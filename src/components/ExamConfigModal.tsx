import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lock, Play, Layers, Search, Zap, ChevronDown, Check } from "lucide-react";
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
  
  const [subject, setSubject] = useState<string>("Mathematics");
  const [topic, setTopic] = useState<string>("");
  const [strictMode, setStrictMode] = useState<boolean>(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [searchSubject, setSearchSubject] = useState("");
  
  const [years, setYears] = useState<number[]>([]);

  const subjectsList = [
    "Accounting", "Agricultural Science", "Basic Science", "Basic Technology", 
    "Biology", "Business Studies", "Chemistry", "Civic Education", "Commerce", 
    "Computer Studies", "CRK", "Current Affairs", "Economics", "English", 
    "English Literature", "Fine Art", "French", "Further Mathematics", 
    "Geography", "Government", "Hausa", "History", "Home Economics", "Igbo",
    "Insurance", "IRK", "Mathematics", "Music", "Physical Education", 
    "Physics", "Technical Drawing", "Yoruba"
  ];

  useEffect(() => {
    if (isOpen) {
      const generatedYears = Array.from({ length: 2026 - 1979 + 1 }, (_, i) => 2026 - i);
      setYears(generatedYears);
      setSearchSubject("");
      setIsSubjectDropdownOpen(false);
    }
  }, [isOpen]);

  const handleStartExam = async () => {
    if (bankType === "premium" && userTier === "free") {
      navigate("/checkout");
      return;
    }
    if (userTier === "free" && testsTakenThisMonth >= 2) {
      navigate("/checkout");
      return;
    }
    
    let url = `/exam?subject=${subject}&year=${selectedYear}&type=${examType}&bank=${bankType}`;
    if (topic.trim()) url += `&topic=${encodeURIComponent(topic.trim())}`;
    if (strictMode) url += `&strict=true`;
    
    navigate(url);
  };

  if (!isOpen) return null;
  
  const filteredSubjects = subjectsList.filter(s => s.toLowerCase().includes(searchSubject.toLowerCase()));
  const showPremiumGate = bankType === "premium" && userTier === "free";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: "100%", scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: "100%", scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-surface w-full sm:max-w-[600px] md:max-w-[720px] max-h-[85dvh] flex flex-col relative rounded-t-[1.5rem] sm:rounded-3xl shadow-2xl overflow-hidden font-sans"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 md:p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface shrink-0">
          <div>
            <h2 className="text-xl font-bold text-on-surface tracking-tight">Exam Setup</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-surface-dim hover:bg-surface-container rounded-full transition-colors active:scale-95"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar p-4 sm:p-5 md:p-6 space-y-6 md:space-y-8">
          
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Subject Dropdown */}
            <div className="space-y-2 relative">
              <label className="text-sm font-bold text-on-surface">Subject</label>
              <button
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                className="w-full flex items-center justify-between p-3 bg-surface-dim border border-outline-variant/60 rounded-xl active:bg-surface-container-high transition-colors text-sm"
              >
                <span className="font-bold capitalize text-on-surface">{subject}</span>
                <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${isSubjectDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              <AnimatePresence>
                {isSubjectDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-surface border border-outline-variant/60 rounded-xl shadow-xl z-20 overflow-hidden flex flex-col"
                  >
                    <div className="p-2 border-b border-outline-variant/30 flex items-center gap-2 bg-surface">
                      <Search className="w-4 h-4 text-on-surface-variant shrink-0 ml-1" />
                      <input 
                        type="text" 
                        placeholder="Search subject..."
                        value={searchSubject}
                        onChange={(e) => setSearchSubject(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-on-surface-variant/60 py-1"
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                      {filteredSubjects.length > 0 ? filteredSubjects.map(s => (
                        <button
                          key={s}
                          onClick={() => { setSubject(s); setIsSubjectDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium capitalize text-left transition-colors ${subject === s ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-dim"}`}
                        >
                          {s}
                          {subject === s && <Check className="w-4 h-4" />}
                        </button>
                      )) : (
                        <div className="p-4 text-center text-sm text-on-surface-variant">No subjects found</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Target Year */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface">Target Year</label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full p-3 bg-surface-dim border border-outline-variant/60 rounded-xl outline-none text-on-surface font-semibold text-sm appearance-none pr-10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                >
                  <option value="any">Mixed</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant flex items-center justify-center">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Target Topic */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface">Specific Topic <span className="text-on-surface-variant font-normal text-xs">(Optional)</span></label>
            <input 
              type="text" 
              placeholder="e.g. Algebra, Organic Chemistry"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 bg-surface-dim border border-outline-variant/60 rounded-xl outline-none placeholder:text-on-surface-variant/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Exam Mode */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface">Exam Mode & Strict Rules</label>
              <div className="grid grid-cols-1 gap-2 p-1.5 bg-surface-dim rounded-xl border border-outline-variant/40">
                <button
                  onClick={() => setExamType("standard")}
                  className={`flex flex-col items-start p-3 rounded-lg transition-all ${examType === "standard" ? "bg-surface shadow-sm text-on-surface border border-outline-variant/60" : "text-on-surface-variant hover:text-on-surface border border-transparent"}`}
                >
                  <span className="text-sm font-bold mb-0.5">Standard</span>
                  <span className="text-[11px] font-medium opacity-80">40 Questions</span>
                </button>
                <button
                  onClick={() => setExamType("micro")}
                  className={`flex flex-col items-start p-3 rounded-lg transition-all ${examType === "micro" ? "bg-surface shadow-sm text-on-surface border border-outline-variant/60" : "text-on-surface-variant hover:text-on-surface border border-transparent"}`}
                >
                  <span className="text-sm font-bold mb-0.5">Micro</span>
                  <span className="text-[11px] font-medium opacity-80">5 Questions</span>
                </button>
                
                <div className="pt-2 mt-1 border-t border-outline-variant/30 px-1 pb-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${strictMode ? "bg-red-500 border-red-500" : "border-outline-variant group-hover:border-outline"}`}>
                      {strictMode && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={strictMode} onChange={(e) => setStrictMode(e.target.checked)} />
                    <div>
                      <div className="text-sm font-bold text-on-surface">Strict Mode</div>
                      <div className="text-[10px] text-on-surface-variant font-medium leading-tight mt-0.5">Auto-submits if you switch tabs</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Question Bank Cards */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface">Question Source</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setBankType("public")}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${bankType === "public" ? "border-emerald-500 bg-emerald-50" : "border-outline-variant/40 bg-surface hover:bg-surface-dim"}`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${bankType === "public" ? "bg-emerald-100 text-emerald-600" : "bg-surface-dim text-on-surface-variant"}`}>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${bankType === "public" ? "text-emerald-900" : "text-on-surface"}`}>Standard</div>
                    <div className={`text-[11px] mt-0.5 font-medium ${bankType === "public" ? "text-emerald-700/80" : "text-on-surface-variant"}`}>JAMB Past Questions</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setBankType("premium")}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all relative overflow-hidden ${bankType === "premium" ? "border-amber-500 bg-amber-50" : "border-outline-variant/40 bg-surface hover:bg-surface-dim"}`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${bankType === "premium" ? "bg-amber-100 text-amber-600" : "bg-amber-50 text-amber-600/60"}`}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-sm font-bold flex items-center gap-1.5 ${bankType === "premium" ? "text-amber-900" : "text-on-surface"}`}>
                      Premium
                    </div>
                    <div className={`text-[11px] mt-0.5 font-medium ${bankType === "premium" ? "text-amber-700/80" : "text-on-surface-variant"}`}>Generative mock exams</div>
                  </div>
                  {userTier === "free" && (
                    <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[9px] uppercase font-bold px-2 py-0.5 rounded-bl-lg">
                      PRO
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 md:p-6 bg-surface border-t border-outline-variant/30 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] pb-safe rounded-b-[1.5rem] sm:rounded-b-3xl">
          {showPremiumGate && (
            <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-semibold text-amber-900">Upgrade to Pro to unlock AI Predictive Mode.</span>
            </div>
          )}
          {userTier === "free" && testsTakenThisMonth >= 2 && !showPremiumGate && (
            <div className="mb-3 px-3 py-2 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-error shrink-0" />
              <span className="text-xs font-semibold text-error">Free limit (2/month) reached.</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={handleStartExam}
              className={`w-full py-3.5 text-[15px] font-bold rounded-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-sm ${
                showPremiumGate || (userTier === "free" && testsTakenThisMonth >= 2)
                  ? "bg-on-surface text-surface hover:bg-on-surface/90" 
                  : "bg-primary text-on-primary hover:bg-primary/90 shadow-primary/25" 
              }`}
            >
              {showPremiumGate || (userTier === "free" && testsTakenThisMonth >= 2) ? (
                <>Unlock Access</>
              ) : (
                <><Play className="w-4 h-4 fill-current" /> Initialize Exam</>
              )}
            </button>
            
            {((userTier === "pro") || (userTier === "free" && localStorage.getItem('hasUsedFreePdf') !== 'true')) && !showPremiumGate && (
              <button
                onClick={() => {
                   if (userTier === "free") {
                      localStorage.setItem('hasUsedFreePdf', 'true');
                   }
                   navigate(`/exam?subject=${subject}&year=${selectedYear}&type=${examType}&bank=${bankType}&print=true`);
                }}
                className="w-full py-2 text-[13px] font-semibold text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center gap-1.5"
              >
                Generate Offline PDF {userTier === "free" && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold ml-1">1 Free Trial</span>}
              </button>
            )}

            {!showPremiumGate && userTier === "free" && testsTakenThisMonth < 2 && (
              <p className="text-[11px] text-center text-on-surface-variant font-medium">
                {2 - testsTakenThisMonth} free attempt{2 - testsTakenThisMonth !== 1 && 's'} remaining this month
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}


