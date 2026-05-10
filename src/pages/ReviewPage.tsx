import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Target,
  Award,
  Play,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { motion } from "motion/react";

export default function ReviewPage() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const fetchData = async () => {
          try {
            if (!resultId) return;
            const resultDoc = await getDoc(doc(db, "exam_results", resultId));
            if (resultDoc.exists()) {
              const data = resultDoc.data();
              setResult(data);
              
              if (data.questions && Array.isArray(data.questions)) {
                // If questions are saved directly in the result (ALOC API approach)
                setQuestions(data.questions);
              } else {
                // Fallback to DB questions mapping (old approach)
                const snapshot = await getDocs(collection(db, "questions"));
                const qList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                if (data.answers) {
                  const answeredIds = Object.keys(data.answers);
                  const answeredQs = qList.filter((q) => answeredIds.includes(q.id));
                  setQuestions(answeredQs);
                } else {
                  setQuestions(qList);
                }
              }
            } else {
               setResult(null);
            }
          } catch (e: any) {
            console.error(e);
            alert("Error fetching review data: " + e.message);
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      } else {
        // Not logged in, stop loading and show not found
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dim flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-surface-dim flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-2xl font-bold font-headline-md mb-4 text-on-surface">
          Result not found
        </h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-primary font-bold hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const scorePercentage = Math.round((result.score / result.total) * 100);

  return (
    <div className="min-h-screen bg-surface-dim font-body-md text-on-surface">
      <nav className="bg-surface px-6 py-4 shadow-sm border-b border-outline-variant/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 hover:bg-surface-dim group rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
          </button>
          <Logo />
          <div className="w-10"></div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface p-10 rounded-[32px] border border-outline-variant/50 shadow-sm flex flex-col md:flex-row items-center gap-10 mb-12"
        >
          <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-outline-variant/30"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className={`${scorePercentage >= 80 ? "text-green-500" : scorePercentage >= 60 ? "text-yellow-500" : "text-red-500"} transition-all duration-1000 ease-out`}
                strokeDasharray="${scorePercentage * 2.82} 282"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-5xl font-extrabold font-headline-md tracking-tight">
                {scorePercentage}%
              </p>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                Score
              </p>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-extrabold font-headline-lg mb-2">
              Exam Review
            </h1>
            <p className="text-lg text-on-surface-variant mb-6 font-medium">
              You got {result.score} out of {result.total} questions correct.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <button
                onClick={() => navigate("/exam")}
                className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-sm inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> Try Again
              </button>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold font-headline-md mb-6">
            Detailed Breakdown
          </h2>

          {questions.map((q, idx) => {
            const userAnswer = result.answers?.[q.id];
            const isCorrect = userAnswer === q.correct_answer;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-surface p-8 rounded-[32px] border border-outline-variant/50 shadow-sm bento-card"
              >
                <div className="flex gap-4 items-start mb-6">
                  <div
                    className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white mt-1 ${isCorrect ? "bg-green-500 shadow-lg shadow-green-500/20" : "bg-red-500 shadow-lg shadow-red-500/20"}`}
                  >
                    {idx + 1}
                  </div>
                  <h3 
                    className="text-xl font-bold font-headline-md leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: q.question_html || q.question_text }}
                  />
                </div>

                <div className="space-y-3 pl-12">
                  {Object.entries(q.options || {}).map(
                    ([key, val]: [string, any]) => {
                      const isUserChoice = userAnswer === key;
                      const isActualCorrect = q.correct_answer === key;

                      let bgClass = "bg-surface border-outline-variant/50";
                      let textClass = "text-on-surface";
                      if (isActualCorrect) {
                        bgClass = "bg-green-500/10 border-green-500";
                        textClass = "text-green-700 font-bold";
                      } else if (isUserChoice && !isActualCorrect) {
                        bgClass = "bg-red-500/10 border-red-500";
                        textClass = "text-red-700 font-bold";
                      }

                      return (
                        <div
                          key={key}
                          className={`p-4 rounded-2xl border-2 flex justify-between items-center ${bgClass}`}
                        >
                          <span 
                            className={`text-lg font-medium ${textClass}`}
                            dangerouslySetInnerHTML={{ __html: val }}
                          />
                          {isActualCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                          {isUserChoice && !isActualCorrect && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      );
                    },
                  )}
                </div>

                {q.explanation && (
                  <div className="mt-8 pl-12">
                    <div
                      className={`p-6 rounded-2xl border-l-4 ${isCorrect ? "bg-green-500/5 border-green-500" : "bg-surface-dim border-primary"}`}
                    >
                      <h4 className="font-bold text-sm uppercase tracking-wider mb-2 text-on-surface flex items-center gap-2">
                        Explanation
                      </h4>
                      <div 
                        className="text-on-surface-variant font-medium text-lg leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: q.explanation }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
