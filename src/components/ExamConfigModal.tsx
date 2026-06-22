import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lock, Key, Play, Layers, Search, Zap, ChevronDown, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CurriculumManager } from "../utils/CurriculumManager";
import { db, auth } from "../firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

interface ExamConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  userTier: "free" | "pro";
  testsTakenThisMonth: number;
  isDemo?: boolean;
}

export function ExamConfigModal({
  isOpen,
  onClose,
  userTier,
  testsTakenThisMonth,
  isDemo = false,
}: ExamConfigModalProps) {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<string>("any");
  const [examType, setExamType] = useState<"standard" | "micro">("standard");
  const [bankType, setBankType] = useState<"public" | "premium">("public");
  
  const [subject, setSubject] = useState<string>("Mathematics");
  const [topic, setTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("standard");
  const [examBoard, setExamBoard] = useState<string>("any");
  const [strictMode, setStrictMode] = useState<boolean>(false);
  const [includePdfAnswers, setIncludePdfAnswers] = useState<boolean>(false);

  const EXAM_BOARDS = [
    { value: "any", label: "Mixed Boards" },
    { value: "WAEC", label: "WAEC (West African Exams)" },
    { value: "JAMB", label: "JAMB (UTME CBT Practice)" },
    { value: "NECO", label: "NECO (National Exams)" },
    { value: "NABTEB", label: "NABTEB (Technical Board)" },
    { value: "Post-UTME", label: "Post-UTME Screening" },
    { value: "SAT", label: "SAT (College Board)" },
    { value: "IELTS", label: "IELTS Exam Practice" },
    { value: "TOEFL", label: "TOEFL Exam Practice" }
  ];
  
  const [dynamicTopics, setDynamicTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(false);
  const [curriculumScope, setCurriculumScope] = useState<string>("");
  const [curriculumDifficulty, setCurriculumDifficulty] = useState<string>("");
  
  const [years, setYears] = useState<number[]>([]);

  const SECONDARY_SUBJECTS = [
    "Agricultural Science", "Basic Science", "Basic Technology", "Civic Education", "Commerce", "CRK", 
    "IRK", "Business Studies", "Current Affairs", "Physical Education", "Technical Drawing", "Home Economics", 
    "Fine Art", "Insurance"
  ];

  const DUAL_PURPOSE_SUBJECTS = [
    "Accounting", "Biology", "Chemistry", "Economics", "English", "English Literature", 
    "French", "Further Mathematics", "Geography", "Hausa", "History", "Igbo", "Mathematics", 
    "Physics", "Yoruba"
  ];

  const PRE_CLINICAL_SUBJECTS = [
    "Anatomy", "Anatomy: Extremities (Locomotor)", "Medical Biochemistry", "Medical Histology", 
    "Embryology", "Neuroanatomy", "Physiology"
  ];

  const CLINICAL_PATH_SUBJECTS = [
    "Pharmacology", "Pathology", "Medical Microbiology", "Hematology", "Medical Parasitology", 
    "Clinical Biochemistry", "Clinical Immunology"
  ];

  const CLINICAL_MID_SUBJECTS = [
    "Pediatrics", "Obstetrics and Gynecology", "Community Medicine"
  ];

  const CLINICAL_SENIOR_SUBJECTS = [
    "Medicine", "Internal Medicine", "Surgery", "Psychiatry", "Radiology", "ENT", "Ophthalmology", "Dermatology"
  ];

  const ENGINEERING_SUBJECTS = [
    "Chemical Engineering", "Civil Engineering", "Computer Engineering", "Electrical Engineering", 
    "Mechanical Engineering", "Petroleum Engineering", "Fluid Mechanics", "Thermodynamics", "Strength of Materials", 
    "Structural Engineering"
  ];

  const SCIENCE_SUBJECTS = [
    "Biochemistry", "Biotechnology", "Botany", "Genetics", "Geology", "Geophysics", "Meteorology", 
    "Microbiology", "Molecular Biology", "Statistics", "Food Science", "Zoology"
  ];

  const getDifficultyLevelsForSubject = (subj: string) => {
    if (SECONDARY_SUBJECTS.includes(subj)) {
      return [{ value: "standard", label: "Standard (WAEC/JAMB/NECO)" }];
    }
    if (DUAL_PURPOSE_SUBJECTS.includes(subj)) {
      return [
        { value: "standard", label: "Standard (WAEC/JAMB/NECO)" },
        { value: "100_sci", label: "100 Level (Intro University)" },
        { value: "200_sci", label: "200 Level (Foundational Core)" },
        { value: "300_sci", label: "300 Level (Intermediate Theory)" },
        { value: "400_sci", label: "400 Level (Advanced Seminar/Thesis)" },
        { value: "postgrad", label: "Postgraduate (MSc/PhD)" },
        { value: "professional", label: "Professional / Chartered Specialist" }
      ];
    }
    if (PRE_CLINICAL_SUBJECTS.includes(subj)) {
      return [
        { value: "200", label: "200 Level (Pre-Clinical Year 1)" },
        { value: "300", label: "300 Level (Pre-Clinical Year 2)" },
        { value: "400", label: "400 Level (Clinical Year 1 / B.Sc Final)" },
        { value: "postgrad", label: "Postgraduate (MSc/PhD)" },
        { value: "professional", label: "Professional Body/Primary Fellowship" }
      ];
    }
    if (CLINICAL_PATH_SUBJECTS.includes(subj)) {
      return [
        { value: "400", label: "400 Level (Clinical Year 1 / Lab Medicine)" },
        { value: "postgrad", label: "Postgraduate (MSc/PhD)" },
        { value: "professional", label: "Professional Fellowship (Part I)" }
      ];
    }
    if (CLINICAL_MID_SUBJECTS.includes(subj)) {
      return [
        { value: "500", label: "500 Level (Clinical Year 2 / Specialties)" },
        { value: "postgrad", label: "Postgraduate (MPH/MSc/PhD)" },
        { value: "professional", label: "Professional Fellowship (Part II)" }
      ];
    }
    if (CLINICAL_SENIOR_SUBJECTS.includes(subj)) {
      return [
        { value: "600", label: "600 Level (Clinical Year 3 / Senior Clerkship)" },
        { value: "postgrad", label: "Postgraduate Residence / Research PhD" },
        { value: "professional", label: "Professional Board Specialty Fellowship" }
      ];
    }
    if (ENGINEERING_SUBJECTS.includes(subj)) {
      return [
        { value: "200_eng", label: "200 Level (Foundational Engineering)" },
        { value: "300_eng", label: "300 Level (Core Engineering Design)" },
        { value: "400_eng", label: "400 Level (Advanced Systems & SIWES)" },
        { value: "500_eng", label: "500 Level (Senior Projects & Electives)" },
        { value: "postgrad", label: "Postgraduate (MEng/PhD)" },
        { value: "professional", label: "Professional Practice (COREN/NSE)" }
      ];
    }
    if (SCIENCE_SUBJECTS.includes(subj)) {
      return [
        { value: "100_sci", label: "100 Level (General Science)" },
        { value: "200_sci", label: "200 Level (Foundational Science)" },
        { value: "300_sci", label: "300 Level (Intermediate Lab & Theory)" },
        { value: "400_sci", label: "400 Level (Advanced Seminar & Research)" },
        { value: "postgrad", label: "Postgraduate (MSc/PhD)" },
        { value: "professional", label: "Professional Specialist / Laboratory Fellow" }
      ];
    }
    
    // Default fallback list
    return [
      { value: "standard", label: "Standard" },
      { value: "undergrad", label: "100 - 300 Level (Undergrad)" },
      { value: "advanced", label: "400 - 600 Level (Advanced/Clinical)" },
      { value: "postgrad", label: "Postgraduate (MSc/PhD)" },
      { value: "professional", label: "Professional / Board Specialist" }
    ];
  };

  useEffect(() => {
    // Reset topic when subject changes to prevent carry-over
    setTopic("");
    const availableLevels = getDifficultyLevelsForSubject(subject);
    if (availableLevels.length > 0) {
      const hasCurrentLevel = availableLevels.some(l => l.value === difficulty);
      if (!hasCurrentLevel) {
        setDifficulty(availableLevels[0].value);
      }
    }
  }, [subject]);

  useEffect(() => {
    let isMounted = true;
    
    // Set immediate synchronous fallback/initial metadata so there is no delay
    const initialMeta = CurriculumManager.getCurriculumMetadata(subject, difficulty);
    setCurriculumScope(initialMeta.scope);
    setCurriculumDifficulty(initialMeta.difficultyRating);
    setDynamicTopics(CurriculumManager.getSubTopics(subject, difficulty));

    const fetchDynamicTopics = async () => {
      setIsLoadingTopics(true);
      try {
        // Query Firestore collection "curriculums" for the chosen subject to support live admin edits
        const q = query(collection(db, "curriculums"), where("name", "==", subject));
        const snap = await getDocs(q);
        
        if (!snap.empty && isMounted) {
          const docData = snap.docs[0].data();
          const levelTopics = docData.topicsByLevel?.[difficulty] || docData.topics;
          if (Array.isArray(levelTopics) && levelTopics.length > 0) {
            setDynamicTopics(levelTopics);
            const initialMeta = CurriculumManager.getCurriculumMetadata(subject, difficulty);
            setCurriculumScope(initialMeta.scope);
            setCurriculumDifficulty(initialMeta.difficultyRating);
            setIsLoadingTopics(false);
            return;
          }
        }

        // Fallback to API if not in Firestore
        const response = await fetch(`/api/curriculum-topics?subject=${encodeURIComponent(subject)}&level=${difficulty}`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        if (isMounted) {
          if (data && data.success && Array.isArray(data.topics) && data.topics.length > 0) {
            setDynamicTopics(data.topics);
            if (data.scope) setCurriculumScope(data.scope);
            if (data.difficultyRating) setCurriculumDifficulty(data.difficultyRating);
          }
        }
      } catch (error: any) {
        console.info("[Curriculum Manager] Using client-sync curriculum fallback:", error?.message || error);
      } finally {
        if (isMounted) {
          setIsLoadingTopics(false);
        }
      }
    };

    fetchDynamicTopics();
    return () => {
      isMounted = false;
    };
  }, [subject, difficulty]);

  const DIFFICULTY_LEVELS = getDifficultyLevelsForSubject(subject);

  const [subjectsList, setSubjectsList] = useState<string[]>([
    "Biology", "Chemistry", "English", "Mathematics", "Physics"
  ]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const q = query(collection(db, "curriculums"), orderBy("name"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const names: string[] = [];
          snap.forEach(doc => {
            const data = doc.data();
            if (data.name) {
              const trimmedName = String(data.name).trim();
              if (trimmedName) names.push(trimmedName);
            }
          });
          // Deduplicate names to prevent React duplicate key errors in lists
          const uniqueNames = Array.from(new Set(names));
          setSubjectsList(uniqueNames);
          // if current subject is not in list, fallback to first
          if (uniqueNames.length > 0 && !uniqueNames.includes(subject)) {
             setSubject(uniqueNames[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching subjects from firebase:", err);
      }
    };
    if (isOpen) {
       fetchSubjects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const generatedYears = Array.from({ length: 2026 - 1979 + 1 }, (_, i) => 2026 - i);
      setYears(generatedYears);
    }
  }, [isOpen]);

  const isLevelPremium = (lvl: string) => {
    return ["postgrad", "professional", "400", "500", "600", "400_eng", "500_eng", "400_sci"].includes(lvl);
  };

  const guestCount = Number(localStorage.getItem('guestExamCount') || 0);
  const isGuestDemoBlocked = !auth.currentUser && guestCount >= 1;
  const isFreeLimitReached = userTier === "free" && (testsTakenThisMonth >= 2 || guestCount >= 2);
  const isBlocked = isGuestDemoBlocked || isFreeLimitReached;

  const handleStartExam = async () => {
    if (isGuestDemoBlocked) {
      navigate("/signup?fromDemo=true");
      onClose();
      return;
    }

    if (isFreeLimitReached) {
      navigate("/checkout");
      onClose();
      return;
    }

    const isCurrentLevelPremium = isLevelPremium(difficulty);
    if ((bankType === "premium" || isCurrentLevelPremium) && userTier === "free") {
      navigate("/checkout");
      return;
    }
    
    // Clear demo result before starting a new one to prevent conflicts
    sessionStorage.removeItem("demoResult");
    
    let url = `/exam?subject=${subject}&year=${selectedYear}&type=${examType}&bank=${bankType}`;
    if (topic.trim()) url += `&topic=${encodeURIComponent(topic.trim())}`;
    if (difficulty !== "standard") url += `&level=${difficulty}`;
    if (strictMode) url += `&strict=true`;
    if (examBoard !== "any") url += `&board=${encodeURIComponent(examBoard)}`;
    
    navigate(url);
  };

  const isCurrentLevelPremium = isLevelPremium(difficulty);
  const showPremiumGate = (bankType === "premium" || isCurrentLevelPremium) && userTier === "free";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-surface w-full sm:max-w-[600px] md:max-w-[680px] max-h-[90vh] flex flex-col relative rounded-[32px] shadow-2xl overflow-hidden font-sans border border-outline-variant/30"
          >
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface/80 backdrop-blur-xl shrink-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-on-surface tracking-tight font-headline-md flex items-center gap-2">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              Exam Setup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-surface-dim hover:bg-surface-container rounded-full transition-all active:scale-90 border border-outline-variant/20 text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar p-4 sm:p-5 md:p-6 space-y-6 md:space-y-8">
          
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Subject Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface">Subject</label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 bg-surface-dim border border-outline-variant/60 rounded-xl outline-none text-on-surface font-semibold text-sm appearance-none pr-10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                >
                  {subjectsList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant flex items-center justify-center">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
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
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface">Specific Topic <span className="text-on-surface-variant font-normal text-xs">(Optional)</span></label>
              <input 
                type="text" 
                placeholder="e.g. Algebra, Organic Chemistry"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-3 bg-surface-dim border border-outline-variant/60 rounded-xl outline-none placeholder:text-on-surface-variant/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium text-sm"
              />
              {isLoadingTopics ? (
                <div className="mt-2 text-left">
                  <div className="text-[10px] font-extrabold text-on-surface-variant/85 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    Fetching dynamic curriculum topics for {subject}...
                  </div>
                </div>
              ) : (
                dynamicTopics && dynamicTopics.length > 0 && (
                  <div className="mt-2 text-left">
                    <div className="text-[10px] font-extrabold text-on-surface-variant/85 uppercase tracking-wider mb-1.5">
                      Suggested Curriculum Topics for {subject}:
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
                      {Array.from(new Set(dynamicTopics || [])).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTopic(t)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            topic === t 
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-surface-dim hover:bg-surface-container text-on-surface border-outline-variant/50"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  Academic Level / Year of Study
                </label>
              </div>
              
              <div className="relative">
                <select 
                  className={`w-full p-3.5 bg-surface-dim border rounded-xl appearance-none outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-bold text-sm cursor-pointer pr-10 ${
                    isCurrentLevelPremium && userTier === "free" 
                      ? "border-amber-500/50 text-amber-900 dark:text-amber-200" 
                      : "border-outline-variant/60 text-on-surface"
                  }`}
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value);
                    setTopic("");
                  }}
                >
                  {DIFFICULTY_LEVELS.map((level) => {
                    const isPremium = isLevelPremium(level.value);
                    const isLocked = isPremium && userTier === "free";
                    const prefix = isLocked ? "🔒 " : isPremium ? "✨ " : "";
                    return (
                      <option 
                        key={level.value} 
                        value={level.value}
                        className="bg-surface text-on-surface font-semibold py-2"
                      >
                        {prefix}{level.label}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                  {isCurrentLevelPremium && userTier === "free" ? (
                    <Lock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  ) : isCurrentLevelPremium ? (
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  ) : null}
                  <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                </div>
              </div>
            </div>
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
                  <span className="text-sm font-bold mb-0.5">Mock Exam</span>
                  <span className="text-[11px] font-medium opacity-80">40 Questions</span>
                </button>
                <button
                  onClick={() => setExamType("micro")}
                  className={`flex flex-col items-start p-3 rounded-lg transition-all ${examType === "micro" ? "bg-surface shadow-sm text-on-surface border border-outline-variant/60" : "text-on-surface-variant hover:text-on-surface border border-transparent"}`}
                >
                  <span className="text-sm font-bold mb-0.5">Quick Study</span>
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
                  </div>
                  {userTier === "free" && (
                    <div className="absolute top-2.5 right-2.5 p-1 bg-stone-950 dark:bg-stone-100 text-stone-100 dark:text-stone-950 rounded-md shadow-sm">
                      <Key className="w-3 h-3" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 md:p-6 bg-surface border-t border-outline-variant/30 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] pb-safe rounded-b-[1.5rem] sm:rounded-b-3xl">
          {isGuestDemoBlocked ? (
            <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                You have completed 1 demo exam. Please create an account to take more exams or trials!
              </span>
            </div>
          ) : isFreeLimitReached ? (
            <div className="mb-3 px-3 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                Free limit (2 exams total) reached. Upgrade to Pro for unlimited access!
              </span>
            </div>
          ) : showPremiumGate ? (
            <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-semibold text-amber-900 font-medium">
                {isCurrentLevelPremium 
                  ? "Upgrade to Pro to unlock Advanced clinical, Postgraduate, and Professional modules." 
                  : "Upgrade to Pro to unlock AI Predictive Mode."}
              </span>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <button
              onClick={handleStartExam}
              className={`w-full py-3.5 text-[15px] font-bold rounded-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-sm cursor-pointer ${
                isBlocked || showPremiumGate
                  ? "bg-on-surface text-surface hover:bg-on-surface/90" 
                  : "bg-primary text-on-primary hover:bg-primary/90 shadow-primary/25" 
              }`}
            >
              {isGuestDemoBlocked ? (
                <>Create Account to Continue</>
              ) : isFreeLimitReached ? (
                <>Upgrade to Pro</>
              ) : showPremiumGate ? (
                <>Unlock Access</>
              ) : (
                <><Play className="w-4 h-4 fill-current" /> {isDemo ? "Start Demo Exam" : "Initialize Exam"}</>
              )}
            </button>
            
            {!isBlocked && !showPremiumGate && userTier === "free" && (
              <p className="text-[11px] text-center text-on-surface-variant font-medium">
                {Math.max(0, 2 - Math.max(testsTakenThisMonth, guestCount))} free attempt{Math.max(0, 2 - Math.max(testsTakenThisMonth, guestCount)) !== 1 && 's'} remaining
              </p>
            )}
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


