import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname === "/login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuthSuccess = async (userId: string) => {
    const demoDataStr = sessionStorage.getItem("demoResult");
    if (demoDataStr) {
      try {
        const { addDoc, collection, increment } = await import("firebase/firestore");
        const demoData = JSON.parse(demoDataStr);
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
          testsTakenThisMonth: increment(1)
        }, { merge: true });

        sessionStorage.removeItem("demoResult");
        navigate(`/review/${resultRef.id}`);
        return;
      } catch (e) {
        console.error("Failed to save demo score", e);
      }
    }
    navigate("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence,
        );
        const res = await signInWithEmailAndPassword(auth, email, password);
        await handleAuthSuccess(res.user.uid);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          email,
          role: "user",
          createdAt: serverTimestamp(),
        });
        await handleAuthSuccess(userCredential.user.uid);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // We should make sure user doc exists
      await setDoc(
        doc(db, "users", result.user.uid),
        {
          name: result.user.displayName || "Google User",
          email: result.user.email,
          role: "user",
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

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

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center relative overflow-hidden font-body-md w-full p-4 sm:p-8">
      {/* Immersive Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 45, 0],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-primary rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -45, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 -left-24 w-[700px] h-[700px] bg-secondary rounded-full blur-[140px]"
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+CjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] opacity-50" />
      </div>

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
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-3xl sm:text-4xl font-headline-md font-extrabold text-on-surface tracking-tight mb-2">
                {isLogin ? "Welcome back" : "Create an account"}
              </h2>
              <p className="text-on-surface-variant font-medium text-[15px] sm:text-base px-2">
                {isLogin
                  ? "Enter your details to access your dashboard"
                  : "Join thousands of learners today"}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          layout
          className="bg-surface/80 backdrop-blur-2xl border border-outline-variant/40 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Form switch toggle */}
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

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-error/10 border border-error/20 text-error p-4 rounded-2xl text-sm font-medium flex items-start gap-3 mb-6"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-500/10 border border-green-500/20 text-green-600 p-4 rounded-2xl text-sm font-medium flex items-start gap-3 mb-6"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {!isLogin && (
                <motion.div
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
                      className="w-full bg-surface-dim/40 border border-outline-variant/50 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-4 outline-none font-medium text-on-surface transition-all placeholder:text-on-surface-variant/60 hover:border-outline-variant shadow-sm text-sm sm:text-base"
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
                className="w-full bg-surface-dim/40 border border-outline-variant/50 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-4 outline-none font-medium text-on-surface transition-all placeholder:text-on-surface-variant/60 hover:border-outline-variant shadow-sm text-sm sm:text-base"
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
                className="w-full bg-surface-dim/40 border border-outline-variant/50 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 rounded-xl sm:rounded-2xl py-3.5 sm:py-4 pl-10 sm:pl-12 pr-12 outline-none font-medium text-on-surface transition-all placeholder:text-on-surface-variant/60 hover:border-outline-variant shadow-sm text-sm sm:text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

            <AnimatePresence>
              {isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
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
                      onClick={handleForgotPassword}
                      className="text-sm font-bold text-primary hover:text-primary/70 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

        <p className="text-center mt-8 text-on-surface-variant font-medium text-sm">
          By continuing, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </motion.div>
    </div>
  );
}
