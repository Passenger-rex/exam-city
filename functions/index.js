const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')({ origin: true });
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore(admin.app(), "ai-studio-f3bff7d7-cefd-4a42-aa3d-c8cfedf96ffe");

// Hardcode the region to europe-west2
const regionalFunctions = functions.region("europe-west2");

// User Auth Trigger
exports.onUserCreated = regionalFunctions.auth.user().onCreate(async (user) => {
  try {
    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "Student",
      subscription_status: "free",
      role: "free",
      tier: "free",
      total_exams_taken: 0,
      average_score: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log("User profile created for", user.uid);
  } catch (error) {
    console.error("Error creating user profile", error);
  }
});

// Grading Function
exports.gradeExam = regionalFunctions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be signed in to submit an exam."
    );
  }

  const { examType, answers } = data;
  const userId = context.auth.uid;

  if (!answers || typeof answers !== "object") {
    throw new functions.https.HttpsError("invalid-argument", "Valid answers map is required.");
  }

  let score = 0;
  let total = 0;
  const detailedResults = [];

  try {
    for (const [questionId, selectedOption] of Object.entries(answers)) {
      total++;
      const qDoc = await db.collection("questions").doc(questionId).get();
      
      if (qDoc.exists) {
        const qData = qDoc.data();
        const isCorrect = qData.correct_answer === selectedOption;
        if (isCorrect) score++;
        
        detailedResults.push({
          questionId,
          isCorrect,
          correctAnswer: qData.correct_answer,
          explanation: qData.explanation
        });
      }
    }

    // Securely write results from the backend so clients can't spoof scores
    const resultRef = await db.collection("exam_results").add({
      userId,
      examType,
      score,
      total,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      score,
      total,
      detailedResults,
      resultId: resultRef.id
    };
  } catch (error) {
    console.error("Grading execution error:", error);
    throw new functions.https.HttpsError("internal", "An error occurred during grading.");
  }
});

// Premium Upgrades via Flutterwave V3 (Payment Link Generation)
exports.generatePaymentLink = regionalFunctions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { uid, email } = req.body;
    if (!uid || !email) {
      return res.status(400).send("UID and email are required");
    }

    try {
      // Flutterwave V4 Standard Payload Scaffold
      const payload = {
        tx_ref: `jtexams-${uid}-${Date.now()}`,
        amount: 5000,
        currency: "NGN",
        redirect_url: "https://your-domain.com/dashboard",
        customer: {
          email,
        },
        customizations: {
          title: "exam city Premium Access",
          description: "Unlock all past questions and analytics",
        }
      };

      // Simulated payment link generation
      // In prod: call Flutterwave endpoint and get real link
      // const response = await axios.post("https://api.flutterwave.com/v3/payments", payload, { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } });
      const paymentLink = `https://checkout.flutterwave.com/v3/hosted/pay/${payload.tx_ref}`;

      return res.json({ success: true, paymentLink });
    } catch (error) {
      console.error("Payment Link Generation Error:", error);
      return res.status(500).json({ error: "Failed to generate payment link" });
    }
  });
});

