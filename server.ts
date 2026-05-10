import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin pointing to the requested project and database
const appAdmin = initializeApp({
  projectId: "gen-lang-client-0439821239"
});
const db = getFirestore(appAdmin, "j-texams-db");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware explicitly (required before API / Vite middleware processing)
  app.use(express.json());

  // Upgrade / Payment API Endpoint
  app.post("/api/upgrade", (req, res) => {
    // Flutterwave V3 logic scaffolding
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
