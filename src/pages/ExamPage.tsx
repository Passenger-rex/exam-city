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
  Volume2,
} from "lucide-react";
import { Logo } from "../components/Logo";

export default function ExamPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const yearParam = searchParams.get("year") || "any";
  const typeParam = searchParams.get("type") || "standard";
  const bankParam = searchParams.get("bank") || "public";
  const subjectParam = searchParams.get("subject") || "english";
  const printParam = searchParams.get("print") === "true";

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(typeParam === "micro" ? 300000 : 3600000); // 5 mins / 1 hour
  const [showGrid, setShowGrid] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // We should not use sessionStorage state restore if print is enabled, to generate a fresh one or just prevent restoring.
  const stateKey = printParam ? "offline_print_only" : `exam_state_${subjectParam}_${yearParam}_${typeParam}`;

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!printParam) {
        const savedStateStr = sessionStorage.getItem(stateKey);
        if (savedStateStr) {
          try {
            const savedState = JSON.parse(savedStateStr);
            if (savedState.questions && savedState.questions.length > 0) {
              setQuestions(savedState.questions);
              setAnswers(savedState.answers || {});
              setCurrentIndex(savedState.currentIndex || 0);
              if (savedState.timeLeft !== undefined) {
                setTimeLeft(savedState.timeLeft);
              }
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error("Failed to parse saved state", e);
          }
        }
      }

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
          if (timeLeft > 300000) setTimeLeft(300000); // 5 mins
        }

        try {
          const res = await fetch(`/api/questions?subject=${encodeURIComponent(targetSubject)}&year=${encodeURIComponent(yearParam)}&type=${encodeURIComponent(typeParam)}&bank=${encodeURIComponent(bankParam)}`);
          const text = await res.text();
          let json;
          try {
             json = JSON.parse(text);
          } catch(e) {
             const isHtml = text.trim().startsWith("<");
             if (isHtml) {
                 throw new Error(`Server configuration error (Failed to load API). Please ensure Vercel/Netlify serverless functions are configured correctly. Details: ${text.slice(0, 100)}...`);
             }
             throw new Error(`Invalid JSON from server (${res.status}): ${text.slice(0, 100)}`);
          }
          
          if (!res.ok) {
             throw new Error(json.error || "Failed to fetch questions");
          }
          if (json.success && json.data && Array.isArray(json.data)) {
            qList = json.data.map((item: any) => ({
              id: String(item.id || Math.random()),
              question_html: item.question,
              options: item.option || {a: "", b: "", c: "", d: ""},
              correct_answer: item.answer || "a",
              subject: json.subject || targetSubject,
              explanation: item.solution || "",
              year: item.examyear || yearParam,
               isPremium: bankParam === "premium",
              image: item.image || null
            }));
          }
        } catch (genErr: any) {
          console.error("Error fetching questions from API: ", genErr);
          // If the API failed explicitly, don't try database if we wanted the API
          throw new Error(genErr.message);
        }

        // Only reach here if fetch succeeded but returned no questions somehow, or DB fetch was meant to happen
        if (!qList || qList.length === 0) {
          console.log("No questions from API, trying Firestore");
          try {
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
          } catch (dbErr) {
            console.error("Error fetching from Firestore", dbErr);
          }
         }
        
        if (qList.length === 0) {
          throw new Error("We couldn't generate questions right now. The API limit might be reached or no valid GROQ_API_KEY was provided.");
        }

        setQuestions(qList);
      } catch (e: any) {
        console.error(e);
        alert("Error fetching questions: " + e.message);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [bankParam, typeParam, yearParam, subjectParam, stateKey]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    if (!printParam) {
       sessionStorage.setItem(stateKey, JSON.stringify({
         questions,
         answers,
         currentIndex,
         timeLeft
       }));
    } else {
       // It's print mode. Wait a bit for DOM to render then trigger print
       setTimeout(() => {
          window.print();
       }, 500);
    }
  }, [questions, answers, currentIndex, timeLeft, stateKey, loading, printParam]);

  // Audio Cleanup
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [currentIndex]);

  // Countdown timer effect
  useEffect(() => {
    if (loading || submitting || printParam || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitting, printParam, timeLeft]);

  // Handle timer reaching zero
  useEffect(() => {
    if (timeLeft === 0 && !submitting && !loading && !printParam && questions.length > 0) {
      alert("Time is up! Submitting your exam automatically.\nGood luck!");
      handleSubmit();
    }
  }, [timeLeft, submitting, loading, printParam, questions.length]);

  const handleSelect = (optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentIndex].id]: optionKey,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    sessionStorage.removeItem(stateKey);

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

  const speakQuestion = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    
    setIsPlaying(true);
    if (!currentQ) return;
    
    let textToSpeak = "";
    
    const tempQ = document.createElement("div");
    tempQ.innerHTML = currentQ.question_text || currentQ.question_html || '';
    textToSpeak += "Question. " + (tempQ.textContent || tempQ.innerText || "") + ". ";

    Object.entries(currentQ.options || {}).forEach(([key, val]) => {
       const optText = val as string;
       const tempO = document.createElement("div");
       tempO.innerHTML = optText;
       textToSpeak += `Option ${key.toUpperCase()}. ${tempO.textContent || tempO.innerText || ""}. `;
    });

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.name.includes("Google") || v.lang === "en-US" || v.lang === "en-GB");
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }
    
    utterance.rate = 0.9;
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  if (printParam) {
    return (
       <div className="min-h-screen bg-white text-black p-10 font-serif print:p-0 print:m-0 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 pb-6 border-b-[3px] border-black relative">
             <div className="flex justify-center items-center gap-3">
               <Logo className="text-4xl !text-black" />
             </div>
             <h1 className="text-3xl font-bold uppercase tracking-[0.15em] mt-6">{subjectParam} MOCK EXAMINATION</h1>
             <p className="text-sm font-semibold uppercase tracking-widest mt-2 text-gray-800">Exam City Assessment Series</p>
             <p className="text-sm italic mt-1 text-gray-600">Year: {yearParam} • Format: {typeParam === 'micro' ? 'Micro-test' : 'Standard'}</p>
             <div className="absolute -bottom-1 left-0 right-0 h-[1px] bg-black"></div>
          </div>
          
          {/* Instructions */}
          <div className="mb-10 border border-gray-300 p-6 bg-gray-50/50 text-sm text-gray-800 leading-relaxed max-w-3xl mx-auto">
            <h4 className="font-bold mb-3 uppercase tracking-wider text-black text-center text-xs">Instructions to Candidates</h4>
            <ul className="list-disc pl-5 space-y-1.5 italic text-gray-700">
              <li>Do not open this booklet until you are told to do so.</li>
              <li>Read all instructions carefully. Answer all questions securely.</li>
              <li>Each question is followed by four options lettered A to D. Find out the correct option for each question and mark it accordingly.</li>
            </ul>
          </div>

          <div className="space-y-12">
             {questions.map((q, idx) => (
                <div key={q.id} className="break-inside-avoid">
                   <div className="flex items-start gap-4">
                     <span className="font-bold text-base min-w-[1.5rem] mt-0.5">{idx + 1}.</span>
                     <div className="flex-1">
                       <div 
                         className="mb-4 text-base leading-relaxed text-justify"
                         dangerouslySetInnerHTML={{ __html: q.question_html || q.question_text }}
                       />
                       {q.image && (
                         <div className="mb-4">
                           <img src={q.image} alt={`Graphic for question ${idx + 1}`} className="max-w-full h-auto max-h-64 rounded-md object-contain mx-auto print:mx-0" referrerPolicy="no-referrer" />
                         </div>
                       )}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
                         {Object.entries(q.options || {}).map(([key, val]: [string, any]) => (
                            <div key={key} className="flex gap-3 text-base">
                               <span className="font-bold uppercase">({key})</span>
                               <span dangerouslySetInnerHTML={{__html: val}} className="flex-1" />
                            </div>
                         ))}
                       </div>
                     </div>
                   </div>
                </div>
             ))}
          </div>
          
          <div className="mt-16 pt-8 border-t border-gray-300 text-center text-[10px] text-gray-500 uppercase tracking-widest print:break-before-auto">
            End of Examination Paper — Generate by Exam City
          </div>
       </div>
    );
  }

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
            className="lg:hidden p-2 rounded-lg bg-surface-dim text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Toggle Exam Overview"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <motion.div
            animate={
              timeLeft < 60000
                ? { scale: [1, 1.08, 1], filter: ["hue-rotate(0deg)", "hue-rotate(10deg)", "hue-rotate(0deg)"] }
                : timeLeft < 300000
                ? { scale: [1, 1.02, 1] }
                : {}
            }
            transition={{
              repeat: Infinity,
              duration: timeLeft < 60000 ? 0.5 : 2,
              ease: "easeInOut",
            }}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold font-mono text-xl md:text-2xl transition-colors duration-500 shadow-lg border-2 ${
              timeLeft < 60000
                ? "bg-error text-white border-error shadow-error/40"
                : timeLeft < 300000
                ? "bg-error/10 text-error border-error/50 shadow-error/10"
                : "bg-surface-dim text-on-surface border-outline-variant/50 shadow-black/5"
            }`}
          >
            <Clock className={`w-6 h-6 ${timeLeft < 60000 ? "animate-pulse" : ""}`} />
            {formatTime(timeLeft)}
          </motion.div>
        </div>
      </nav>

      <div className="w-full h-1 bg-surface-dim shrink-0">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>

      <main className="flex-1 flex overflow-hidden flex-col lg:flex-row relative">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto md:pb-10 pb-28">
            <div className="flex justify-between items-end mb-6 md:mb-8">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full inline-block">
                Question {currentIndex + 1}
              </h2>
              <button
                onClick={speakQuestion}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center transition-colors shadow-sm ${isPlaying ? "bg-primary text-white border-primary animate-pulse" : "border-outline-variant/50 text-on-surface hover:bg-surface-dim hover:text-primary"}`}
                aria-label={isPlaying ? "Stop Reading" : "Read Question Aloud"}
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-surface p-5 sm:p-8 md:p-10 rounded-[20px] sm:rounded-[28px] border border-outline-variant/40 shadow-sm"
            >
              <h1 
                className="text-lg sm:text-2xl md:text-3xl font-headline-md font-bold mb-6 sm:mb-8 md:mb-10 text-on-surface leading-snug prose prose-p:my-0 prose-img:max-w-full prose-img:rounded-xl break-words w-full"
                dangerouslySetInnerHTML={{ __html: currentQ?.question_html || currentQ?.question_text }}
              />

              {currentQ?.image && (
                <div className="mb-6 sm:mb-8 md:mb-10 w-full flex justify-center bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-outline-variant/30 shadow-sm">
                  <img 
                    src={currentQ.image} 
                    alt="Question Graphic" 
                    className="max-w-full h-auto max-h-[24rem] object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="space-y-3 sm:space-y-4">
                {Object.entries(currentQ?.options || {}).map(
                  ([key, val]: [string, any]) => {
                    const isSelected = answers[currentQ.id] === key;
                    return (
                      <label
                        key={key}
                        className={`w-full text-left p-4 sm:p-5 md:p-6 flex gap-3 sm:gap-4 lg:gap-5 items-start rounded-xl sm:rounded-2xl border-2 transition-all group cursor-pointer ${isSelected ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-outline-variant/40 hover:bg-surface-dim hover:border-outline-variant/80 bg-surface"}`}
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
                          className={`mt-0.5 sm:mt-1 shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-colors font-bold text-xs sm:text-sm ${isSelected ? "border-primary bg-primary text-white" : "border-outline-variant text-on-surface-variant group-hover:border-outline"}`}
                        >
                          {isSelected ? (
                             <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          ) : (
                             key.toUpperCase()
                          )}
                        </div>
                        <div
                          className={`text-[15px] sm:text-base md:text-lg font-medium prose prose-p:my-0 flex-1 min-w-0 break-words w-full ${isSelected ? "font-bold text-primary" : "text-on-surface"}`}
                          dangerouslySetInnerHTML={{ __html: val }}
                        />
                      </label>
                    );
                  },
                )}
              </div>
            </motion.div>

            <div className="mt-6 sm:mt-8 flex justify-between items-center gap-3">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 sm:px-6 py-3 sm:py-3.5 font-bold text-on-surface hover:bg-surface border border-outline-variant/50 rounded-2xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> <span className="hidden sm:inline">Back</span>
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      Math.min(questions.length - 1, prev + 1),
                    )
                  }
                  className="flex-1 sm:flex-none justify-center px-6 sm:px-8 py-3 sm:py-3.5 bg-on-surface text-surface font-bold rounded-2xl hover:bg-on-surface/90 transition-all active:scale-95 shadow-lg shadow-on-surface/20 flex items-center gap-2"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 sm:flex-none justify-center px-6 sm:px-8 py-3 sm:py-3.5 bg-primary text-on-primary font-bold rounded-2xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  {submitting ? "Submitting..." : "Submit Exam"} <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Nav (Desktop) / Mobile Drawer */}
        <div 
          className={`shrink-0 w-80 lg:w-96 bg-surface border-l border-outline-variant/30 flex flex-col transition-transform duration-300 lg:translate-x-0 absolute lg:relative right-0 top-0 h-full z-40 ${showGrid ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'}`}
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
              className="lg:hidden p-2 bg-surface-dim rounded-full text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
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
                    if(window.innerWidth < 1024) setShowGrid(false);
                  }}
                  aria-label={`Go to question ${idx + 1}`}
                  className={`w-full aspect-square rounded-xl font-bold text-sm lg:text-base flex items-center justify-center transition-all ${
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
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
        />
      )}
    </div>
  );
}
