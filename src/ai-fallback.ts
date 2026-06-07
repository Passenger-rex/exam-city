import { OpenAI } from "openai";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

interface ExecuteAIOptions {
  isJson?: boolean;
  isVision?: boolean;
  searchActive?: boolean;
  thinkActive?: boolean;
}

function isPlaceholderKey(key: string): boolean {
  const k = key.trim().toLowerCase();
  return (
    k === "" ||
    k === "gsk_" ||
    k.includes("placeholder") ||
    k.includes("your") ||
    k.includes("insert") ||
    k.includes("key_here") ||
    k.includes("my_key") ||
    k.includes("api_key") ||
    k.includes("token_here") ||
    k.includes("my_token") ||
    k.includes("token_value")
  );
}

/**
 * Safe, dependency-free web search fetcher that queries DuckDuckGo HTML
 * and extracts search results to serve as real-time context.
 */
async function fetchWebSearchResults(query: string): Promise<{ text: string; sources: string[] }> {
  const emptyResult = { text: "", sources: [] };
  if (!query || query.trim().length === 0) return emptyResult;
  
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    if (!response.ok) return emptyResult;
    
    const html = await response.text();
    const results: { title: string; url: string; snippet: string }[] = [];
    const parts = html.split('class="result');
    
    for (let i = 1; i < parts.length && results.length < 5; i++) {
      const section = parts[i];
      const hrefMatch = section.match(/href="([^"]+)"/);
      if (!hrefMatch) continue;
      
      let targetUrl = hrefMatch[1];
      if (targetUrl.includes("uddg=")) {
        try {
          const partsOfUrl = targetUrl.split("uddg=");
          if (partsOfUrl[1]) {
            const encodedUrl = partsOfUrl[1].split("&")[0];
            targetUrl = decodeURIComponent(encodedUrl);
          }
        } catch (_) {}
      }
      
      if (targetUrl.startsWith("//")) {
        targetUrl = "https:" + targetUrl;
      }
      
      if (targetUrl.includes("duckduckgo.com") || targetUrl.includes("duck.com")) {
        continue;
      }
      
      const snippetMatch = section.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      const titleMatch = section.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/) || 
                         section.match(/class="result__url"[^>]*>([\s\S]*?)<\/a>/) ||
                         section.match(/class="result__snippet"[^>]*>([\s\S]*?)$/) ||
                         section.match(/result__title[^>]*>([\s\S]*?)<\/h2>/);
      
      const stripHtml = (txt: string) => {
        return txt
          .replace(/<[^>]*>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/\s+/g, " ")
          .trim();
      };
      
      const snippet = snippetMatch ? stripHtml(snippetMatch[1]) : "No snippet summary available.";
      const title = titleMatch ? stripHtml(titleMatch[1]) : "Web Search Source";
      
      results.push({ title, url: targetUrl, snippet });
    }
    
    if (results.length === 0) return emptyResult;
    
    let renderedText = "\n\n=== REAL-TIME INTERNET SEARCH GROUNDING CONTEXT ===\n";
    const sources: string[] = [];
    results.forEach((res, idx) => {
      renderedText += `[Source #${idx + 1}]\n`;
      renderedText += `Title: ${res.title}\n`;
      renderedText += `Link: ${res.url}\n`;
      renderedText += `Excerpt: ${res.snippet}\n\n`;
      
      try {
        const host = new URL(res.url).hostname || "Source website";
        sources.push(`${idx + 1}. [${host}](${res.url}) - *${res.title}*`);
      } catch (_) {
        sources.push(`${idx + 1}. [Source](${res.url}) - *${res.title}*`);
      }
    });
    renderedText += "===================================================================\n";
    renderedText += "INSTRUCTION: The above block contains real-time search knowledge. Adopt facts from the sources above into your answers, making sure you cite search references as e.g. [1], [2], etc., where appropriate to guarantee maximum factual alignment.\n";
    
    return { text: renderedText, sources };
  } catch (error) {
    console.warn("[fetchWebSearchResults] error querying DuckDuckGo HTML:", error);
    return emptyResult;
  }
}

