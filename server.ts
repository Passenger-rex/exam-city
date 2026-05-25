import express from "express";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ override: true });

import { OpenAI } from "openai";

// Firebase-admin was removed as all firestore operations are client-driven via Firebase Web SDK

const app = express();
const PORT = 3000;

app.use(express.json());

// Exam Grading endpoint has been removed as grading is handled client-side
// Upgrade endpoint removed since it's handled via Flutterwave webhook and client-side setup

app.use((req, res, next) => {
  console.log(`[Router] ${req.method} ${req.url}`);
  next();
});

// AI Explanations Endpoint
app.post(["/api/explain", "/explain"], async (req, res) => {
  try {
    const { question, options, userAnswer, correctAnswer } = req.body;
    const rawApiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.OPENAI_API_KEY || "";
    const apiKey = rawApiKey.replace(/^["']+|["']+$/g, "").trim();
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "API KEY is missing. Please add GROQ_API_KEY to your Vercel Environment Variables, THEN REDEPLOY." });
    }
    
    // Auto-detect provider
    let baseURL = undefined;
    let model = "gpt-4o-mini"; // Default OpenAI fallback
    
    if (apiKey.startsWith("gsk_") || process.env.GROQ_API_KEY) {
       baseURL = "https://api.groq.com/openai/v1";
       model = "llama-3.3-70b-versatile";
    } else if (apiKey.startsWith("xai-") || process.env.GROK_API_KEY) {
       baseURL = "https://api.x.ai/v1";
       model = "grok-2-latest";
   
    }

    const openai = new OpenAI({ apiKey, baseURL });
    
    const prompt = `Provide a detailed, step-by-step explanation for the following question, specifically addressing why the user's answer is incorrect and why the actual correct answer is right.
    
Question: ${question}
Options: ${JSON.stringify(options)}
User's Incorrect Answer: ${options[userAnswer] || userAnswer}
Correct Answer: ${options[correctAnswer] || correctAnswer}

Explain it like you're an enthusiastic and helpful tutor. Give a clear, step-by-step breakdown. Use markdown to format the output nicely.`;

    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }]
    });

    res.json({ success: true, explanation: response.choices[0].message.content });
  } catch (error: any) {
     console.error("AI Explain Error:", error);
     res.status(500).json({ success: false, error: "Could not generate explanation." });
  }
});

