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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-8 sm:p-10 text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Branding */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
            Identity Certification
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            Exam City Activation
          </h1>
        </div>

        {/* Action Visualizer */}
        <div className="flex flex-col items-center justify-center py-4">
          {status === "loading" && (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-500/15 blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-in zoom-in-50 duration-300">
                <MailCheck className="w-8 h-8" />
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center border border-rose-100 dark:border-rose-900/20 text-rose-600 dark:text-rose-400 animate-in zoom-in-50 duration-300">
                <XCircle className="w-8 h-8" />
              </div>
            </div>
          )}
        </div>

        {/* Context Information */}
        <div className="space-y-3">
          <h2 className="text-lg font-black text-neutral-800 dark:text-neutral-200">
            {status === "loading" ? "Activating Account..." : status === "success" ? "Account Activated!" : "Validation Failed"}
          </h2>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
        </div>

        {status === "success" && (
          <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
              You may now return to your original login tab and select "Check Verification Status" to immediately launch your dashboard.
            </p>
            <div>
              <a
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all active:scale-[0.98] shadow-md shadow-indigo-500/15 cursor-pointer"
              >
                Go to login
              </a>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="pt-2">
            <a
              href="/login"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              Back to Sign-in
            </a>
          </div>
        )}

        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-mono font-bold border-t border-neutral-100 dark:border-neutral-800/60 pt-6">
          Exam City Authentication Protocol
        </div>

      </div>
    </div>
  );
}
