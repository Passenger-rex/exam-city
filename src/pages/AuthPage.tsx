import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname === "/login");
  const [authView, setAuthView] = useState<"auth" | "forgot">("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuthProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await signInWithEmailAndPassword(auth, email, password);
        const userSnap = await getDoc(doc(db, "users", res.user.uid));
        const userData = userSnap.data();

        if (userData && !userData.emailVerified) {
          // Trigger OTP for unverified email
          const otpRes = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name: userData.name, isSignup: false }),
          });
          const otpData = await otpRes.json();
          if (!otpRes.ok) throw new Error(otpData.error || "Failed to send OTP.");

          await auth.signOut(); // Block access until OTP is verified
          navigate("/verify-email", {
            state: {
              verificationId: otpData.verificationId,
              email,
              password,
              uid: res.user.uid,
              name: userData.name,
              isSignup: false,
            }
          });
          return;
        }

        navigate("/dashboard");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          email,
          role: "user",
          emailVerified: false,
          createdAt: serverTimestamp(),
        });

        // Trigger OTP for new registration
        const otpRes = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, isSignup: true }),
        });
        const otpData = await otpRes.json();
        
        if (otpRes.ok) {
           await auth.signOut();
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
        await setDoc(doc(db, "users", result.user.uid), {
          name: result.user.displayName || "Google User",
          email: result.user.email,
          role: "user",
          emailVerified: true, // Google emails are already verified
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

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      <div className="w-full max-w-md z-10 bg-surface p-8 rounded-[32px] border border-outline-variant/30 shadow-2xl relative overflow-hidden">
        
        {error && (
          <div className="bg-error/10 text-error p-3 rounded-xl text-sm mb-4 border border-error/20">
            {error}
          </div>
        )}
        {message && (
           <div className="bg-primary/10 text-primary p-3 rounded-xl text-sm mb-4 border border-primary/20">
             {message}
           </div>
        )}

        {authView === "forgot" ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full bg-surface-dim/40 border border-outline-variant/50 py-4 px-4 rounded-2xl"
              required
            />
            <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl">
              Send Reset Link
            </button>
            <button
              type="button"
              onClick={() => setAuthView("auth")}
              className="w-full text-sm font-medium text-on-surface-variant hover:text-on-surface"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <div>
            <div className="flex gap-4 mb-8 bg-surface-dim p-1 rounded-2xl">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 font-medium rounded-xl transition-all ${isLogin ? "bg-surface shadow-sm text-primary" : "text-on-surface-variant"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 font-medium rounded-xl transition-all ${!isLogin ? "bg-surface shadow-sm text-primary" : "text-on-surface-variant"}`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleAuthProcess} className="space-y-4">
              {!isLogin && (
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-surface-dim/40 border border-outline-variant/50 focus:border-primary py-4 px-4 rounded-2xl"
                />
              )}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-surface-dim/40 border border-outline-variant/50 focus:border-primary py-4 px-4 rounded-2xl"
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-surface-dim/40 border border-outline-variant/50 focus:border-primary py-4 px-4 rounded-2xl"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-sm text-on-surface-variant text-right w-full">
                 {showPassword ? "Hide" : "Show"} password
              </button>

              {isLogin && (
                <button
                  type="button"
                  onClick={() => setAuthView("forgot")}
                  className="text-primary text-sm font-medium block ml-auto hover:underline"
                >
                  Forgot password?
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                 {isLogin ? "Sign In" : "Create Account"} <ArrowRight className="w-5 h-5"/>
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-4">
               <div className="h-px bg-outline-variant w-full" />
               <span className="text-on-surface-variant text-sm font-medium">OR</span>
               <div className="h-px bg-outline-variant w-full" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full mt-6 py-4 bg-surface-dim text-on-surface font-medium rounded-2xl hover:bg-surface-dim/70 flex items-center justify-center gap-2 shadow-sm"
            >
              Continue with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
