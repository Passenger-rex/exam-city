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
  Bot,
  ChevronDown,
  Share2,
  Check,
  X,
  Copy,
  ExternalLink,
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
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [sharedExamId, setSharedExamId] = useState<string | null>(null);
  const [shareModalExam, setShareModalExam] = useState<any | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const getExamSubject = (exam: any) => {
    if (exam.subject) return String(exam.subject);
    if (exam.questions && exam.questions.length > 0) {
      return String(exam.questions[0].subject || "Unknown");
    }
    return "Unknown";
  };

  const formatSubject = (subjectStr: string) => {
    if (!subjectStr) return "Mock Exam";
    const acronyms = ["crk", "irk", "waec", "jamb", "neco"];
    if (acronyms.includes(subjectStr.toLowerCase())) {
      return subjectStr.toUpperCase();
    }
    return subjectStr
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleSharePerformance = (exam: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareModalExam(exam);
    setCopiedToClipboard(false);
  };

  const handleCopyText = async (textMsg: string) => {
    try {
      await navigator.clipboard.writeText(textMsg);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const uniqueSubjects = Array.from(
    new Set(
      recentExams
        .map((exam) => getExamSubject(exam))
        .filter((subj) => subj && subj !== "Unknown")
        .map((subj) => subj.toLowerCase())
    )
  );

  const filteredExams = recentExams.filter((exam) => {
    if (selectedSubject === "all") return true;
    const subj = getExamSubject(exam);
    return subj.toLowerCase() === selectedSubject.toLowerCase();
  });

  const displayedExams = filteredExams.slice(0, 5);

  useEffect(() => {
    if (location.state && location.state.upgradeSuccess) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5500);
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
        
        // Sort DESC by createdAt
        results.sort((a: any, b: any) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        });

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
    <div className="min-h-screen bg-surface-dim text-on-surface font-body-md select-none sm:select-text">
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
      <nav className="bg-surface/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50 border-b border-outline-variant/50 hidden md:block">
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
                }, 1000);
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

      <nav className="md:hidden bg-surface/90 backdrop-blur-md px-5 py-3 flex justify-between items-center shadow-sm sticky top-0 z-40 border-b border-outline-variant/50">
        <Logo />
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 w-fit ${userProfile.tier === "pro" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-surface-dim text-on-surface-variant border border-outline-variant/50"}`}>
             {userProfile.tier === "pro" ? <><Zap className="w-2.5 h-2.5" /> PRO</> : "FREE"}
          </span>
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
              }, 1000);
            }}
            disabled={isSigningOut}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-dim text-on-surface-variant hover:text-error transition-colors border border-outline-variant/30"
          >
            {isSigningOut ? (
               <div className="w-3.5 h-3.5 border-[1.5px] border-on-surface-variant border-t-transparent rounded-full animate-spin" />
            ) : (
               <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Navbar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant/50 flex justify-around items-center py-2 px-2 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
         <button onClick={() => { /* home */ }} className="flex flex-col items-center p-2 text-primary">
            <BookOpen className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Home</span>
         </button>
         <button onClick={() => setShowConfigModal(true)} className="flex flex-col items-center p-2 text-on-surface-variant hover:text-primary transition-colors">
            <div className="w-10 h-10 -mt-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-4 border-surface">
               <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold mt-1">Start</span>
         </button>
         <button onClick={() => navigate("/profile")} className="flex flex-col items-center p-2 text-on-surface-variant hover:text-primary transition-colors">
            <User className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Profile</span>
         </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 pb-28 md:pb-10">
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-headline-md tracking-tight mb-3 text-on-surface leading-tight">
              Welcome back, {firstName}.
            </h1>
            <p className="text-on-surface-variant text-base sm:text-lg font-medium opacity-90">
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
            {/* Study coach button moved to floating widget */}
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-8 py-3.5 bg-primary text-white font-semibold text-sm rounded-2xl hover:bg-primary/90 transition-all active:scale-[0.98] whitespace-nowrap shadow-[0_4px_14px_0_rgba(129,51,255,0.39)] flex items-center justify-center gap-2"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="font-headline-md text-xl font-bold">
                  Recent Performance
                </h2>
                <div className="flex items-center gap-3">
                  {/* Subject Dropdown Filter */}
                  <div className="relative">
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="appearance-none bg-surface-dim hover:bg-surface-dim/80 text-on-surface font-semibold text-xs py-2.5 pl-4 pr-10 rounded-xl border border-outline-variant/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-sans"
                    >
                      <option value="all">All Subjects</option>
                      {uniqueSubjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {formatSubject(sub)}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {selectedSubject !== "all" && (
                    <button
                      onClick={() => setSelectedSubject("all")}
                      className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl border border-primary/20 hover:border-primary/40 transition-all flex items-center justify-center animate-fade-in"
                    >
                      Clear
                    </button>
                  )}

                  <button className="text-primary font-bold text-sm hover:underline">
                    View All
                  </button>
                </div>
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
              ) : displayedExams.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-surface-dim rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-outline" />
                  </div>
                  <p className="text-on-surface-variant font-medium">
                    No exam results found for {formatSubject(selectedSubject)}.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-on-surface-variant text-xs font-bold uppercase bg-surface-dim border-b border-outline-variant/50 rounded-t-xl">
                      <tr>
                        <th className="px-6 py-4 rounded-tl-xl w-1/3">Exam</th>
                        <th className="px-6 py-4 w-1/5">Score</th>
                        <th className="px-6 py-4 w-1/5">Date</th>
                        <th className="px-6 py-4 rounded-tr-xl w-1/4 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedExams.map((exam, i) => (
                        <tr
                          key={i}
                          className="border-b border-outline-variant/30 hover:bg-surface-dim transition-colors group"
                        >
                          <td className="px-6 py-4 font-bold text-on-surface flex flex-col">
                            <span className="text-sm font-bold text-on-surface">
                              {formatSubject(getExamSubject(exam))}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
                              Mock Exam
                            </span>
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
                          <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => handleSharePerformance(exam, e)}
                              className="px-3 py-1.5 text-xs rounded-lg border bg-surface-dim/40 text-on-surface-variant hover:text-primary hover:bg-primary/10 border-outline-variant/50 font-bold flex items-center gap-1.5 transition-all outline-none"
                              title="Share score with friends"
                            >
                              <Share2 className="w-3.5 h-3.5 text-on-surface-variant/70 shrink-0" />
                              <span>Share</span>
                            </button>

                            <button
                               onClick={() => navigate(`/review/${exam.id}`)}
                              className="px-4 py-2 bg-surface-dim text-primary border border-transparent font-bold text-[13px] rounded-lg group-hover:bg-primary group-hover:text-on-primary transition-colors flex items-center gap-1"
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

      {/* Floating Study Coach */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/tutor")}
        className="fixed bottom-24 md:bottom-8 right-6 md:right-8 z-50 p-4 md:px-6 md:py-4 bg-surface text-on-surface font-bold text-sm rounded-full shadow-2xl shadow-primary/20 border border-outline-variant/60 flex items-center gap-3 group backdrop-blur-xl hover:border-primary/50 transition-all overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary group-hover:animate-pulse" />
          </div>
          <span className="hidden md:inline mr-2 tracking-wide">Study Coach</span>
        </div>
      </motion.button>

      {/* Social Media Share Modal Overlay */}
      <AnimatePresence>
        {shareModalExam && (() => {
          const modalSubjName = formatSubject(getExamSubject(shareModalExam));
          const modalPct = Math.round((shareModalExam.score / shareModalExam.total) * 100);
          const modalShareText = `I scored ${shareModalExam.score}/${shareModalExam.total} (${modalPct}%) on my ${modalSubjName} Mock Exam on AceMock! 🎯 Check out your scores or practice here:`;
          const shareUrl = window.location.origin;
          const fullMessageForCopy = `${modalShareText} ${shareUrl}`;

          return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              {/* Dismiss backdrop */}
              <div 
                className="absolute inset-0 cursor-default" 
                onClick={() => setShareModalExam(null)} 
              />

              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="bg-surface border border-outline-variant/60 rounded-3xl p-6 w-[350px] max-w-full shadow-2xl relative z-10 flex flex-col font-sans overflow-hidden"
              >
                {/* Visual top accent bar */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-primary/80 animate-pulse" />

                {/* Close Button */}
                <button
                  onClick={() => setShareModalExam(null)}
                  className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-dim rounded-full transition-colors outline-none"
                  aria-label="Close share dialog"
                >
                  <X className="w-4.5 h-4.5" />
                </button>

                {/* Title */}
                <div className="mb-5 mt-1 text-center font-sans">
                  <h3 className="text-lg font-black text-on-surface tracking-tight mb-1">
                    Share Performance
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Celebrate and inspire your schoolmates!
                  </p>
                </div>

                {/* Aesthetic visual representation card */}
                <div className="bg-gradient-to-br from-primary/10 via-surface/80 to-secondary/10 border border-outline-variant/40 rounded-2xl p-5 mb-5 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden w-full">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 blur-md animate-pulse" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full -ml-8 -mb-8 blur-md animate-pulse" style={{ animationDelay: '1s' }} />

                  {/* 80x80 Centered Score Badge */}
                  <div className="w-[80px] h-[80px] rounded-full bg-gradient-to-tr from-primary to-secondary p-[2.5px] flex items-center justify-center shadow-md shrink-0 mb-3.5 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-full opacity-25 blur-md animate-pulse" />
                    <div className="w-full h-full rounded-full bg-surface flex flex-col items-center justify-center text-center relative z-10 select-none p-1.5">
                      <span className="text-xl font-black text-on-surface tracking-tight leading-none text-center block w-full">
                        {modalPct}%
                      </span>
                      <span className="text-[9px] font-extrabold text-on-surface-variant uppercase tracking-widest mt-1 leading-none text-center block w-full">
                        Score
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-on-surface-variant/85 uppercase tracking-[0.15em] block mb-1.5">
                    {modalSubjName} MOCK EXAM
                  </span>
                  <div className="text-xs font-extrabold text-primary px-3 py-1 bg-primary/10 rounded-full mb-3.5 shadow-sm">
                    Scored {shareModalExam.score} / {shareModalExam.total} Points
                  </div>
                  <div className="text-[11px] text-on-surface/90 font-medium italic line-clamp-2 bg-surface/60 border border-outline-variant/35 rounded-lg p-2.5 max-w-full mx-auto shadow-sm leading-normal">
                    "{modalShareText}"
                  </div>
                </div>

                {/* Main Action if System Share API is available */}
                {typeof navigator !== "undefined" && !!navigator.share && (
                  <button
                    onClick={async () => {
                      try {
                        await navigator.share({
                          title: "My AceMock Result",
                          text: modalShareText,
                          url: shareUrl,
                        });
                      } catch (err) {
                        console.log("System Share cancelled or failed:", err);
                      }
                    }}
                    className="w-full mb-3.5 py-3 px-4 bg-primary text-white hover:bg-primary/95 font-bold text-xs tracking-tight rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 outline-none group"
                  >
                    <Share2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    <span>Share via Other Apps (System Share)</span>
                  </button>
                )}

                {/* Social Actions Grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  {/* WhatsApp Status / Chat */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessageForCopy)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/25 hover:bg-[#25D366]/20 transition-all text-[#128C7E] font-bold text-xs gap-1.5 shadow-sm group"
                  >
                    <svg
                      className="w-4 h-4 text-[#25D366] fill-current group-hover:scale-110 transition-transform"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12.004 0C5.378 0 .004 5.373.004 12c0 2.112.551 4.168 1.597 5.978L0 24l6.19-1.623c1.743.949 3.71 1.45 5.811 1.455 6.626 0 12-5.373 12-12 0-3.202-1.247-6.213-3.513-8.479A11.916 11.916 0 0 0 12.004 0zm0 2.054a9.888 9.888 0 0 1 7.012 2.903c1.874 1.875 2.906 4.368 2.904 7.02l-.003.01c-.001 5.426-4.417 9.84-9.913 9.84h-.008c-1.612-.001-3.2-.424-4.6-.184L3.63 22l.608-2.222-.244-.388c-.822-1.307-1.258-2.822-1.257-4.379.003-5.426 4.419-9.842 9.917-9.842v-.115zm4.646 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.62.15-.15 2.72-2.5 2.77-2.7.01-.03.01-.14-.05-.2-.06-.06-.15-.04-.22-.02-.1.02-1.61 1.02-4.54 3a8.9 8.9 0 0 1-2.9 1c-.63-.2-1.24-.4-1.85-.6-.74-.23-.93-.36-.88-.76.08-.41.53-.83 1.34-1.2h.01c4.89-2.12 8.16-3.53 9.77-4.2.49-.21.94-.31 1.31-.31.3 0 .91.16 1.25.75.14.23.22.51.24.78z" />
                    </svg>
                    <span>WhatsApp</span>
                  </a>

                  {/* Twitter / X */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(modalShareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-3 rounded-xl bg-on-surface/5 border border-outline-variant hover:bg-on-surface/10 transition-all text-on-surface font-bold text-xs gap-1.5 shadow-sm group"
                  >
                    <svg
                      className="w-4 h-4 text-on-surface fill-current group-hover:scale-110 transition-transform"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>Twitter / X</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(modalShareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-3 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/25 hover:bg-[#1877F2]/20 transition-all text-[#1877F2] font-bold text-xs gap-1.5 shadow-sm group"
                  >
                    <svg
                      className="w-4 h-4 text-[#1877F2] fill-current group-hover:scale-110 transition-transform"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </a>

                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(modalShareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-3 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/25 hover:bg-[#0088cc]/20 transition-all text-[#0088cc] font-bold text-xs gap-1.5 shadow-sm group"
                  >
                    <svg
                      className="w-4 h-4 text-[#0088cc] fill-current group-hover:scale-110 transition-transform"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.62.15-.15 2.72-2.5 2.77-2.7.01-.03.01-.14-.05-.2-.06-.06-.15-.04-.22-.02-.1.02-1.61 1.02-4.54 3a8.9 8.9 0 0 1-2.9 1c-.63-.2-1.24-.4-1.85-.6-.74-.23-.93-.36-.88-.76.08-.41.53-.83 1.34-1.2h.01c4.89-2.12 8.16-3.53 9.77-4.2.49-.21.94-.31 1.31-.31.3 0 .91.16 1.25.75.14.23.22.51.24.78z" />
                    </svg>
                    <span>Telegram</span>
                  </a>
                </div>

                {/* Copy Link Direct Clipboard Action */}
                <button
                  onClick={() => handleCopyText(fullMessageForCopy)}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs tracking-tight transition-all border flex items-center justify-center gap-1.5 ${
                    copiedToClipboard
                      ? "bg-green-500/10 border-green-500/30 text-green-600"
                      : "bg-surface-dim hover:bg-surface-dim/80 text-on-surface border-outline-variant/60"
                  }`}
                >
                  {copiedToClipboard ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600 animate-bounce" />
                      <span>Copied Score Successfully!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span>Copy Result Text to Clipboard</span>
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
