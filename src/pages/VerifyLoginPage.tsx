import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck, Loader2, XCircle } from "lucide-react";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

export default function VerifyLoginPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Authenticating browser profile. Please hold...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid identity token. The verification link is incorrect or broken.");
      return;
    }

    async function verifyToken() {
      try {
        const docRef = doc(db, "login_verifications", token as string);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          setStatus("error");
          setMessage("Verification secure bridge token is empty or has expired.");
          return;
        }

        const data = snap.data();
        if (data.used || data.verified) {
          setStatus("error");
          setMessage("This verification link has already been used.");
          return;
        }

        const expiresAt = new Date(data.expires_at || data.expiresAt).getTime();
        if (Date.now() > expiresAt) {
          setStatus("error");
          setMessage("This login verification session has expired. Please log in again.");
          return;
        }

        // --- SECURE TRUST BINDING ---
        const userDocRef = doc(db, "users", data.uid);
        try {
          await updateDoc(userDocRef, {
            trustedDevices: arrayUnion(data.device_id)
          });
        } catch (profileErr) {
          console.warn("Could not append trusted device footprint:", profileErr);
        }

        await updateDoc(docRef, {
          verified: true,
          used: true
        });

        setStatus("success");
        setMessage("Device verified successfully. Check your first browser window to access your dashboard.");
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage("Security validation handshake failed. Please try logging in again.");
      }
    }

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4 py-8 transition-colors duration-300">
      <div className="w-full max-w-sm bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/80 rounded-2xl shadow-lg p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header Branding */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/40 dark:border-indigo-950/20 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
            Security Bridge
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
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />
              <div className="relative w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center border border-emerald-100/20 dark:border-emerald-900/10 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50 duration-300">
                <ShieldCheck className="w-6 h-6" />
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
            {status === "loading" ? "Authorizing..." : status === "success" ? "Access Granted" : "Validation Failed"}
          </h2>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
            {message}
          </p>
        </div>

        {/* Clear Instructions */}
        {status === "success" && (
          <div className="p-3 bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-150/40 dark:border-neutral-800/60 rounded-xl space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
              Safe to Close Tab
            </p>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium leading-relaxed">
              Your device profile is registered. Your other active browser sign-in tab will launch automatically.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="pt-1">
            <a
              href="/login"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-[11px] font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              Back to Secure Portal
            </a>
          </div>
        )}

        <div className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest font-mono border-t border-neutral-250/20 dark:border-neutral-800/60 pt-4">
          Exam City Guard • Live Bridge
        </div>

      </div>
    </div>
  );
}
