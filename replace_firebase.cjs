const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const newCode = code.replace(
  `app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email, name, isSignup } = req.body;
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    const verificationId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabase.from("login_verifications").insert({
      id: verificationId,
      email: email,
      otp_code: otpCode,
      is_used: false,
      expires_at: expiresAt,
      attempt_count: 0,
      resend_count: 0,
    });`,
  `import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, query, collection, where, getDocs, updateDoc } from "firebase/firestore";
import localConfig from "./firebase-applet-config.json" with { type: "json" };
const fbApp = initializeApp(localConfig);
const serverDb = getFirestore(fbApp, localConfig.firestoreDatabaseId);

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email, name, isSignup } = req.body;
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));

    const verificationId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await setDoc(doc(serverDb, "login_verifications", verificationId), {
      id: verificationId,
      email: email,
      otp_code: otpCode,
      is_used: false,
      expires_at: expiresAt,
      attempt_count: 0,
      resend_count: 0,
    });`
);

let newCode2 = newCode.replace(
  `app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { verificationId, otpCode } = req.body;
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    const { data: verifications, error } = await supabase
      .from("login_verifications")
      .select("*")
      .eq("id", verificationId)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .limit(1);

    const verification = verifications?.[0];

    if (!verification) {
      return res.status(400).json({ error: "Session expired or verification not found" });
    }

    if (verification.attempt_count >= 5) {
      return res.status(429).json({ error: "Too many attempts" });
    }

    if (verification.otp_code !== String(otpCode).trim()) {
      const newCount = verification.attempt_count + 1;
      await supabase
        .from("login_verifications")
        .update({ attempt_count: newCount })
        .eq("id", verification.id);
      return res.status(400).json({ error: "Invalid OTP code", attemptsLeft: Math.max(0, 5 - newCount) });
    }

    await supabase
      .from("login_verifications")
      .update({ is_used: true })
      .eq("id", verification.id);`,
  `app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { verificationId, otpCode } = req.body;
    
    // Using Firestore instead of Supabase
    const q = query(
      collection(serverDb, "login_verifications"),
      where("id", "==", verificationId),
      where("is_used", "==", false),
      where("expires_at", ">", new Date().toISOString())
    );
    const snap = await getDocs(q);
    
    if (snap.empty) {
      return res.status(400).json({ error: "Session expired or verification not found" });
    }

    const verificationDoc = snap.docs[0];
    const verification = verificationDoc.data();

    if (verification.attempt_count >= 5) {
      return res.status(429).json({ error: "Too many attempts" });
    }

    if (verification.otp_code !== String(otpCode).trim()) {
      const newCount = verification.attempt_count + 1;
      await updateDoc(verificationDoc.ref, { attempt_count: newCount });
      return res.status(400).json({ error: "Invalid OTP code", attemptsLeft: Math.max(0, 5 - newCount) });
    }

    await updateDoc(verificationDoc.ref, { is_used: true });`
);

fs.writeFileSync('server.ts', newCode2);
console.log('Firebase replacements applied');
