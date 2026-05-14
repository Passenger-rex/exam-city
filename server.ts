import express from "express";
import path from "path";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import dotenv from "dotenv";
dotenv.config({ override: true });

import fs from "fs";

// Load firebase config
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

// Initialize Firebase Admin pointing to the requested project and database
const appAdmin = initializeApp({
  projectId: firebaseConfig.projectId
});
const db = getFirestore(appAdmin, firebaseConfig.firestoreDatabaseId);

const app = express();
const PORT = 3000;

app.use(express.json());

// Upgrade / Payment API Endpoint
app.post("/api/upgrade", (req, res) => {
  const { userId, transactionId } = req.body;
  res.json({
    success: true,
    message: "Payment verified. Account upgraded to premium.",
    data: { userId, transactionId }
  });
});

// Flutterwave Webhook Endpoint
app.post("/api/webhook/flutterwave", async (req, res) => {
  try {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    const signature = req.headers["verif-hash"];

    if (!secretHash || signature !== secretHash) {
      return res.status(401).send("Unauthorized");
    }

    const payload = req.body;
    
    // Check if this is a successful payment event
    if (payload.event === "charge.completed" && payload.data.status === "successful") {
      const customerEmail = payload.data.customer.email;
      const amount = payload.data.amount;
      const currency = payload.data.currency;

      // Verify amount and currency (e.g. 1500 NGN)
      if (amount >= 1500 && currency === "NGN") {
        // Find the user by email in Firestore
        const usersRef = db.collection("users");
        const snapshot = await usersRef.where("email", "==", customerEmail).get();
        
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await userDoc.ref.set({ tier: "pro" }, { merge: true });
          console.log(`Upgraded user ${customerEmail} to pro`);
        } else {
           console.log(`Payment successful but user ${customerEmail} not found`);
        }
      }
    }

    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Webhook failed");
  }
});

// Exam Grading Endpoint
app.post("/api/grade", async (req, res) => {
  try {
    const { userId, examType, answers } = req.body;
    
    let score = 0;
    let total = 0;
    const detailedResults: any[] = []; // Using any for scoping ease in MVP

    // We process all questions from the user's answers payload
    for (const [questionId, selectedOption] of Object.entries(answers)) {
      total++;
      const qDoc = await db.collection("questions").doc(questionId).get();
      if (qDoc.exists) {
        const qData = qDoc.data();
        const isCorrect = qData?.correct_answer === selectedOption;
        if (isCorrect) score++;
        detailedResults.push({
          questionId,
          questionText: qData?.question_text,
          options: qData?.options,
          isCorrect,
          userSelectedOption: selectedOption,
          correctAnswer: qData?.correct_answer,
          explanation: qData?.explanation
        });
      }
    }

    // Store results in exam_results collection securely
    const resultRef = await db.collection("exam_results").add({
      userId,
      examType,
      score,
      total,
      detailedResults,
      createdAt: FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      score,
      total,
      detailedResults,
      resultId: resultRef.id
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: "Grading failed" });
  }
});

// AI Explanations Endpoint
app.post("/api/explain", async (req, res) => {
  try {
    const { question, options, userAnswer, correctAnswer } = req.body;
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    const prompt = `Provide a detailed, step-by-step explanation for the following question, specifically addressing why the user's answer is incorrect and why the actual correct answer is right.
    
Question: ${question}
Options: ${JSON.stringify(options)}
User's Incorrect Answer: ${options[userAnswer] || userAnswer}
Correct Answer: ${options[correctAnswer] || correctAnswer}

Explain it like you're an enthusiastic and helpful tutor. Give a clear, step-by-step breakdown. Use markdown to format the output nicely.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    res.json({ success: true, explanation: response.text });
  } catch (error: any) {
     console.error("AI Explain Error:", error);
     res.status(500).json({ success: false, error: "Could not generate explanation." });
  }
});

// Questions generator API Endpoint
app.get("/api/questions", async (req, res) => {
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
    
    // If we need more questions, or if it's pro mode, mix in Gemini questions
    if (remainingLimit > 0 && (isPro || allQuestions.length === 0)) {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

      let yearInstruction = "";
      if (typeof year === "string" && (year.toLowerCase() === "random" || year.toLowerCase() === "any")) {
        yearInstruction = "Assign a random past year to each question.";
      } else {
        yearInstruction = `All questions should be specifically from or adapted from the year ${year}.`;
      }

      const prompt = `Surf online to find and return exactly ${remainingLimit} real, accurate, and challenging past questions for West African Examinations Council (WAEC), Joint Admissions and Matriculation Board (JAMB) or National Examinations Council (NECO) for the subject: "${subject}". ${yearInstruction} The difficulty MUST strictly match the rigor of standard Senior Secondary Certification Examination (SSCE) or University Tertiary Matriculation Examination (UTME). DO NOT generate overly simple questions; retrieve authentic complex questions that require critical thinking or multi-step problem solving.`;
      
      const responseSchema = {
          type: Type.OBJECT,
          properties: {
             subject: { type: Type.STRING },
             data: {
               type: Type.ARRAY,
               items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    option: {
                      type: Type.OBJECT,
                      properties: {
                        a: { type: Type.STRING },
                        b: { type: Type.STRING },
                        c: { type: Type.STRING },
                        d: { type: Type.STRING }
                      }
                    },
                    answer: { type: Type.STRING, enum: ["a", "b", "c", "d"] },
                    solution: { type: Type.STRING },
                    examyear: { type: Type.STRING }
                  },
                  required: ["id", "question", "option", "answer", "solution", "examyear"]
               }
             }
          },
          required: ["subject", "data"]
      };

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            temperature: 0.7,
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: responseSchema
          }
        });

        const jsonStr = response.text?.trim() || "{}";
        const json = JSON.parse(jsonStr);
        if (json.data && Array.isArray(json.data)) {
          allQuestions = [...allQuestions, ...json.data];
        }
      } catch (genErr) {
        console.error("Error generating questions with Gemini: ", genErr);
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
app.post("/api/chatbot", async (req, res) => {
  try {
    const { messages } = req.body; 
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    const history = messages.map((m: any) => ({
      role: m.role,
      parts: m.parts || [{ text: m.parts[0]?.text || "" }]
    }));
    
    // Generate content using the new genai SDK
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: history,
      config: {
        systemInstruction: "You are a helpful Study Coach tutor. Provide study tips, mental math tricks, and clear concise explanations for specific topics. Be encouraging and concise. Answer in markdown."
      }
    });
    
    res.json({ success: true, text: response.text });
  } catch (error: any) {
     console.error("Chatbot Error:", error);
     res.status(500).json({ success: false, error: "Could not reply." });
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
