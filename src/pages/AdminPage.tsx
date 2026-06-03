import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query, doc, getDoc, setDoc, where, updateDoc, deleteDoc } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Upload, Database, CheckCircle2, AlertCircle, Edit2, Trash2, Check, X, Plus, Search, Sparkles, Info, LayoutGrid, Layers, RefreshCw } from "lucide-react";
import { Logo } from "../components/Logo";
import { Navbar } from "../components/Navbar";
import { useUser } from "../UserContext";
import { CurriculumManager } from "../utils/CurriculumManager";

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

export function getDifficultyLevelsForSubject(subj: string): { value: string; label: string }[] {
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
      { value: "400", label: "400 / Clinical Year 1" },
      { value: "postgrad", label: "Postgraduate (MSc/PhD)" },
      { value: "professional", label: "Professional Body/Primary Fellowship" }
    ];
  }
  if (CLINICAL_PATH_SUBJECTS.includes(subj)) {
    return [
      { value: "400", label: "400 Level (Clinical Year 1 / Lab Medicine)" },
      { value: "postgrad", label: "Postgraduate (MSc/PhD)" },
      { value: "professional", label: "Professional Body Specialty Fellowship" }
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
    { value: "standard", label: "Standard (WAEC/JAMB/NECO)" },
    { value: "undergrad", label: "100 - 300 Level (Undergrad)" },
    { value: "advanced", label: "400 - 600 Level (Advanced/Clinical)" },
    { value: "postgrad", label: "Postgraduate (MSc/PhD)" },
    { value: "professional", label: "Professional / Board Specialist" }
  ];
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notionToken, setNotionToken] = useState("");
  const [notionDbId, setNotionDbId] = useState("");
  const [curriculums, setCurriculums] = useState<{id: string, name: string, topics: string[], topicsByLevel?: Record<string, string[]>, group?: string}[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectIcon, setNewSubjectIcon] = useState("");
  const [newSubjectGroup, setNewSubjectGroup] = useState("General");
  const [newTopicName, setNewTopicName] = useState("");
  const [activeSubjectId, setActiveSubjectId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("standard");

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");
  const [editingSubjectIcon, setEditingSubjectIcon] = useState("");
  const [editingSubjectGroup, setEditingSubjectGroup] = useState("General");

  const [editingTopicId, setEditingTopicId] = useState<{subId: string, index: number} | null>(null);
  const [editingTopicName, setEditingTopicName] = useState("");

  const [verificationResults, setVerificationResults] = useState<Record<string, { verified: boolean; hasMismatches: boolean; mismatches: string[]; levelMismatches: string[] }>>({});
  const [adminTab, setAdminTab] = useState<"curriculum" | "upload" | "notion">("curriculum");
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");

  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const loadNotionSettings = async () => {
      try {
        const configRef = doc(db, "settings", "notion");
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.token) setNotionToken(data.token);
          if (data.dbId) setNotionDbId(data.dbId);
          if (data.lastSyncTime) setLastSyncTime(data.lastSyncTime.toDate());
        }
      } catch (err) {
        console.error("Error loading notion config", err);
      }
    };
    loadNotionSettings();
  }, []);

  useEffect(() => {
    setStatus("");
  }, [adminTab]);

  useEffect(() => {
    const fetchCurriculums = async () => {
      try {
        const q = query(collection(db, "curriculums"), orderBy("name"));
        const snap = await getDocs(q);
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() as any })) as any[];
        
        const defaults = CurriculumManager.getAllSubjects();
        const existingNames = new Set(data.map(c => String(c.name).toLowerCase().trim()));
        const missing = defaults.filter(sub => !existingNames.has(sub.toLowerCase().trim()));
        
        if (missing.length > 0) {
          const seededList = [...data];
          for (const sub of missing) {
            const defaultTopics = CurriculumManager.getSubTopics(sub, "standard") || [];
            const fullTopicsByLevel = CurriculumManager.getAllTopicsByLevel(sub);
            const defaultGroup = CurriculumManager.getDefaultGroup(sub);
            
            const payload = {
              name: sub,
              topics: defaultTopics,
              topicsByLevel: fullTopicsByLevel,
              group: defaultGroup,
              createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, "curriculums"), payload);
            seededList.push({ 
              id: docRef.id, 
              name: sub, 
              topics: defaultTopics, 
              topicsByLevel: fullTopicsByLevel, 
              group: defaultGroup 
            });
          }
          seededList.sort((a, b) => a.name.localeCompare(b.name));
          data = seededList;
        }

        // Deduplicate subjects by name (case-insensitive) to prevent duplicate subjects in view
        const uniqueData: any[] = [];
        const seenNames = new Set<string>();
        for (const item of data) {
          const lowerName = String(item.name || "").toLowerCase().trim();
          if (!seenNames.has(lowerName)) {
            seenNames.add(lowerName);
            uniqueData.push(item);
          }
        }
        data = uniqueData;

        setCurriculums(data);
        if (data.length > 0) {
          setActiveSubjectId(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching curriculums", err);
      }
    };
    fetchCurriculums();
  }, [db]);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    setIsUploading(true);
    try {
      const docRef = await addDoc(collection(db, "curriculums"), {
        name: newSubjectName.trim(),
        icon: newSubjectIcon.trim() || undefined,
        group: newSubjectGroup,
        topics: [],
        topicsByLevel: {},
        createdAt: serverTimestamp()
      });
      const newSubject = { id: docRef.id, name: newSubjectName.trim(), icon: newSubjectIcon.trim() || undefined, group: newSubjectGroup, topics: [], topicsByLevel: {} };
      setCurriculums([...curriculums, newSubject]);
      setActiveSubjectId(docRef.id);
      setNewSubjectName("");
      setNewSubjectIcon("");
      setNewSubjectGroup("General");
      setStatus("Subject added successfully");
    } catch (err: any) {
      setStatus("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSeedAllSubjects = async () => {
    setIsUploading(true);
    setStatus("Initiating manual full-coverage re-sync...");
    try {
      const ALL_SUBJECTS = CurriculumManager.getAllSubjects();
      const newCurriculums = [...curriculums];
      
      for (const sub of ALL_SUBJECTS) {
         const existing = newCurriculums.find(c => c.name.toLowerCase() === sub.toLowerCase());
         const defaultTopics = CurriculumManager.getSubTopics(sub, "standard") || [];
         const fullTopicsByLevel = CurriculumManager.getAllTopicsByLevel(sub);
         const defaultGroup = CurriculumManager.getDefaultGroup(sub);
         
         const payload: any = {
            name: sub,
            topics: defaultTopics,
            topicsByLevel: fullTopicsByLevel,
            createdAt: serverTimestamp()
         };
         
         if (!existing || !existing.group) {
            payload.group = defaultGroup;
         }
         
         if (existing) {
            await setDoc(doc(db, "curriculums", existing.id), payload, { merge: true });
            const idx = newCurriculums.findIndex(c => c.id === existing.id);
            if (idx !== -1) {
              newCurriculums[idx] = {
                 ...newCurriculums[idx],
                 topics: defaultTopics,
                 topicsByLevel: fullTopicsByLevel,
                 group: existing.group || defaultGroup
              };
            }
         } else {
            const docRef = await addDoc(collection(db, "curriculums"), { ...payload, group: defaultGroup });
            newCurriculums.push({
               id: docRef.id,
               name: sub,
               topics: defaultTopics,
               topicsByLevel: fullTopicsByLevel,
               group: defaultGroup
            });
         }
      }
      setCurriculums(newCurriculums);
      setStatus("Success: All curriculums re-synced successfully from CurriculumManager.ts!");
      alert("Successfully re-synced all subjects and topics from CurriculumManager.ts to Firestore!");
    } catch (err: any) {
      console.error("Error seeding subjects:", err);
      setStatus("Error: " + err.message);
      alert("Re-sync failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSubjectSave = async (id: string) => {
    if (!editingSubjectName.trim()) return;
    setIsUploading(true);
    try {
      const subjectRef = doc(db, "curriculums", id);
      await setDoc(subjectRef, { 
        name: editingSubjectName.trim(), 
        icon: editingSubjectIcon.trim() || undefined,
        group: editingSubjectGroup
      }, { merge: true });

      setCurriculums(curriculums.map(c => c.id === id ? { 
        ...c, 
        name: editingSubjectName.trim(), 
        icon: editingSubjectIcon.trim() || undefined,
        group: editingSubjectGroup
      } : c));

      setEditingSubjectId(null);
      setStatus("Subject updated successfully");
    } catch (err: any) {
      setStatus("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the subject "${name}"? This will also delete all its curriculum topics.`)) {
      return;
    }
    setIsUploading(true);
    try {
      await deleteDoc(doc(db, "curriculums", id));

      const updated = curriculums.filter(c => c.id !== id);
      setCurriculums(updated);
      if (activeSubjectId === id) {
        setActiveSubjectId(updated.length > 0 ? updated[0].id : "");
      }
      setStatus("Subject deleted successfully");
    } catch (err: any) {
      setStatus("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifySync = (sub: typeof curriculums[0]) => {
    const defaultTopics = CurriculumManager.getSubTopics(sub.name, "standard") || [];
    const firestoreTopics = sub.topics || [];
    
    const levels = [
       "standard", "undergrad", "advanced", "postgrad", "professional",
       "100_sci", "200_sci", "300_sci", "400_sci",
       "200_eng", "300_eng", "400_eng", "500_eng",
       "200", "300", "400", "500", "600"
    ];
    
    let hasMismatches = false;
    const mismatches: string[] = [];
    const levelMismatches: string[] = [];
    
    // Check standard level
    if (JSON.stringify(defaultTopics) !== JSON.stringify(firestoreTopics)) {
       hasMismatches = true;
       levelMismatches.push("standard");
       const hSet = new Set(defaultTopics.map(t => t.trim()));
       const fSet = new Set(firestoreTopics.map(t => t.trim()));
       defaultTopics.forEach(t => { if (!fSet.has(t.trim())) mismatches.push(`[Standard] Missing: "${t}"`); });
       firestoreTopics.forEach(t => { if (!hSet.has(t.trim())) mismatches.push(`[Standard] Extra: "${t}"`); });
    }
    
    // Check subsequent levels
    for (const lvl of levels) {
       if (lvl === "standard") continue;
       const hLvl = CurriculumManager.getSubTopics(sub.name, lvl) || [];
       const fLvl = sub.topicsByLevel?.[lvl] || [];
       if (JSON.stringify(hLvl) !== JSON.stringify(fLvl)) {
          hasMismatches = true;
          levelMismatches.push(lvl);
          const hSet = new Set(hLvl.map(t => t.trim()));
          const fSet = new Set(fLvl.map(t => t.trim()));
          hLvl.forEach(t => { if (!fSet.has(t.trim())) mismatches.push(`[${lvl}] Missing: "${t}"`); });
          fLvl.forEach(t => { if (!hSet.has(t.trim())) mismatches.push(`[${lvl}] Extra: "${t}"`); });
       }
    }
    
    setVerificationResults(prev => ({
       ...prev,
       [sub.id]: {
          verified: true,
          hasMismatches,
          mismatches,
          levelMismatches
       }
    }));

    if (hasMismatches) {
       setStatus(`Verification details: Subject "${sub.name}" has ${mismatches.length} mismatches in: ${levelMismatches.join(", ")}.`);
    } else {
       setStatus(`Success: "${sub.name}" matches exactly with the CurriculumManager.ts configuration!`);
    }
  };

  const getActiveTopics = (): string[] => {
    if (!activeSubjectId) return [];
    const cur = curriculums.find(c => c.id === activeSubjectId);
    if (!cur) return [];
    if (cur.topicsByLevel && Array.isArray(cur.topicsByLevel[selectedLevel])) {
      return cur.topicsByLevel[selectedLevel];
    }
    if (selectedLevel === "standard") {
      return cur.topics || [];
    }
    // Generate dynamically if no level topics are found
    const generated = CurriculumManager.getSubTopics(cur.name, selectedLevel);
    return generated || [];
  };

  const handleEditTopicSave = async (topicIndex: number) => {
    if (!activeSubjectId || !editingTopicName.trim()) return;
    setIsUploading(true);
    try {
      const cur = curriculums.find(c => c.id === activeSubjectId);
      if (!cur) return;
      
      const currentTopics = getActiveTopics();
      const updatedTopicsForLevel = currentTopics.map((t, idx) => idx === topicIndex ? editingTopicName.trim() : t);
      
      const topicsByLevel = cur.topicsByLevel || {};
      const updatedTopicsByLevel = {
        ...topicsByLevel,
        [selectedLevel]: updatedTopicsForLevel
      };
      
      const isStandard = selectedLevel === "standard";
      const updatePayload: any = {
        topicsByLevel: updatedTopicsByLevel
      };
      if (isStandard) {
        updatePayload.topics = updatedTopicsForLevel;
      }
      
      await setDoc(doc(db, "curriculums", activeSubjectId), updatePayload, { merge: true });

      setCurriculums(curriculums.map(c => c.id === activeSubjectId ? { 
        ...c, 
        topics: isStandard ? updatedTopicsForLevel : c.topics,
        topicsByLevel: updatedTopicsByLevel
      } : c));
      setEditingTopicId(null);
      setStatus("Topic updated successfully");
    } catch (err: any) {
      setStatus("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTopic = async () => {
    if (!activeSubjectId || !newTopicName.trim()) return;
    setIsUploading(true);
    try {
      const cur = curriculums.find(c => c.id === activeSubjectId);
      if (!cur) return;
      
      const currentTopics = getActiveTopics();
      const updatedTopicsForLevel = [...currentTopics, newTopicName.trim()];
      
      const topicsByLevel = cur.topicsByLevel || {};
      const updatedTopicsByLevel = {
        ...topicsByLevel,
        [selectedLevel]: updatedTopicsForLevel
      };
      
      const isStandard = selectedLevel === "standard";
      const updatePayload: any = {
        topicsByLevel: updatedTopicsByLevel
      };
      if (isStandard) {
        updatePayload.topics = updatedTopicsForLevel;
      }
      
      await setDoc(doc(db, "curriculums", activeSubjectId), updatePayload, { merge: true });
      
      setCurriculums(curriculums.map(c => c.id === activeSubjectId ? { 
        ...c, 
        topics: isStandard ? updatedTopicsForLevel : c.topics,
        topicsByLevel: updatedTopicsByLevel
      } : c));
      setNewTopicName("");
      setStatus("Topic added successfully");
    } catch (err: any) {
      setStatus("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteTopic = async (topicIndex: number) => {
     if (!activeSubjectId) return;
     setIsUploading(true);
     try {
       const cur = curriculums.find(c => c.id === activeSubjectId);
       if (!cur) return;
       
       const currentTopics = getActiveTopics();
       const updatedTopicsForLevel = currentTopics.filter((_, i) => i !== topicIndex);
       
       const topicsByLevel = cur.topicsByLevel || {};
       const updatedTopicsByLevel = {
         ...topicsByLevel,
         [selectedLevel]: updatedTopicsForLevel
       };
       
       const isStandard = selectedLevel === "standard";
       const updatePayload: any = {
         topicsByLevel: updatedTopicsByLevel
       };
       if (isStandard) {
         updatePayload.topics = updatedTopicsForLevel;
       }
       
       await setDoc(doc(db, "curriculums", activeSubjectId), updatePayload, { merge: true });
       
       setCurriculums(curriculums.map(c => c.id === activeSubjectId ? { 
         ...c, 
         topics: isStandard ? updatedTopicsForLevel : c.topics,
         topicsByLevel: updatedTopicsByLevel
       } : c));
       setStatus("Topic removed");
     } catch (err: any) {
       setStatus("Error: " + err.message);
     } finally {
       setIsUploading(false);
     }
  };

  useEffect(() => {
    if (!activeSubjectId) return;
    const cur = curriculums.find(c => c.id === activeSubjectId);
    if (!cur) return;
    const available = getDifficultyLevelsForSubject(cur.name);
    if (available.length > 0) {
      const hasCurrent = available.some(l => l.value === selectedLevel);
      if (!hasCurrent) {
        setSelectedLevel(available[0].value);
      }
    }
  }, [activeSubjectId, curriculums]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    const adminEmails = [
      "johntobismart@gmail.com",
    ];
    if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... handles file upload
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("Reading file...");
    setIsUploading(true);

    try {
      const text = await file.text();
      const questions = JSON.parse(text);

      if (!Array.isArray(questions)) {
        throw new Error("File must contain a JSON array of questions");
      }

      setStatus(`Uploading to exam city DB... (${questions.length} questions)`);

      const questionsRef = collection(db, "questions");
      let count = 0;

      for (const q of questions) {
        await addDoc(questionsRef, {
          ...q,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        count++;
        setStatus(
          `Uploading to exam city DB... (${count}/${questions.length})`,
        );
      }

      setStatus(`Success! Uploaded ${count} questions!`);
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const syncAllToNotionDatabase = async (isAutoSync = false) => {
    if (!notionToken || !notionDbId) {
      if (!isAutoSync) alert("Please enter your Notion Integration Token and Database ID first.");
      return;
    }
    
    if (isAutoSync && !lastSyncTime) return; // Cannot auto sync without a previous sync baseline
    
    if (!isAutoSync) {
       setIsSyncing(true);
       setStatus("Syncing Exam City data to Notion Database...");
    }
    
    try {
      if (!isAutoSync) setStatus("Preparing analytics data...");
      
      let fQuery, rQuery, uQuery;
      if (isAutoSync && lastSyncTime) {
         fQuery = query(collection(db, "feedbacks"), where("createdAt", ">", lastSyncTime));
         rQuery = query(collection(db, "reviews"), where("createdAt", ">", lastSyncTime));
         uQuery = query(collection(db, "users"), where("createdAt", ">", lastSyncTime));
      } else {
         fQuery = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
         rQuery = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
         uQuery = collection(db, "users");
      }
      
      const [fSnap, rSnap, uSnap] = await Promise.all([
         getDocs(fQuery),
         getDocs(rQuery),
         getDocs(uQuery)
      ]);
      
      if (isAutoSync && fSnap.empty && rSnap.empty && uSnap.empty) {
         return; // Nothing new to sync
      }

      const feedbackRows = fSnap.docs.map(d => {
        const data = d.data() as any;
        const date = data.createdAt?.toDate?.()?.toISOString() || (data.createdAt ? new Date(data.createdAt).toISOString() : "N/A");
        const attachmentDetail = data.attachment || data.fileUrl || data.imageUrl || "No Attachment";
        return [d.id, date, data.userId || "", data.name || "", data.email || "", String(data.rating || ""), data.message || "", attachmentDetail];
      });

      const reviewRows = rSnap.docs.map(d => {
        const data = d.data() as any;
        const date = data.createdAt?.toDate?.()?.toISOString() || (data.createdAt ? new Date(data.createdAt).toISOString() : "N/A");
        return [d.id, date, data.userId || "", String(data.rating || ""), data.review || ""];
      });

      const userRows = uSnap.docs.map(d => {
        const data = d.data() as any;
        const dateRegistered = data.createdAt?.toDate?.()?.toISOString() || "N/A";
        const datePremium = data.tier === "pro" ? (data.premiumSince?.toDate?.()?.toISOString() || dateRegistered) : "N/A";
        return [d.id, dateRegistered, datePremium, String(data.tier || "free").toUpperCase(), data.name || "", data.email || "", String(data.examCount || 0)];
      });

      const dataSets = [
        { 
          tabName: "Complaints & Feedbacks", 
          headers: ["Record ID", "Date Submitted", "User ID", "Name", "Email", "Category/Type", "Message", "Attachment/Details"],
          rows: feedbackRows
        },
        { 
          tabName: "App Reviews", 
          headers: ["Record ID", "Date Submitted", "User ID", "Rating", "Review"], 
          rows: reviewRows 
        },
        { 
          tabName: "All Users Database", 
          headers: ["Record ID", "Date Registered", "Date Upgraded (Premium)", "Tier", "Full Name", "Email", "Exams Taken"], 
          rows: userRows 
        }
      ].filter(d => d.rows.length > 0);

      if (dataSets.length === 0) return;

      if (!isAutoSync) setStatus("Transmitting to backend Notion sync engine (Clearing old records)...");
      
      const response = await fetch("/api/sync-notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          notionToken, 
          databaseId: notionDbId, 
          dataSets,
          clearDatabase: !isAutoSync // True if this is a manual full sync
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Notion Sync failed on server.");
      }
      
      const newSyncTime = new Date();
      setLastSyncTime(newSyncTime);
      await setDoc(doc(db, "settings", "notion"), {
        token: notionToken,
        dbId: notionDbId,
        lastSyncTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (!isAutoSync) setStatus("Success! Exported to Notion Database successfully.");
    } catch (err: any) {
      console.error(err);
      if (!isAutoSync) setStatus("Error: " + err.message);
    } finally {
      if (!isAutoSync) setIsSyncing(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (notionToken && notionDbId) {
      interval = setInterval(() => {
        if (!isSyncing) syncAllToNotionDatabase(true);
      }, 30000); // Background auto-sync every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [notionToken, notionDbId, isSyncing, lastSyncTime]);

  return (
    <div id="admin-root-container" className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 font-sans text-neutral-800 dark:text-neutral-100 flex flex-col w-full selection:bg-indigo-500/15 selection:text-indigo-600">
      <Navbar />

      {/* Mobile Top Navigation */}
      <nav id="admin-mobile-nav" className="bg-white dark:bg-neutral-900 px-6 py-4 shadow-sm border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50 md:hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="hover:opacity-95 transition-opacity">
            <Logo />
          </Link>
          <button
            id="btn-nav-dashboard"
            onClick={() => navigate("/dashboard")}
            className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="flex-1 min-w-0 overflow-y-auto w-full animate-fade-in">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 w-full">
          
          {/* Header Dashboard Banner */}
          <div id="admin-header-banner" className="relative overflow-hidden bg-white dark:bg-neutral-910 bg-neutral-900 p-6 sm:p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800/80 shadow-md shadow-neutral-100/50 dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="relative z-10 space-y-2">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/[0.08] text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full border border-indigo-100 dark:border-indigo-900/40 uppercase tracking-widest">
                  🛡️ Admin Control Deck
               </div>
               <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                 Admin Settings Hub
               </h1>
               <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm max-w-2xl leading-relaxed">
                 Fully manage the learning syllabus, add live overrides, and import parsed question banks seamlessly.
               </p>
            </div>
            <button
              id="btn-header-back-dashboard"
              onClick={() => navigate("/dashboard")}
              className="relative z-10 px-5 py-3 bg-neutral-900 text-white dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 rounded-2xl font-bold text-sm tracking-tight transition-all active:scale-95 shadow-lg shadow-neutral-900/15 dark:shadow-none self-start md:self-auto flex items-center gap-2 cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Interactive Navigation Tab Switches */}
          <div id="admin-tab-switcher" className="flex flex-col sm:inline-flex sm:flex-row p-1 bg-neutral-100 dark:bg-neutral-900/80 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 shadow-inner w-full max-w-2xl gap-1">
             <button
                id="admin-tab-curriculum"
                onClick={() => setAdminTab("curriculum")}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-6 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                   adminTab === "curriculum" 
                      ? "bg-white dark:bg-neutral-800 text-neutral-850 dark:text-white shadow-sm ring-1 ring-neutral-200/40 dark:ring-neutral-700/60" 
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-white/50 dark:hover:bg-neutral-800/50"
                }`}
             >
                <Layers className="w-4 h-4" />
                <span>Curriculum</span>
             </button>
             <button
                id="admin-tab-upload"
                onClick={() => setAdminTab("upload")}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-6 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                   adminTab === "upload" 
                      ? "bg-white dark:bg-neutral-800 text-neutral-850 dark:text-white shadow-sm ring-1 ring-neutral-200/40 dark:ring-neutral-700/60" 
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-white/50 dark:hover:bg-neutral-800/50"
                }`}
             >
                <Upload className="w-4 h-4" />
                <span>Upload Question Bank</span>
             </button>
             <button
                id="admin-tab-notion"
                onClick={() => setAdminTab("notion")}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-6 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                   adminTab === "notion" 
                      ? "bg-white dark:bg-neutral-800 text-neutral-850 dark:text-white shadow-sm ring-1 ring-neutral-200/40 dark:ring-neutral-700/60" 
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-white/50 dark:hover:bg-neutral-800/50"
                }`}
             >
                <Database className="w-4 h-4" />
                <span>Notion Database Sync</span>
             </button>
          </div>

          {/* Tab Content Display Area */}
          <div id="admin-active-tab-content" className="w-full">
                  {/* TAB 1: CURRICULUM MANAGEMENT */}
            {adminTab === "curriculum" && (
                <div id="card-curriculum-panel" className="bg-white dark:bg-neutral-900 p-6 sm:p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800/80 shadow-md shadow-neutral-100/40 dark:shadow-none space-y-8">
                  <div className="flex items-center gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white">
                        Syllabus & Core Curriculums
                      </h2>
                      <p className="text-neutral-500 dark:text-neutral-400 font-medium text-xs sm:text-sm">
                        Instantly customize active subjects, levels, and topic overrides. Edits write live to Firestore database registers.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row gap-8">
                     
                     {/* LEFT COLUMN: Subjects List with Search bar */}
                     <div id="sidebar-subject-list" className="w-full lg:w-1/3 bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 min-h-[280px] lg:min-h-[520px]">
                        <div className="space-y-3 flex flex-col">
                           <div className="flex justify-between items-center">
                             <h3 className="font-extrabold text-xs tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">Syllabus Index</h3>
                             <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full font-bold">
                               {curriculums.length} Active
                             </span>
                           </div>
                           
                           {/* Quick Filter Search Box */}
                           <div className="relative flex items-center">
                              <Search className="w-4 h-4 absolute left-3.5 text-neutral-400 dark:text-neutral-500" />
                              <input
                                 id="input-subject-search"
                                 type="text"
                                 placeholder="Search current subjects..."
                                 value={subjectSearchQuery}
                                 onChange={e => setSubjectSearchQuery(e.target.value)}
                                 className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-neutral-400 dark:placeholder:text-neutral-600 text-neutral-800 dark:text-neutral-100"
                              />
                           </div>
                        </div>
                        
                        {/* Subjects Dynamic Container */}
                        <div className="flex-1 flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
                            {(() => {
                               const filteredList = curriculums.filter(c => 
                                  c.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
                                  (c.group || "").toLowerCase().includes(subjectSearchQuery.toLowerCase())
                               );

                               if (filteredList.length === 0) {
                                  return (
                                     <div className="text-xs text-neutral-400 dark:text-neutral-600 p-8 italic text-center font-medium bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                                        {subjectSearchQuery ? "No matching subjects found" : "No subjects registered yet"}
                                     </div>
                                  );
                               }

                               return filteredList.map(sub => {
                                  const isEditing = editingSubjectId === sub.id;
                                  const result = verificationResults[sub.id];
                                  return (
                                     <div
                                        key={sub.id}
                                        onClick={() => !isEditing && setActiveSubjectId(sub.id)}
                                        className={`group flex flex-col p-3 rounded-xl border transition-all ${
                                           isEditing 
                                           ? "bg-white dark:bg-neutral-900 border-indigo-500"
                                           : activeSubjectId === sub.id 
                                           ? "bg-indigo-650 text-white border-indigo-600 shadow-md shadow-indigo-600/15 font-bold" 
                                           : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-150 dark:hover:bg-neutral-805 border-neutral-200 dark:border-neutral-800/80 font-medium"
                                        } ${!isEditing ? "cursor-pointer" : ""}`}
                                     >
                                        {isEditing ? (
                                           <div className="flex flex-col gap-2 w-full" onClick={e => e.stopPropagation()}>
                                              <input
                                                 type="text"
                                                 value={editingSubjectName}
                                                 onChange={e => setEditingSubjectName(e.target.value)}
                                                 className="px-3 py-1.5 text-xs bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-lg outline-none focus:border-indigo-500 w-full"
                                                 placeholder="Subject Name"
                                              />
                                              <input
                                                 type="text"
                                                 value={editingSubjectIcon}
                                                 onChange={e => setEditingSubjectIcon(e.target.value)}
                                                 className="px-3 py-1.5 text-xs bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-lg outline-none focus:border-indigo-500 w-full"
                                                 placeholder="Icon (e.g. Activity)"
                                              />
                                              <select
                                                 value={editingSubjectGroup}
                                                 onChange={e => setEditingSubjectGroup(e.target.value)}
                                                 className="px-3 py-1.5 text-xs bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-lg outline-none focus:border-indigo-500 w-full font-medium"
                                              >
                                                 <option value="General">General</option>
                                                 <option value="Medical">Medical</option>
                                                 <option value="Engineering">Engineering</option>
                                                 <option value="Humanities">Humanities</option>
                                                 <option value="Science">Science</option>
                                                 <option value="Social Sciences">Social Sciences</option>
                                              </select>
                                              <div className="flex justify-end gap-1.5 mt-1.5">
                                                 <button
                                                    onClick={() => setEditingSubjectId(null)}
                                                    className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 cursor-pointer"
                                                 >
                                                    <X className="w-4 h-4" />
                                                 </button>
                                                 <button
                                                    onClick={() => handleEditSubjectSave(sub.id)}
                                                    className="p-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded cursor-pointer"
                                                 >
                                                    <Check className="w-4 h-4" />
                                                 </button>
                                              </div>
                                           </div>
                                        ) : (
                                           <div className="flex flex-col gap-1.5 w-full">
                                              <div className="flex justify-between items-start gap-1">
                                                 <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-xs select-none break-words leading-snug tracking-tight font-bold">{sub.name}</span>
                                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                       <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                                                          activeSubjectId === sub.id 
                                                             ? "bg-white/20 text-white border-white/10" 
                                                             : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700/60"
                                                       }`}>
                                                          {sub.group || "General"}
                                                       </span>
                                                       {result?.verified && (
                                                          <span className={`text-[9px] font-bold flex items-center gap-0.5 ${
                                                             result.hasMismatches 
                                                                ? "text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 font-bold" 
                                                                : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold"
                                                          }`}>
                                                             {result.hasMismatches 
                                                                ? `✓ Customized` 
                                                                : "✓ Synced"
                                                             }
                                                          </span>
                                                       )}
                                                    </div>
                                                 </div>
                                              </div>
                                              
                                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200/40 dark:border-neutral-800/40 opacity-90 group-hover:opacity-100">
                                                 <button
                                                    id={`btn-verify-${sub.id}`}
                                                    onClick={(e) => {
                                                       e.stopPropagation();
                                                       handleVerifySync(sub);
                                                    }}
                                                    title="Verification Tool"
                                                    className={`px-2 py-1 rounded text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                                                       activeSubjectId === sub.id
                                                          ? "bg-white/15 hover:bg-white/25 text-white border border-white/25"
                                                          : "bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-indigo-600 dark:text-indigo-400 border border-neutral-200 dark:border-neutral-700"
                                                    } border`}
                                                 >
                                                    Verify
                                                 </button>
                                                 
                                                 <div className="flex items-center gap-1">
                                                    <button
                                                       onClick={(e) => {
                                                          e.stopPropagation();
                                                          setEditingSubjectId(sub.id);
                                                          setEditingSubjectName(sub.name);
                                                          setEditingSubjectIcon((sub as any).icon || "");
                                                          setEditingSubjectGroup(sub.group || "General");
                                                       }}
                                                       title="Rename Subject"
                                                       className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors cursor-pointer ${activeSubjectId === sub.id ? 'text-white/80 hover:text-white' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
                                                    >
                                                       <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    
                                                    <button
                                                       onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleDeleteSubject(sub.id, sub.name);
                                                       }}
                                                       title="Delete Subject"
                                                       className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 text-red-500/80 transition-all cursor-pointer"
                                                    >
                                                       <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                 </div>
                                              </div>
                                           </div>
                                        )}
                                     </div>
                                  );
                               });
                            })()}
                        </div>

                        {/* Interactive Seeding & Add Elements */}
                        <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
                           <button 
                              id="btn-seed-all"
                              onClick={handleSeedAllSubjects}
                              disabled={isUploading}
                              className="w-full py-2.5 bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-neutral-700/80 border border-neutral-200 dark:border-neutral-700 text-[10px] font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                           >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Reset All to CurriculumTemplate
                           </button>
                           
                           <div className="space-y-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                             <span className="text-[10px] uppercase font-black text-neutral-400 dark:text-neutral-500 tracking-wider block">New Custom Subject</span>
                             <input
                                 id="input-new-subject"
                                 type="text"
                                 placeholder="Subject Name"
                                 value={newSubjectName}
                                 onChange={e => setNewSubjectName(e.target.value)}
                                 className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500/30 font-medium"
                             />
                             <div className="grid grid-cols-2 gap-2">
                               <select
                                   id="select-subject-group"
                                   value={newSubjectGroup}
                                   onChange={e => setNewSubjectGroup(e.target.value)}
                                   className="px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none font-medium text-neutral-800 dark:text-neutral-100 w-full"
                               >
                                   <option value="General">General</option>
                                   <option value="Medical">Medical</option>
                                   <option value="Engineering">Engineering</option>
                                   <option value="Humanities">Humanities</option>
                                   <option value="Science">Science</option>
                                   <option value="Social Sciences">Social Sciences</option>
                               </select>
                               
                               <input
                                   id="input-new-subject-icon"
                                   type="text"
                                   placeholder="Icon (Activity)"
                                   value={newSubjectIcon}
                                   onChange={e => setNewSubjectIcon(e.target.value)}
                                   className="px-3 py-2 text-xs bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none font-medium w-full"
                               />
                             </div>
                             
                             <button 
                                 id="btn-add-subject"
                                 onClick={handleAddSubject}
                                 disabled={!newSubjectName.trim() || isUploading}
                                 className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                             >
                                 Add Subject
                             </button>
                           </div>
                        </div>
                     </div>

                     {/* RIGHT COLUMN: Active Selected Subject's Topics list */}
                     <div id="topics-override-manager" className="w-full lg:w-2/3 bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 flex flex-col min-h-[280px] lg:min-h-[520px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 border-b border-neutral-200 dark:border-neutral-800 pb-3.5">
                           <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
                              Syllabus Schema: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{curriculums.find(c => c.id === activeSubjectId)?.name || 'Select subject'}</span>
                           </h3>
                           {activeSubjectId && (
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                 <span className="text-xs text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider whitespace-nowrap">Grade / Level:</span>
                                 <select
                                    id="select-difficulty-level"
                                    value={selectedLevel}
                                    onChange={(e) => setSelectedLevel(e.target.value)}
                                    className="px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold outline-none ring-1 ring-neutral-200 dark:ring-neutral-800 focus:border-indigo-500 flex-1 sm:flex-initial cursor-pointer"
                                 >
                                    {getDifficultyLevelsForSubject(curriculums.find(c => c.id === activeSubjectId)?.name || "").map(lvl => (
                                       <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                                    ))}
                                 </select>
                              </div>
                           )}
                        </div>

                        {/* Informational helper banner indicating live sync is fully active */}
                        {activeSubjectId && (
                           <div className="mb-5 p-4 bg-indigo-500/[0.04] border border-indigo-500/20 rounded-2xl text-xs text-neutral-800 dark:text-neutral-200 flex items-start gap-3">
                              <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5 animate-pulse" />
                              <div className="space-y-1">
                                 <span className="font-extrabold block text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-[10px]">Real-time Database link</span>
                                 <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed font-semibold">
                                    Changes below apply instantly. Custom overrides appear live inside the student exam configurations modal with a specialist <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">Dynamic Override</span> badge.
                                 </p>
                              </div>
                           </div>
                        )}
                        
                        <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1.5 mb-5 custom-scrollbar max-h-[340px]">
                           {activeSubjectId && (() => {
                              const activeSub = curriculums.find(c => c.id === activeSubjectId);
                              const defaultTopics = activeSub ? (CurriculumManager.getSubTopics(activeSub.name, selectedLevel) || []) : [];
                              const defaultTopicsLower = defaultTopics.map(t => t.trim().toLowerCase());
                              const activeTopics = getActiveTopics();

                              return (
                                 <>
                                    <div className="space-y-2">
                                    {activeTopics.map((topic, i) => {
                                       const isEditingTopic = editingTopicId?.subId === activeSubjectId && editingTopicId?.index === i;
                                       const isExtra = !defaultTopicsLower.includes(topic.trim().toLowerCase());

                                       return (
                                          <div 
                                             key={i} 
                                             className={`flex justify-between items-center px-4 py-3.5 rounded-xl border transition-all ${
                                                isExtra 
                                                   ? "bg-indigo-500/[0.03] text-indigo-900 dark:text-indigo-300 border-indigo-500/25 shadow-sm" 
                                                   : "bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border-neutral-200 dark:border-neutral-805"
                                             } group`}
                                          >
                                             {isEditingTopic ? (
                                                <div className="flex items-center gap-2.5 w-full">
                                                   <input
                                                      type="text"
                                                      value={editingTopicName}
                                                      onChange={e => setEditingTopicName(e.target.value)}
                                                      className="flex-1 px-3 py-2 text-xs bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                                      placeholder="Topic Name"
                                                   />
                                                   <button
                                                      onClick={() => setEditingTopicId(null)}
                                                      className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 cursor-pointer"
                                                   >
                                                      <X className="w-4 h-4" />
                                                   </button>
                                                   <button
                                                      onClick={() => handleEditTopicSave(i)}
                                                      className="p-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg cursor-pointer"
                                                   >
                                                      <Check className="w-4 h-4" />
                                                   </button>
                                                </div>
                                             ) : (
                                                <>
                                                   <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 pr-2">
                                                      <span className={`text-xs ${isExtra ? "text-indigo-900 dark:text-indigo-300 font-bold" : "text-neutral-800 dark:text-neutral-200 font-semibold"}`}>
                                                         {topic}
                                                      </span>
                                                      {isExtra ? (
                                                         <span className="w-fit text-[8px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 uppercase tracking-widest">
                                                            Dynamic Override
                                                         </span>
                                                      ) : (
                                                         <span className="w-fit text-[8px] font-bold text-neutral-450 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700 uppercase tracking-widest">
                                                            📚 Core Syllabus
                                                         </span>
                                                      )}
                                                   </div>
                                                   
                                                   <div className="flex items-center gap-1 opacity-20 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <button 
                                                         onClick={() => {
                                                            setEditingTopicId({ subId: activeSubjectId, index: i });
                                                            setEditingTopicName(topic);
                                                         }}
                                                         className="text-neutral-500 dark:text-neutral-400 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all cursor-pointer"
                                                         title="Rename Topic"
                                                      >
                                                         <Edit2 className="w-3.5 h-3.5" />
                                                      </button>
                                                      <button 
                                                         onClick={() => handleDeleteTopic(i)}
                                                         className="text-red-500/80 hover:text-red-600 p-1.5 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                                         title="Remove Topic"
                                                      >
                                                         <Trash2 className="w-3.5 h-3.5" />
                                                      </button>
                                                   </div>
                                                </>
                                             )}
                                          </div>
                                       );
                                    })}
                                    </div>

                                    {activeTopics.length === 0 && (
                                       <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-neutral-400 dark:text-neutral-500 py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 italic">
                                          No active topics are defined. Inject suggestions using the template list below.
                                       </div>
                                    )}

                                    {/* Missing Core Curriculum Templates Section */}
                                    {(() => {
                                       const activeTopicsLower = activeTopics.map(t => t.trim().toLowerCase());
                                       const missingTopics = defaultTopics.filter(t => !activeTopicsLower.includes(t.trim().toLowerCase()));

                                       if (missingTopics.length === 0) return null;

                                       return (
                                          <div className="mt-5 p-4.5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20 space-y-3">
                                             <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                <h4 className="text-[10px] font-extrabold uppercase tracking-widest">Missing Core Syllabus Recommendations ({missingTopics.length})</h4>
                                             </div>
                                             <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-semibold">
                                                The following topics are in the default curriculum index but aren't activated inside your Firestore database records. Select them to deploy instantly:
                                             </p>
                                             <div className="flex flex-wrap gap-1.5">
                                                {missingTopics.map((mTopic, idx) => (
                                                   <button
                                                      key={idx}
                                                      onClick={async () => {
                                                         setIsUploading(true);
                                                         try {
                                                            const updatedTopicsForLevel = [...activeTopics, mTopic];
                                                            const topicsByLevel = activeSub.topicsByLevel || {};
                                                            const updatedTopicsByLevel = {
                                                               ...topicsByLevel,
                                                               [selectedLevel]: updatedTopicsForLevel
                                                            };
                                                            const isStandard = selectedLevel === "standard";
                                                            const updatePayload: any = {
                                                               topicsByLevel: updatedTopicsByLevel
                                                            };
                                                            if (isStandard) {
                                                               updatePayload.topics = updatedTopicsForLevel;
                                                            }
                                                            await setDoc(doc(db, "curriculums", activeSubjectId), updatePayload, { merge: true });
                                                            setCurriculums(curriculums.map(c => c.id === activeSubjectId ? { 
                                                               ...c, 
                                                               topics: isStandard ? updatedTopicsForLevel : c.topics,
                                                               topicsByLevel: updatedTopicsByLevel
                                                            } : c));
                                                            setStatus(`Added suggesting topic: "${mTopic}"`);
                                                         } catch (err: any) {
                                                            setStatus("Error: " + err.message);
                                                         } finally {
                                                            setIsUploading(false);
                                                         }
                                                      }}
                                                      className="inline-flex items-center gap-1.5 text-[9px] font-extrabold text-amber-900 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/20 transition-all cursor-pointer active:scale-95"
                                                   >
                                                      <Plus className="w-3 h-3" />
                                                      <span>{mTopic}</span>
                                                   </button>
                                                ))}
                                             </div>
                                          </div>
                                       );
                                    })()}
                                 </>
                              );
                           })()}

                           {!activeSubjectId && (
                              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-neutral-400 dark:text-neutral-500 py-16 italic">
                                 <Layers className="w-12 h-12 text-neutral-305 dark:text-neutral-700 animate-pulse" />
                                 <span className="text-xs font-semibold">Select a subject index on the left to review, override, or verify syllabus topics.</span>
                              </div>
                           )}
                        </div>

                        {/* Add live topic box */}
                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
                           <input
                              id="input-new-topic"
                              type="text"
                              placeholder={activeSubjectId ? "Type a new syllabus override topic..." : "Choose a subject first..."}
                              value={newTopicName}
                              onChange={e => setNewTopicName(e.target.value)}
                              disabled={!activeSubjectId}
                              className="flex-1 px-4 py-2.5 text-xs bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50 font-medium"
                           />
                           <button 
                              id="btn-add-topic"
                              onClick={handleAddTopic}
                              disabled={!activeSubjectId || !newTopicName.trim() || isUploading}
                              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors cursor-pointer shadow-sm active:scale-95"
                           >
                              Add Topic
                           </button>
                        </div>
                     </div>
                  </div>
                </div>
            )}

            {/* TAB 2: QUESTIONS JSON FILE UPLOADER */}
            {adminTab === "upload" && (
                <div id="card-upload-panel" className="bg-white dark:bg-neutral-900 p-6 sm:p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800/80 shadow-md shadow-neutral-100/40 dark:shadow-none space-y-8 max-w-4xl animate-fade-in animate-duration-200">
                  <div className="flex items-center gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white">
                        Question Bank Uploader
                      </h2>
                      <p className="text-neutral-500 dark:text-neutral-400 font-medium text-xs sm:text-sm">
                        Instantly seed the primary system database in bulk with clean JSON schema files.
                      </p>
                    </div>
                  </div>

                  <label
                    className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 block transition-all duration-200 text-center group ${
                      isUploading 
                        ? 'cursor-not-allowed bg-indigo-50/25 border-indigo-300 dark:border-indigo-905' 
                        : 'border-neutral-200 hover:border-indigo-500 dark:border-neutral-850 dark:hover:border-indigo-500 hover:bg-indigo-500/[0.01] cursor-pointer'
                    }`}
                  >
                    {isUploading ? (
                      <div className="w-12 h-12 border-4 border-indigo-500/35 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                    ) : (
                      <Upload className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4 group-hover:text-indigo-550 dark:group-hover:text-indigo-400 group-hover:-translate-y-1 transition-all duration-300" />
                    )}
                    <span className="font-extrabold text-base sm:text-lg text-neutral-850 dark:text-white block mb-1">
                      {isUploading ? "Uploading Data Schema..." : "Select Question Bank JSON"}
                    </span>
                    <span className="text-neutral-450 dark:text-neutral-400 font-medium text-xs sm:text-sm block">
                      {isUploading ? "Please wait while our parsers examine the schema entries" : "Drag & drop or click to browse files on your device (supports .json files only)"}
                    </span>
                    <input
                      id="input-upload-json-file"
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>

                  <div className="p-5.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 space-y-3.5">
                    <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 font-bold uppercase tracking-wider text-[10px]">
                       <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                       <span>JSON Question Array Schema Guidelines:</span>
                    </div>
                    <p className="leading-relaxed font-semibold">Every uploaded file must comply with a structured JSON array format to feed correctly into the exam selection queries:</p>
                    <pre className="p-4 bg-neutral-900 border border-neutral-800 text-slate-100 rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed select-all shadow-inner max-h-56">
{`[
  {
    "subject": "Anatomy",
    "topic": "Gross Anatomy",
    "difficulty": "200", 
    "question": "What is the primary muscle of respiration?",
    "type": "mcq",
    "options": [
       "Diaphragm", 
       "External Intercostals", 
       "Internal Intercostals", 
       "Scalene"
    ],
    "answer": "Diaphragm",
    "explanation": "The Diaphragm is the primary muscle underlying respiratory excursion and active inhalation."
  }
]`}
                    </pre>
                  </div>
                </div>
            )}

            {adminTab === "notion" && (
                <div id="card-notion-panel" className="bg-white dark:bg-neutral-900 p-6 sm:p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800/80 shadow-md shadow-neutral-100/40 dark:shadow-none space-y-8 max-w-4xl animate-fade-in animate-duration-200">
                  <div className="flex items-center gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white">
                        Notion API Server Sync
                      </h2>
                      <p className="text-neutral-500 dark:text-neutral-400 font-medium text-xs sm:text-sm">
                        Automatically export user metrics, curriculum configurations, and feedback logs securely to your Notion workspace DB.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest pl-1">Notion Integration Token</label>
                        <input
                          type="password"
                          placeholder="secret_XXXXXXXXXXXX"
                          value={notionToken}
                          onChange={(e) => setNotionToken(e.target.value)}
                          className="w-full px-4 py-3 bg-neutral-50 top-0 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-700 dark:text-neutral-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest pl-1">Notion Database ID</label>
                        <input
                          type="text"
                          placeholder="e.g. 8f9b9... (from database link)"
                          value={notionDbId}
                          onChange={(e) => setNotionDbId(e.target.value)}
                          className="w-full px-4 py-3 bg-neutral-50 top-0 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-mono text-neutral-700 dark:text-neutral-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                        />
                      </div>

                    </div>



                    <button
                       onClick={() => syncAllToNotionDatabase(false)}
                       disabled={isSyncing || !notionToken || !notionDbId}
                       className="w-full mt-4 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl flex justify-center items-center gap-3 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/10 active:scale-[0.98]"
                    >
                       {isSyncing ? (
                         <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                       ) : (
                         <>
                           <RefreshCw className="w-5 h-5 animate-pulse" />
                           <span>Sync to Notion Database</span>
                         </>
                       )}
                    </button>
                    {lastSyncTime && (
                       <div className="text-center mt-2 space-y-1">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Last automated delta-sync was {lastSyncTime.toLocaleString()}</p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-extrabold uppercase tracking-widest">Background Auto-Sync Active (30s interval)</p>
                       </div>
                    )}
                  </div>
                </div>
            )}

          </div>

          {/* Feedback/Status Updates Toast */}
          {status && (
            <div
              id="status-feedback-panel"
              className={`p-4 rounded-2xl border font-bold flex items-center gap-3 transition-all shadow-md animate-fade-in ${
                status.startsWith("Error") 
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-450" 
                  : status.startsWith("Success") 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450" 
                  : "bg-indigo-500/10 border-indigo-500/25 text-indigo-600 dark:text-indigo-400"
              }`}
            >
              {status.startsWith("Error") ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-550" />
              ) : status.startsWith("Success") ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-550" />
              ) : (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0 text-indigo-550" />
              )}
              <span className="text-xs sm:text-sm font-semibold">{status}</span>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
