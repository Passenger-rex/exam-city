import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { motion } from "motion/react";
import { ShieldCheck, ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { Logo } from "../components/Logo";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

export default function VerifyLoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [deviceDetails, setDeviceDetails] = useState<any>(null);

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setError("Missing login verification token parameter.");
        setLoading(false);
        return;
      }

      const performFirebaseFallback = async () => {
        const tokenRef = doc(db, "login_verifications", token);
        const tokenSnap = await getDoc(tokenRef);

        if (!tokenSnap.exists()) {
          setError("The verification token does not exist or has expired.");
          setLoading(false);
          return;
        }

        const data = tokenSnap.data();
        setDeviceDetails(data);

        if (data.used || data.verified) {
          setError("This single-use challenge token has already been spent. If your original tab did not complete registration, please try logging in again to dispatch a new link.");
          setLoading(false);
          return;
        }

        // Validate temporal integrity (expiry check)
        const expiryDate = new Date(data.expiresAt);
        if (new Date() > expiryDate) {
          setError("Your secure verification challenge link has expired (15-minute challenge window). Please return to the login tab and trigger a new verification.");
          setLoading(false);
          return;
        }

        // Mark secure token as fully verified & single-used in Firestore
        await updateDoc(tokenRef, {
          verified: true,
          used: true
        });

        setSuccess(true);
      };

      try {
        if (isSupabaseConfigured && supabase) {
          console.log("[Supabase Verification] Querying token:", token);
          const { data, error: queryError } = await supabase
            .from("login_verifications")
            .select("*")
            .eq("id", token)
            .single();

          if (queryError || !data) {
            console.warn("Supabase query failed or token not found. Falling back to Firebase...", queryError);
            await performFirebaseFallback();
            return;
          }

          setDeviceDetails({
            email: data.email,
            deviceId: data.device_id || data.deviceId,
            ip: data.ip,
            location: data.location,
          });

          if (data.used || data.verified) {
            setError("This single-use challenge token has already been spent. If your original tab did not complete registration, please try logging in again to dispatch a new link.");
            setLoading(false);
            return;
          }

          const expiryDate = new Date(data.expires_at || data.expiresAt);
          if (new Date() > expiryDate) {
            setError("Your secure verification challenge link has expired (15-minute challenge window). Please return to the login tab and trigger a new verification.");
            setLoading(false);
            return;
          }

          const { error: updateError } = await supabase
            .from("login_verifications")
            .update({ verified: true, used: true })
            .eq("id", token);

          if (updateError) {
            throw updateError;
          }

          // Sync Firebase just in case
          try {
            const tokenRef = doc(db, "login_verifications", token);
            const tokenSnap = await getDoc(tokenRef);
            if (tokenSnap.exists()) {
              await updateDoc(tokenRef, { verified: true, used: true });
            }
          } catch (e) {
            console.log("Replication sync skipped or database rules restrictions applied:", e);
          }

          setSuccess(true);
        } else {
          await performFirebaseFallback();
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "An error occurred while verifying your device security challenge.");
      } finally {
        setLoading(false);
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="min-h-screen bg-surface md:bg-surface-dim font-sans text-on-surface flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-surface border border-outline-variant/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        <div className="flex justify-center mb-2">
          <Logo />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <h3 className="text-base font-bold font-mono tracking-tight text-on-surface-variant uppercase">
              Verifying Security Token...
            </h3>
            <p className="text-xs text-on-surface-variant text-center max-w-xs">
              Confirming browser cryptographic fingerprint characteristics with secure cloud registers.
            </p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-on-surface tracking-tight">
                Verification Failed
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed text-justify bg-error/5 border border-error/10 p-3 rounded-2xl">
                {error}
              </p>
            </div>

            <hr className="border-outline-variant/30" />

            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-surface border border-outline border-outline-variant/60 hover:bg-surface-dim text-on-surface font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              Back to Login Hub
            </button>
          </motion.div>
        ) : success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-on-surface tracking-tight">
                Authentication Verified!
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Your unrecognized browser fingerprint has been registered as a trusted device for account <strong className="text-on-surface font-semibold">{deviceDetails?.email}</strong>.
              </p>
            </div>

            {deviceDetails && (
              <div className="p-4 bg-surface-dim border border-outline-variant/30 rounded-2xl text-[11px] text-on-surface-variant text-left leading-relaxed space-y-1.5 font-mono shadow-inner">
                <div className="flex justify-between border-b border-outline-variant/15 pb-1">
                  <span className="font-bold uppercase text-[9px] tracking-wider">Device ID:</span>
                  <span className="text-primary font-bold">{deviceDetails.deviceId?.substring(0, 12)}...</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/15 pb-1">
                  <span className="font-bold uppercase text-[9px] tracking-wider">IP Source:</span>
                  <span>{deviceDetails.ip || "127.0.0.1"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold uppercase text-[9px] tracking-wider">Location:</span>
                  <span>{deviceDetails.location || "Unknown Geolocation"}</span>
                </div>
              </div>
            )}

            <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-2xl text-xs text-indigo-600 font-semibold text-center leading-relaxed">
              🎉 Success! Your original login window has already auto-completed the login and opened your hub dashboard!
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-3 px-4 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Navigate to Hub Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-on-surface-variant/70 italic text-center">
                You may also securely close this tab and return to your original browser session.
              </p>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
