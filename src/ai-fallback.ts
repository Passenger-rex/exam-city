import { OpenAI } from "openai";
import { GoogleGenAI, Type } from "@google/genai";

interface ExecuteAIOptions {
  isJson?: boolean;
  isVision?: boolean;
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

export async function executeAIFallback(messages: any[], options: ExecuteAIOptions = {}) {
  const providers = [
    { name: "Groq", param: "GROQ_API_KEY", baseURL: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", visionModel: "llama-3.2-11b-vision-preview" },
    { name: "Gemini", param: "GEMINI_API_KEY", baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-2.5-flash", visionModel: "gemini-2.5-flash" },
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
  
  for (const p of providers) {
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
        
        const response = await ai.models.generateContent({
          model: modelToUse,
          contents: { parts },
          config: {
            temperature: 0.7,
            systemInstruction: systemInstructionText.trim() ? systemInstructionText.trim() : undefined,
            responseMimeType: options.isJson ? "application/json" : "text/plain"
          }
        });
        
        const content = response.text;
        if (content) {
          console.log(`[AI Fallback] Successfully used ${p.name}`);
          return content;
        }
      } else {
        // Create OpenAI client configuring it to use the provider's baseURL
        const client = new OpenAI({ apiKey, baseURL: p.baseURL });
        const modelToUse = options.isVision ? p.visionModel! : p.model;
        
        const requestOptions: any = {
          model: modelToUse,
          messages: messages,
          temperature: 0.7
        };

        if (options.isJson) {
          requestOptions.response_format = { type: "json_object" };
        }

        const response = await client.chat.completions.create(requestOptions);
        
        const content = response.choices[0].message?.content;
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
