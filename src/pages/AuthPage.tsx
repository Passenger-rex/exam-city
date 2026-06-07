import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendEmailVerification,
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  addDoc, 
  collection, 
  increment, 
  query, 
  where, 
  getDocs,
  getDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  deleteDoc
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Shield,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const AuthBackground = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0">
    <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] sm:blur-[120px]" />
    <div className="absolute -bottom-24 -left-24 w-[700px] h-[700px] bg-secondary/10 rounded-full blur-[100px] sm:blur-[140px]" />
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+CjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] opacity-50" />
  </div>
));

const AuthForm = React.memo(({ 
  isLogin, 
  loading, 
  onAuthProcess,
  initialEmail = "",
  rememberMe,
  setRememberMe,
  onForgotPassword
}: any) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthProcess({ email, password, name });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AnimatePresence mode="wait">
        {!isLogin && (
          <motion.div
            key="signup-name"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                required={!isLogin}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                autoComplete="name"
                className="w-full bg-surface-dim/40 border border-outline-variant/50 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-4 outline-none font-medium text-on-surface transition-all placeholder:text-on-surface-variant/60 shadow-sm text-sm sm:text-base mb-1"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          autoComplete="email"
          className="w-full bg-surface-dim/40 border border-outline-variant/50 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-4 outline-none font-medium text-on-surface transition-all placeholder:text-on-surface-variant/60 shadow-sm text-sm sm:text-base"
        />
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type={showPassword ? "text" : "password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          className="w-full bg-surface-dim/40 border border-outline-variant/50 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-12 outline-none font-medium text-on-surface transition-all placeholder:text-on-surface-variant/60 shadow-sm text-sm sm:text-base"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
        >
          {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
      </div>

      {isLogin && (
        <div className="flex justify-between items-center pt-2 pb-2 pl-1">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="peer appearance-none w-5 h-5 rounded-md border-[1.5px] border-outline-variant bg-surface-dim/50 checked:bg-primary checked:border-primary transition-all cursor-pointer"
              />
              <CheckCircle2 className="absolute w-3.5 h-3.5 text-on-primary opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
            </div>
            <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">
              Remember me
            </span>
          </label>
          <button
            type="button"
            onClick={() => onForgotPassword(email)}
            className="text-sm font-bold text-primary hover:text-primary/70 transition-colors"
          >
            Forgot password?
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-primary text-on-primary font-bold text-base rounded-2xl hover:bg-primary/95 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] flex justify-center items-center gap-2 mt-2 disabled:opacity-70 disabled:hover:shadow-none"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            {isLogin ? "Sign In" : "Create Account"}
            <ArrowRight className="w-5 h-5 ml-1" />
          </>
        )}
      </button>
    </form>
  );
});

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname === "/login");
  const [authView, setAuthView] = useState<"auth" | "forgot">("auth");
  const urlParams = new URLSearchParams(location.search);
  const refCode = urlParams.get("ref");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [unverifiedUser, setUnverifiedUser] = useState<any>(null);
  const [resendStatus, setResendStatus] = useState("");
  const [devActivationLink, setDevActivationLink] = useState("");
  const [devMfaPinLink, setDevMfaPinLink] = useState("");
  const [devActivationWarning, setDevActivationWarning] = useState("");
  const [devMfaWarning, setDevMfaWarning] = useState("");

  // Device Binding and Location Geolocation Challenge States
  const [mfaChallenge, setMfaChallenge] = useState(false);
  const [generatedPin, setGeneratedPin] = useState("");
  const [enteredPin, setEnteredPin] = useState("");
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [ipData, setIpData] = useState<any>(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [mfaResendStatus, setMfaResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // Helper to clear cached authorization states
  const clearAuthSessionStorage = () => {
    try {
      const keys = [
        "auth_unverifiedUser",
        "auth_mfaChallenge",
        "auth_generatedPin",
        "auth_pendingUser",
        "auth_ipData",
        "auth_devActivationLink",
        "auth_devMfaPinLink",
        "auth_devActivationWarning",
        "auth_devMfaWarning",
        "auth_message",
        "auth_error"
      ];
      keys.forEach(k => sessionStorage.removeItem(k));
    } catch (e) {
      console.warn("Failed to clear auth sessionStorage", e);
    }
  };

  // Hydrate states from sessionStorage on mount to preserve state across page navigation
  useEffect(() => {
    try {
      const storedUnverified = sessionStorage.getItem("auth_unverifiedUser");
      if (storedUnverified) setUnverifiedUser(JSON.parse(storedUnverified));

      const storedMfaChallenge = sessionStorage.getItem("auth_mfaChallenge");
      if (storedMfaChallenge) setMfaChallenge(JSON.parse(storedMfaChallenge));

      const storedGeneratedPin = sessionStorage.getItem("auth_generatedPin");
      if (storedGeneratedPin) setGeneratedPin(storedGeneratedPin);

      const storedPendingUser = sessionStorage.getItem("auth_pendingUser");
      if (storedPendingUser) setPendingUser(JSON.parse(storedPendingUser));

      const storedIpData = sessionStorage.getItem("auth_ipData");
      if (storedIpData) setIpData(JSON.parse(storedIpData));

      const storedDevActivationLink = sessionStorage.getItem("auth_devActivationLink");
      if (storedDevActivationLink) setDevActivationLink(storedDevActivationLink);

      const storedDevMfaPinLink = sessionStorage.getItem("auth_devMfaPinLink");
      if (storedDevMfaPinLink) setDevMfaPinLink(storedDevMfaPinLink);

      const storedDevActivationWarning = sessionStorage.getItem("auth_devActivationWarning");
      if (storedDevActivationWarning) setDevActivationWarning(storedDevActivationWarning);

      const storedDevMfaWarning = sessionStorage.getItem("auth_devMfaWarning");
      if (storedDevMfaWarning) setDevMfaWarning(storedDevMfaWarning);

      const storedMessage = sessionStorage.getItem("auth_message");
      if (storedMessage) setMessage(storedMessage);

      const storedError = sessionStorage.getItem("auth_error");
      if (storedError) setError(storedError);
    } catch (e) {
      console.warn("Session storage hydration failed", e);
    }
  }, []);

  // Sync state variables to sessionStorage whenever they change
  useEffect(() => {
    try {
      if (unverifiedUser) {
        sessionStorage.setItem("auth_unverifiedUser", JSON.stringify(unverifiedUser));
      } else {
        sessionStorage.removeItem("auth_unverifiedUser");
      }
    } catch (e) {}
  }, [unverifiedUser]);

  useEffect(() => {
    try {
      sessionStorage.setItem("auth_mfaChallenge", JSON.stringify(mfaChallenge));
    } catch (e) {}
  }, [mfaChallenge]);

  useEffect(() => {
    try {
      if (generatedPin) {
        sessionStorage.setItem("auth_generatedPin", generatedPin);
      } else {
        sessionStorage.removeItem("auth_generatedPin");
      }
    } catch (e) {}
  }, [generatedPin]);

  useEffect(() => {
    try {
      if (pendingUser) {
        sessionStorage.setItem("auth_pendingUser", JSON.stringify(pendingUser));
      } else {
        sessionStorage.removeItem("auth_pendingUser");
      }
    } catch (e) {}
  }, [pendingUser]);

  useEffect(() => {
    try {
      if (ipData) {
        sessionStorage.setItem("auth_ipData", JSON.stringify(ipData));
      } else {
        sessionStorage.removeItem("auth_ipData");
      }
    } catch (e) {}
  }, [ipData]);

  useEffect(() => {
    try {
      if (devActivationLink) {
        sessionStorage.setItem("auth_devActivationLink", devActivationLink);
      } else {
        sessionStorage.removeItem("auth_devActivationLink");
      }
    } catch (e) {}
  }, [devActivationLink]);

  useEffect(() => {
    try {
      if (devMfaPinLink) {
        sessionStorage.setItem("auth_devMfaPinLink", devMfaPinLink);
      } else {
        sessionStorage.removeItem("auth_devMfaPinLink");
      }
    } catch (e) {}
  }, [devMfaPinLink]);

  useEffect(() => {
    try {
      if (devActivationWarning) {
        sessionStorage.setItem("auth_devActivationWarning", devActivationWarning);
      } else {
        sessionStorage.removeItem("auth_devActivationWarning");
      }
    } catch (e) {}
  }, [devActivationWarning]);

  useEffect(() => {
    try {
      if (devMfaWarning) {
        sessionStorage.setItem("auth_devMfaWarning", devMfaWarning);
      } else {
        sessionStorage.removeItem("auth_devMfaWarning");
      }
    } catch (e) {}
  }, [devMfaWarning]);

  useEffect(() => {
    try {
      if (message) {
        sessionStorage.setItem("auth_message", message);
      } else {
        sessionStorage.removeItem("auth_message");
      }
    } catch (e) {}
  }, [message]);

  useEffect(() => {
    try {
      if (error) {
        sessionStorage.setItem("auth_error", error);
      } else {
        sessionStorage.removeItem("auth_error");
      }
    } catch (e) {}
  }, [error]);

  // Fetch or construct a permanent identifier for browser client
  const getDeviceId = () => {
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = "dvc_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("deviceId", id);
    }
    return id;
  };

  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    try {
      setResendStatus("sending");
      setError("");
      setMessage("");
      
      let token = unverifiedUser.activationToken;
      if (!token) {
        token = "act_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
        // Save back with token
        setUnverifiedUser((prev: any) => ({ ...prev, activationToken: token }));
      }
      
      // Update/create verification record in Firestore
      await setDoc(doc(db, "email_verifications", token), {
        uid: unverifiedUser.uid || auth.currentUser?.uid || "pending_activation",
        email: unverifiedUser.email,
        name: unverifiedUser.displayName || "Scholar",
        createdAt: serverTimestamp(),
        verified: false,
        used: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      const emailRes = await fetch("/api/auth/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedUser.email, name: unverifiedUser.displayName || "Scholar", token }),
      });
      if (!emailRes.ok) {
        throw new Error("Failed to dispatch email via Resend.");
      }
      
      const resData = await emailRes.json();
      if (resData.devLink) {
        setDevActivationLink(resData.devLink);
      }
      if (resData.warning) {
        setDevActivationWarning(resData.warning);
      }
      
      setResendStatus("sent");
      setMessage("A fresh activation link has been sent! Please check your inbox and SPAM folder.");
    } catch (e: any) {
      console.error(e);
      setResendStatus("error");
      setError(e.message || "Failed to resend activation link. Please check details and try again.");
    }
  };

  const handleResendMfaEmail = async () => {
    if (!pendingUser || !generatedPin) return;
    try {
      setMfaResendStatus("sending");
      setError("");
      setMessage("");
      const emailRes = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingUser.email, token: generatedPin })
      });
      if (!emailRes.ok) {
        const errData = await emailRes.json();
        throw new Error(errData.error || "Server response error during dispatch.");
      }
      const resData = await emailRes.json();
      if (resData.devLink) {
        setDevMfaPinLink(resData.devLink);
      }
      if (resData.warning) {
        setDevMfaWarning(resData.warning);
      }
      setMfaResendStatus("sent");
      setMessage("A secure verification email has been resent successfully!");
      setTimeout(() => setMfaResendStatus("idle"), 5000);
    } catch (e: any) {
      console.error(e);
      setMfaResendStatus("error");
      setError(e.message || "Failed to resend verification alert. Please try again.");
    }
  };

  const handleVerifyDeviceSecurely = async () => {
    if (!pendingUser) return;
    setError("");
    setMessage("");
    if (enteredPin.trim() !== generatedPin) {
      setError("Incorrect security PIN code. Please confirm the code and re-type.");
      return;
    }

    try {
      setChallengeLoading(true);
      // Re-initialize correct firebase session state securely
      const loginRes = await signInWithEmailAndPassword(auth, pendingUser.email, pendingUser.password);
      
      // Permanently bind current browser fingerprint as a trusted device
      await updateDoc(doc(db, "users", loginRes.user.uid), {
        trustedDevices: arrayUnion(pendingUser.deviceId)
      });

      // Set up concurrent session parameters
      const localSessionId = "sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("sessionId", localSessionId);

      const userSnap = await getDoc(doc(db, "users", loginRes.user.uid));
      const userData = userSnap.data();
      const ip = pendingUser.ip || "127.0.0.1";
      const locationStr = pendingUser.location || "Unknown City, Unknown Country";

      const newSession = {
        id: localSessionId,
        deviceId: pendingUser.deviceId,
        ip,
        location: locationStr,
        userAgent: navigator.userAgent,
        lastActive: new Date().toISOString()
      };

      let sessions = userData?.activeSessions || [];
      sessions = sessions.filter((s: any) => s.deviceId !== pendingUser.deviceId);
      sessions.push(newSession);
      if (sessions.length > 5) {
        sessions = sessions.slice(-5);
      }

      await updateDoc(doc(db, "users", loginRes.user.uid), {
        activeSession: newSession,
        activeSessions: sessions
      });

      setMfaChallenge(false);
      setPendingUser(null);
      setUnverifiedUser(null);
      await handleAuthSuccess(loginRes.user.uid);
    } catch (e: any) {
      console.error("MFA Validation failure", e);
      setError(e.message || "Failed to trust device. Please try again.");
    } finally {
      setChallengeLoading(false);
    }
  };

  // Reactive listener to capture when Tab 2 verifies the device challenge token
  React.useEffect(() => {
    if (!mfaChallenge || !generatedPin || !pendingUser) return;

    const handleSuccessfulVerification = async () => {
      try {
        setChallengeLoading(true);
        let uid = pendingUser.uid;
        
        // Re-authenticate only if signed out and credentials are fully present
        if (!auth.currentUser && pendingUser.email && pendingUser.password) {
          const loginRes = await signInWithEmailAndPassword(auth, pendingUser.email, pendingUser.password);
          uid = loginRes.user.uid;
        }
        
        // Permanently bind current browser fingerprint as a trusted device
        await updateDoc(doc(db, "users", uid), {
          trustedDevices: arrayUnion(pendingUser.deviceId)
        });

        const localSessionId = "sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem("sessionId", localSessionId);

        const userSnap = await getDoc(doc(db, "users", uid));
        const userData = userSnap.data();
        const ip = pendingUser.ip || "127.0.0.1";
        const locationStr = pendingUser.location || "Unknown City, Unknown Country";

        const newSession = {
          id: localSessionId,
          deviceId: pendingUser.deviceId,
          ip,
          location: locationStr,
          userAgent: navigator.userAgent,
          lastActive: new Date().toISOString()
        };

        let sessions = userData?.activeSessions || [];
        sessions = sessions.filter((s: any) => s.deviceId !== pendingUser.deviceId);
        sessions.push(newSession);
        if (sessions.length > 5) {
          sessions = sessions.slice(-5);
        }

        await updateDoc(doc(db, "users", uid), {
          activeSession: newSession,
          activeSessions: sessions
        });

        setMfaChallenge(false);
        setPendingUser(null);
        setUnverifiedUser(null);
        await handleAuthSuccess(uid);
      } catch (authErr: any) {
        console.error("Auto log-in after verification failed:", authErr);
        setError(authErr.message || "Failed to complete authentication automatically.");
      } finally {
        setChallengeLoading(false);
      }
    };

    const unsubscribe = onSnapshot(doc(db, "login_verifications", generatedPin), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.verified === true && data.used === true) {
          console.log("[Firestore Realtime] Verification event detected, executing log-in.");
          handleSuccessfulVerification();
          deleteDoc(doc(db, "login_verifications", generatedPin)).catch(console.error);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [mfaChallenge, generatedPin, pendingUser]);

  const reason = urlParams.get("reason");

  React.useEffect(() => {
    if (reason === "session_expired") {
      setError("Your session has expired or someone else has logged in on another device or unusual location.");
    }

    // Capture on-load unauthorized persistent sessions
    const handleUnrecognizedDevicePersistent = async (user: any) => {
      const currentDeviceId = getDeviceId();
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const trusted = userData?.trustedDevices || [];
          if (!trusted.includes(currentDeviceId)) {
            let city = "Unknown City";
            let country = "Unknown Country";
            let ip = "127.0.0.1";
            try {
              const resGeo = await fetch("https://ipapi.co/json/");
              if (resGeo.ok) {
                const geoData = await resGeo.json();
                city = geoData.city || "Unknown City";
                country = geoData.country_name || "Unknown Country";
                ip = geoData.ip || "127.0.0.1";
              }
            } catch (e) {
              console.warn("Location check bypassed", e);
            }
            const locationStr = `${city}, ${country}`;
            setIpData({ ip, location: locationStr });

            const verificationToken = "tok_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
            const createdAt = new Date().toISOString();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

            await setDoc(doc(db, "login_verifications", verificationToken), {
              uid: user.uid,
              email: user.email || "",
              device_id: currentDeviceId,
              ip,
              location: locationStr,
              created_at: createdAt,
              expires_at: expiresAt,
              verified: false,
              used: false
            });

            const emailRes = await fetch('/api/auth/send-verification-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email, token: verificationToken })
            });
            if (!emailRes.ok) {
              const errData = await emailRes.json();
              throw new Error(`Device verification email failed: ${errData.error || 'Server error'}`);
            }
            const resData = await emailRes.json();
            if (resData.devLink) {
              setDevMfaPinLink(resData.devLink);
            }
            if (resData.warning) {
              setDevMfaWarning(resData.warning);
            }

            setGeneratedPin(verificationToken);
            setPendingUser({
              uid: user.uid,
              email: user.email || "",
              password: "",
              resUser: user,
              deviceId: currentDeviceId,
              ip,
              location: locationStr
            });

            setMfaChallenge(true);
          }
        }
      } catch (err: any) {
        console.error("Failed persistent device audit context:", err);
        setError(err.message || "An error occurred setting up secure verification.");
      }
    };

    const unsub = auth.onAuthStateChanged((user) => {
      if (user && !mfaChallenge && !pendingUser) {
        handleUnrecognizedDevicePersistent(user);
      }
    });

    return () => unsub();
  }, [reason, mfaChallenge, pendingUser]);

  const handleAuthSuccess = async (userId: string) => {
    clearAuthSessionStorage();
    const demoDataStr = sessionStorage.getItem("demoResult");
    if (demoDataStr) {
      try {
        const demoData = JSON.parse(demoDataStr);
        
        // Check user tier and limits before converting demo
        const userSnap = await getDoc(doc(db, "users", userId));
        const userData = userSnap.data() || { tier: "free", examCount: 0 };
        const tier = userData.tier || "free";
        const examCount = userData.examCount || 0;

        // If free and already reached limit, ignore demo result
        if (tier === "free" && examCount >= 2) {
          sessionStorage.removeItem("demoResult");
          localStorage.removeItem("guestExamCount");
          setError("Your free exam limit (2/month) has been reached. This recent result could not be saved to your dashboard. Please upgrade to Pro for unlimited access.");
          setTimeout(() => navigate("/dashboard"), 4000);
          return;
        }

        const resultRef = await addDoc(collection(db, "exam_results"), {
          userId,
          score: demoData.score,
          total: demoData.total,
          subject: demoData.subject,
          answers: demoData.answers || {},
          questions: demoData.questions || [],
          createdAt: serverTimestamp(),
        });

        await setDoc(doc(db, "users", userId), {
          examCount: increment(1)
        }, { merge: true });

        sessionStorage.removeItem("demoResult");
        localStorage.removeItem("guestExamCount"); // Clear guest limit on conversion
        navigate(`/review/${resultRef.id}`);
        return;
      } catch (e) {
        console.error("Failed to save demo score", e);
      }
    }
    navigate("/dashboard");
  };

  const handleAuthProcess = async ({ email, password, name }: any) => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        // Query geography characteristics early for check
        let city = "Unknown City";
        let country = "Unknown Country";
        let ip = "127.0.0.1";
        try {
          const resGeo = await fetch("https://ipapi.co/json/");
          if (resGeo.ok) {
            const geoData = await resGeo.json();
            city = geoData.city || "Unknown City";
            country = geoData.country_name || "Unknown Country";
            ip = geoData.ip || "127.0.0.1";
          }
        } catch(e) {
          console.warn("Location check bypassed", e);
        }

        const locationStr = `${city}, ${country}`;
        setIpData({ ip, location: locationStr });

        // IMPORTANT BRUTE FORCE CHECK
        try {
           const checkRes = await fetch(`/api/auth/check-attempts?email=${encodeURIComponent(email)}&ip=${encodeURIComponent(ip)}`);
           const checkData = await checkRes.json();
           if (checkData.blocked || checkRes.status === 429) {
             setError("Too many failed attempts. Try again later.");
             setLoading(false);
             return;
           }
        } catch(e) {
           console.warn("Could not reach auth checks endpoints.");
        }

        const res = await signInWithEmailAndPassword(auth, email, password);
        
        // Enforce Email Verification (check both Firebase and custom Firestore verified status)
        const userSnap = await getDoc(doc(db, "users", res.user.uid));
        const userData = userSnap.data();

        if (!res.user.emailVerified && !userData?.emailVerified) {
          const displayName = userData?.name || res.user.displayName || email.split("@")[0];

          // Generate custom welcome/activation token
          const activationToken = "act_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
          await setDoc(doc(db, "email_verifications", activationToken), {
            uid: res.user.uid,
            email: email,
            name: displayName,
            createdAt: serverTimestamp(),
            verified: false,
            used: false,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });

          // Dispatch verification welcome email via Resend
          try {
            const emailRes = await fetch("/api/auth/send-welcome-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, name: displayName, token: activationToken }),
            });
            const resData = await emailRes.json();
            if (resData.devLink) {
              setDevActivationLink(resData.devLink);
            }
            if (resData.warning) {
              setDevActivationWarning(resData.warning);
            }
          } catch (sendErr: any) {
            console.error("Auto verification send-welcome-email failed on sign in:", sendErr);
          }

          setUnverifiedUser({
            uid: res.user.uid,
            email,
            password,
            displayName,
            activationToken
          });
          await auth.signOut();
          setError("Your email remains unverified.");
          setLoading(false);
          return;
        }

        // --- DEVICE BINDING & IP GEOLOCATION AUDIT ---
        const trusted = userData?.trustedDevices || [];
        const currentDeviceId = getDeviceId();

        // Challenge unrecognized device terminals
        if (!trusted.includes(currentDeviceId)) {
          const verificationToken = "tok_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
          const createdAt = new Date().toISOString();
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

          try {
            await setDoc(doc(db, "login_verifications", verificationToken), {
              uid: res.user.uid,
              email: email,
              device_id: currentDeviceId,
              ip: ip,
              location: locationStr,
              created_at: createdAt,
              expires_at: expiresAt,
              verified: false,
              used: false
            });

            // Trigger backend email notification and check for errors
            const emailRes = await fetch('/api/auth/send-verification-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, token: verificationToken })
            });
            if (!emailRes.ok) {
              const errData = await emailRes.json();
              throw new Error(`Device verification email failed: ${errData.error || 'Server error'}`);
            }
            const resData = await emailRes.json();
            if (resData.devLink) {
              setDevMfaPinLink(resData.devLink);
            }
            if (resData.warning) {
              setDevMfaWarning(resData.warning);
            }
          } catch (fireErr: any) {
            console.error("MFA email or Firestore setup failure:", fireErr);
            throw fireErr;
          }

          setGeneratedPin(verificationToken); // Store token in generatedPin state
          setPendingUser({
            uid: res.user.uid,
            email,
            password,
            resUser: res.user,
            deviceId: currentDeviceId,
            ip,
            location: locationStr
          });

          setMfaChallenge(true); // Open the Challenge prompt overlay
          setLoading(false);
          return;
        }

        // Auto trust first device
        await updateDoc(doc(db, "users", res.user.uid), {
          trustedDevices: arrayUnion(currentDeviceId)
        });

        // Set up active concurrent session ID
        const localSessionId = "sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem("sessionId", localSessionId);

        const newSession = {
          id: localSessionId,
          deviceId: currentDeviceId,
          ip,
          location: locationStr,
          userAgent: navigator.userAgent,
          lastActive: new Date().toISOString()
        };

        let sessions = userData?.activeSessions || [];
        sessions = sessions.filter((s: any) => s.deviceId !== currentDeviceId);
        sessions.push(newSession);
        if (sessions.length > 5) {
          sessions = sessions.slice(-5);
        }

        await updateDoc(doc(db, "users", res.user.uid), {
          activeSession: newSession,
          activeSessions: sessions
        });
        
        setUnverifiedUser(null);
        await handleAuthSuccess(res.user.uid);
      } else {
        // Enforce approved domains check to verify real emails
        const emailLower = email.trim().toLowerCase();
        const domain = emailLower.split("@")[1] || "";
        
        const approvedDomains = [
          "gmail.com",
          "yahoo.com",
          "yahoo.co.uk",
          "yahoo.com.ng",
          "outlook.com",
          "outlook.co.uk",
          "outlook.com.ng",
          "hotmail.com",
          "live.com",
          "icloud.com",
          "aol.com",
          "proton.me",
          "protonmail.com"
        ];
        
        const isApproved = approvedDomains.some(d => domain === d || domain.endsWith("." + d));
        if (!isApproved) {
          setError("Registration is limited to approved, authentic email domains (e.g. @gmail.com, @yahoo.com, or @outlook.com) to maintain platform integrity.");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        
        // 1. Update display name FIRST so that the Firebase email template has access to it immediately
        await updateProfile(userCredential.user, { displayName: name });
        
        // 2. Generate a custom validation token and register activation bridge
        const activationToken = "act_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
        await setDoc(doc(db, "email_verifications", activationToken), {
          uid: userCredential.user.uid,
          email: email,
          name: name,
          createdAt: serverTimestamp(),
          verified: false,
          used: false,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

        // 3. Dispatch beautifully designed Welcome Activation email via Resend
        try {
          const emailRes = await fetch("/api/auth/send-welcome-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name, token: activationToken }),
          });
          const resData = await emailRes.json();
          if (resData.devLink) {
            setDevActivationLink(resData.devLink);
          }
          if (resData.warning) {
            setDevActivationWarning(resData.warning);
          }
        } catch (sendErr: any) {
          console.error("Welcome email dispatch failed:", sendErr);
        }
        
        // 4. Register user profile metadata in Firestore
        const currentDeviceId = getDeviceId();
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          email,
          role: "user",
          trustedDevices: [currentDeviceId],
          emailVerified: false,
          createdAt: serverTimestamp(),
        });
        
        // Handle Referral
        if (refCode) {
           try {
              await addDoc(collection(db, "referrals"), {
                 referrerId: refCode,
                 referredId: userCredential.user.uid,
                 createdAt: serverTimestamp()
               });
           } catch(e) {
              console.error("Failed to add referral record", e);
           }
        }

        // Sign out is critical so they cannot bypass verification
        await auth.signOut();
        
        // Set state to trigger our newly restructured verification visual page
        setUnverifiedUser({
          uid: userCredential.user.uid,
          email,
          password,
          displayName: name,
          activationToken
        });
        setMessage("Account created successfully!");
        setLoading(false);
        return;
      }
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
         setError("Invalid email or password. Please try again.");
         // Log the explicit failure with the backend explicitly to keep the check-attempts functioning properly
         if (isLogin && email) {
            try {
              let ip = "127.0.0.1";
              if (ipData && ipData.ip) ip = ipData.ip;
              await fetch('/api/auth/login', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ email: email, password: "FAILED_ATTEMPT_LOG", trustDevice: false })
              });
            } catch (postErr) {
              console.warn("Could not record failed attempt synchronously", postErr);
            }
         }
      } else if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
      setTimeout(() => setAuthView("auth"), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
         sessionStorage.setItem("google_access_token", credential.accessToken);
      }
      
      const currentDeviceId = getDeviceId();
      const userDocRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          name: result.user.displayName || "Google User",
          email: result.user.email,
          role: "user",
          trustedDevices: [currentDeviceId], // trusted initial device
          createdAt: serverTimestamp(),
        });
        
        if (refCode) {
           try {
              await addDoc(collection(db, "referrals"), {
                 referrerId: refCode,
                 referredId: result.user.uid,
                 createdAt: serverTimestamp()
              });
           } catch(e) {
              console.error("Failed to add referral record", e);
           }
        }
      } else {
        // Enforce device audit for existing Google users
        const userData = userSnap.data();
        const trusted = userData?.trustedDevices || [];
        
        if (!trusted.includes(currentDeviceId)) {
          // Identify location
          let city = "Unknown City";
          let country = "Unknown Country";
          let ip = "127.0.0.1";
          try {
            const resGeo = await fetch("https://ipapi.co/json/");
            if (resGeo.ok) {
              const geoData = await resGeo.json();
              city = geoData.city || "Unknown City";
              country = geoData.country_name || "Unknown Country";
              ip = geoData.ip || "127.0.0.1";
            }
          } catch (e) {
            console.warn("Location check bypassed", e);
          }
          const locationStr = `${city}, ${country}`;
          setIpData({ ip, location: locationStr });

          const verificationToken = "tok_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
          const createdAt = new Date().toISOString();
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

          await setDoc(doc(db, "login_verifications", verificationToken), {
            uid: result.user.uid,
            email: result.user.email || "",
            device_id: currentDeviceId,
            ip,
            location: locationStr,
            created_at: createdAt,
            expires_at: expiresAt,
            verified: false,
            used: false
          });

          // Trigger email block and error check
          const emailRes = await fetch('/api/auth/send-verification-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: result.user.email, token: verificationToken })
          });
          if (!emailRes.ok) {
            const errData = await emailRes.json();
            throw new Error(`Device verification email failed: ${errData.error || 'Server error'}`);
          }
          const resData = await emailRes.json();
          if (resData.devLink) {
            setDevMfaPinLink(resData.devLink);
          }
          if (resData.warning) {
            setDevMfaWarning(resData.warning);
          }

          setGeneratedPin(verificationToken);
          setPendingUser({
            uid: result.user.uid,
            email: result.user.email || "",
            password: "", // Google has no password
            resUser: result.user,
            deviceId: currentDeviceId,
            ip,
            location: locationStr,
            isGoogle: true
          });

          setMfaChallenge(true);
          return;
        }
      }
      
      await handleAuthSuccess(result.user.uid);
    } catch (err: any) {
      if (err.code === "auth/popup-blocked") {
        setError("Popup blocked by browser. Please allow popups for this site, or try another tab/login method.");
      } else {
        setError(err.message);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setMessage("");
  };

  const ForgotPasswordView = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Mail className="w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="email"
          required
          placeholder="Email Address"
          className="w-full bg-surface-dim/40 border border-outline-variant/50 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 rounded-2xl py-4 pl-12 pr-4 outline-none font-medium text-on-surface transition-all placeholder:text-on-surface-variant/60 shadow-sm"
          onChange={(e) => setInitialEmail(e.target.value)}
          value={initialEmail}
        />
      </div>
      <button
        onClick={() => handleForgotPassword(initialEmail)}
        disabled={loading}
        className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl hover:bg-primary/95 transition-all flex justify-center items-center gap-2 mt-2 disabled:opacity-70 disabled:hover:shadow-none"
      >
        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send Reset Link"}
      </button>
      <button
        onClick={() => setAuthView("auth")}
        className="w-full py-2 text-primary font-bold hover:text-primary/70 transition-colors flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center relative overflow-hidden font-body-md w-full p-4 sm:p-8">
      {/* Immersive Background */}
      <AuthBackground />

      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-8 lg:left-8 flex items-center gap-2 sm:gap-3 text-on-surface-variant hover:text-primary transition-all font-semibold z-20 bg-surface/80 sm:bg-surface/40 p-2 sm:pr-5 rounded-full backdrop-blur-md border border-outline-variant/30 hover:bg-surface/60 hover:-translate-y-0.5 shadow-sm"
      >
        <span className="bg-surface p-2 rounded-full shadow-sm">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </span>
        <span className="hidden sm:inline">Back to Home</span>
      </button>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] sm:max-w-[460px] z-10 relative"
      >
        {/* Header content outside card */}
        <div className="text-center mb-6 sm:mb-8 relative mt-12 sm:mt-0">
          <Logo
            onClick={() => navigate("/")}
            className="mx-auto text-3xl sm:text-4xl mb-4 sm:mb-6 relative z-10 cursor-pointer"
          />
          {new URLSearchParams(location.search).get("fromDemo") === "true" && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-2xl mb-6 text-sm font-bold flex items-start gap-3 text-left"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>Demo exam completed! Create your free account or log in to view your score and detailed review.</p>
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={unverifiedUser ? "verify-header" : (authView === "forgot" ? "forgot-header" : (isLogin ? "login-header" : "signup-header"))}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-3xl sm:text-4xl font-headline-md font-extrabold text-on-surface tracking-tight mb-2">
                {unverifiedUser ? "Verify Email" : (authView === "forgot" ? "Reset Password" : (isLogin ? "Welcome back" : "Create an account"))}
              </h2>
              <p className="text-on-surface-variant font-medium text-[15px] sm:text-base px-2">
                {unverifiedUser 
                  ? "We've sent a secure invitation link to your address"
                  : (authView === "forgot" 
                      ? "Receive a secure link to recover your access"
                      : (isLogin ? "Enter your details to access your dashboard" : "Join thousands of learners today"))}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          className="bg-surface/90 backdrop-blur-md border border-outline-variant/40 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          {authView === "auth" && !mfaChallenge && !unverifiedUser && (
            <div className="bg-surface-dim/80 p-1.5 rounded-xl sm:rounded-2xl flex relative mb-6 sm:mb-8 shadow-inner">
              <motion.div
                className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-surface rounded-lg sm:rounded-xl shadow-sm border border-outline-variant/20"
                initial={false}
                animate={{ left: isLogin ? "6px" : "calc(50%)" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-bold z-10 transition-colors ${
                  isLogin
                    ? "text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 text-sm font-bold z-10 transition-colors ${
                  !isLogin
                    ? "text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {(error || message) && !unverifiedUser && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                {error && (
                  <div className="bg-error/10 border border-error/20 text-error p-4 rounded-2xl text-sm font-medium flex flex-col gap-2.5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  </div>
                )}
                {message && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-600 p-4 rounded-2xl text-sm font-medium flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{message}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {unverifiedUser ? (
              <motion.div
                key="verify"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6 text-left"
              >
                <div className="space-y-4">
                  <div className="relative inline-flex">
                    <div className="absolute -inset-1 rounded-full bg-indigo-500/15 blur animate-pulse" />
                    <div className="relative w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-on-surface tracking-tight leading-none">
                      Check Your Inbox
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium leading-relaxed font-sans">
                      We've dispatched a beautifully formatted welcome and activation email to verify your ownership of:
                    </p>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono break-all leading-relaxed">
                      {unverifiedUser.email}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-neutral-100/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/80 rounded-xl space-y-3 text-xs">
                  <h4 className="font-bold text-on-surface uppercase tracking-wider text-[10px] font-mono">
                    Steps to Activate
                  </h4>
                  <ul className="space-y-2.5 font-medium text-on-surface-variant">
                    <li className="flex gap-2.5 items-start">
                      <span className="w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[9px] shrink-0 font-bold">1</span>
                      <span className="leading-normal">Open the email from <strong className="font-semibold text-on-surface font-sans">Exam City</strong> (be sure to inspect your Spam/Junk folder).</span>
                    </li>
                    <li className="flex gap-2.5 items-start">
                      <span className="w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[9px] shrink-0 font-bold">2</span>
                      <span className="leading-normal">Tap the <strong className="font-semibold text-on-surface font-sans">"Activate Account &amp; Start Exams"</strong> button.</span>
                    </li>
                    <li className="flex gap-2.5 items-start">
                      <span className="w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[9px] shrink-0 font-bold">3</span>
                      <span className="leading-normal">Click <strong className="font-semibold text-on-surface font-sans">"Check Verification Status"</strong> below to launch your dashboard!</span>
                    </li>
                  </ul>
                </div>



                {message && (
                  <div className="p-3.5 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl text-xs font-semibold text-left animate-fade-in">
                     {message}
                  </div>
                )}
                {error && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold text-left animate-fade-in">
                     {error}
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setError("");
                        setMessage("");
                        setLoading(true);
                        
                        // Transient login check
                        const loginRes = await signInWithEmailAndPassword(auth, unverifiedUser.email, unverifiedUser.password);
                        await loginRes.user.reload();
                        
                        const userSnap = await getDoc(doc(db, "users", loginRes.user.uid));
                        const userData = userSnap.data();

                        if (loginRes.user.emailVerified || userData?.emailVerified) {
                          const currentDeviceId = getDeviceId();
                          
                          let city = "Unknown City";
                          let country = "Unknown Country";
                          let ip = "127.0.0.1";
                          try {
                            const resGeo = await fetch("https://ipapi.co/json/");
                            if (resGeo.ok) {
                              const geoData = await resGeo.json();
                              city = geoData.city || "Unknown City";
                              country = geoData.country_name || "Unknown Country";
                              ip = geoData.ip || "127.0.0.1";
                            }
                          } catch(e) {
                            console.warn("Location check bypassed", e);
                          }

                          const locationStr = `${city}, ${country}`;
                          setIpData({ ip, location: locationStr });

                          const localSessionId = "sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
                          localStorage.setItem("sessionId", localSessionId);

                          const newSession = {
                            id: localSessionId,
                            deviceId: currentDeviceId,
                            ip,
                            location: locationStr,
                            userAgent: navigator.userAgent,
                            lastActive: new Date().toISOString()
                          };

                          let sessions = userData?.activeSessions || [];
                          sessions = sessions.filter((s: any) => s.deviceId !== currentDeviceId);
                          sessions.push(newSession);
                          if (sessions.length > 5) {
                            sessions = sessions.slice(-5);
                          }

                          await updateDoc(doc(db, "users", loginRes.user.uid), {
                            activeSession: newSession,
                            activeSessions: sessions,
                            trustedDevices: arrayUnion(currentDeviceId)
                          });

                          setUnverifiedUser(null);
                          await handleAuthSuccess(loginRes.user.uid);
                        } else {
                          await auth.signOut();
                          setError("Your account is not active yet. Please click the activation link in your welcome email first.");
                        }
                      } catch (err: any) {
                        console.error(err);
                        setError(err.message || "Could not connect to verify status.");
                        await auth.signOut().catch(() => {});
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full py-3.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/95 shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Check Verification Status</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setUnverifiedUser(null);
                        setError("");
                        setMessage("");
                        clearAuthSessionStorage();
                      }}
                      className="flex-1 py-3 bg-surface border border-outline-variant hover:bg-surface-dim text-on-surface font-bold text-xs rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Back to Login
                    </button>

                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendStatus === "sending"}
                      className="flex-1 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-primary font-bold text-xs rounded-xl shadow-none active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {resendStatus === "sending" ? "Resending..." : "Resend Email"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : mfaChallenge ? (
              <motion.div
                key="mfa"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-6 text-left"
              >
                <div className="space-y-5">
                  <div className="relative inline-flex">
                    <div className="absolute -inset-1 rounded-full bg-indigo-500/20 blur animate-pulse" />
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Shield className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-on-surface tracking-tight leading-none animate-in fade-in slide-in-from-top-2 duration-300">
                      Secure Device Authorization
                    </h3>
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                      We detected a login attempt from an unrecognized browser environment. For your ultimate account safety, a secure device validation alert has been sent to your registered email.
                    </p>
                  </div>

                  <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 rounded-2xl flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-3 duration-300">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-on-surface-variant/80 font-bold uppercase tracking-widest font-mono">Recipient Address</span>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 break-all leading-tight">
                        {pendingUser?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl space-y-4 shadow-inner">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest font-mono">
                      Real-Time Security Listener
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-on-surface font-semibold leading-relaxed">
                      Awaiting secure authentication confirmation...
                    </p>
                    <p className="text-[11px] text-on-surface-variant/85 leading-relaxed">
                      Once you tap the link on your mobile, tablet, or desktop email client, this browser screen will immediately authorize, activate your session, and load your dashboard. You do not need to refresh this tab.
                    </p>
                  </div>
                </div>

                {ipData && (
                  <div className="p-4 bg-neutral-100/60 dark:bg-neutral-900/40 rounded-xl border border-outline-variant/30 text-xs text-on-surface-variant leading-relaxed font-semibold flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant font-medium">Location Origin:</span>
                      <span className="font-mono text-on-surface font-bold">{ipData.location}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant font-medium">IP Connection:</span>
                      <span className="font-mono text-on-surface font-bold">{ipData.ip}</span>
                    </div>
                  </div>
                )}



                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMfaChallenge(false);
                      setPendingUser(null);
                      setError("");
                      setMessage("");
                      clearAuthSessionStorage();
                    }}
                    className="flex-1 py-3.5 bg-surface border border-outline-variant hover:bg-surface-dim text-on-surface font-bold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer text-center"
                  >
                    Cancel Sign-In
                  </button>

                  <button
                    type="button"
                    onClick={handleResendMfaEmail}
                    disabled={mfaResendStatus === "sending"}
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer text-center disabled:opacity-50"
                  >
                    {mfaResendStatus === "sending" ? "Resending Alert..." : mfaResendStatus === "sent" ? "Link Sent! ✓" : "Resend Alert Email"}
                  </button>
                </div>
              </motion.div>
            ) : authView === "forgot" ? (
              <ForgotPasswordView key="forgot" />
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <AuthForm 
                  isLogin={isLogin} 
                  loading={loading} 
                  onAuthProcess={handleAuthProcess}
                  initialEmail={initialEmail}
                  rememberMe={rememberMe}
                  setRememberMe={setRememberMe}
                  onForgotPassword={(email: string) => {
                    setInitialEmail(email);
                    setAuthView("forgot");
                  }}
                />

                <div className="my-6 flex items-center gap-3 text-outline font-medium text-sm">
                  <div className="h-px bg-outline-variant/50 flex-1"></div>
                  <div className="uppercase tracking-wider text-xs text-on-surface-variant">
                    or continue with
                  </div>
                  <div className="h-px bg-outline-variant/50 flex-1"></div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  className="w-full py-3.5 bg-surface font-bold text-on-surface rounded-2xl border border-outline-variant hover:bg-surface-dim hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex justify-center items-center gap-3 shadow-sm text-[15px] sm:text-base"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>
              </motion.div>
             )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center mt-8 text-on-surface-variant font-medium text-sm">
          By continuing, you agree to our{" "}
          <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </motion.div>
    </div>
  );
}
