import express from "express";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ override: true });

import { OpenAI } from "openai";
import { executeAIFallback } from "./src/ai-fallback";

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
    
    // Auto-detect provider
    const prompt = `Provide a detailed, step-by-step explanation for the following question, specifically addressing why the user's answer is incorrect and why the actual correct answer is right.
    
Question: ${question}
Options: ${JSON.stringify(options)}
User's Incorrect Answer: ${options[userAnswer] || userAnswer}
Correct Answer: ${options[correctAnswer] || correctAnswer}

Explain it like you're an enthusiastic and helpful tutor. Give a clear, step-by-step breakdown. Use markdown to format the output nicely.`;

    const content = await executeAIFallback([{ role: "user", content: prompt }]);
    res.json({ success: true, explanation: content });
  } catch (error: any) {
     console.error("AI Explain Error:", error);
     res.status(500).json({ success: false, error: `Explain API Error: ${error.message || "Unknown error"}` });
  }
});

// ALOC Past Questions API Helper
async function fetchAlocQuestions(subject: string, limit: number, year?: string, type?: string): Promise<any[] | null> {
  const token = process.env.VITE_ALOC_ACCESS_TOKEN || "ALOC-78bfe77b49fb3e407bf8";
  if (!token) return null;
  
  // Normalize subject name to match ALOC subjects
  const subLower = String(subject).toLowerCase().trim();
  let alocSubject = "";
  if (subLower.includes("mathematics") || subLower === "math" || subLower === "further mathematics") alocSubject = "mathematics";
  else if (subLower.includes("english")) alocSubject = "english";
  else if (subLower.includes("biology")) alocSubject = "biology";
  else if (subLower.includes("chemistry")) alocSubject = "chemistry";
  else if (subLower.includes("physics")) alocSubject = "physics";
  else if (subLower.includes("economics")) alocSubject = "economics";
  else if (subLower.includes("geography")) alocSubject = "geography";
  else if (subLower.includes("government")) alocSubject = "government";
  else if (subLower.includes("literature")) alocSubject = "english literature";
  else if (subLower.includes("crk") || subLower.includes("christian")) alocSubject = "crk";
  else if (subLower.includes("irk") || subLower.includes("islamic")) alocSubject = "irk";
  else if (subLower.includes("commerce")) alocSubject = "commerce";
  else if (subLower.includes("accounting") || subLower.includes("financial")) alocSubject = "accounting";
  else if (subLower.includes("agric")) alocSubject = "agricultural science";
  else if (subLower.includes("civic")) alocSubject = "civic education";

  if (!alocSubject) {
    console.log(`[ALOC API] Subject "${subject}" is not a direct match for ALOC past questions API database.`);
    return null;
  }

  try {
    // Fetch a larger set (80) so that we have enough diversity, random selection, and topic keyword coverage
    let url = `https://questions.aloc.com.ng/v1/qp/questions?subject=${alocSubject}&limit=80`;
    
    if (year && year !== "any" && year !== "random") {
      url += `&year=${year}`;
    }
    
    console.log(`[ALOC API] Fetching from endpoint: ${url}`);
    
    const cleanToken = token.replace(/^["']+|["']+$/g, "").trim();
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "AccessToken": cleanToken
    };

    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`[ALOC API] Request failed with status ${res.status}`);
      return null;
    }

    const jsonHistory: any = await res.json();
    if (jsonHistory && jsonHistory.data && Array.isArray(jsonHistory.data) && jsonHistory.data.length > 0) {
      console.log(`[ALOC API] Successfully retrieved ${jsonHistory.data.length} questions for subject '${alocSubject}'`);
      return jsonHistory.data;
    }
    return null;
  } catch (err: any) {
    console.error("[ALOC API] Failed fetching questions:", err.message || err);
    return null;
  }
}

