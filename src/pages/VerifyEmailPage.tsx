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
    <div className="min-h-screen bg-[#FDFDFF] relative flex items-center justify-center p-4 font-sans overflow-hidden">
      {/* Background Ambience - Same high-end theme as Auth Page */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[600px] h-[600px] bg-primary/10 blur-[140px] rounded-full mix-blend-multiply" />
        <div className="absolute top-[30%] -right-[10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(#C6C6CD 1px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Back to Home/Login Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate("/login")}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-xs font-bold text-on-surface-variant/60 hover:text-primary transition-all group bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/50 shadow-sm cursor-pointer"
      >
        <span className="rotate-180"><ArrowRight className="w-3.5 h-3.5" /></span>
        Back to Login
      </motion.button>
      
      <div className="w-full max-w-[440px] z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] relative overflow-hidden"
        >
          {/* Prominent Logo */}
          <div className="flex flex-col items-center justify-center mb-10">
            <motion.img 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src="/examcity_no_bg.png" 
              alt="ExamCity Logo" 
              className="h-20 w-auto max-w-[240px] object-contain"
              referrerPolicy="no-referrer" 
            />
          </div>

          <AnimatePresence mode="wait">
            {status === "error" && !state?.email ? (
               <motion.div
                 key="error-state"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0 }}
                 className="text-center space-y-8"
               >
                 <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] mx-auto flex items-center justify-center border border-rose-100 shadow-sm">
                   <ShieldAlert className="w-10 h-10" />
                 </div>
                 <div className="space-y-2">
                   <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">Session Expired</h2>
                   <p className="text-on-surface-variant/70 text-sm font-medium leading-relaxed">{message}</p>
                 </div>
                 <Link
                   to="/login"
                   className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-on-primary font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                 >
                   Return to Login
                   <ArrowRight className="w-4 h-4" />
                 </Link>
               </motion.div>
            ) : status === "success" ? (
               <motion.div
                 key="success-state"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0 }}
                 className="text-center space-y-8 py-6"
               >
                 <div className="relative mx-auto w-24 h-24">
                   <motion.div 
                     initial={{ scale: 0.8, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center border border-emerald-100 shadow-sm"
                   >
                     <MailCheck className="w-12 h-12" />
                   </motion.div>
                   <motion.div 
                     animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                     transition={{ duration: 1.5, repeat: Infinity }}
                     className="absolute inset-0 bg-emerald-500/20 rounded-[2.5rem]"
                   />
                 </div>
                 <div className="space-y-2">
                   <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">Verified Successfully!</h2>
                   <p className="text-emerald-600 font-bold text-sm tracking-wide uppercase px-2">{message}</p>
                 </div>
               </motion.div>
            ) : (
               <motion.div
                 key="form-state"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-8"
               >
                 <div className="text-center space-y-3">
                   <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">Verify your identity</h2>
                   <p className="text-sm text-on-surface-variant/70 font-medium leading-relaxed">
                     Enter the 6-digit verification code <br/> we sent to <span className="text-primary font-bold">{state?.email}</span>
                   </p>
                 </div>

                 {status === "error" && (
                   <motion.div 
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold border border-rose-100 flex items-center gap-3"
                   >
                     <ShieldAlert className="w-4 h-4 shrink-0" />
                     {message}
                   </motion.div>
                 )}

                 <div className={`flex justify-center transition-all ${status === "loading" ? "opacity-40 grayscale pointer-events-none" : ""}`}>
                   <OTPInput
                     value={otpCode}
                     onChange={(val) => {
                       setOtpCode(val);
                       if (status === "error") setStatus("idle");
                     }}
                     disabled={status === "loading"}
                   />
                 </div>

                 <div className="space-y-4">
                   <button
                     onClick={handleVerify}
                     disabled={status === "loading" || otpCode.length !== 6}
                     className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                   >
                     {status === "loading" ? (
                       <>
                         <Loader2 className="w-5 h-5 animate-spin" />
                         Verifying...
                       </>
                     ) : (
                       <>Complete Verification <ArrowRight className="w-4 h-4" /></>
                     )}
                   </button>

                   <div className="flex flex-col items-center gap-4 pt-2">
                     <p className="text-xs text-on-surface-variant/50 font-bold uppercase tracking-widest">Didn't receive a code?</p>
                     <button
                       onClick={handleResend}
                       disabled={countdown > 0 || status === "loading"}
                       className="group text-sm font-bold flex items-center gap-2 text-primary hover:text-primary/80 disabled:text-on-surface-variant/40 disabled:cursor-not-allowed transition-all"
                     >
                       <RefreshCw className={`w-4 h-4 transition-transform group-hover:rotate-180 duration-500 ${status === 'loading' ? 'animate-spin' : ''}`} />
                       {countdown > 0 ? `Resend in ${countdown}s` : "Resend Verification Code"}
                     </button>
                   </div>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
