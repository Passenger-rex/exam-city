const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startTag = '// --- AUTH ENDPOINTS --- //';
const endTag = '// --- END AUTH ENDPOINTS --- //';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag) + endTag.length;

if (startIndex !== -1 && endIndex !== -1) {
  const newAuthCode = `// --- AUTH ENDPOINTS --- //

app.post("/api/auth/send-otp", async (req, res) => {
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
    });

    const emailHtml = \`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #000000; background-color: #ffffff;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #18181b;">\${isSignup ? 'Verify Your Email' : 'Verification Code'}</h2>
        <p style="font-size: 16px; margin-bottom: 12px;">Hello \${name || ''},</p>
        <p style="font-size: 16px; margin-bottom: 30px;">Please use the code below to verify your email address:</p>

        <div style="text-align: center; margin: 30px 0; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #18181b; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px; background-color: #f4f4f5;">
          \${otpCode}
        </div>

        <p style="font-size: 16px; margin-bottom: 12px;">This code is valid for 15 minutes.</p>
        <p style="font-size: 16px; margin-bottom: 4px; margin-top: 40px;">Thank you,</p>
        <p style="font-size: 16px; margin-bottom: 40px;">Exam City</p>
      </div>
    \`;

    await sendResendEmail({
      from: "Exam City <welcome@examcity.qzz.io>",
      to: email,
      subject: isSignup ? "Verify Your Exam City Account" : "Your Exam City Verification Code",
      text: \`Your verification code is: \${otpCode}. It is valid for 15 minutes.\`,
      html: emailHtml,
    });

    return res.json({ success: true, verificationId });
  } catch (error: any) {
    console.error("Failed to send OTP:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
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
      .eq("id", verification.id);

    return res.json({ success: true, email: verification.email });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.post("/api/auth/send-welcome", async (req, res) => {
  try {
    const { email, name } = req.body;

    const emailHtml = \`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #000000; background-color: #ffffff;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #18181b;">Welcome to Exam City!</h2>
        <p style="font-size: 16px; margin-bottom: 12px;">Hello \${name || ''},</p>
        <p style="font-size: 16px; margin-bottom: 12px;">Thank you for registering. Your account has been successfully created and verified.</p>
        <p style="font-size: 16px; margin-bottom: 30px;">We're excited to have you on board!</p>
        
        <p style="font-size: 16px; margin-bottom: 4px; margin-top: 40px;">Best regards,</p>
        <p style="font-size: 16px; margin-bottom: 40px;">The Exam City Team</p>
      </div>
    \`;

    await sendResendEmail({
      from: "Exam City <welcome@examcity.qzz.io>",
      to: email,
      subject: "Welcome to Exam City!",
      text: \`Hello \${name || ''}, Welcome to Exam City! Your account has been successfully verified.\`,
      html: emailHtml,
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to send welcome email:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// --- END AUTH ENDPOINTS --- //`;

  const newCode = code.substring(0, startIndex) + newAuthCode + code.substring(endIndex);
  fs.writeFileSync('server.ts', newCode);
  console.log('Successfully replaced Auth routes');
} else {
  console.log('Auth endpoint tags not found');
}
