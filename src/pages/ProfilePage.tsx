import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
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
  Award,
  Calendar,
  Zap,
  LifeBuoy,
  X,
  Paperclip,
  Laptop,
  Smartphone,
  Trash2,
  Globe,
  Shield,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { useUser } from "../UserContext";
import { Navbar } from "../components/Navbar";

interface ReferredUser {
  id: string;
  email: string;
  createdAt: Date;
  tier: "free" | "pro";
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, logout } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Support Complaint Widget states
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportCategory, setSupportCategory] = useState("Site Bug");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportAttachment, setSupportAttachment] = useState<File | null>(null);
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState("");
  const [supportError, setSupportError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Concurrent device/session management states
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceLoading, setDeviceLoading] = useState(false);

  // Helper to structure nice labels out of raw agent metadata
  const getDeviceFromUA = (ua: string) => {
    if (!ua) return { name: "Unknown System", isMobile: false };
    const lower = ua.toLowerCase();
    let os = "Unknown OS";
    let browser = "Web Browser";

    if (lower.includes("windows")) os = "Windows";
    else if (lower.includes("macintosh") || lower.includes("mac os")) os = "macOS";
    else if (lower.includes("iphone") || lower.includes("ipad")) os = "iOS";
    else if (lower.includes("android")) os = "Android";
    else if (lower.includes("linux")) os = "Linux";

    if (lower.includes("chrome") || lower.includes("crios")) browser = "Chrome";
    else if (lower.includes("firefox")) browser = "Firefox";
    else if (lower.includes("safari") && !lower.includes("chrome")) browser = "Safari";
    else if (lower.includes("edge")) browser = "Edge";
    else if (lower.includes("opr") || lower.includes("opera")) browser = "Opera";

    return {
      name: `${browser} on ${os}`,
      isMobile: lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")
    };
  };

  const handleLogoutSession = async (sessionId: string) => {
    if (!auth.currentUser) return;
    try {
      setDeviceLoading(true);
      setError("");
      setMessage("");
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        let sessions = data.activeSessions || [];
        sessions = sessions.filter((s: any) => s.id !== sessionId);

        let updatePayload: any = { activeSessions: sessions };
        if (sessionId === currentSessionId) {
          updatePayload.activeSession = null;
        }

        await setDoc(userDocRef, updatePayload, { merge: true });
        setActiveSessions(sessions);
        
        if (sessionId === currentSessionId) {
          await logout();
          navigate("/login");
        } else {
          setMessage("Selected trusted device session has been revoked successfully.");
        }
      }
    } catch (e: any) {
      console.error(e);
      setError("Failed to terminate session credentials safely: " + e.message);
    } finally {
      setDeviceLoading(false);
    }
  };

  const handleLogoutAllOtherSessions = async () => {
    if (!auth.currentUser || !currentSessionId) return;
    try {
      setDeviceLoading(true);
      setError("");
      setMessage("");
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const sessions = data.activeSessions || [];
        const currentSess = sessions.find((s: any) => s.id === currentSessionId);
        
        const remainingSessions = currentSess ? [currentSess] : [];
        await setDoc(userDocRef, {
          activeSessions: remainingSessions,
          activeSession: currentSess || null
        }, { merge: true });
        
        setActiveSessions(remainingSessions);
        setMessage("All other active session instances logged out successfully.");
      }
    } catch (e: any) {
      console.error(e);
      setError("Failed to revoke sister sessions: " + e.message);
    } finally {
      setDeviceLoading(false);
    }
  };

  const [referralCount, setReferralCount] = useState(0);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);

  // Study Group Premium Buddy management states
  const [groupEmailInput, setGroupEmailInput] = useState("");
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupError, setGroupError] = useState("");
  const [groupMessage, setGroupMessage] = useState("");
  const [groupMembersList, setGroupMembersList] = useState<string[]>([]);

  const MIN_SUPPORT_CHARS = 20;
  const MAX_SUPPORT_CHARS = 1000;

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMsg = supportMessage.trim();
    if (cleanMsg.length < MIN_SUPPORT_CHARS) {
      setSupportError(`Please provide enough information about your issue (at least ${MIN_SUPPORT_CHARS} characters required).`);
      return;
    }
    if (cleanMsg.length > MAX_SUPPORT_CHARS) {
      setSupportError(`Your message is too long (maximum of ${MAX_SUPPORT_CHARS} characters).`);
      return;
    }
    setSupportSubmitting(true);
    setSupportError("");
    setSupportSuccess("");

    try {
      let attachmentUrl = "";
      if (supportAttachment) {
        // Convert to base64 for embedding in the document as we don't have a direct storage hook set up easily without bucket config
        const reader = new FileReader();
        attachmentUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(supportAttachment);
        });
      }

      // Save feedback document to Firestore feedbacks collection
      await addDoc(collection(db, "feedbacks"), {
        userId: auth.currentUser?.uid || "anonymous",
        name: profile?.name || auth.currentUser?.displayName || "Student",
        email: auth.currentUser?.email || "unknown@student.com",
        rating: `[SUPPORT: ${supportCategory}]`,
        message: cleanMsg,
        attachment: attachmentUrl, // Store base64 or URL
        createdAt: new Date(),
      });

      setSupportSuccess("Support ticket submitted! Our administration team will process your inquiry shortly.");
      setSupportMessage("");
      setSupportAttachment(null);
    } catch (err: any) {
      console.error(err);
      setSupportError("Failed to submit support ticket: " + err.message);
    } finally {
      setSupportSubmitting(false);
    }
  };

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
              setGroupMembersList(userDoc.data().groupMembers || []);
              setActiveSessions(userDoc.data().activeSessions || []);
            }
            setCurrentSessionId(localStorage.getItem("sessionId"));

            const refQ = query(
              collection(db, "referrals"),
              where("referrerId", "==", user.uid),
            );
            const refSnap = await getDocs(refQ);
            setReferralCount(refSnap.size);

            const usersData: ReferredUser[] = refSnap.docs.map((doc) => ({
              id: doc.id,
              email: doc.data().referredEmail || "Anonymous User",
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              tier: doc.data().upgradeStatus || "free",
            }));

            setReferredUsers(
              usersData.sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
              ),
            );
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

  const handleAddGroupMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    const targetEmail = groupEmailInput.trim().toLowerCase();
    if (!targetEmail) return;

    if (groupMembersList.includes(targetEmail)) {
      setGroupError("This buddy is already in your group!");
      return;
    }

    if (groupMembersList.length >= 4) { // Admin + 4 companions = 5 total accounts!
      setGroupError("Group limit reached (Max 5 people including yourself).");
      return;
    }

    setGroupSaving(true);
    setGroupError("");
    setGroupMessage("");

    try {
      const updatedList = [...groupMembersList, targetEmail];
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userDocRef, { groupMembers: updatedList }, { merge: true });
      
      setGroupMembersList(updatedList);
      setGroupEmailInput("");
      setGroupMessage("Study buddy added successfully!");
    } catch (err: any) {
      setGroupError("Could not add study buddy: " + err.message);
    } finally {
      setGroupSaving(false);
    }
  };

  const handleRemoveGroupMember = async (memberEmail: string) => {
    if (!auth.currentUser) return;
    setGroupSaving(true);
    setGroupError("");
    setGroupMessage("");

    try {
      const updatedList = groupMembersList.filter(email => email !== memberEmail);
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userDocRef, { groupMembers: updatedList }, { merge: true });
      
      setGroupMembersList(updatedList);
      setGroupMessage("Study buddy removed successfully.");
    } catch (err: any) {
      setGroupError("Could not remove buddy: " + err.message);
    } finally {
      setGroupSaving(false);
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
    <div className="min-h-screen bg-surface-dim text-on-surface font-body-md flex flex-col w-full">
      <div className="flex-1 min-w-0 overflow-y-auto w-full">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-surface p-6 sm:p-10 rounded-[24px] sm:rounded-[32px] border border-outline-variant/50 shadow-sm bento-card">
            <button
               onClick={() => navigate("/dashboard")}
               className="mb-8 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-semibold text-sm group"
            >
               <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
               Back to Dashboard
            </button>
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2 mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold font-headline-md flex items-center gap-2 text-on-surface text-left justify-start w-full sm:w-auto">
                      <Award className="w-6 h-6 text-primary shrink-0" /> Invite
                      & Earn Premium
                    </h2>
                    <div className="bg-surface px-4 py-1.5 rounded-full border border-primary/30 flex items-center gap-2 font-bold text-sm text-primary shadow-sm w-fit sm:mx-0">
                      <Users className="w-4 h-4 shrink-0" /> {referralCount} / 12
                      Referred
                    </div>
                  </div>
                  <p className="text-on-surface-variant font-medium mb-6 text-sm text-left">
                    Share Exam City with your friends! Once 12 friends sign up
                    using your unique link, your account will be automatically
                    upgraded to Premium for free.
                  </p>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary uppercase tracking-widest pl-1 block text-left">
                      Your Unique Invite Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`https://examcity.qzz.io/signup?ref=${auth.currentUser?.uid}`}
                        className="flex-1 bg-surface border border-outline-variant/60 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-on-surface outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `https://examcity.qzz.io/signup?ref=${auth.currentUser?.uid}`,
                          );
                          setMessage("Referral link copied to clipboard!");
                        }}
                        className="bg-primary text-white p-2 sm:px-5 sm:py-3 rounded-xl hover:bg-primary/90 transition-all font-bold flex items-center justify-center shrink-0 shadow-sm active:scale-95"
                      >
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2 shrink-0" />
                        <span className="hidden sm:inline">Copy Link</span>
                      </button>
                    </div>
                  </div>

                   {referralCount >= 12 && (
                    <div className="mt-4 flex justify-start">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 border border-green-500/20 text-xs font-bold rounded-full">
                        <CheckCircle2 className="w-4 h-4" /> You've achieved
                        Premium status!
                      </div>
                    </div>
                  )}

                  {referralCount < 12 && (
                    <div className="mt-6">
                      <div className="w-full bg-surface h-3 rounded-full overflow-hidden border border-outline-variant/30">
                        <div
                          className="h-full bg-primary transition-all rounded-full"
                          style={{ width: `${(referralCount / 12) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-left sm:text-right mt-1.5 text-xs font-bold text-on-surface-variant">
                        {12 - referralCount} more to go!
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-outline-variant/30">
                <h2 className="text-xl font-bold font-headline-md flex items-center gap-2 text-on-surface mb-6">
                  <Users className="w-5 h-5 text-primary" /> Your Referrals
                </h2>
                {referredUsers.length === 0 ? (
                  <div className="bg-surface border border-outline-variant/30 rounded-xl p-8 flex flex-col items-center justify-center text-center text-on-surface-variant">
                    <Users className="w-10 h-10 mb-3 opacity-20" />
                    <p className="font-medium">
                      You haven't referred anyone yet.
                    </p>
                    <p className="text-sm opacity-80 mt-1">
                      Share your link above to get started!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="bg-surface border border-outline-variant/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-on-surface">
                              {user.email}
                            </div>
                            <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" /> Joined{" "}
                              {user.createdAt.toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 flex sm:justify-end">
                          {user.tier === "pro" ? (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                              <Zap className="w-3 h-3" /> PRO
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-surface-dim text-on-surface-variant border border-outline-variant/50 rounded-full text-[10px] font-bold uppercase tracking-widest">
                              FREE
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>



            </div>
          </div>
        </motion.div>
      </main>
      </div>

      {/* Floating Complaint/Support Widget (Profile Page Only) */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <button
          onClick={() => setShowSupportModal(true)}
          className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 hover:rotate-12 active:scale-95 transition-all group border-2 border-white/20 cursor-pointer"
          title="Submit Site Bug or Payment Issue"
        >
          <LifeBuoy className="w-7 h-7 group-hover:rotate-45 transition-transform duration-500" />
        </button>
      </div>

      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface w-full max-w-[460px] rounded-[28px] overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh] text-left relative"
            >
              <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center shrink-0 bg-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                    <LifeBuoy className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-on-surface leading-tight">Complaint & Support</h3>
                    <p className="text-xs text-on-surface-variant font-semibold">Log payment issues or site bugs</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSupportModal(false);
                    setSupportSuccess("");
                    setSupportError("");
                  }}
                  className="p-2 hover:bg-surface-dim rounded-full transition-colors text-on-surface-variant cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitSupport} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    Issue Category
                  </label>
                  <select
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    className="w-full h-11 px-4 bg-surface-dim border border-outline-variant rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-on-surface font-medium cursor-pointer"
                  >
                    <option value="Site Bug">Site Bug / Technical Failure</option>
                    <option value="Question Error">Question / Syllabus Feedback</option>
                    <option value="Other Complaint">General Complaint</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Describe the problem
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${supportMessage.trim().length < MIN_SUPPORT_CHARS ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500"}`}>
                      {supportMessage.trim().length < MIN_SUPPORT_CHARS 
                        ? `${supportMessage.trim().length}/${MIN_SUPPORT_CHARS} min` 
                        : `${supportMessage.trim().length}/${MAX_SUPPORT_CHARS} max`
                      }
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    maxLength={MAX_SUPPORT_CHARS}
                    placeholder="Provide details (e.g. subject name, specific question, transaction hash, active steps to reproduce)..."
                    className="w-full p-4 rounded-2xl bg-surface-dim border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-on-surface placeholder:text-neutral-500 resize-none font-medium leading-relaxed shadow-inner"
                  />
                  {supportMessage.trim().length > 0 && supportMessage.trim().length < MIN_SUPPORT_CHARS && (
                    <p className="text-xs text-amber-500 font-semibold mt-1.5 flex items-center gap-1">
                      ⚠️ Needs {MIN_SUPPORT_CHARS - supportMessage.trim().length} more characters to submit.
                    </p>
                  )}
                </div>



                {supportError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{supportError}</span>
                  </div>
                )}

                {supportSuccess && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs font-semibold rounded-xl flex items-start gap-2.5 leading-relaxed">
                    <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0 mt-0.5" />
                    <span>{supportSuccess}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSupportModal(false);
                      setSupportSuccess("");
                      setSupportError("");
                    }}
                    className="flex-1 py-3 bg-surface-dim hover:bg-surface-dim/80 text-on-surface-variant hover:text-on-surface font-bold text-sm rounded-2xl transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={supportSubmitting || supportMessage.trim().length < MIN_SUPPORT_CHARS || supportMessage.trim().length > MAX_SUPPORT_CHARS}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {supportSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "Submit Ticket"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deviceModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface w-full max-w-[500px] rounded-[28px] overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col max-h-[85vh] text-left relative"
            >
              <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center shrink-0 bg-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-on-surface leading-tight">Manage Sessions</h3>
                    <p className="text-xs text-on-surface-variant font-semibold">Active credentials on other hardware portals</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeviceModalOpen(false)}
                  className="p-2 hover:bg-surface-dim rounded-full transition-colors text-on-surface-variant cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
                {activeSessions.length > 1 && (
                  <div className="flex justify-between items-center bg-red-500/5 hover:bg-red-500/10 p-3 rounded-2xl border border-red-500/10 transition-colors">
                     <span className="text-[11px] font-bold text-red-700 dark:text-red-400">Kill all other active desktop and mobile access keys.</span>
                     <button
                       type="button"
                       disabled={deviceLoading}
                       onClick={handleLogoutAllOtherSessions}
                       className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md"
                     >
                       Sign Out Others
                     </button>
                  </div>
                )}

                <div className="space-y-3">
                  {activeSessions.map((session: any) => {
                    const devInfo = getDeviceFromUA(session.userAgent);
                    const isCurrent = session.id === currentSessionId;
                    
                    return (
                      <div 
                        key={session.id}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${isCurrent ? 'bg-green-500/5 border-green-500/20' : 'bg-surface-dim border-outline-variant/40 hover:border-primary/20'}`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${isCurrent ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-surface border-outline-variant/50 text-neutral-500'}`}>
                            {devInfo.isMobile ? (
                              <Smartphone className="w-5.5 h-5.5" />
                            ) : (
                              <Laptop className="w-5.5 h-5.5" />
                            )}
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-on-surface truncate">
                                {devInfo.name}
                              </span>
                              {isCurrent && (
                                <span className="shrink-0 px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-600 rounded-full text-[9px] font-extrabold uppercase tracking-wide">
                                  Current Unit
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-on-surface-variant font-semibold mt-0.5 flex items-center gap-1">
                              <Globe className="w-3 h-3 text-outline" />
                              <span>IP: {session.ip || "127.0.0.1"} ({session.location || "Unknown Location"})</span>
                            </p>
                            <span className="text-[10px] font-medium text-neutral-400 block mt-0.5">
                              Last action: {session.lastActive ? new Date(session.lastActive).toLocaleString() : 'Recent'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={deviceLoading}
                          onClick={() => handleLogoutSession(session.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${isCurrent ? 'text-red-500 hover:bg-red-500/10 border-red-500/25 bg-red-500/5' : 'text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-outline-variant/40'}`}
                          title={isCurrent ? "Self Sign Out" : "Terminate Session"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="px-6 py-4 bg-surface-dim border-t border-outline-variant/30 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDeviceModalOpen(false)}
                  className="px-5 py-2 bg-surface hover:bg-outline-variant/20 border border-outline-variant text-on-surface font-semibold text-xs rounded-xl cursor-pointer transition-all active:scale-[0.98]"
                >
                  Close Console
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
