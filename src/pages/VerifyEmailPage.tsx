import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { 
  MailCheck, 
  Loader2, 
  XCircle, 
  Fingerprint, 
  Globe, 
  CheckCircle2, 
  Lock, 
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "motion/react";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Activating your Exam City account...");
  const [userData, setUserData] = useState<any>(null);
  
  // Custom step-by-step progress checklist for email verification
  const [stepIndex, setStepIndex] = useState(0);
  const [dbCompleted, setDbCompleted] = useState(false);

  const steps = [
    "Establishing handshake with the user activation roster",
    "Validating secure registration verification signature",
    "Writing active enrollment permissions inside standard directory",
    "Handshake complete! Account fully active"
  ];

  useEffect(() => {
    if (status === "error") return;

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < 2) {
          return prev + 1;
        }
        if (dbCompleted && prev < 3) {
          return 3;
        }
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [status, dbCompleted]);

  useEffect(() => {
    if (dbCompleted && status === "success") {
      setStepIndex(3);
    }
  }, [dbCompleted, status]);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification activation token is missing. The link is incorrect or broken.");
      return;
    }

    async function verifyEmail() {
      try {
        const docRef = doc(db, "email_verifications", token as string);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          setStatus("error");
          setMessage("The registration verification token does not exist or has expired.");
          return;
        }

        const data = snap.data();
        setUserData(data);

        if (data.used || data.verified) {
          setStatus("error");
          setMessage("This registration activation link has already been used.");
          return;
        }

        const expiresAt = new Date(data.expiresAt || data.expires_at).getTime();
        if (Date.now() > expiresAt) {
          setStatus("error");
          setMessage("This email activation session has expired. Please register or request a new link.");
          return;
        }

        // Wait slightly to make sure step animations render nicely
        await new Promise((resolve) => setTimeout(resolve, 1200));

        // --- UPDATE USER ACCOUNT ---
        const userDocRef = doc(db, "users", data.uid);
        await updateDoc(userDocRef, {
          emailVerified: true
        });

        // --- MARK TOKEN USED ---
        await updateDoc(docRef, {
          verified: true,
          used: true
        });

        setDbCompleted(true);
        setStatus("success");
        setMessage("Your email address has been verified successfully. Your Exam City account is now active.");
      } catch (err: any) {
        console.error("Email verification error:", err);
        setStatus("error");
        setMessage("Security validation handshake failed. Please try signing in again.");
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none antialiased">
      
      {/* Decorative ambient background blur lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[130px] -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-600/5 blur-[100px] -z-10 pointer-events-none" />

      <div className="w-full max-w-[460px] relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800/80 mb-3 text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
            <Lock className="w-3 h-3 text-indigo-500 shrink-0" />
            Activation Guard
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl font-sans">
            Exam<span className="text-indigo-500">City</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1.5 font-medium max-w-xs mx-auto">
            Secure multi-tier student database activation
          </p>
        </div>

        {/* Content Box with glass effect */}
        <div className="bg-neutral-900/40 backdrop-blur-3xl border border-neutral-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          
          {/* Subtle top scanner light beam */}
          {status === "loading" && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-shimmer" />
          )}

          <AnimatePresence mode="wait">
            
            {status === "loading" && (
              <motion.div
                key="loading-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Visualizer Circle */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
                    <div className="relative w-20 h-20 rounded-2xl bg-neutral-900/90 flex items-center justify-center border border-neutral-800 text-indigo-400 group">
                      <Fingerprint className="w-10 h-10 animate-pulse text-indigo-500" />
                      <div className="absolute inset-1 rounded-xl border border-dashed border-indigo-500/30 animate-spin [animation-duration:15s]" />
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-semibold tracking-wide text-neutral-300 font-mono flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    {message}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Establishing safe node connections. Verifying signature...
                  </p>
                </div>

                {/* Progress Checklist */}
                <div className="bg-neutral-950/60 rounded-2xl p-4 border border-neutral-800/40 space-y-3.5">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                    Handshake Status log
                  </div>
                  <div className="space-y-3">
                    {steps.map((step, idx) => {
                      const isDone = stepIndex > idx;
                      const isActive = stepIndex === idx;
                      return (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-950/40" />
                            ) : isActive ? (
                              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-neutral-800 bg-neutral-900" />
                            )}
                          </div>
                          <p className={`text-xs ${isDone ? "text-neutral-400 font-medium line-through decoration-neutral-800" : isActive ? "text-indigo-400 font-semibold" : "text-neutral-600"}`}>
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Visualizer Check Circle */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-2xl animate-pulse" />
                    <div className="relative w-24 h-24 rounded-3xl bg-neutral-900/90 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-950/20">
                      <MailCheck className="w-12 h-12 text-emerald-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-neutral-950 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                <div className="text-center space-y-1.5">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Account Activated Successfully!
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                    {message}
                  </p>
                </div>

                {/* Data Footprint */}
                {userData && (
                  <div className="bg-neutral-950/80 rounded-2xl border border-neutral-800/80 divide-y divide-neutral-800/40 p-1">
                    <div className="p-3 text-left">
                      <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono mb-2">
                        Account Information
                      </div>
                      <div className="space-y-2 text-xs">
                        {userData.email && (
                          <div className="flex justify-between items-center text-neutral-400">
                            <span className="font-mono text-[10px]">Activated Email</span>
                            <span className="font-semibold text-white/90 truncate max-w-[200px]">
                              {userData.email}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-neutral-400">
                          <span className="font-mono text-[10px]">Verification Target</span>
                          <span className="font-semibold text-white/90 truncate max-w-[200px] font-mono text-[10px]">
                            {token?.substring(0, 16)}...
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-neutral-900/20 text-center">
                      <p className="text-[11px] text-green-400 font-medium flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        Permissions unlocked on live production node
                      </p>
                    </div>
                  </div>
                )}

                {/* Guidelines information */}
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    💡 Verified & Complete.
                  </p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-normal">
                    Your core account registry is established. You can now securely log in to your personalized test preparation dash board or check the status on your original sign-up tab.
                  </p>
                </div>

                {/* Primary Action Button */}
                <div className="space-y-3 pt-2">
                  <Link
                    to="/dashboard"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    Go to Account Dashboard
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Visualizer Warning Circle */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-rose-500/15 blur-2xl animate-pulse" />
                    <div className="relative w-20 h-20 rounded-2xl bg-neutral-900/90 flex items-center justify-center border border-rose-500/30 text-rose-500">
                      <ShieldAlert className="w-10 h-10" />
                    </div>
                  </div>
                </div>

                {/* Header Error Title */}
                <div className="text-center space-y-1.5">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Activation Handshake Failed
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                    {message}
                  </p>
                </div>

                {/* Detailed Troubleshooting Advice */}
                <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-left space-y-1.5">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest font-mono">
                    Security Advice
                  </span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-normal">
                    This verification link has expired or reached maximum transaction use limit. If your account is already active, please directly navigate to profile dashboard.
                  </p>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl border border-neutral-800 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Return to Login Hub
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                  </Link>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* Footer branding copyright */}
        <div className="text-center mt-6">
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest font-mono">
            Exam City Secure Port • Active Verification
          </p>
        </div>

      </div>
    </div>
  );
}
