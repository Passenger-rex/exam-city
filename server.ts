import express from "express";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ override: true });

import { OpenAI } from "openai";

// Firebase-admin was removed as all firestore operations are client-driven via Firebase Web SDK

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    const rawApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || "";
    const apiKey = rawApiKey.replace(/^["']+|["']+$/g, "").trim();
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "API KEY is missing. Please add GROQ_API_KEY to your Vercel Environment Variables, THEN REDEPLOY." });
    }
    
    // Auto-detect provider
    const baseURL = "https://api.groq.com/openai/v1";
    const model = "llama-3.3-70b-versatile";

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
     res.status(500).json({ success: false, error: `Explain API Error: ${error.message || "Unknown error"}` });
  }
});

// Questions generator API Endpoint
app.get(["/api/questions", "/questions"], async (req, res) => {
  try {
    const { subject = "english", year = "any", type = "standard", bank = "public", topic = "" } = req.query;
    const limitNum = type === "micro" ? 5 : 40;
    
    let allQuestions: any[] = [];
    
    // ALOC fetch has been removed in favor of strictly generating college/professional level questions via AI.

    // Fallback to Generative AI if no questions yet
    if (allQuestions.length === 0) {
      const rawApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || "";
      const apiKey = rawApiKey.replace(/^["']+|["']+$/g, "").trim();
      
      if (apiKey) {
        const baseURL = "https://api.groq.com/openai/v1";
        const model = "llama-3.3-70b-versatile";

        const openai = new OpenAI({ apiKey, baseURL });

        let yearInstruction = "";
        if (typeof year === "string" && (year.toLowerCase() === "random" || year.toLowerCase() === "any")) {
          yearInstruction = "Assign a random past year to each question.";
        } else {
          yearInstruction = `All questions should be specifically from or adapted from the year ${year}.`;
        }
        
        let topicInstruction = "";
        if (typeof topic === "string" && topic.trim().length > 0) {
          topicInstruction = `The questions MUST specifically test knowledge on the topic of "${topic}".`;
        }

        const prompt = `Generate exactly ${limitNum} highly professional, challenging, and college/institute-level mock exam multiple choice questions for the subject: "${subject}". ${yearInstruction} ${topicInstruction} The questions MUST match the rigor of professional certification exams, university-level assessments, or medical/clinical board exams in Nigerian, UK, Australian, or US styles. Do NOT generate overly simple, basic, or repetitive questions. Prioritize authentic complex questions that require critical thinking, multi-step problem solving, or clinical reasoning (especially for medical, nursing, pharmacology, or scientific subjects). Use modern scientific naming conventions, precise terminology, and strict IUPAC nomenclature. Keep the 'solution' field very brief (1-2 sentences maximum) so all ${limitNum} questions can be returned.
        IMPORTANT: You MUST return your response as a raw JSON string EXACTLY formatted as this schema:
        {
           "subject": "${subject}",
           "data": [
              {
                 "id": "q1",
                 "question": "question text here",
                 "option": { "a": "opt A", "b": "opt B", "c": "opt C", "d": "opt D" },
                 "answer": "a",
                 "solution": "step by step solution",
                 "examyear": "2024"
              }
           ]
        }`;
        
        try {
          const response = await openai.chat.completions.create({
            model: model,
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
             max_tokens: 8000,
          });

          let jsonStr = response.choices[0].message.content?.trim() || "{}";
          const firstBracket = jsonStr.indexOf("{");
          const lastBracket = jsonStr.lastIndexOf("}");
          if (firstBracket !== -1 && lastBracket !== -1) {
             jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
          }
          const json = JSON.parse(jsonStr);
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            allQuestions = [...json.data];
          } else {
             throw new Error("AI returned empty or invalid question data format.");
          }
        } catch (genErr: any) {
          console.error("Error generating questions with AI: ", genErr);
          return res.status(500).json({ 
             success: false, 
             error: `AI Generation Error: ${genErr.message || "Unknown error occurred"}` 
          });
        }
      } else {
         return res.status(500).json({ 
            success: false, 
            error: "GROQ_API_KEY is missing." 
         });
      }
    }

    // Shuffle the array nicely
    for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    res.json({ success: true, subject, data: allQuestions.slice(0, limitNum) });
  } catch (err: any) {
    console.error("Questions endpoint error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});



// Study Coach / Chatbot Endpoint
app.post(["/api/chatbot", "/chatbot"], async (req, res) => {
  try {
    const { messages } = req.body; 
    const rawApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || "";
    const apiKey = rawApiKey.replace(/^["']+|["']+$/g, "").trim();
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "API KEY is missing. Please add GROQ_API_KEY to your Vercel Environment Variables, THEN REDEPLOY." });
    }
    
    const baseURL = "https://api.groq.com/openai/v1";
    const model = "llama-3.3-70b-versatile";

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
     res.status(500).json({ success: false, error: `Study Coach API Error: ${error.message}` });
  }
});

// Process Study Material File Endpoint via Gemini
app.post("/api/process-file", async (req, res) => {
  try {
    const { fileBase64, mimeType = "", fileName = "", action, message } = req.body;
    
    if (!fileBase64) {
      return res.status(400).json({ success: false, error: "File content is required." });
    }
    
    const rawApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || "";
    const apiKey = rawApiKey.replace(/^["']+|["']+$/g, "").trim();
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "GROQ_API_KEY is not configured in secrets. Please set it in Settings > Secrets." });
    }
    
    const baseURL = "https://api.groq.com/openai/v1";
    const openai = new OpenAI({ apiKey, baseURL });
    
    const isImage = mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(fileName);
    
    if (isImage) {
      const model = "llama-3.2-11b-vision-preview";
      
      if (action === "tutor") {
        const prompt = `You are an expert AI Study Coach. The student has uploaded an image named: "${fileName}".
        Look at this image content and fulfill their study request: "${message || "Explain the main key terms and concepts in detail."}"
        
        Provide a highly encouraging, structured, and easy-to-understand explanation with bullet points and bold headers. Do not make up information if the content can't be found. Always remain helpful and precise. Respond in Markdown.`;
        
        const response = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${fileBase64}` } }
              ]
            }
          ]
        });
        
        res.json({ success: true, text: response.choices[0].message.content || "No response generated." });
      } else if (action === "exam") {
        const examPrompt = `We need to generate exactly 40 high-quality, professional mock exam multiple choice questions based strictly on the uploaded image named: "${fileName}".
        The questions must retrieve or test factual or analytical understanding of the image details. For each question, provide 4 options (a, b, c, d) and assign the single correct answer, a brief step-by-step solution / explanation, and the source.
        
        You must return your output strictly in JSON format matching this schema:
        {
           "questions": [
              {
                 "id": "uq1",
                 "question": "Clear and detailed question text here?",
                 "option": { "a": "Option A", "b": "Option B", "c": "Option C", "d": "Option D" },
                 "answer": "a",
                 "solution": "Brief explanation why option A is correct based on the file",
                 "examyear": "Uploaded Content"
              }
           ]
        }`;
        
        const response = await openai.chat.completions.create({
          model: model,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: examPrompt },
                { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${fileBase64}` } }
              ]
            }
          ]
        });
        
        let responseText = response.choices[0].message.content || "{}";
        responseText = responseText.trim();
        const firstBracket = responseText.indexOf("{");
        const lastBracket = responseText.lastIndexOf("}");
        if (firstBracket !== -1 && lastBracket !== -1) {
           responseText = responseText.substring(firstBracket, lastBracket + 1);
        }
        const json = JSON.parse(responseText);
        res.json({ success: true, questions: json.questions || [] });
      } else {
        res.status(400).json({ success: false, error: "Invalid action." });
      }
    } else {
      // Document text extraction for PDF / DOCX / TXT
      let extractedText = "";
      if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) {
        try {
          const { createRequire } = await import("module");
          const require = createRequire(import.meta.url);
          const pdfParse = require("pdf-parse");
          const buffer = Buffer.from(fileBase64, "base64");
          const pdfData = await pdfParse(buffer);
          extractedText = pdfData.text || "";
        } catch (pdfErr: any) {
          console.error("PDF Extraction Error:", pdfErr);
          throw new Error("Failed to extract readable text from PDF. " + (pdfErr.message || pdfErr));
        }
      } else if (mimeType.includes("word") || mimeType.includes("officedocument") || fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        try {
          const { createRequire } = await import("module");
          const require = createRequire(import.meta.url);
          const mammoth = require("mammoth");
          const buffer = Buffer.from(fileBase64, "base64");
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value || "";
        } catch (docxErr: any) {
          console.error("DOCX Extraction Error:", docxErr);
          throw new Error("Failed to extract readable text from Word document. " + docxErr.message);
        }
      } else {
        try {
          const buffer = Buffer.from(fileBase64, "base64");
          extractedText = buffer.toString("utf-8");
        } catch (txtErr: any) {
          console.error("Plain Text Extraction Error:", txtErr);
          throw new Error("Failed to decode text file. Ensure the file has valid text encoding.");
        }
      }
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("The uploaded file could not be parsed or does not contain any readable text.");
      }
      
      const model = "llama-3.3-70b-versatile";
      
      if (action === "tutor") {
        const textPrompt = `You are an expert AI Study Coach. The student has uploaded a study material file named: "${fileName}".
        Below is the content of the file:
        
        --- FILE CONTENT START ---
        ${extractedText.substring(0, 40000)}
        --- FILE CONTENT END ---
        
        Read the content of this file and fulfill their study request: "${message || "Explain the main key terms and concepts in detail."}"
        
        Provide a highly encouraging, structured, and easy-to-understand explanation with bullet points and bold headers. Do not make up information if the content can't be found. Always remain helpful and precise. Respond in Markdown.`;
        
        const response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: textPrompt }]
        });
        
        res.json({ success: true, text: response.choices[0].message.content || "No response generated." });
      } else if (action === "exam") {
        const examPrompt = `We need to generate exactly 40 high-quality, professional mock exam multiple choice questions based strictly on the uploaded file named: "${fileName}".
        Below is the content of the file:
        
        --- FILE CONTENT START ---
        ${extractedText.substring(0, 35000)}
        --- FILE CONTENT END ---
        
        The questions must retrieve or test factual or analytical understanding of the document details. For each question, provide 4 options (a, b, c, d) and assign the single correct answer, a brief step-by-step solution / explanation, and the source.
        
        You must return your output strictly in JSON format matching this schema:
        {
           "questions": [
              {
                 "id": "uq1",
                 "question": "Clear and detailed question text here?",
                 "option": { "a": "Option A", "b": "Option B", "c": "Option C", "d": "Option D" },
                 "answer": "a",
                 "solution": "Brief explanation why option A is correct based on the file",
                 "examyear": "Uploaded Content"
              }
           ]
        }`;
        
        const response = await openai.chat.completions.create({
          model: model,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: examPrompt }]
        });
        
        let responseText = response.choices[0].message.content || "{}";
        responseText = responseText.trim();
        const firstBracket = responseText.indexOf("{");
        const lastBracket = responseText.lastIndexOf("}");
        if (firstBracket !== -1 && lastBracket !== -1) {
           responseText = responseText.substring(firstBracket, lastBracket + 1);
        }
        const json = JSON.parse(responseText);
        res.json({ success: true, questions: json.questions || [] });
      } else {
        res.status(400).json({ success: false, error: "Invalid action." });
      }
    }
  } catch (err: any) {
    console.error("File processing error: ", err);
    res.status(500).json({ success: false, error: err.message || "An error occurred while analyzing the file." });
  }
});

function startStaticServer() {
  if (process.env.VERCEL || process.env.NETLIFY) return; // Do not serve static files in serverless environments
  
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Static server running on http://localhost:${PORT}`);
  });
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
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL && !process.env.NETLIFY) {
  const vitePkg = "vi" + "te";
  import(vitePkg)
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