// Scheduled Sync to Master Google Sheet
exports.scheduledSyncToSheets = regionalFunctions.pubsub.schedule("every 24 hours").onRun(async (context) => {
  try {
    const configDoc = await db.collection("settings").doc("google_sheets").get();
    if (!configDoc.exists) {
      console.log("No google_sheets config found, skipping sync.");
      return null;
    }
    const data = configDoc.data();
    if (!data.spreadsheetId) return null;

    // Ideally, we'd use a service account or refreshed token. 
    // Since this is a demo/prototype architecture:
    console.log(`Cron triggered: Syncing pending feedbacks to sheet ${data.spreadsheetId}`);
    
    // 1. Fetch pending feedbacks (for example, where synced == false)
    // 2. Refresh Google OAuth token using a stored refresh token
    // 3. Append to Google Sheets API
    // 4. Mark as synced.
    
    // Placeholder implementation due to OAuth limitations in background without stored refresh tokens
    const pendingFeedbacks = await db.collection("feedbacks").where("synced", "==", false).get();
    if (pendingFeedbacks.empty) {
      console.log("No pending feedbacks to sync.");
      return null;
    }
    console.log(`Found ${pendingFeedbacks.size} pending feedbacks. Sync execution initiated.`);
    
    // Update synced status internally for demo
    const batch = db.batch();
    pendingFeedbacks.docs.forEach(doc => {
      batch.update(doc.ref, { synced: true, syncedAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    await batch.commit();

  } catch (error) {
    console.error("Scheduled sync error:", error);
  }
  return null;
});
exports.verifyFlutterwaveWebhook = regionalFunctions.https.onRequest(async (req, res) => {
  // We do not wrap webhook in cors usually, but following the pattern:
  const signature = req.headers["verif-hash"];
  if (!signature || signature !== process.env.FLW_SECRET_HASH) {
    // In dev mode or missing env, we might comment this out to test or keep it secure
    console.warn("Invalid or missing webhook signature");
    return res.status(401).send("Unauthorized");
  }

  const payload = req.body;
  if (!payload || !payload.data) {
    return res.status(400).send("Invalid payload");
  }

  // Assuming Flutterwave V3 payload structure for success
  if (payload.data.status === "successful" && payload.data.amount >= 5000) {
    try {
      // Extract uid from tx_ref (e.g. jtexams-<uid>-<timestamp>)
      const txRef = payload.data.tx_ref || "";
      const uidMatch = txRef.match(/jtexams-([a-zA-Z0-9]+)-/);
      const uid = uidMatch ? uidMatch[1] : null;

      if (uid) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1-month duration
        await db.collection("users").doc(uid).set({
          subscription_status: "premium",
          role: "premium",
          tier: "pro",
          proType: "individual",
          billingInterval: "monthly",
          proExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
          premiumUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`User ${uid} upgraded to premium via webhook.`);
      }
      return res.status(200).send("Webhook processed");
    } catch (error) {
      console.error("Webhook processing error:", error);
      return res.status(500).send("Failed to process webhook");
    }
  }

  return res.status(200).send("Event ignored");
});

// Automatically sync & demote expired users whose one-month premium plan has expired
exports.scheduledSubscriptionSync = regionalFunctions.pubsub.schedule("every 12 hours").onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  try {
    const expiredUsersSnapshot = await db.collection("users")
      .where("tier", "==", "pro")
      .where("billingInterval", "==", "monthly")
      .get();

    console.log(`Scheduled Subscription sync checking ${expiredUsersSnapshot.size} potential expired monthly subscribers.`);
    
    let expiredCount = 0;
    const batch = db.batch();

    expiredUsersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      let expiresAtVal = null;
      if (data.proExpiresAt) {
        expiresAtVal = data.proExpiresAt.toDate ? data.proExpiresAt.toDate() : new Date(data.proExpiresAt);
      }

      if (expiresAtVal && expiresAtVal < now.toDate()) {
        const userRef = doc.ref;
        batch.set(userRef, {
          subscription_status: "free",
          role: "free",
          tier: "free",
          proType: null,
          billingInterval: null,
          proExpiresAt: null,
          groupMembers: null,
          demotedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        expiredCount++;
        console.log(`User ${doc.id} subscription expired on ${expiresAtVal.toISOString()}. Scheduled for demotion.`);
      }
    });

    if (expiredCount > 0) {
      await batch.commit();
      console.log(`Successfully updated ${expiredCount} expired subscriptions to 'free'.`);
    } else {
      console.log("No expired subscriptions detected.");
    }
  } catch (error) {
    console.error("Error in scheduled subscription sync:", error);
  }
  return null;
});

// Listener on 'payments' collection updates
exports.onPaymentUpdated = regionalFunctions.firestore
  .document("payments/{paymentId}")
  .onWrite(async (change, context) => {
    const data = change.after.exists ? change.after.data() : null;
    if (!data) return null;

    // Trigger only if payment status is verified/successful
    if (data.status === "verified" || data.status === "successful" || data.status === "completed") {
      const uid = data.userId || data.uid;
      if (!uid) {
        console.error("No valid user ID found in payment details for:", context.params.paymentId);
        return null;
      }

      // Handle raw timestamp or firestore Timestamp
      const paymentTime = data.updatedAt || data.createdAt || admin.firestore.FieldValue.serverTimestamp();
      let baseDate = new Date();
      if (paymentTime && paymentTime.toDate) {
        baseDate = paymentTime.toDate();
      } else if (paymentTime) {
        baseDate = new Date(paymentTime);
        if (isNaN(baseDate.getTime())) {
          baseDate = new Date();
        }
      }

      // Expiration 30 days from transaction timestamp
      const expiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      await db.collection("users").doc(uid).set({
        subscription_status: "premium",
        role: "premium",
        tier: "pro",
        proType: "individual",
        billingInterval: "monthly",
        proExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        premiumUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`User ${uid} successfully upgraded to 'premium' for 30 days based on payment ${context.params.paymentId}`);
    }
    return null;
  });

// Daily scheduled trigger to identify expired subscriptions and revert their role to 'free'
exports.scheduledDailySubscriptionSync = regionalFunctions.pubsub.schedule("every 24 hours").onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  try {
    // Look up users that are currently premium or pro and check expiration
    const activePremiumUsers = await db.collection("users")
      .where("role", "==", "premium")
      .get();

    console.log(`Daily Subscription checker scanning ${activePremiumUsers.size} premium users.`);

    let expiredCount = 0;
    const batch = db.batch();

    activePremiumUsers.docs.forEach(doc => {
      const data = doc.data();
      let expiresAtVal = null;
      if (data.proExpiresAt) {
        expiresAtVal = data.proExpiresAt.toDate ? data.proExpiresAt.toDate() : new Date(data.proExpiresAt);
      }

      if (expiresAtVal && expiresAtVal < now.toDate()) {
        batch.set(doc.ref, {
          subscription_status: "free",
          role: "free",
          tier: "free",
          proType: null,
          billingInterval: null,
          proExpiresAt: null,
          groupMembers: null,
          demotedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        expiredCount++;
        console.log(`Daily check: User ${doc.id} expired at ${expiresAtVal.toISOString()}. Reverting to free.`);
      }
    });

    if (expiredCount > 0) {
      await batch.commit();
      console.log(`Daily clean completed: Reverted ${expiredCount} expired users to free.`);
    } else {
      console.log("Daily clean: No expired subscriptions found today.");
    }
  } catch (error) {
    console.error("Daily clean error:", error);
  }
  return null;
});

