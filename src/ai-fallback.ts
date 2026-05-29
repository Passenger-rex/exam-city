import { OpenAI } from "openai";

interface ExecuteAIOptions {
  isJson?: boolean;
  isVision?: boolean;
}

export async function executeAIFallback(messages: any[], options: ExecuteAIOptions = {}) {
  const providers = [
    { name: "Groq", param: "GROQ_API_KEY", baseURL: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", visionModel: "llama-3.2-11b-vision-preview" },
    { name: "Gemini", param: "GEMINI_API_KEY", baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-2.5-flash", visionModel: "gemini-2.5-flash" },
    { name: "Together", param: "TOGETHER_API_KEY", baseURL: "https://api.together.xyz/v1", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", visionModel: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo" },
    { name: "OpenRouter", param: "OPENROUTER_API_KEY", baseURL: "https://openrouter.ai/api/v1", model: "google/gemini-2.5-flash", visionModel: "google/gemini-2.5-flash" },
    { name: "OpenAI", param: "OPENAI_API_KEY", baseURL: "https://api.openai.com/v1", model: "gpt-4o-mini", visionModel: "gpt-4o-mini" },
    { name: "SambaNova", param: "SAMBANOVA_API_KEY", baseURL: "https://api.sambanova.ai/v1", model: "Meta-Llama-3.1-405B-Instruct", visionModel: "Llama-3.2-11B-Vision-Instruct" },
    { name: "Mistral", param: "MISTRAL_API_KEY", baseURL: "https://api.mistral.ai/v1", model: "mistral-large-latest", visionModel: "pixtral-12b-2409" },
    { name: "GitHub", param: "GITHUB_TOKEN", baseURL: "https://models.inference.ai.azure.com", model: "Llama-3.3-70B-Instruct", visionModel: "Llama-3.2-90B-Vision-Instruct" },
    { name: "DeepSeek", param: "DEEPSEEK_API_KEY", baseURL: "https://api.deepseek.com", model: "deepseek-chat", visionModel: null },
    { name: "Novita", param: "NOVITA_API_KEY", baseURL: "https://api.novita.ai/v3/openai", model: "meta-llama/llama-3.3-70b-instruct", visionModel: null },
    { name: "Fireworks", param: "FIREWORKS_API_KEY", baseURL: "https://api.fireworks.ai/inference/v1", model: "accounts/fireworks/models/llama-v3p3-70b-instruct", visionModel: "accounts/fireworks/models/llama-v3p2-11b-vision-instruct" },
    { name: "Cohere", param: "COHERE_API_KEY", baseURL: "https://api.cohere.com/v1", model: "command-r-plus-08-2024", visionModel: null },
    { name: "X.AI", param: "XAI_API_KEY", baseURL: "https://api.x.ai/v1", model: "grok-beta", visionModel: "grok-vision-beta" },
    { name: "Hyperbolic", param: "HYPERBOLIC_API_KEY", baseURL: "https://api.hyperbolic.xyz/v1", model: "meta-llama/Llama-3.3-70B-Instruct", visionModel: null },
    { name: "DeepInfra", param: "DEEPINFRA_API_KEY", baseURL: "https://api.deepinfra.com/v1/openai", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", visionModel: null },
    { name: "Cerebras", param: "CEREBRAS_API_KEY", baseURL: "https://api.cerebras.ai/v1", model: "llama3.3-70b", visionModel: null }
  ];

  const errors: string[] = [];
  
  for (const p of providers) {
    const rawKey = process.env[p.param] || (p.param === "GROQ_API_KEY" ? process.env.VITE_GROQ_API_KEY : undefined);
    if (!rawKey) continue;
    
    // Skip if we need vision but the provider doesn't support it or has no model mapped
    if (options.isVision && !p.visionModel) continue;

    const apiKey = rawKey.replace(/^["']+|["']+$/g, "").trim();
    if (!apiKey) continue;

    try {
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
    } catch (e: any) {
      console.warn(`[AI Fallback] ${p.name} failed: ${e.message}`);
      errors.push(`${p.name}: ${e.message}`);
      // Fallback kicks in - continue to the next provider!
    }
  }

  if (errors.length > 0) {
    throw new Error("All configured AI providers failed. " + errors.join(" | "));
  } else {
    throw new Error("No API KEY is configured. Please add an API Key for Groq, Gemini, OpenRouter, Together AI, or any of the 15 supported providers in Settings > Secrets.");
  }
}