// Questions generator API Endpoint
app.get(["/api/questions", "/questions"], async (req, res) => {
  try {
    const { subject = "english", year = "any", type = "standard", bank = "public", topic = "" } = req.query;
    const limitNum = type === "micro" ? 5 : 40;
    
    let allQuestions: any[] = [];
    let responseSubject = typeof topic === "string" && topic.trim().length > 0 
      ? `${subject} - ${topic.trim()}` 
      : String(subject);

    // Normalize subject name
    const subjectStr = String(subject).trim();
    const topicStr = typeof topic === "string" ? topic.trim() : "";

    // Try fetching from ALOC if requested, or if subject is matching Nigerian WAEC/UTME subjects
    let fetchedAloc: any[] | null = null;
    const isAlocEligible = ["mathematics", "english", "biology", "chemistry", "physics", "economics", "geography", "government", "literature", "crk", "irk", "commerce", "accounting", "agric", "civic"]
      .some(s => subjectStr.toLowerCase().includes(s));

    if (isAlocEligible) {
      console.log(`[ALOC Past Questions] Checking ALOC API for subject: ${subjectStr}`);
      fetchedAloc = await fetchAlocQuestions(subjectStr, limitNum, String(year));
    }

    if (fetchedAloc && fetchedAloc.length > 0) {
      // Map ALOC questions keys to match our exact required schema
      const mappedAloc = fetchedAloc.map((item: any) => {
        const optionsRaw = item.option || item.options || {};
        const cleanOptions: Record<string, string> = {
          a: optionsRaw.a || optionsRaw.A || "",
          b: optionsRaw.b || optionsRaw.B || "",
          c: optionsRaw.c || optionsRaw.C || "",
          d: optionsRaw.d || optionsRaw.D || ""
        };

        let cleanAnswer = "a";
        if (typeof item.answer === "string") {
          cleanAnswer = item.answer.toLowerCase().trim();
        }

        return {
          id: String(item.id || Math.random()),
          question: item.question || "",
          option: cleanOptions,
          answer: cleanAnswer,
          solution: item.solution || item.explanation || "No explanation provided.",
          examyear: item.examyear || item.year || "Past Question"
        };
      });

      // If they passed a specific topic, filter the ALOC past questions by matching keywords
      if (topicStr.length > 0) {
        const subTopicLower = topicStr.toLowerCase();
        console.log(`[ALOC Filter] Filtering ALOC questions by keyword: "${subTopicLower}"`);
        const topicFiltered = mappedAloc.filter(q => {
          const contentStr = `${q.question} ${Object.values(q.option).join(" ")} ${q.solution}`.toLowerCase();
          return contentStr.includes(subTopicLower);
        });

        if (topicFiltered.length >= limitNum) {
          console.log(`[ALOC Filter] Success: Found ${topicFiltered.length} authentic questions covering topic "${topicStr}"`);
          allQuestions = topicFiltered;
        } else if (topicFiltered.length > 0) {
          console.log(`[ALOC Filter] Partial: Found ${topicFiltered.length} questions matching topic, padding with general ${subjectStr} questions`);
          allQuestions = [...topicFiltered, ...mappedAloc.filter(q => !topicFiltered.includes(q))];
        } else {
          // No direct matches on ALOC for this highly specific topic - fall back to generate rigorous, bespoke questions!
          console.log(`[ALOC Filter] No matching ALOC questions for topic "${topicStr}". Falling back to AI model to generate high-rigidity questions.`);
          fetchedAloc = null;
        }
      } else {
        allQuestions = mappedAloc;
      }
    }

    // AI Fallback Question Generation (or when no ALOC questions exist)
    if (!fetchedAloc || allQuestions.length === 0) {
      let yearInstruction = "";
      if (typeof year === "string" && (year.toLowerCase() === "random" || year.toLowerCase() === "any")) {
        yearInstruction = "Assign a random past year designation (e.g. 2018, 2021) to each question.";
      } else {
        yearInstruction = `All questions should be set or adapted for the past year ${year}.`;
      }
      
      let topicInstruction = "";
      if (topicStr.length > 0) {
        topicInstruction = `The questions MUST test highly specific, advanced academic knowledge on the topic of "${topicStr}".`;
      }

      const prompt = `Generate exactly ${limitNum} exceptionally difficult, intellectually rigorous, and upper-division university/certification-grade mock exam multiple choice questions for the subject: "${subjectStr}". 
      ${yearInstruction} 
      ${topicInstruction}
      
      The questions MUST:
      1. Be highly challenging, representing very hard high-level college, prestigious professional institute-level, or professional board-level styles (Nigerian, UK, Australian, or US style).
      2. Ensure an exceptionally diverse mix of question subgroups! For relevant subjects (especially medical/health sciences), enforce this distribution: roughly 40% Clinical & Surgical Scenarios (highest proportion). Deeply integrate the remaining 60% across these 16 types: (1) Fundamental Theory, (2) Gross Anatomy, (3) Histology & Cytology, (4) Pathophysiology, (5) Pharmacology & Therapeutics, (6) Epidemiology & Public Health, (7) Diagnostic Imaging & Radiology, (8) Genetics & Molecular Biology, (9) Biochemistry & Metabolism, (10) Immunology & Serology, (11) Embryology & Developmental Biology, (12) Microbiology & Parasitology, (13) Behavioral Science & Psychiatry, (14) Medical Ethics & Law, (15) Biostatistics & Research, and (16) Toxicology & Forensic Pathology.
      3. Vary the formats: combine direct high-level knowledge queries with detailed scenarios, algebraic formulas, chemical reactions, or brief vignettes.
      4. Use precise modern nomenclature (such as IUPAC for Chemistry), strict scientific/academic terminology, and absolute technical accuracy.
      5. Have highly plausible and sophisticated distractors (incorrect options) that require careful analysis and cannot be easily eliminated.
      
      Keep the 'solution' field very brief (1-2 sentences maximum) explaining the exact step-by-step reasoning or mathematical proof.
      
      IMPORTANT: You MUST return your response as a raw JSON string EXACTLY formatted matching this schema:
      {
         "subject": "${responseSubject}",
         "data": [
            {
               "id": "q1",
               "question": "question HTML or text here",
               "option": { "a": "opt A", "b": "opt B", "c": "opt C", "d": "opt D" },
               "answer": "a",
               "solution": "step by step solution",
               "examyear": "2024"
            }
         ]
      }`;

      console.log(`[AI Generation] Dispatching request for extremely challenging questions of ${subjectStr} (Topic: ${topicStr || "None"})`);
      const content = await executeAIFallback(
        [{ role: "user", content: prompt }],
        { isJson: true }
      );

      let jsonStr = content.trim() || "{}";
      const firstBracket = jsonStr.indexOf("{");
      const lastBracket = jsonStr.lastIndexOf("}");
      if (firstBracket !== -1 && lastBracket !== -1) {
         jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
      }
      const json = JSON.parse(jsonStr);
      if (json.subject) {
         responseSubject = String(json.subject);
      }
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        allQuestions = [...json.data];
      } else {
         throw new Error("AI returned empty or invalid question data format.");
      }
    }

    // Shuffle and randomize the questions array
    for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    res.json({ success: true, subject: responseSubject, data: allQuestions.slice(0, limitNum) });
  } catch (err: any) {
    console.error("Questions endpoint error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// Study Coach / Chatbot Endpoint
app.post(["/api/chatbot", "/chatbot"], async (req, res) => {
  try {
    const { messages } = req.body; 
    
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
    
    const content = await executeAIFallback(formattedMessages);
    
    res.json({ success: true, text: content });
  } catch (error: any) {
     console.error("Chatbot Error:", error);
     res.status(500).json({ success: false, error: `Study Coach API Error: ${error.message}` });
  }
});

// Process Study Material File Endpoint via Gemini/Groq Fallbacks
app.post("/api/process-file", async (req, res) => {
  try {
    const { fileBase64, mimeType = "", fileName = "", action, message } = req.body;
    
    if (!fileBase64) {
      return res.status(400).json({ success: false, error: "File content is required." });
    }
    
    const isImage = mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(fileName);
    
    if (isImage) {
      if (action === "tutor") {
        const prompt = `You are an expert AI Study Coach. The student has uploaded an image named: "${fileName}".
        Look at this image content and fulfill their study request: "${message || "Explain the main key terms and concepts in detail."}"
        
        Provide a highly encouraging, structured, and easy-to-understand explanation with bullet points and bold headers. Do not make up information if the content can't be found. Always remain helpful and precise. Respond in Markdown.`;
        
        const content = await executeAIFallback([
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${fileBase64}` } }
            ]
          }
        ], { isVision: true });
        
        res.json({ success: true, text: content || "No response generated." });
      } else if (action === "exam") {
        const examPrompt = `We need to generate between 25 and 30 high-quality, professional, college-grade and institute-level mock exam multiple choice questions based STRICTLY and ONLY on the uploaded image named: "${fileName}".
        First, deduce the specific subject name of the exam from the file name "${fileName}" and the visual content of the image. The deduced subject should be precise (e.g., "Organic Chemistry", "Anatomy", "Financial Accounting", "Thermodynamics", "Clinical Medicine") instead of generic terms. Do NOT default to "English" or "Uploaded Study Material" unless the content is genuinely english language.
        Ensure that the questions reflect very hard, rigorous certification, university-level, or professional standards in Nigerian, UK, Australian, or US style for the specific subject matter and topics shown. Avoid overly simple, trivial, or basic questions.
        The generated questions MUST be perfectly synced and linked with the actual topics, concepts, and content of the image. The questions must test clinical reasoning, critical thinking, or multi-step problem solving. For each question, provide 4 options (a, b, c, d) and assign the single correct answer, a brief step-by-step solution / explanation, and the source. All questions on standard / premium must test very hard high-level concepts and specific topics from the document.
        
        You must return your output strictly in JSON format matching this schema:
        {
           "subject": "The deduced precise subject based on the filename and image content",
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
        
        const content = await executeAIFallback([
          {
            role: "user",
            content: [
              { type: "text", text: examPrompt },
              { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${fileBase64}` } }
            ]
          }
        ], { isVision: true, isJson: true });
        
        let responseText = content || "{}";
        responseText = responseText.trim();
        const firstBracket = responseText.indexOf("{");
        const lastBracket = responseText.lastIndexOf("}");
        if (firstBracket !== -1 && lastBracket !== -1) {
           responseText = responseText.substring(firstBracket, lastBracket + 1);
        }
        let json: any = { subject: "Uploaded Study Material", questions: [] };
        try {
           json = JSON.parse(responseText);
        } catch (e: any) {
           console.error("Image JSON parse error:", e, responseText);
           throw new Error("AI returned malformed JSON instead of a valid exam format.");
        }
        res.json({ success: true, subject: (json.subject ? String(json.subject) : "Uploaded Study Material"), questions: json.questions || [] });
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
          const { PDFParse } = require("pdf-parse");
          const buffer = Buffer.from(fileBase64, "base64");
          const parser = new PDFParse({ data: buffer });
          const pdfData = await parser.getText();
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
      
      if (action === "tutor") {
        const textPrompt = `You are an expert AI Study Coach. The student has uploaded a study material file named: "${fileName}".
        Below is the content of the file:
        
        --- FILE CONTENT START ---
        ${extractedText.substring(0, 40000)}
        --- FILE CONTENT END ---
        
        Read the content of this file and fulfill their study request: "${message || "Explain the main key terms and concepts in detail."}"
        
        Provide a highly encouraging, structured, and easy-to-understand explanation with bullet points and bold headers. Do not make up information if the content can't be found. Always remain helpful and precise. Respond in Markdown.`;
        
        const content = await executeAIFallback([{ role: "user", content: textPrompt }]);
        
        res.json({ success: true, text: content || "No response generated." });
      } else if (action === "exam") {
        const examPrompt = `We need to generate between 25 and 30 high-quality, professional, college-grade and institute-level mock exam multiple choice questions based STRICTLY and ONLY on the uploaded file named: "${fileName}".
        First, deduce the specific subject name of the exam from the file title "${fileName}" and the content of the file. The deduced subject should be highly precise and clear (e.g., "Organic Chemistry", "Anatomy", "Financial Accounting", "Thermodynamics", "Clinical Medicine") instead of generic terms. Do NOT default to "English" or "Uploaded Study Material" unless the content is genuinely english language.
        Below is the content of the file:
        
        --- FILE CONTENT START ---
        ${extractedText.substring(0, 35000)}
        --- FILE CONTENT END ---
        
        Ensure that the questions reflect very hard, rigorous certification, university-level, or professional standards in Nigerian, UK, Australian, or US style for the specific subject matter covered in this document. Avoid overly simple, trivial, or basic questions.
        The generated questions MUST be perfectly synced and linked with the specific topics, facts, concepts, and subject of the document content provided above. The questions must test clinical reasoning, deep analytical understanding, or complex problem-solving. Each question should test a clear and distinct high-level topic or concept from the content. For each question, provide 4 options (a, b, c, d) and assign the single correct answer, a brief step-by-step solution / explanation, and the source. All standard / premium questions must represent very hard high-level college and institute-style assessments.
        
        You must return your output strictly in JSON format matching this schema:
        {
           "subject": "The deduced precise subject based on the filename and file content",
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
        
        const content = await executeAIFallback(
          [{ role: "user", content: examPrompt }],
          { isJson: true }
        );
        
        let responseText = content || "{}";
        responseText = responseText.trim();
        const firstBracket = responseText.indexOf("{");
        const lastBracket = responseText.lastIndexOf("}");
        if (firstBracket !== -1 && lastBracket !== -1) {
           responseText = responseText.substring(firstBracket, lastBracket + 1);
        }
        let json: any = { subject: "Uploaded Study Material", questions: [] };
        try {
           json = JSON.parse(responseText);
        } catch (e: any) {
           console.error("Text JSON parse error:", e, responseText);
           throw new Error("AI returned malformed JSON instead of a valid exam format.");
        }
        res.json({ success: true, subject: (json.subject ? String(json.subject) : "Uploaded Study Material"), questions: json.questions || [] });
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