// Questions generator API Endpoint
app.get(["/api/questions", "/questions"], async (req, res) => {
  try {
    const { subject = "english", year = "any", type = "standard", bank = "public" } = req.query;
    const limitNum = type === "micro" ? 5 : 40;
    const isPro = bank === "premium";
    
    let allQuestions: any[] = [];
    
    // Attempt ALOC API
    const alocToken = process.env.VITE_ALOC_ACCESS_TOKEN || process.env.ALOC_ACCESS_TOKEN || "ALOC-78bfe77b49fb3e407bf8"; // Fallback to a known demo token if missing
    const alocLimit = isPro ? Math.floor(limitNum / 2) : limitNum; 
    let alocError = null;

    try {
      if (alocLimit > 0) {
        // Fetch up to 40 questions: ALOC provides 'q/40' for multiple questions
        const fetchUrl = alocLimit > 1 ? `https://questions.aloc.com.ng/api/v2/q/${alocLimit}?subject=${subject}` : `https://questions.aloc.com.ng/api/v2/q?subject=${subject}`;
        
        const alocRes = await fetch(fetchUrl, {
           headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "AccessToken": alocToken
           }
        });
        if (alocRes.ok) {
           const alocJson = await alocRes.json();
           if (alocJson.status && alocJson.data) {
              const fetchedData = Array.isArray(alocJson.data) ? alocJson.data : [alocJson.data];
              allQuestions = fetchedData.slice(0, alocLimit);
           }
        } else {
           alocError = alocRes.status;
        }
      }
    } catch (e: any) {
      console.error("Backend ALOC API error:", e);
      alocError = e.message;
    }

    const remainingLimit = limitNum - allQuestions.length;
    
    // If we need more questions, or if it's pro mode, mix in AI questions
    if (remainingLimit > 0 && (isPro || allQuestions.length === 0)) {
      const rawApiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.OPENAI_API_KEY || "";
      const apiKey = rawApiKey.replace(/^["']+|["']+$/g, "").trim();
      if (!apiKey) {
        throw new Error("API KEY is missing. Please add GROQ_API_KEY to your Vercel Environment Variables, THEN REDEPLOY.");
      }
      
      let baseURL = undefined;
      let model = "gpt-4o-mini"; // Default OpenAI
      
      if (apiKey.startsWith("gsk_") || process.env.GROQ_API_KEY) {
         baseURL = "https://api.groq.com/openai/v1";
         model = "llama-3.3-70b-versatile";
      } else if (apiKey.startsWith("xai-") || process.env.GROK_API_KEY) {
         baseURL = "https://api.x.ai/v1";
         model = "grok-2-latest";
     
      }

      const openai = new OpenAI({ apiKey, baseURL });

      let yearInstruction = "";
      if (typeof year === "string" && (year.toLowerCase() === "random" || year.toLowerCase() === "any")) {
        yearInstruction = "Assign a random past year to each question.";
      } else {
        yearInstruction = `All questions should be specifically from or adapted from the year ${year}.`;
      }

      const prompt = `Surf online to find and return exactly ${remainingLimit} real, accurate, and challenging past questions for West African Examinations Council (WAEC), Joint Admissions and Matriculation Board (JAMB) or National Examinations Council (NECO) for the subject: "${subject}". ${yearInstruction} The difficulty MUST strictly match the rigor of standard Senior Secondary Certification Examination (SSCE) or University Tertiary Matriculation Examination (UTME). DO NOT generate overly simple questions; retrieve authentic complex questions that require critical thinking or multi-step problem solving.
      IMPORTANT: You MUST return your response as a raw JSON string matching the following schema. Do NOT wrap in markdown code blocks.
      Schema:
      {
         "subject": "string",
         "data": [
            {
               "id": "string",
               "question": "string",
               "option": {
                   "a": "string",
                   "b": "string",
                   "c": "string",
                   "d": "string"
               },
               "answer": "string (a, b, c, or d)",
               "solution": "string",
               "examyear": "string"
            }
         ]
      }`;
      
      try {
        const response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        let jsonStr = response.choices[0].message.content?.trim() || "{}";
        const firstBracket = jsonStr.indexOf("{");
        const lastBracket = jsonStr.lastIndexOf("}");
        if (firstBracket !== -1 && lastBracket !== -1) {
           jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
        }
        const json = JSON.parse(jsonStr);
        if (json.data && Array.isArray(json.data)) {
          allQuestions = [...allQuestions, ...json.data];
        }
      } catch (genErr) {
        console.error("Error generating questions with AI: ", genErr);
      }
    }

    // fallback mapping if both failed entirely will be handled by the frontend picking from DB.
    
    // Shuffle the array nicely
    for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    res.json({ success: true, subject, data: allQuestions.slice(0, limitNum), alocError });
  } catch (err: any) {
    console.error("Questions endpoint error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Study Coach / Chatbot Endpoint
app.post(["/api/chatbot", "/chatbot"], async (req, res) => {
  try {
    const { messages } = req.body; 
    const rawApiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.OPENAI_API_KEY || "";
    const apiKey = rawApiKey.replace(/^["']+|["']+$/g, "").trim();
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "API KEY is missing. Please add GROQ_API_KEY to your Vercel Environment Variables, THEN REDEPLOY." });
    }
    
    // Auto-detect provider
    let baseURL = undefined;
    let model = "gpt-4o-mini"; // Default OpenAI fallback
    
    if (apiKey.startsWith("gsk_") || process.env.GROQ_API_KEY) {
       baseURL = "https://api.groq.com/openai/v1";
       model = "llama-3.3-70b-versatile";
    } else if (apiKey.startsWith("xai-") || process.env.GROK_API_KEY) {
       baseURL = "https://api.x.ai/v1";
       model = "grok-2-latest";
   
    }

    const openai = new OpenAI({ apiKey, baseURL });
    
    const formattedMessages = [
      { 
        role: "system", 
        content: "You are a helpful Study Coach tutor. Provide study tips, mental math tricks, and clear concise explanations for specific topics. Be encouraging and concise. Answer in markdown." 
      },
      ...messages.map((m: any) => ({
        role: m.role === "model" ? "assistant" : m.role,
        content: m.parts ? m.parts[0]?.text || "" : ""
      }))
    ];
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: formattedMessages
    });
    
    res.json({ success: true, text: response.choices[0].message.content });
  } catch (error: any) {
     console.error("Chatbot Error:", error);
     res.status(500).json({ success: false, error: "Could not reply. If you deployed to Vercel, please add your GROQ_API_KEY as an Environment Variable in Vercel settings." });
  }
});

function startStaticServer() {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Static server running on http://localhost:${PORT}`);
    });
  }
}

// API 404 Not Found Handler
app.use((req, res, next) => {
  if (req.url.startsWith("/api/") || req.url === "/questions" || req.url === "/chatbot" || req.url === "/explain") {
    return res.status(404).json({ success: false, error: `Cannot ${req.method} ${req.url}` });
  }
  next();
});

// API Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  if (req.url.startsWith("/api/") || req.url === "/questions" || req.url === "/chatbot" || req.url === "/explain") {
    console.error("API Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
  next(err);
});

// Vite middleware for development or fallback
if (process.env.NODE_ENV !== "production") {
  import("vite")
    .then(({ createServer: createViteServer }) => {
      createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      })
        .then((vite) => {
          app.use(vite.middlewares);
          if (!process.env.VERCEL) {
            app.listen(PORT, "0.0.0.0", () => {
              console.log(`Vite Dev Server running on http://localhost:${PORT}`);
            });
          }
        })
        .catch(() => {
          console.warn("Vite init failed, falling back to static server.");
          startStaticServer();
        });
    })
    .catch(() => {
      console.warn("Vite not found, assuming production mode and falling back to static server.");
      startStaticServer();
    });
} else {
  startStaticServer();
}

export default app;
