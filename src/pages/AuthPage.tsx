import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, Zap, Check, X, AlertCircle } from "lucide-react";

const validateEmail = (emailStr: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
};

const getPasswordRequirements = (pwd: string) => {
  return {
    length: pwd.length >= 8,
    hasNumber: /\d/.test(pwd),
    hasSpecial: /[^A-Za-z0-9]/.test(pwd),
  };
};

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== "/signup");
  const [authView, setAuthView] = useState<"auth" | "forgot">("auth");

  useEffect(() => {
    setIsLogin(location.pathname !== "/signup");
  }, [location.pathname]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("rememberMe") !== "false";
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAuthProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        // Apply the chosen state-based persistence to Firebase Auth before logging in
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        const res = await signInWithEmailAndPassword(auth, email, password);
        
        // Removed the enforced verification check on login as per user request
        // Users only verify once during registration
        
        setIsSuccess(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        const guestExamCount = Number(localStorage.getItem('guestExamCount') || 0);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          email,
          role: "user",
          emailVerified: false,
          examCount: guestExamCount,
          createdAt: serverTimestamp(),
        });

        const otpRes = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, isSignup: true }),
        });
        const otpData = await otpRes.json();
        
        if (otpRes.ok) {
           await auth.signOut();
           setIsSuccess(true);
           setTimeout(() => {
             navigate("/verify-email", {
               state: {
                 verificationId: otpData.verificationId,
                 email,
                 password,
                 uid: userCredential.user.uid,
                 name,
                 isSignup: true
               }
             });
           }, 2000);
        } else {
           throw new Error(otpData.error || "Failed to send OTP.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
      setAuthView("auth");
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
      
      const userSnap = await getDoc(doc(db, "users", result.user.uid));
      if (!userSnap.exists()) {
        const guestExamCount = Number(localStorage.getItem('guestExamCount') || 0);
        await setDoc(doc(db, "users", result.user.uid), {
          name: result.user.displayName || "Google User",
          email: result.user.email,
          role: "user",
          emailVerified: true,
          examCount: guestExamCount,
          createdAt: serverTimestamp(),
        });
        
        await fetch("/api/auth/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: result.user.email, name: result.user.displayName }),
        });
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isEmailDirty = email.length > 0;
  const isEmailFormatValid = validateEmail(email);

  const pwdReq = getPasswordRequirements(password);
  const isPasswordDirty = password.length > 0;
  
  // Complexity check declarations
  const isPasswordComplexityMet = pwdReq.length && pwdReq.hasNumber && pwdReq.hasSpecial;
  const isPasswordValidLogin = password.length >= 8;

  const isFormValid = isLogin 
    ? (validateEmail(email) && isPasswordValidLogin)
    : (name.trim() !== "" && validateEmail(email) && isPasswordComplexityMet);

  return (
    <div className="min-h-screen bg-[#FDFDFF] relative flex items-center justify-center p-4 font-sans overflow-hidden transition-colors duration-1000">
      {/* Dynamic Background with high-end mesh-like gradients that shift based on auth mode */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            backgroundColor: isLogin ? "rgba(129, 51, 255, 0.08)" : "rgba(139, 92, 246, 0.08)",
            scale: isLogin ? 1 : 1.1
          }}
          className="absolute -top-[10%] -left-[5%] w-[600px] h-[600px] blur-[140px] rounded-full mix-blend-multiply animate-pulse" 
        />
        <motion.div 
          animate={{ 
            backgroundColor: isLogin ? "rgba(99, 102, 241, 0.08)" : "rgba(236, 72, 153, 0.1)",
            scale: isLogin ? 1 : 1.2
          }}
          className="absolute top-[30%] -right-[10%] w-[500px] h-[500px] blur-[120px] rounded-full mix-blend-multiply animate-blob-slow" 
        />
        <motion.div 
          animate={{ 
            backgroundColor: isLogin ? "rgba(168, 85, 247, 0.05)" : "rgba(59, 130, 246, 0.08)",
            scale: isLogin ? 1 : 0.9
          }}
          className="absolute -bottom-[10%] left-[20%] w-[550px] h-[550px] blur-[130px] rounded-full mix-blend-multiply animate-pulse" 
        />
        
        {/* Subtle dot pattern grid */}
        <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: 'radial-gradient(#C6C6CD 1px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Back to Home Button - Floating elegantly in the top left */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-xs font-bold text-on-surface-variant/60 hover:text-primary transition-all group bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/50 shadow-sm cursor-pointer"
      >
        <span className="rotate-180"><ArrowRight className="w-3.5 h-3.5" /></span>
        Back to Home
      </motion.button>
      
      <div className="w-full max-w-[420px] z-10">
        {/* Auth Card with sleek glass borders and high-contrast spacing */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white/90 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] relative overflow-hidden"
        >
          {/* Top Logo branding container - highly prominent */}
          <div className="flex flex-col items-center justify-center mb-10 overflow-visible">
            <motion.img 
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.05 }}
              src="/examcity_no_bg.png" 
              alt="ExamCity Logo" 
              className="h-28 md:h-32 w-auto max-w-[340px] drop-shadow-2xl object-contain cursor-pointer"
              referrerPolicy="no-referrer" 
              onClick={() => navigate("/")}
            />
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div 
                key="success-animation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-6 text-center space-y-5"
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  className="relative flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-full border border-emerald-500/20"
                >
                  <svg
                    className="w-10 h-10 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ type: "spring", duration: 1.2, bounce: 0 }}
                      d="M20 6L9 17l-5-5"
                    />
                  </svg>
                  
                  {/* Concentric expanding wave pulse representing success */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full border-2 border-emerald-500/40"
                  />
                </motion.div>
                
                <div className="space-y-2">
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg font-bold text-on-surface"
                  >
                    {isLogin ? "Welcome Back!" : "Success!"}
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs text-on-surface-variant font-medium max-w-[260px] leading-relaxed mx-auto"
                  >
                    {isLogin 
                      ? "Authorization approved. Directing you to your learning dashboard..."
                      : "Registration successfully completed. Setting up your security verification..."
                    }
                  </motion.p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, y: -10 }} 
                      animate={{ opacity: 1, height: 'auto', y: 0 }} 
                      exit={{ opacity: 0, height: 0, y: -10 }} 
                      className="mb-5 overflow-hidden"
                    >
                      <div className="bg-error/10 text-error p-3 rounded-xl text-xs font-semibold border border-error/20 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-error" />
                        <span>{error}</span>
                      </div>
                    </motion.div>
                  )}
                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, y: -10 }} 
                      animate={{ opacity: 1, height: 'auto', y: 0 }} 
                      exit={{ opacity: 0, height: 0, y: -10 }} 
                      className="mb-5 overflow-hidden"
                    >
                      <div className="bg-emerald-500/10 text-emerald-600 p-3 rounded-xl text-xs font-semibold border border-emerald-500/20 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                        <span>{message}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {authView === "forgot" ? (
                  <motion.form 
                    key="forgot"
                    initial={{ opacity: 0, x: 15 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -15 }}
                    onSubmit={handleForgotPassword} 
                    className="space-y-4"
                  >
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-bold text-on-surface">Reset Password</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/40 group-focus-within:text-primary transition-colors" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email Address"
                          className="w-full bg-surface-dim/30 border border-outline-variant/60 hover:border-outline-variant focus:border-primary/60 text-on-surface placeholder:text-on-surface-variant/40 py-3.5 pl-11 pr-4 rounded-xl outline-none transition-all focus:bg-surface focus:ring-4 focus:ring-primary/10 text-sm font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full py-3.5 bg-primary hover:bg-primary/95 text-on-primary font-bold rounded-xl transition-all shadow-md active:translate-y-[1px] disabled:opacity-50 cursor-pointer text-sm"
                      >
                        {loading ? "Sending link..." : "Send Reset Link"}
                      </button>
                    </div>

                    <div className="text-center pt-1">
                      <button 
                        type="button" 
                        onClick={() => setAuthView("auth")} 
                        className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="auth" 
                    initial={{ opacity: 0, x: -15 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 15 }}
                  >
                    <div className="text-center mb-8">
                       <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">
                         {isLogin ? "Sign in to your account" : "Create your account"}
                       </h2>
                       <p className="text-sm text-on-surface-variant/60 font-medium mt-1">
                         {isLogin ? "Welcome back! Please enter your details." : "Join ExamCity to start mapping your future."}
                       </p>
                    </div>

                    <form onSubmit={handleAuthProcess} className="space-y-4">
                      <AnimatePresence mode="popLayout">
                        {!isLogin && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            exit={{ opacity: 0, height: 0 }} 
                            className="relative group overflow-hidden"
                          >
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/40 group-focus-within:text-primary transition-colors" />
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Full Name"
                              className="w-full bg-surface-dim/30 border border-outline-variant/60 hover:border-outline-variant focus:border-primary/60 text-on-surface placeholder:text-on-surface-variant/40 py-3.5 pl-11 pr-4 rounded-xl outline-none transition-all focus:bg-surface focus:ring-4 focus:ring-primary/10 text-sm font-medium"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/40 group-focus-within:text-primary transition-colors" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email Address"
                          className={`w-full bg-surface-dim/30 border text-on-surface placeholder:text-on-surface-variant/40 py-3.5 pl-11 pr-11 rounded-xl outline-none transition-all focus:bg-surface focus:ring-4 text-sm font-medium ${isEmailDirty ? (isEmailFormatValid ? "border-emerald-500/50 focus:border-emerald-500/80 focus:ring-emerald-500/10" : "border-rose-500/50 focus:border-rose-500/80 focus:ring-rose-500/10") : "border-outline-variant/60 hover:border-outline-variant focus:border-primary/60 focus:ring-primary/10"}`}
                        />
                        {isEmailDirty && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                            {isEmailFormatValid ? (
                              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-500" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/40 group-focus-within:text-primary transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className={`w-full bg-surface-dim/30 border text-on-surface placeholder:text-on-surface-variant/40 py-3.5 pl-11 pr-12 rounded-xl outline-none transition-all focus:bg-surface focus:ring-4 text-sm font-medium ${isPasswordDirty ? (isLogin ? (isPasswordValidLogin ? "border-emerald-500/50 focus:border-emerald-500/80 focus:ring-emerald-500/10" : "border-rose-500/50 focus:border-rose-500/80 focus:ring-rose-500/10") : (isPasswordComplexityMet ? "border-emerald-500/50 focus:border-emerald-500/80 focus:ring-emerald-500/10" : "border-rose-500/50 focus:border-rose-500/80 focus:ring-rose-500/10")) : "border-outline-variant/60 hover:border-outline-variant focus:border-primary/60 focus:ring-primary/10"}`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          {isPasswordDirty && (
                            <span className="pointer-events-none">
                              {isLogin ? (
                                isPasswordValidLogin ? <Check className="w-4 h-4 text-emerald-500 stroke-[3]" /> : <AlertCircle className="w-4 h-4 text-rose-500" />
                              ) : (
                                isPasswordComplexityMet ? <Check className="w-4 h-4 text-emerald-500 stroke-[3]" /> : <AlertCircle className="w-4 h-4 text-rose-500" />
                              )}
                            </span>
                          )}
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="text-on-surface-variant/40 hover:text-on-surface transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Signup real-time password requirements indicators */}
                      {!isLogin && isPasswordDirty && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-1.5 text-[11px] font-medium text-on-surface-variant/70 bg-surface-dim/45 p-3 rounded-xl border border-outline-variant/40"
                        >
                          <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-wider mb-1">
                            Password Complexity checklist
                          </div>
                          <div className="flex items-center gap-1.5 transition-all">
                            {pwdReq.length ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 stroke-[3]" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30 ml-1.5 mr-1.5" />
                            )}
                            <span className={pwdReq.length ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>At least 8 characters</span>
                          </div>
                          <div className="flex items-center gap-1.5 transition-all">
                            {pwdReq.hasNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 stroke-[3]" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30 ml-1.5 mr-1.5" />
                            )}
                            <span className={pwdReq.hasNumber ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>Contains a number (0-9)</span>
                          </div>
                          <div className="flex items-center gap-1.5 transition-all">
                            {pwdReq.hasSpecial ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 stroke-[3]" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30 ml-1.5 mr-1.5" />
                            )}
                            <span className={pwdReq.hasSpecial ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>Contains a special character</span>
                          </div>
                        </motion.div>
                      )}

                      {/* Login simple mini indicator if password is typed but not long enough */}
                      {isLogin && isPasswordDirty && !isPasswordValidLogin && (
                        <motion.p 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 px-1"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Password must be at least 8 characters.
                        </motion.p>
                      )}

                      {/* Remember Me checkbox and Forgot Password link styled neatly */}
                      {isLogin && (
                        <div className="flex items-center justify-between pt-1 font-sans">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => {
                                const checkVal = e.target.checked;
                                setRememberMe(checkVal);
                                localStorage.setItem("rememberMe", String(checkVal));
                              }}
                              className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                            />
                            <span className="text-xs text-on-surface-variant/75 font-semibold">Remember Me</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setAuthView("forgot")}
                            className="text-primary text-xs font-bold hover:text-primary/80 transition-colors cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading || !isFormValid}
                          className="w-full py-3.5 bg-primary hover:bg-primary/95 text-on-primary font-bold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 active:translate-y-[1px] cursor-pointer text-sm"
                        >
                           {loading ? (
                             <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                           ) : (
                             <>{isLogin ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4"/></>
                           )}
                        </button>
                      </div>

                      <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-outline-variant/60"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-surface px-4 text-on-surface-variant/40 font-bold tracking-widest">Or continue with</span>
                        </div>
                      </div>

                      <button
                        onClick={handleGoogleSignIn}
                        type="button"
                        className="w-full py-3 bg-white dark:bg-surface-bright text-on-surface font-semibold rounded-xl hover:bg-surface-dim/40 flex items-center justify-center gap-3 transition-all border border-outline-variant hover:border-outline shadow-sm active:scale-[0.98] cursor-pointer text-xs"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                      </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-outline-variant/40">
                      <p className="text-center text-sm text-on-surface-variant/60 font-medium">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                        <button
                          type="button"
                          onClick={() => navigate(isLogin ? "/signup" : "/login")}
                          className="text-primary font-bold hover:underline underline-offset-4 transition-all cursor-pointer"
                        >
                          {isLogin ? "Sign up" : "Sign in"}
                        </button>
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

