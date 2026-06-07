import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  MailCheck, 
  Loader2, 
  ShieldAlert,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Mail
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { OTPInput } from "../components/OTPInput";

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const state = location.state as {
    verificationId?: string;
    email?: string;
    password?: string;
    uid?: string;
    name?: string;
    isSignup?: boolean;
  } | null;

  const [verificationId, setVerificationId] = useState(state?.verificationId || "");
  const [otpCode, setOtpCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!state || !state.email || !state.verificationId) {
      setStatus("error");
      setMessage("Invalid verification session. Please try logging in again.");
    }
  }, [state]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0 && status !== 'success') {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, status]);

  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      setStatus("error");
      setMessage("Please enter a valid 6-digit OTP.");
      return;
    }
    
    setStatus("loading");
    setMessage("Verifying your code...");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId, otpCode }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Invalid OTP code.");

      if (state?.uid) {
        await updateDoc(doc(db, "users", state.uid), {
          emailVerified: true,
        });

        // Send welcome email after successful registration/verification
        if (state?.isSignup) {
           await fetch("/api/auth/send-welcome", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ email: state.email, name: state.name }),
           });
        }

        setStatus("success");
        setMessage("Email verified successfully! Logging you in...");

        // Auto login
        if (state?.password && state?.email) {
          setTimeout(async () => {
             await signInWithEmailAndPassword(auth, state.email!, state.password!);
             navigate("/dashboard");
          }, 1500);
        } else {
           setTimeout(() => navigate("/login"), 1500);
        }
      } else {
        setStatus("success");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to verify code.");
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setStatus("loading");
    setMessage("Sending new code...");
    setOtpCode("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: state?.email, 
          name: state?.name, 
          isSignup: state?.isSignup || false 
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP.");

      setVerificationId(data.verificationId);
      setCountdown(60);
      setStatus("idle");
      setMessage(""); // Clear message to show form again
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to resend code.");
    }
  };

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (otpCode.length === 6 && status === "idle") {
      handleVerify();
    }
  }, [otpCode]);

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      <div className="w-full max-w-md z-10 bg-surface p-8 rounded-[32px] border border-outline-variant/30 shadow-2xl relative overflow-hidden">
        
        {/* State UI mapping */}
        <AnimatePresence mode="wait">
          {status === "error" && !state?.email ? (
             <motion.div
               key="error-state"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               className="text-center space-y-6"
             >
               <div className="w-20 h-20 bg-error/10 text-error rounded-3xl mx-auto flex items-center justify-center border border-error/20">
                 <ShieldAlert className="w-10 h-10" />
               </div>
               <div>
                 <h2 className="text-xl font-bold mb-2">Verification Error</h2>
                 <p className="text-on-surface-variant text-sm">{message}</p>
               </div>
               <Link
                 to="/login"
                 className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-on-primary font-bold rounded-2xl transition-all"
               >
                 Return to Login
                 <ChevronRight className="w-4 h-4" />
               </Link>
             </motion.div>
          ) : status === "success" ? (
             <motion.div
               key="success-state"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               className="text-center space-y-6 py-4"
             >
               <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2rem] mx-auto flex items-center justify-center border border-emerald-500/20">
                 <MailCheck className="w-12 h-12" />
               </div>
               <div>
                 <h2 className="text-xl font-bold mb-2">Account Verified!</h2>
                 <p className="text-on-surface-variant text-sm animate-pulse">{message}</p>
               </div>
             </motion.div>
          ) : (
             <motion.div
               key="form-state"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-6"
             >
               <div className="text-center space-y-2">
                 <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl mx-auto flex items-center justify-center mb-6 border border-primary/20">
                   <Mail className="w-8 h-8" />
                 </div>
                 <h2 className="text-2xl font-bold">Check your email</h2>
                 <p className="text-sm text-on-surface-variant">
                   We sent a 6-digit verification code to
                   <br />
                   <span className="font-bold text-on-surface">{state?.email}</span>
                 </p>
               </div>

               {status === "error" && (
                 <div className="bg-error/10 text-error p-3 rounded-xl text-sm border border-error/20 flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4 shrink-0" />
                   {message}
                 </div>
               )}

               <div className={status === "loading" ? "opacity-50 pointer-events-none" : ""}>
                 <OTPInput
                   value={otpCode}
                   onChange={(val) => {
                     setOtpCode(val);
                     if (status === "error") setStatus("idle");
                   }}
                   disabled={status === "loading"}
                 />
               </div>

               <button
                 onClick={handleVerify}
                 disabled={status === "loading" || otpCode.length !== 6}
                 className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all my-2"
               >
                 {status === "loading" ? (
                   <>
                     <Loader2 className="w-5 h-5 animate-spin" />
                     {message || "Verifying..."}
                   </>
                 ) : (
                   <>Verify Account <ArrowRight className="w-4 h-4" /></>
                 )}
               </button>

               <div className="text-center">
                 <button
                   onClick={handleResend}
                   disabled={countdown > 0 || status === "loading"}
                   className="text-sm font-medium flex items-center justify-center w-full gap-2 text-on-surface-variant disabled:opacity-50 hover:text-on-surface transition-colors"
                 >
                   <RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
                   {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
                 </button>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
