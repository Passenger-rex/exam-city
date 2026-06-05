import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MailCheck, Loader2, XCircle } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Activating your account. Please hold...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid validation token. The account activation link is incorrect or broken.");
      return;
    }

    async function verifyEmail() {
      try {
        const docRef = doc(db, "email_verifications", token as string);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          setStatus("error");
          setMessage("Activation token is empty or has expired.");
          return;
        }

        const data = snap.data();
        if (data.used || data.verified) {
          setStatus("error");
          setMessage("This email activation link has already been used.");
          return;
        }

        const expiresAt = new Date(data.expiresAt || data.expires_at).getTime();
        if (Date.now() > expiresAt) {
          setStatus("error");
          setMessage("This activation session has expired. Please sign up or request a new link.");
          return;
        }

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

        setStatus("success");
        setMessage("Your email address has been verified successfully. Your Exam City account is active.");
      } catch (err: any) {
        console.error("Email verification error:", err);
        setStatus("error");
        setMessage("Handshake validation failed. Please try signing in again.");
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4 py-8 transition-colors duration-300">
      <div className="w-full max-w-sm bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/80 rounded-2xl shadow-lg p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header Branding */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/40 dark:border-indigo-950/20 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
            Activation Guard
          </div>
          <h1 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight">
            Exam City
          </h1>
        </div>

        {/* Action Visualizer */}
        <div className="flex flex-col items-center justify-center py-2">
          {status === "loading" && (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
              <div className="relative w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center border border-indigo-100/30 dark:border-indigo-900/10 text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-500/15 blur-xl animate-pulse" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/10 animate-in zoom-in-50 duration-300">
                <MailCheck className="w-6 h-6" />
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-xl animate-pulse" />
              <div className="relative w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center border border-rose-100/20 dark:border-rose-900/10 text-rose-600 dark:text-rose-400 animate-in zoom-in-50 duration-300">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          )}
        </div>

        {/* Context Information */}
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-mono">
            {status === "loading" ? "Activating..." : status === "success" ? "All Systems Active!" : "Failed"}
          </h2>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
            {message}
          </p>
        </div>

        {status === "success" && (
          <div className="pt-1 animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-relaxed">
              Account activated! You can now check verification status on your original sign-in screen or continue to landing.
            </p>
            <div>
              <a
                href="/login"
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-all active:scale-[0.98] shadow-sm shadow-indigo-500/10 cursor-pointer"
              >
                Go to Profile Dashboard
              </a>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="pt-1">
            <a
              href="/login"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-[11px] font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              Return to Sign-in Portal
            </a>
          </div>
        )}

        <div className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest font-mono border-t border-neutral-250/20 dark:border-neutral-800/60 pt-4">
          Exam City Guard • Active Verification
        </div>

      </div>
    </div>
  );
}
