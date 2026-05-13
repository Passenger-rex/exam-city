import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useLocation } from "react-router-dom";
import { db, auth } from "../firebase";
import { useUser } from "../UserContext";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Trophy,
  Target,
  BookOpen,
  Clock,
  Activity,
  LogOut,
  Settings,
  Award,
  ArrowRight,
  User,
  Zap,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { ExamConfigModal } from "../components/ExamConfigModal";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile: userProfile, loading: userLoading } = useUser();
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : "Scholar";
  const [stats, setStats] = useState({ total: 0, average: 0, highest: 0 });
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (location.state && location.state.upgradeSuccess) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      window.history.replaceState({}, document.title)
    }
  }, [location]);

  useEffect(() => {
    const fetchUserData = async (uid: string) => {
      try {
        const q = query(
          collection(db, "exam_results"),
          where("userId", "==", uid)
        );
        const snapshot = await getDocs(q);
        let results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Sort DESC by createdAt and take top 5
        results.sort((a: any, b: any) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        });
        results = results.slice(0, 5);

        setRecentExams(results);

        if (results.length > 0) {
          const totalScore = results.reduce(
            (acc: number, curr: any) => acc + (curr.score / curr.total) * 100,
            0,
          );
          const highestScore = Math.max(
            ...results.map((r: any) => (r.score / r.total) * 100),
          );

          setStats({
            total: results.length,
            average: Math.round(totalScore / results.length),
            highest: Math.round(highestScore),
          });
        }
      } catch (err: any) {
        console.error("Error fetching exams:", err);
        setError("Error fetching exam results: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-surface-dim flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dim text-on-surface font-body-md">
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2"
          >
            <Trophy className="w-5 h-5" /> Account upgraded to Pro successfully!
          </motion.div>
        )}
      </AnimatePresence>
      <nav className="bg-surface/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50 border-b border-outline-variant/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Logo />
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={async () => {
                setIsSigningOut(true);
                setTimeout(async () => {
                  try {
                    await auth.signOut();
                  } catch (error) {
                    console.error("Sign out error", error);
                    setIsSigningOut(false);
                  }
                }, 600);
              }}
              disabled={isSigningOut}
              className="text-on-surface-variant font-semibold text-sm hover:text-error transition-colors flex items-center gap-2 disabled:opacity-50"
              aria-label="Sign Out"
            >
              {isSigningOut ? (
                <div className="w-4 h-4 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full bg-surface-dim flex items-center justify-center cursor-pointer hover:bg-surface-container-high transition-colors outline outline-1 outline-outline-variant/50"
              aria-label="Go to Profile"
            >
              <User className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <AnimatePresence>
          {showConfigModal && (
            <ExamConfigModal
              isOpen={showConfigModal}
              onClose={() => setShowConfigModal(false)}
              userTier={userProfile.tier}
              testsTakenThisMonth={userProfile.testsTakenThisMonth}
            />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-surface p-10 sm:p-12 rounded-[2rem] sm:rounded-[3rem] overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/30 mb-8 sm:mb-12 flex flex-col md:flex-row justify-between items-center gap-8"
        >
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-primary/5 via-transparent to-transparent pointer-events-none"></div>
          <div className="relative z-10 w-full">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-fit ${userProfile.tier === "pro" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-surface-dim text-on-surface-variant border border-outline-variant/50"}`}
              >
                {userProfile.tier === "pro" ? (
                  <>
                    <Zap className="w-3 h-3 text-amber-500" /> Pro Member
                  </>
                ) : (
                  "Free Plan"
                )}
              </span>
              {userProfile.tier === "free" && (
                <span className="text-on-surface-variant/80 text-xs font-semibold">
                  {userProfile.testsTakenThisMonth} / 2 Mock Exams
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-headline-md tracking-tight mb-3 text-on-surface">
              Welcome back, {firstName}.
            </h1>
            <p className="text-on-surface-variant text-base sm:text-lg">
              Ready to conquer your next exam?
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
            {userProfile.tier === "free" && (
              <button
                onClick={() => navigate("/checkout")}
                className="px-8 py-3.5 bg-surface text-on-surface font-semibold text-sm rounded-2xl transition-all active:scale-[0.98] whitespace-nowrap border border-outline-variant hover:border-outline hover:bg-surface-dim shadow-sm flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4 text-amber-500" /> Upgrade
              </button>
            )}
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-8 py-3.5 bg-primary text-white font-semibold text-sm rounded-2xl hover:bg-primary/90 transition-all active:scale-[0.98] whitespace-nowrap shadow-[0_4px_14px_0_rgba(129,51,255,0.39)]"
            >
              Start Mock Exam
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div
            whileHover={{ y: -4 }}
            className="bento-card bg-surface p-6 rounded-3xl border border-outline-variant/50 flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <Activity className="w-5 h-5 text-outline" />
            </div>
            <h3 className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">
              Total Exams
            </h3>
            <p className="text-4xl font-extrabold text-on-surface font-headline-md">
              {stats.total}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bento-card bg-surface p-6 rounded-3xl border border-outline-variant/50 flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-green-400/20 text-green-600 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">
              Average Score
            </h3>
            <p className="text-4xl font-extrabold text-on-surface font-headline-md">
              {stats.average}%
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bento-card bg-surface p-6 rounded-3xl border border-outline-variant/50 flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-yellow-400/20 text-yellow-600 rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">
              Highest Score
            </h3>
            <p className="text-4xl font-extrabold text-on-surface font-headline-md">
              {stats.highest}%
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="col-span-1">
            <div className="bg-surface p-8 rounded-[32px] border border-outline-variant/50 overflow-hidden bento-card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline-md text-xl font-bold">
                  Recent Performance
                </h2>
                <button className="text-primary font-bold text-sm hover:underline">
                  View All
                </button>
              </div>

              {recentExams.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-surface-dim rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-outline" />
                  </div>
                  <p className="text-on-surface-variant font-medium">
                    No recent exams taken.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-on-surface-variant text-xs font-bold uppercase bg-surface-dim border-b border-outline-variant/50 rounded-t-xl">
                      <tr>
                        <th className="px-6 py-4 rounded-tl-xl w-1/3">Exam</th>
                        <th className="px-6 py-4 w-1/4">Score</th>
                        <th className="px-6 py-4 w-1/4">Date</th>
                        <th className="px-6 py-4 rounded-tr-xl w-1/6 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentExams.map((exam, i) => (
                        <tr
                          key={i}
                          className="border-b border-outline-variant/30 hover:bg-surface-dim transition-colors group"
                        >
                          <td className="px-6 py-4 font-bold text-on-surface">
                            Mock Exam
                          </td>
                          <td className="px-6 py-4 font-bold text-primary">
                            {exam.score} / {exam.total} (
                            {Math.round((exam.score / exam.total) * 100)}%)
                          </td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">
                            {exam.createdAt?.toDate
                              ? exam.createdAt.toDate().toLocaleDateString()
                              : "Just now"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => navigate(`/review/${exam.id}`)}
                              className="px-4 py-2 bg-surface-dim text-primary font-bold text-[13px] rounded-lg group-hover:bg-primary group-hover:text-on-primary transition-colors flex items-center gap-1 ml-auto"
                            >
                              Review <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
