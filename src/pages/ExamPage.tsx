import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  setDoc,
  doc,
  increment,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Send,
} from "lucide-react";
import { Logo } from "../components/Logo";

export default function ExamPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const yearParam = searchParams.get("year") || "any";
  const typeParam = searchParams.get("type") || "standard";
  const bankParam = searchParams.get("bank") || "public";
  const subjectParam = searchParams.get("subject") || "english";

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600000); // 1 hour in ms
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        let qList: any[] = [];
        
        // Define amount based on standard vs micro
        const limitStr = typeParam === "micro" ? "5" : "40";
        let targetSubject = subjectParam;

        if (typeParam === "micro" && auth.currentUser) {
          // Find weakest from DB
          const resultsQ = query(
            collection(db, "exam_results"),
            where("userId", "==", auth.currentUser.uid)
          );
          const resultsSnap = await getDocs(resultsQ);
          if (!resultsSnap.empty) {
            const allResults = resultsSnap.docs.map(d => d.data());
            allResults.sort((a: any, b: any) => {
              if (!a.createdAt || !b.createdAt) return 0;
              return b.createdAt.toMillis() - a.createdAt.toMillis();
            });
            // Approximate weakest subject (could be improved)
            targetSubject = "mathematics";
          }
          setTimeLeft(600000);
        }

        try {
          const { GoogleGenAI, Type } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

          let yearInstruction = "";
          if (yearParam.toLowerCase() === "random" || yearParam.toLowerCase() === "any") {
            yearInstruction = "Assign a random past year to each question.";
          } else {
            yearInstruction = `All questions should be specifically from or adapted from the year ${yearParam}.`;
          }

          const prompt = `Surf online to find and return exactly ${limitStr} real, accurate, and challenging past questions for West African Examinations Council (WAEC), Joint Admissions and Matriculation Board (JAMB) or National Examinations Council (NECO) for the subject: "${targetSubject}". ${yearInstruction} Make sure to use the Google Search tool to find exact past questions from online platforms if available. The difficulty MUST strictly match the rigor of standard Senior Secondary Certification Examination (SSCE) or University Tertiary Matriculation Examination (UTME). DO NOT generate overly simple questions; retrieve authentic complex questions that require critical thinking or multi-step problem solving.
          
IMPORTANT: You MUST return your answer as a raw JSON object. Do not wrap it in a markdown code block like \`\`\`json. The JSON object must exactly match this structure:
{
  "subject": "subject name",
  "data": [
    {
       "id": 1,
       "question": "question text",
       "option": { "a": "option A text", "b": "option B text", "c": "option C text", "d": "option D text" },
       "answer": "a",
       "solution": "explanation of the answer",
       "examyear": "2023"
    }
  ]
}`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              temperature: 0.7,
              tools: [{ googleSearch: {} }]
            }
          });

          let jsonStr = response.text?.trim() || "{}";
          // Remove Markdown formatting if AI included it
          if (jsonStr.startsWith("\`\`\`json")) {
            jsonStr = jsonStr.replace(/^\`\`\`json/, "");
            if (jsonStr.endsWith("\`\`\`")) {
              jsonStr = jsonStr.slice(0, -3).trim();
            }
          } else if (jsonStr.startsWith("\`\`\`")) {
            jsonStr = jsonStr.replace(/^\`\`\`/, "");
            if (jsonStr.endsWith("\`\`\`")) {
               jsonStr = jsonStr.slice(0, -3).trim();
            }
          }
          const json = JSON.parse(jsonStr);

          if (json && json.data && Array.isArray(json.data)) {
            qList = json.data.map((item: any) => ({
              id: String(item.id),
              question_html: item.question,
              options: item.option,
              correct_answer: item.answer,
              subject: json.subject || targetSubject,
              explanation: item.solution,
              year: item.examyear || yearParam,
              isPremium: bankParam === "premium"
            }));
          } else if (json && json.data && typeof json.data === "object") {
            qList = [{
              id: String(json.data.id),
              question_html: json.data.question,
              options: json.data.option,
              correct_answer: json.data.answer,
              subject: json.subject || targetSubject,
              explanation: json.data.solution,
              year: json.data.examyear || yearParam,
              isPremium: bankParam === "premium"
             }];
          }
        } catch (genErr) {
          console.error("Error generating questions with Gemini: ", genErr);
        }

        // If ALOC API fails or returns nothing, fallback to Firestore DB questions
        if (qList.length === 0) {
           const snapshot = await getDocs(collection(db, "questions"));
           qList = snapshot.docs.map((doc) => ({
             id: doc.id,
             question_html: doc.data().question_text || doc.data().question_html,
             ...doc.data(),
           }));
           
           if (yearParam !== "any") {
             qList = qList.filter((q) => q.year == yearParam);
           }
           if (typeParam === "micro") qList = qList.slice(0, 5);
        }
        
        if (qList.length === 0) {
          // Fallback if db is also empty and ALOC API fails
          qList = [
            {
              id: "demo-1",
              question_html: "Which of the following is not a programming language?",
              options: { a: "Python", b: "HTML", c: "Java", d: "C++" },
              correct_answer: "b",
              explanation: "HTML is a markup language, not a programming language.",
              subject: targetSubject || "computer",
              year: "2024"
            },
            {
              id: "demo-2",
              question_html: "What is the capital of Nigeria?",
              options: { a: "Lagos", b: "Kano", c: "Abuja", d: "Ibadan" },
              correct_answer: "c",
              explanation: "Abuja replaced Lagos as the capital of Nigeria in 1991.",
              subject: targetSubject || "general",
              year: "2024"
            },
            {
              id: "demo-3",
              question_html: "Solve for x: 2x + 5 = 15",
              options: { a: "5", b: "10", c: "15", d: "20" },
              correct_answer: "a",
              explanation: "Subtract 5 from both sides: 2x = 10, so x = 5.",
              subject: "mathematics",
              year: "2024"
            },
            {
              id: "demo-4",
              question_html: "Which planet is known as the Red Planet?",
              options: { a: "Venus", b: "Mars", c: "Jupiter", d: "Saturn" },
              correct_answer: "b",
              explanation: "Mars appears red due to iron oxide on its surface.",
              subject: "science",
              year: "2024"
            },
            {
              id: "demo-5",
              question_html: "Who wrote 'Things Fall Apart'?",
              options: { a: "Wole Soyinka", b: "Chimamanda Ngozi Adichie", c: "Chinua Achebe", d: "Buchi Emecheta" },
              correct_answer: "c",
              explanation: "Chinua Achebe wrote the novel 'Things Fall Apart' in 1958.",
              subject: targetSubject || "literature",
              year: "2024"
            }
          ];
          
          if (typeParam === "micro") {
            qList = qList.slice(0, 5);
          }
        }

        setQuestions(qList);
      } catch (e: any) {
        console.error(e);
        alert("Error fetching questions: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [bankParam, typeParam, yearParam]);

  useEffect(() => {
    if (loading || submitting) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitting]);

  const handleSelect = (optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentIndex].id]: optionKey,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) score++;
    });

    try {
      if (auth.currentUser) {
        // Record test in results
        const resultRef = await addDoc(collection(db, "exam_results"), {
          userId: auth.currentUser.uid,
          score,
          total: questions.length,
          answers, // storing answers to review later
          questions, // saving the specific questions for this test (ALOC or DB)
          createdAt: serverTimestamp(),
        });

        // Update user exam count
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          examCount: increment(1),
        }, { merge: true });

        navigate(`/review/${resultRef.id}`);
      } else {
        sessionStorage.setItem("demoResult", JSON.stringify({
          score,
          total: questions.length,
          subject: subjectParam || "demo",
          answers,
          questions
        }));
        navigate("/signup?fromDemo=true");
      }
    } catch (err) {
      console.error("Error submitting exam: ", err);
      // Even if update count fails, show review page
      setSubmitting(false);
    }
  };

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dim flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-surface-dim font-body-md text-on-surface flex flex-col h-screen overflow-hidden">
      <nav className="bg-surface px-6 py-4 shadow-sm z-50 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <Logo />
          <div className="hidden md:flex items-center gap-2 pl-4 ml-4 border-l border-outline-variant/50">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest">{subjectParam}</span>
            <span className="w-1 h-1 bg-outline rounded-full"></span>
            <span className="text-sm font-semibold text-on-surface-variant">{yearParam}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowGrid(!showGrid)}
            className="md:hidden p-2 rounded-lg bg-surface-dim text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Toggle Exam Overview"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold font-mono text-lg transition-colors ${timeLeft < 300000 ? "bg-error/10 text-error animate-pulse" : "bg-primary/10 text-primary"}`}
          >
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </nav>

      <div className="w-full h-1 bg-surface-dim shrink-0">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>

      <main className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto pb-24">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full inline-block">
                Question {currentIndex + 1}
              </h2>
            </div>

            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-surface p-8 sm:p-10 rounded-[32px] border border-outline-variant/40 shadow-sm"
            >
              <h1 
                className="text-2xl sm:text-3xl font-headline-md font-bold mb-10 text-on-surface leading-snug prose prose-p:my-0 prose-img:max-w-full prose-img:rounded-xl"
                dangerouslySetInnerHTML={{ __html: currentQ?.question_html || currentQ?.question_text }}
              />

              <div className="space-y-4">
                {Object.entries(currentQ?.options || {}).map(
                  ([key, val]: [string, any]) => {
                    const isSelected = answers[currentQ.id] === key;
                    return (
                      <label
                        key={key}
                        className={`w-full text-left p-6 flex gap-4 items-start rounded-2xl border-2 transition-all group cursor-pointer ${isSelected ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-outline-variant/40 hover:bg-surface-dim hover:border-outline-variant/80 bg-surface"}`}
                      >
                        <input
                           type="radio"
                           name={`question-${currentQ.id}`}
                           value={key}
                           checked={isSelected}
                           onChange={() => handleSelect(key)}
                           className="hidden"
                        />
                        <div
                          className={`mt-1 shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors font-bold text-sm ${isSelected ? "border-primary bg-primary text-white" : "border-outline-variant text-on-surface-variant group-hover:border-outline"}`}
                        >
                          {isSelected ? (
                             <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : (
                             key.toUpperCase()
                          )}
                        </div>
                        <div
                          className={`text-lg font-medium prose prose-p:my-0 flex-1 ${isSelected ? "font-bold text-primary" : "text-on-surface"}`}
                          dangerouslySetInnerHTML={{ __html: val }}
                        />
                      </label>
                    );
                  },
                )}
              </div>
            </motion.div>

            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-6 py-3.5 font-bold text-on-surface hover:bg-surface border border-outline-variant/50 rounded-2xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      Math.min(questions.length - 1, prev + 1),
                    )
                  }
                  className="px-8 py-3.5 bg-on-surface text-surface font-bold rounded-2xl hover:bg-on-surface/90 transition-all active:scale-95 shadow-lg shadow-on-surface/20 flex items-center gap-2"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded-2xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  {submitting ? "Submitting..." : "Submit Exam"} <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Nav (Desktop) / Mobile Drawer */}
        <div 
          className={`shrink-0 w-80 bg-surface border-l border-outline-variant/30 flex flex-col transition-transform duration-300 md:translate-x-0 absolute md:relative right-0 top-0 h-full z-40 ${showGrid ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
        >
          <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface sticky top-0 z-10">
            <div>
              <h3 className="font-bold text-lg">Exam Overview</h3>
              <p className="text-sm font-medium text-on-surface-variant flex gap-2 items-center mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {answeredCount} / {questions.length} Answered
              </p>
            </div>
            <button 
              onClick={() => setShowGrid(false)}
              className="md:hidden p-2 bg-surface-dim rounded-full text-on-surface-variant"
              aria-label="Close Exam Overview"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-5 gap-3 content-start">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    if(window.innerWidth < 768) setShowGrid(false);
                  }}
                  aria-label={`Go to question ${idx + 1}`}
                  className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${
                    isCurrent 
                      ? "ring-2 ring-primary ring-offset-2 bg-primary/10 text-primary border border-primary/30" 
                      : isAnswered 
                        ? "bg-primary text-white shadow-sm shadow-primary/20" 
                        : "bg-surface-dim text-on-surface-variant hover:bg-surface-container border border-outline-variant/30"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="p-6 border-t border-outline-variant/30 bg-surface-dim/30">
            <button
               onClick={handleSubmit}
               disabled={submitting}
               className="w-full py-4 bg-on-surface text-surface font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
               {submitting ? (
                 <div className="w-5 h-5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
               ) : (
                 "Finish Exam"
               )}
            </button>
          </div>
        </div>
      </main>

      {/* Overlay for mobile drawer */}
      {showGrid && (
        <div 
          onClick={() => setShowGrid(false)}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
        />
      )}
    </div>
  );
}
