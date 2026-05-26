import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { updateEmail, updatePassword } from "firebase/auth";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Share2,
  Users,
  Award
} from "lucide-react";
import { Logo } from "../components/Logo";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const fetchUserData = async () => {
          try {
            setEmail(user.email || "");

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setName(userDoc.data().name || "");
            }
            
            const refQ = query(collection(db, "referrals"), where("referrerId", "==", user.uid));
            const refSnap = await getDocs(refQ);
            setReferralCount(refSnap.size);

          } catch (err) {
            console.error("Error fetching user data:", err);
          } finally {
            setLoading(false);
          }
        };

        fetchUserData();
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);
    setMessage("");
    setError("");

    try {
      let requiresReauth = false;

      // Update email if changed
      if (email !== auth.currentUser.email) {
        try {
          await updateEmail(auth.currentUser, email);
        } catch (err: any) {
          if (err.code === "auth/requires-recent-login") {
            requiresReauth = true;
          } else {
            throw err;
          }
        }
      }

      // Update password if provided
      if (password && !requiresReauth) {
        try {
          await updatePassword(auth.currentUser, password);
        } catch (err: any) {
          if (err.code === "auth/requires-recent-login") {
            requiresReauth = true;
          } else {
            throw err;
          }
        }
      }

      if (requiresReauth) {
        setError(
          "For security reasons, updating email or password requires a recent login. Please log out and log back in, then try again.",
        );
        setSaving(false);
        return;
      }

      // Update name in Firestore
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userDocRef, { name }, { merge: true });

      setMessage("Profile updated successfully!");
      setPassword(""); // Clear password field
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dim flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dim text-on-surface font-body-md">
      <nav className="bg-surface/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50 border-b border-outline-variant/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 hover:bg-surface-dim group rounded-full transition-colors flex items-center"
            >
              <ArrowLeft className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
            </button>
            <Logo />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-surface p-6 sm:p-10 rounded-[24px] sm:rounded-[32px] border border-outline-variant/50 shadow-sm bento-card">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-headline-md mb-2">
              Profile Settings
            </h1>
            <p className="text-on-surface-variant font-medium mb-6 sm:mb-8 text-sm sm:text-base">
              Update your account details and password.
            </p>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="bg-error/10 border border-error/20 text-error p-4 rounded-2xl text-sm font-medium flex items-start gap-3 overflow-hidden"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </motion.div>
              )}
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="bg-green-500/10 border border-green-500/20 text-green-600 p-4 rounded-2xl text-sm font-medium flex items-start gap-3 overflow-hidden"
                >
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-on-surface px-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline transition-colors group-focus-within:text-primary" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-dim border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl outline-none transition-all font-medium text-on-surface"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-on-surface px-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline transition-colors group-focus-within:text-primary" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-dim border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl outline-none transition-all font-medium text-on-surface"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/50">
                <h2 className="text-lg font-bold mb-4">Change Password</h2>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-on-surface px-1">
                    New Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline transition-colors group-focus-within:text-primary" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      className="w-full pl-12 pr-4 py-3.5 bg-surface-dim border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl outline-none transition-all font-medium text-on-surface"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-4 bg-primary text-on-primary font-bold rounded-2xl hover:bg-primary/90 transition-all active:scale-95 shadow-sm shadow-primary/20 flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-70 disabled:active:scale-100"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-10 pt-8 border-t border-outline-variant/30">
               <div className="bg-primary/5 border border-primary/20 rounded-[20px] p-6 sm:p-8 relative overflow-hidden group hover:border-primary/40 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mt-10 -mr-10"></div>
                  <div className="relative z-10">
                     <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl sm:text-2xl font-bold font-headline-md flex items-center gap-2 text-on-surface">
                           <Award className="w-6 h-6 text-primary" /> Invite & Earn Premium
                        </h2>
                        <div className="bg-surface px-4 py-1.5 rounded-full border border-primary/30 flex items-center gap-2 font-bold text-sm text-primary shadow-sm">
                           <Users className="w-4 h-4" /> {referralCount} / 3 Referred
                        </div>
                     </div>
                     <p className="text-on-surface-variant font-medium mb-6 text-sm">
                        Share Exam City with your friends! Once 3 friends sign up using your unique link, your account will be automatically upgraded to Premium for free.
                     </p>
                     
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-primary uppercase tracking-widest pl-1">Your Unique Invite Link</label>
                        <div className="flex gap-2">
                           <input 
                              type="text" 
                              readOnly 
                              value={`https://examcity.netlify.app/signup?ref=${auth.currentUser?.uid}`} 
                              className="flex-1 bg-surface border border-outline-variant/60 rounded-xl px-4 py-3 text-sm font-medium text-on-surface outline-none"
                           />
                           <button 
                              onClick={() => {
                                 navigator.clipboard.writeText(`https://examcity.netlify.app/signup?ref=${auth.currentUser?.uid}`);
                                 setMessage("Referral link copied to clipboard!");
                              }}
                              className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-all font-bold flex shrink-0 shadow-sm active:scale-95"
                           >
                              <Share2 className="w-5 h-5 sm:mr-2" />
                              <span className="hidden sm:inline">Copy Link</span>
                           </button>
                        </div>
                     </div>
                     
                     {referralCount >= 3 && (
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 border border-green-500/20 text-xs font-bold rounded-full">
                           <CheckCircle2 className="w-4 h-4" /> You've achieved Premium status!
                        </div>
                     )}
                     
                     {referralCount < 3 && (
                        <div className="mt-6">
                           <div className="w-full bg-surface h-3 rounded-full overflow-hidden border border-outline-variant/30">
                              <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${(referralCount / 3) * 100}%` }}></div>
                           </div>
                           <div className="text-right mt-1.5 text-xs font-bold text-on-surface-variant">
                              {3 - referralCount} more to go!
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