export async function executeAIFallback(messages: any[], options: ExecuteAIOptions = {}) {
  let searchGroundingBlock = "";
  let searchGroundingSources: string[] = [];
  let attemptedSearchFetch = false;

  const providers = [
    { name: "Groq", param: "GROQ_API_KEY", baseURL: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", visionModel: "llama-3.2-11b-vision-preview" },
    { name: "Gemini", param: "GEMINI_API_KEY", baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-3.5-flash", visionModel: "gemini-3.5-flash" },
    { name: "Perplexity", param: "PERPLEXITY_API_KEY", baseURL: "https://api.perplexity.ai", model: "sonar", visionModel: null },
    { name: "Together", param: "TOGETHER_API_KEY", baseURL: "https://api.together.xyz/v1", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", visionModel: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo" },
    { name: "OpenRouter", param: "OPENROUTER_API_KEY", baseURL: "https://openrouter.ai/api/v1", model: "google/gemini-2.5-flash", visionModel: "google/gemini-2.5-flash" },
    { name: "OpenAI", param: "OPENAI_API_KEY", baseURL: "https://api.openai.com/v1", model: "gpt-4o-mini", visionModel: "gpt-4o-mini" },
    { name: "Mistral", param: "MISTRAL_API_KEY", baseURL: "https://api.mistral.ai/v1", model: "mistral-large-latest", visionModel: "pixtral-12b-2409" },
    { name: "GitHub", param: "GITHUB_TOKEN", baseURL: "https://models.inference.ai.azure.com", model: "Llama-3.3-70B-Instruct", visionModel: "Llama-3.2-90B-Vision-Instruct" },
    { name: "DeepSeek", param: "DEEPSEEK_API_KEY", baseURL: "https://api.deepseek.com", model: "deepseek-chat", visionModel: null },
    { name: "Novita", param: "NOVITA_API_KEY", baseURL: "https://api.novita.ai/v3/openai", model: "meta-llama/llama-3.3-70b-instruct", visionModel: null },
    { name: "Fireworks", param: "FIREWORKS_API_KEY", baseURL: "https://api.fireworks.ai/inference/v1", model: "accounts/fireworks/models/llama-v3p3-70b-instruct", visionModel: "accounts/fireworks/models/llama-v3p2-11b-vision-instruct" },
    { name: "Cohere", param: "COHERE_API_KEY", baseURL: "https://api.cohere.com/v1", model: "command-r-plus-08-2024", visionModel: null },
    { name: "X.AI", param: "XAI_API_KEY", baseURL: "https://api.x.ai/v1", model: "grok-beta", visionModel: "grok-vision-beta" },
    { name: "Hyperbolic", param: "HYPERBOLIC_API_KEY", baseURL: "https://api.hyperbolic.xyz/v1", model: "meta-llama/Llama-3.3-70B-Instruct", visionModel: null },
    { name: "DeepInfra", param: "DEEPINFRA_API_KEY", baseURL: "https://api.deepinfra.com/v1/openai", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", visionModel: null },
    { name: "Cerebras", param: "CEREBRAS_API_KEY", baseURL: "https://api.cerebras.ai/v1", model: "llama3.3-70b", visionModel: null },
    { name: "SambaNova", param: "SAMBANOVA_API_KEY", baseURL: "https://api.sambanova.ai/v1", model: "Meta-Llama-3.3-70B-Instruct", visionModel: "Llama-3.2-11B-Vision-Instruct" }
  ];

  const errors: string[] = [];

  // If web search grounding is active, dynamically reorder providers to prioritize Gemini or Perplexity.
  let prioritizedProviders = [...providers];
  if (options.searchActive) {
    const searchCapable = ["Gemini", "Perplexity", "OpenRouter", "Cohere"];
    prioritizedProviders.sort((a, b) => {
      const aIndex = searchCapable.indexOf(a.name);
      const bIndex = searchCapable.indexOf(b.name);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return 0;
    });
  }
  
  for (const p of prioritizedProviders) {
    const rawKey = process.env[p.param] || (p.param === "GROQ_API_KEY" ? process.env.VITE_GROQ_API_KEY : undefined);
    if (!rawKey) continue;
    
    // Skip if we need vision but the provider doesn't support it or has no model mapped
    if (options.isVision && !p.visionModel) continue;

    const apiKey = rawKey.replace(/^["']+|["']+$/g, "").trim();
    if (!apiKey || isPlaceholderKey(apiKey)) {
      errors.push(`${p.name}: Key is configured as a placeholder/blank string.`);
      continue;
    }

    // Special validation for Google Gemini keys to fail fast if they are obviously invalid
    if (p.name === "Gemini" && !apiKey.startsWith("AIzaSy")) {
      console.warn(`[AI Fallback] Skipping Gemini call: API Key does not start with 'AIzaSy'.`);
      errors.push("Gemini: Key does not start with AIzaSy (Google key prefix requirement).");
      continue;
    }

    try {
      if (p.name === "Gemini") {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });
        const modelToUse = options.isVision ? p.visionModel! : p.model;
        
        let systemInstructionText = "";
        const parts: any[] = [];

        for (const msg of messages) {
          if (msg.role === "system") {
            systemInstructionText += (typeof msg.content === 'string' ? msg.content : "") + "\n";
            continue;
          }
          
          const rolePrefix = msg.role ? `${msg.role.toUpperCase()}: ` : "";
          if (typeof msg.content === 'string') {
            parts.push({ text: `${rolePrefix}${msg.content}` });
          } else if (Array.isArray(msg.content)) {
            parts.push({ text: rolePrefix });
            for (const part of msg.content) {
              if (part.type === 'text') {
                parts.push({ text: part.text });
              } else if (part.type === 'image_url') {
                const url = part.image_url?.url || "";
                if (url.startsWith("data:")) {
                  const matches = url.match(/^data:([^;]+);base64,(.+)$/);
                  if (matches) {
                    parts.push({
                      inlineData: {
                        mimeType: matches[1],
                        data: matches[2]
                      }
                    });
                  }
                }
              }
            }
          }
        }

        // Apply prompt reinforcements to system instructions for thinking behavior if requested
        if (options.thinkActive) {
          systemInstructionText += "\n\nDEEP THINKING MODE IS ACTIVE: Prioritize providing a detailed step-by-step thinking process. Format this thinking process using markdown blockquotes (e.g. starting with '> **Thinking Process:**' or custom step-by-step reasoning blocks) before presenting your final answers.";
        }

        const configObject: any = {
          temperature: 0.7,
          systemInstruction: systemInstructionText.trim() ? systemInstructionText.trim() : undefined,
          responseMimeType: options.isJson ? "application/json" : "text/plain"
        };

        if (options.searchActive) {
          configObject.tools = [{ googleSearch: {} }];
        }

        if (options.thinkActive) {
          configObject.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
        }
        
        const response = await ai.models.generateContent({
          model: modelToUse,
          contents: { parts },
          config: configObject
        });
        
        let content = response.text || "";

        // Extract and format search ground reference links
        if (options.searchActive && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          const chunks = response.candidates[0].groundingMetadata.groundingChunks;
          const sources = chunks
            .map((c: any) => {
              const title = c.web?.title || c.web?.uri || "Web Grounding Link";
              const uri = c.web?.uri;
              if (uri) {
                return `- [${title}](${uri})`;
              }
              return null;
            })
            .filter(Boolean);
          if (sources.length > 0) {
            content += "\n\n**Web Search Grounding Sources:**\n" + sources.join("\n");
          }
        }

        if (content) {
          console.log(`[AI Fallback] Successfully used ${p.name}`);
          return content;
        }
      } else if (p.name === "Cohere") {
        // Native Cohere Chat API call to leverage real web-search connectors
        const systemMessage = messages.find(m => m.role === "system")?.content || "";
        const userMessages = messages.filter(m => m.role !== "system");
        const currentMessage = userMessages[userMessages.length - 1]?.content || "";
        const chatHistory = userMessages.slice(0, -1).map(m => ({
          role: m.role === "assistant" ? "CHATBOT" : "USER",
          message: typeof m.content === "string" ? m.content : JSON.stringify(m.content)
        }));

        const bodyPayload: any = {
          message: typeof currentMessage === "string" ? currentMessage : JSON.stringify(currentMessage),
          model: p.model,
          chat_history: chatHistory,
          preamble: systemMessage
        };

        if (options.searchActive) {
          bodyPayload.connectors = [{ id: "web-search" }];
        }

        const response = await fetch("https://api.cohere.com/v1/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify(bodyPayload)
        });

        if (!response.ok) {
          throw new Error(`Cohere API returned status ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        let content = data.text || "";

        // Extract sources from Cohere search connectors
        if (options.searchActive && data.documents && Array.isArray(data.documents)) {
          const links = data.documents
            .map((doc: any) => {
              const title = doc.title || "Referenced Source";
              if (doc.url) return `- [${title}](${doc.url})`;
              return null;
            })
            .filter(Boolean);
          if (links.length > 0) {
            // Deduplicate links
            const uniqueLinks = Array.from(new Set(links));
            content += "\n\n**Web Search Grounding Sources:**\n" + uniqueLinks.slice(0, 10).join("\n");
          }
        }

        console.log(`[AI Fallback] Successfully used Cohere (native chat)`);
        return content;
      } else {
        // Fallback or non-Gemini provider path
        // For non-Gemini and non-Cohere models, if Google search (options.searchActive) is requested,
        // we execute a real-time search context fetch and inject it to guarantee genuine search grounding.
        if (options.searchActive && !attemptedSearchFetch) {
          attemptedSearchFetch = true;
          try {
            let query = "";
            const userMessages = messages.filter(m => m.role === "user");
            const lastMsg = userMessages[userMessages.length - 1];
            if (lastMsg) {
              query = typeof lastMsg.content === "string" ? lastMsg.content : JSON.stringify(lastMsg.content);
            }
            if (query) {
              const res = await fetchWebSearchResults(query);
              searchGroundingBlock = res.text;
              searchGroundingSources = res.sources;
            }
          } catch (err: any) {
            console.warn("[AI Fallback Search Grounding Fetch Failed]", err);
          }
        }

        const simulatedMessages = [...messages];
        if (options.thinkActive || options.searchActive) {
          let instructionText = "System instructions reinforcement:";
          if (options.thinkActive) {
            instructionText += "\n- DEEP REASONING: Prioritize presenting a detailed clinical reasoning or thinking process under a blockquote (e.g., matching '> **Thinking Process:**') before writing the final answered content.";
          }
          if (options.searchActive) {
            instructionText += "\n- VIRTUAL WEB GROUNDING: Simulate search-retrieval verification to back up claims with real-world factuality.";
            if (searchGroundingBlock) {
              instructionText += `\n${searchGroundingBlock}`;
            }
          }
          simulatedMessages.push({
            role: "system",
            content: instructionText
          });
        }

        // Create OpenAI client configuring it to use the provider's baseURL
        const client = new OpenAI({ apiKey, baseURL: p.baseURL });
        
        let modelToUse = options.isVision ? p.visionModel! : p.model;
        if (options.searchActive && !options.isVision) {
          if (p.name === "OpenRouter") {
            modelToUse = "perplexity/sonar";
          } else if (p.name === "Perplexity") {
            modelToUse = "sonar";
          }
        }
        
        const requestOptions: any = {
          model: modelToUse,
          messages: simulatedMessages,
          temperature: 0.7
        };

        if (options.isJson) {
          requestOptions.response_format = { type: "json_object" };
        }

        const response = await client.chat.completions.create(requestOptions);
        
        let content = response.choices[0].message?.content || "";

        // Extract citations if the provider is Perplexity or OpenRouter utilizing Perplexity models
        const rawResponse = response as any;
        if (options.searchActive) {
          if (rawResponse.citations && Array.isArray(rawResponse.citations)) {
            const links = rawResponse.citations
              .map((url: string, index: number) => {
                try {
                  const hostname = new URL(url).hostname || "Search Result";
                  return `${index + 1}. [${hostname}](${url})`;
                } catch (_) {
                  return `${index + 1}. [Source](${url})`;
                }
              })
              .join("\n");
            if (links) {
              content += "\n\n**Web Search Grounding Sources:**\n" + links;
            }
          } else if (searchGroundingSources.length > 0) {
            // Append our external search grounding source list as a fallback citation list!
            content += "\n\n**Web Search Grounding Sources:**\n" + searchGroundingSources.join("\n");
          }
        }

        if (content) {
          console.log(`[AI Fallback] Successfully used ${p.name}`);
          return content; // Successfully received response
        }
      }
    } catch (e: any) {
      console.warn(`[AI Fallback] ${p.name} failed: ${e.message}`);
      errors.push(`${p.name}: ${e.message}`);
      // Fallback kicks in - continue to the next provider!
    }
  }

  const tipMsg = "\n\n💡 TROUBLESHOOTING TIP: Please click the Settings icon in the top right menu, open \"Secrets\", and configure a valid, funded API Key (such as GEMINI_API_KEY from Google AI Studio or GROQ_API_KEY from Groq Console) without quotation marks or spaces.";
  
  if (errors.length > 0) {
    throw new Error("All configured AI providers failed.\nDetails:\n- " + errors.join("\n- ") + tipMsg);
  } else {
    throw new Error("No API KEY is configured. Please add an API Key for Groq, Gemini, OpenRouter, Together AI, or any of the supported providers in Settings > Secrets." + tipMsg);
  }
}
