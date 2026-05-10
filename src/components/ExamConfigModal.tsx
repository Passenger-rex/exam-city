import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lock, Play, Layers, Search, ChevronDown, Check, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ExamConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  userTier: "free" | "pro";
  testsTakenThisMonth: number;
}

export function ExamConfigModal({
  isOpen,
  onClose,
  userTier,
  testsTakenThisMonth,
}: ExamConfigModalProps) {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<string>("any");
  const [examType, setExamType] = useState<"standard" | "micro">("standard");
  const [bankType, setBankType] = useState<"public" | "premium">("public");
  const [subject, setSubject] = useState<string>("english");
  const [searchSubject, setSearchSubject] = useState("");
  
  const [years, setYears] = useState<number[]>([]);

  const subjectsList = [
    "english", "mathematics", "commerce", "accounting", "biology",
    "physics", "chemistry", "englishlit", "government", "crk",
    "geography", "economics", "irk", "civicedu", "insurance",
    "currentaffairs", "history"
  ].sort();

  useEffect(() => {
    if (isOpen) {
      // Generate years from 2026 down to 1979
      const generatedYears = Array.from({ length: 2026 - 1979 + 1 }, (_, i) => 2026 - i);
      setYears(generatedYears);
      // Reset subject search on open
      setSearchSubject("");
    }
  }, [isOpen]);

  const handleStartExam = async () => {
    if (bankType === "premium" && userTier === "free") {
      navigate("/checkout");
      return;
    }
    if (userTier === "free" && testsTakenThisMonth >= 1) {
      navigate("/checkout");
      return;
    }
    navigate(`/exam?subject=${subject}&year=${selectedYear}&type=${examType}&bank=${bankType}`);
  };

  if (!isOpen) return null;
  
  const filteredSubjects = subjectsList.filter(s => s.toLowerCase().includes(searchSubject.toLowerCase()));
  const showPremiumGate = bankType === "premium" && userTier === "free";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-surface w-full max-w-[850px] rounded-[2rem] border border-outline-variant/30 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col md:flex-row relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden z-10 p-2 bg-surface hover:bg-surface-dim rounded-full transition-colors shadow-sm border border-outline-variant/20"
        >
          <X className="w-5 h-5 text-on-surface-variant" />
        </button>

        {/* Left column: Setup */}
        <div className="flex-[3] p-6 md:p-8 flex flex-col max-h-[85vh] overflow-hidden">
          <div className="mb-6">
            <h2 className="text-2xl font-bold font-headline-md text-on-surface tracking-tight">
              Exam Configuration
            </h2>
            <p className="text-sm border-b border-outline-variant/40 pb-4 mt-2 text-on-surface-variant">
              Customize your mock exam experience.
            </p>
          </div>

          <div className="space-y-8 overflow-y-auto pr-3 mr-[-12px] custom-scrollbar pb-6 flex-1">
            {/* Subject Selection (Enhanced) */}
            <div className="space-y-4">
              <label className="text-base font-bold text-on-surface flex items-center justify-between">
                <span>Select Subject</span>
                {subject && <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">{subject} selected</span>}
              </label>
              
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input 
                  type="text" 
                  placeholder="Search and select a subject..." 
                  value={searchSubject}
                  onChange={e => setSearchSubject(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-surface-dim border font-medium border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none transition-all placeholder:text-on-surface-variant/60"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar p-1">
                {filteredSubjects.map(s => {
                  const isSelected = subject === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all border ${
                        isSelected 
                          ? "bg-primary text-on-primary border-primary shadow-sm" 
                          : "bg-surface border-outline-variant/40 text-on-surface-variant hover:bg-surface-dim hover:border-outline-variant hover:text-on-surface"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-on-primary" : "border-outline-variant"}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-on-primary" />}
                      </div>
                      {s}
                    </button>
                  );
                })}
                {filteredSubjects.length === 0 && (
                  <div className="col-span-full py-6 text-center text-on-surface-variant font-medium text-sm border-2 border-dashed border-outline-variant/40 rounded-xl">
                    No subjects found for "{searchSubject}"
                  </div>
                )}
              </div>
            </div>

            {/* Filter by Year (Enhanced: Chips) */}
            <div className="space-y-4">
              <label className="text-base font-bold text-on-surface">
                Exam Year
              </label>
              <div className="flex overflow-x-auto pb-4 gap-2 custom-scrollbar pr-4">
                <button
                  onClick={() => setSelectedYear("any")}
                  className={`shrink-0 px-6 py-2.5 md:px-4 md:py-2 rounded-full text-base md:text-sm font-bold transition-all border ${
                    selectedYear === "any" 
                      ? "bg-primary text-on-primary border-primary shadow-sm" 
                      : "bg-surface border-outline-variant/50 text-on-surface-variant hover:border-primary/50 hover:bg-surface-dim"
                  }`}
                >
                  Any Year
                </button>
                {years.map((y) => {
                  const yStr = String(y);
                  return (
                    <button
                      key={y}
                      onClick={() => setSelectedYear(yStr)}
                      className={`shrink-0 px-6 py-2.5 md:px-4 md:py-2 rounded-full text-base md:text-sm font-bold transition-all border ${
                        selectedYear === yStr 
                          ? "bg-primary text-on-primary border-primary shadow-sm" 
                          : "bg-surface border-outline-variant/50 text-on-surface-variant hover:border-primary/50 hover:bg-surface-dim"
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exam Format & Question Bank */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Format */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-on-surface">Mode</label>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setExamType("standard")}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${examType === "standard" ? "border-primary bg-primary/5" : "border-outline-variant/30 hover:border-outline-variant"}`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${examType === "standard" ? "border-primary" : "border-outline-variant"}`}>
                      {examType === "standard" && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-on-surface">Standard</div>
                      <div className="text-xs text-on-surface-variant">Full-length 40-question test</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setExamType("micro")}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${examType === "micro" ? "border-primary bg-primary/5" : "border-outline-variant/30 hover:border-outline-variant"}`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${examType === "micro" ? "border-primary" : "border-outline-variant"}`}>
                      {examType === "micro" && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-on-surface">Micro</div>
                      <div className="text-xs text-on-surface-variant">Rapid 5-question targeted session</div>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Bank */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-on-surface">Question Bank</label>
                <div className="flex flex-col gap-2 relative">
                  <button
                    onClick={() => setBankType("public")}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${bankType === "public" ? "border-emerald-500 bg-emerald-500/5 shadow-sm" : "border-outline-variant/30 hover:border-outline-variant"}`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${bankType === "public" ? "bg-emerald-500/10 text-emerald-600" : "bg-surface-dim text-on-surface-variant"}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-on-surface">Public DB</div>
                      <div className="text-xs text-on-surface-variant">Standard previous year pool</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setBankType("premium")}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${bankType === "premium" ? "border-amber-500 bg-amber-500/5 shadow-sm" : "border-outline-variant/30 hover:border-outline-variant"}`}
                  >
                    {userTier === "free" && (
                       <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500/20 to-transparent pr-2 pl-6 py-1 rounded-bl-xl border-b border-l border-amber-500/10">
                         <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 flex items-center gap-1"><Zap className="w-3 h-3 fill-amber-600" /> PRO</span>
                       </div>
                    )}
                    <div className={`p-1.5 rounded-lg shrink-0 ${bankType === "premium" ? "bg-amber-100 text-amber-600" : "bg-amber-50 text-amber-600/50"}`}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 pr-10">
                      <div className="font-bold text-sm text-on-surface">Premium</div>
                      <div className="text-xs text-on-surface-variant">Advanced generative & predictive AI questions</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column: Summary & CTA */}
        <div className="flex-[2] bg-surface-dim p-6 md:p-8 flex flex-col border-t md:border-t-0 md:border-l border-outline-variant/30 relative max-h-[85vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-surface hover:bg-surface-container rounded-full transition-colors hidden md:block shadow-sm border border-outline-variant/20"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
          
          <div className="mt-8 md:mt-10 flex-1 flex flex-col">
            <h3 className="font-bold text-xl mb-6 text-on-surface tracking-tight">Summary</h3>
            <div className="space-y-4 mb-8">
               <div className="flex flex-col bg-surface px-4 py-3 rounded-xl border border-outline-variant/40 shadow-sm">
                 <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Subject</span>
                 <span className="text-base font-bold capitalize text-on-surface">{subject || "None"}</span>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col bg-surface px-4 py-3 rounded-xl border border-outline-variant/40 shadow-sm">
                   <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Year</span>
                   <span className="text-base font-bold text-on-surface">{selectedYear === "any" ? "Mixed" : selectedYear}</span>
                 </div>
                 <div className="flex flex-col bg-surface px-4 py-3 rounded-xl border border-outline-variant/40 shadow-sm">
                   <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Format</span>
                   <span className="text-base font-bold capitalize text-on-surface">{examType}</span>
                 </div>
               </div>
               <div className={`flex flex-col px-4 py-3 rounded-xl border shadow-sm ${bankType === "premium" ? "bg-amber-50 border-amber-200" : "bg-surface border-outline-variant/40"}`}>
                 <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${bankType === "premium" ? "text-amber-800" : "text-on-surface-variant"}`}>Question Bank</span>
                 <span className={`text-base font-bold capitalize flex items-center gap-2 ${bankType === "premium" ? "text-amber-700" : "text-on-surface"}`}>
                   {bankType === "premium" && <Lock className="w-4 h-4" />}
                   {bankType}
                 </span>
               </div>
            </div>

            <div className="mt-auto pt-6">
              {showPremiumGate && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <div className="p-1 bg-amber-100 rounded-full shrink-0">
                    <Lock className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-900 mb-1">Pro Feature requires Upgrade</div>
                    <div className="text-xs text-amber-800/80 font-medium">You need an active Premium subscription to access this Question Bank.</div>
                  </div>
                </div>
              )}
              {userTier === "free" && testsTakenThisMonth >= 1 && !showPremiumGate && (
                <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3">
                  <div className="p-1 bg-error/20 rounded-full shrink-0">
                    <Lock className="w-4 h-4 text-error" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-error mb-1">Monthly Limit Reached</div>
                    <div className="text-xs text-error/80 font-medium">You've reached your free 1 mock exam limit.</div>
                  </div>
                </div>
              )}

              <button
                onClick={handleStartExam}
                className={`w-full py-4 font-bold text-base rounded-2xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg mb-4 ${
                  showPremiumGate || (userTier === "free" && testsTakenThisMonth >= 1)
                    ? "bg-on-surface text-surface hover:bg-on-surface/90 shadow-on-surface/20 border-2 border-on-surface" // Upgrade styling
                    : "bg-primary text-on-primary hover:bg-primary/90 shadow-primary/30" // Normal styling
                }`}
              >
                {showPremiumGate || (userTier === "free" && testsTakenThisMonth >= 1) ? (
                  <>
                    <Zap className="w-5 h-5 fill-current" />
                    Upgrade to Pro
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Start Exam Session
                  </>
                )}
              </button>
              
              {!showPremiumGate && userTier === "pro" && (
                <p className="text-xs text-center text-emerald-600 font-bold flex items-center justify-center gap-1.5 bg-emerald-50 py-2 rounded-lg border border-emerald-100">
                  <Check className="w-3 h-3" /> Pro Active
                </p>
              )}
              {!showPremiumGate && userTier === "free" && testsTakenThisMonth < 1 && (
                <p className="text-xs text-center text-on-surface-variant font-medium">
                  You have <strong className="text-on-surface">1 free exam</strong> left
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

