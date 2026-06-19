import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { 
  ShieldCheck, 
  Loader2, 
  XCircle, 
  Fingerprint, 
  Globe, 
  Laptop, 
  CheckCircle2, 
  Lock, 
  Server, 
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "motion/react";

export default function VerifyLoginPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Establishing secure authentication bridge...");
  const [verificationData, setVerificationData] = useState<any>(null);
  
  // Custom step-by-step security progress checklist for elite tactile feedback
  const [stepIndex, setStepIndex] = useState(0);
  const [dbCompleted, setDbCompleted] = useState(false);

  const steps = [
    "Establishing cryptographic connection to security vault",
    "Validating secure browser profile and IP footprint",
    "Writing trusted unique hardware footprint",
    "Handshake complete! Access granted"
  ];

  useEffect(() => {
    // Progress through visual steps unless an error occurs
    if (status === "error") return;

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        // Stop at step 2 (0, 1, 2) until the database operations are verified
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

  // When database operations succeed, fast-track progress to the final step
  useEffect(() => {
    if (dbCompleted && status === "success") {
      setStepIndex(3);
    }
  }, [dbCompleted, status]);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing. The link is incorrect or broken.");
      return;
    }

    async function verifyToken() {
      try {
        const docRef = doc(db, "login_verifications", token as string);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          setStatus("error");
          setMessage("The secure bridge token does not exist or has expired.");
          return;
        }

        const data = snap.data();
        setVerificationData(data);

        if (data.used || data.verified) {
          setStatus("error");
          setMessage("This device verification link has already been used.");
          return;
        }

        const expiresAt = new Date(data.expires_at || data.expiresAt).getTime();
        if (Date.now() > expiresAt) {
          setStatus("error");
          setMessage("The login authorization session has expired. Please log in again.");
          return;
        }

        // Wait slightly to make sure step animations render nicely
        await new Promise((resolve) => setTimeout(resolve, 1200));

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

        setDbCompleted(true);
        setStatus("success");
        setMessage("Your browser has been authorized as a trusted device profile.");
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage("Security handshake failed. Please request a new link.");
      }
    }

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 font-sans overflow-hidden">
      {/* Background Ambience with a subtle, elegant radial lighting glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-[20%] w-[350px] h-[350px] bg-primary/10 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full mix-blend-multiply" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800c_1px,transparent_1px),linear-gradient(to_bottom,#8080800c_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="w-full max-w-[400px] z-10">
        {/* Auth Card with sleek glass borders */}
        <div className="bg-surface p-8 sm:p-9 rounded-[2rem] border border-outline-variant/60 shadow-[0_12px_44px_-10px_rgba(0,0,0,0.06)] relative overflow-hidden">
          
          {/* Top Logo design matching AuthPage */}
          <div className="flex flex-col items-center justify-center mb-8">
            <img 
              src="/examcity_no_bg.png" 
              alt="ExamCity Logo" 
              className="h-12 w-auto max-w-[180px] object-contain transition-transform duration-300 hover:scale-[1.02]"
              referrerPolicy="no-referrer" 
            />
          </div>

          <AnimatePresence mode="wait">
            
            {status === "loading" && (
              <motion.div
                key="loading-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-center"
              >
                {/* Visualizer Spinner */}
                <div className="flex justify-center pt-2">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-16 h-16 rounded-full border-4 border-primary/20 animate-pulse" />
                    <div className="w-12 h-12 rounded-full border-4 border-solid border-primary border-t-transparent animate-spin" />
                  </div>
                </div>

                {/* Status Message */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-on-surface">
                    Authorizing session...
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium max-w-xs mx-auto">
                    Please wait while we securely process your request.
                  </p>
                </div>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 text-center"
              >
                {/* Success Indicator */}
                <div className="flex justify-center pt-2">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-md">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                </div>

                {/* Status Message */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-on-surface">
                    Session Authorized
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm mx-auto font-medium">
                    Your login attempt has been verified successfully.
                  </p>
                </div>

                {/* Clear Single Button Action */}
                <div className="pt-2">
                  <Link
                    to="/dashboard"
                    className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-primary hover:bg-primary/95 text-on-primary font-bold rounded-xl transition-all shadow-md cursor-pointer text-sm"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error-view"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-center"
              >
                {/* Warning Indicator */}
                <div className="flex justify-center pt-2">
                  <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center border border-error/20">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                </div>

                {/* Header Error Title */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-on-surface">
                    Authorization Failed
                  </h3>
                  <p className="text-xs text-error font-medium leading-relaxed max-w-xs mx-auto">
                    {message}
                  </p>
                </div>

                {/* Action button to return */}
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-surface hover:bg-surface-dim/40 text-on-surface font-bold rounded-xl border border-outline-variant/60 transition-all cursor-pointer text-sm"
                  >
                    Return to Sign In
                    <ChevronRight className="w-4 h-4 text-on-surface-variant/50" />
                  </Link>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
