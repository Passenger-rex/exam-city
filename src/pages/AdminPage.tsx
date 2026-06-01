import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query, doc, getDoc, setDoc, where, updateDoc, deleteDoc } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Upload, Database, CheckCircle2, AlertCircle, FileSpreadsheet, Edit2, Trash2, Check, X, Plus } from "lucide-react";
import { Logo } from "../components/Logo";
import { Navbar } from "../components/Navbar";
import { useUser } from "../UserContext";
import { CurriculumManager } from "../utils/CurriculumManager";

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [configuredSheetId, setConfiguredSheetId] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [curriculums, setCurriculums] = useState<{id: string, name: string, topics: string[]}[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectIcon, setNewSubjectIcon] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [activeSubjectId, setActiveSubjectId] = useState("");

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");
  const [editingSubjectIcon, setEditingSubjectIcon] = useState("");

  const [editingTopicId, setEditingTopicId] = useState<{subId: string, index: number} | null>(null);
  const [editingTopicName, setEditingTopicName] = useState("");

  useEffect(() => {
    const fetchCurriculums = async () => {
      try {
        const q = query(collection(db, "curriculums"), orderBy("name"));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() as any })) as any[];
        
        if (data.length > 0) {
          setCurriculums(data);
          setActiveSubjectId(data[0].id);
        } else {
          // Prepopulate some default subjects if completely empty
          const defaults = ["Mathematics", "English Language", "Physics", "Chemistry", "Biology"];
          for (const sub of defaults) {
            const mappedName = sub === "English Language" ? "English" : sub;
            const defaultTopics = CurriculumManager.getSubTopics(mappedName, "standard") || [];
            await addDoc(collection(db, "curriculums"), { name: sub, topics: defaultTopics, createdAt: serverTimestamp() });
          }
          // Fetch again
          const snap2 = await getDocs(q);
          const data2 = snap2.docs.map(d => ({ id: d.id, ...d.data() as any })) as any[];
          setCurriculums(data2);
          if (data2.length > 0) setActiveSubjectId(data2[0].id);
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
        topics: [],
        createdAt: serverTimestamp()
      });
      const newSubject = { id: docRef.id, name: newSubjectName.trim(), icon: newSubjectIcon.trim() || undefined, topics: [] };
      setCurriculums([...curriculums, newSubject]);
      setActiveSubjectId(docRef.id);
      setNewSubjectName("");
      setNewSubjectIcon("");
      setStatus("Subject added successfully");
    } catch (err: any) {
      setStatus("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSeedAllSubjects = async () => {
    setIsUploading(true);
    try {
      const ALL_SUBJECTS = [
        "Accounting", "Agricultural Science", "Anatomy", "Basic Science", "Basic Technology", 
        "Biochemistry", "Biology", "Biotechnology", "Botany", "Business Studies", 
        "Chemical Engineering", "Chemistry", "Civic Education", "Civil Engineering", 
        "Clinical Biochemistry", "Clinical Immunology", "Commerce", "Community Medicine", 
        "Computer Engineering", "CRK", "Current Affairs", "Dermatology", "Economics", 
        "Electrical Engineering", "Embryology", "English", "English Literature", 
        "ENT", "Fine Art", "Fluid Mechanics", "Food Science", "French", 
        "Further Mathematics", "Genetics", "Geography", "Geology", "Geophysics", 
        "Hausa", "Hematology", "History", "Home Economics", "Igbo", "Insurance", 
        "Internal Medicine", "IRK", "Mathematics", "Mechanical Engineering", "Medical Biochemistry", 
        "Medical Histology", "Medical Microbiology", "Medical Parasitology", "Medicine", 
        "Meteorology", "Microbiology", "Molecular Biology", "Neuroanatomy", "Obstetrics and Gynecology", 
        "Ophthalmology", "Pathology", "Pediatrics", "Petroleum Engineering", "Pharmacology", 
        "Physical Education", "Physics", "Physiology", "Psychiatry", "Radiology", 
        "Statistics", "Strength of Materials", "Structural Engineering", "Surgery", 
        "Technical Drawing", "Thermodynamics", "Yoruba", "Zoology"
      ];
      
      const newCurriculums = [...curriculums];
      // Only seed subjects that are not already present
      for (const sub of ALL_SUBJECTS) {
         if (!newCurriculums.find(c => c.name.toLowerCase() === sub.toLowerCase())) {
            const defaultTopics = CurriculumManager.getSubTopics(sub, "standard") || [];
            const docRef = await addDoc(collection(db, "curriculums"), { 
               name: sub, 
               topics: defaultTopics, 
               createdAt: serverTimestamp() 
            });
            newCurriculums.push({ id: docRef.id, name: sub, icon: undefined, topics: defaultTopics } as any);
         }
      }
      setCurriculums(newCurriculums);
      setStatus("Seeded all subjects with default topics successfully!");
    } catch (err: any) {
      setStatus("Error: " + err.message);
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
        icon: editingSubjectIcon.trim() || undefined 
      }, { merge: true });

      setCurriculums(curriculums.map(c => c.id === id ? { 
        ...c, 
        name: editingSubjectName.trim(), 
        icon: editingSubjectIcon.trim() || undefined 
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

  const handleEditTopicSave = async (topicIndex: number) => {
    if (!activeSubjectId || !editingTopicName.trim()) return;
    setIsUploading(true);
    try {
      const cur = curriculums.find(c => c.id === activeSubjectId);
      if (!cur) return;
      const updatedTopics = cur.topics.map((t, idx) => idx === topicIndex ? editingTopicName.trim() : t);
      await setDoc(doc(db, "curriculums", activeSubjectId), { topics: updatedTopics }, { merge: true });

      setCurriculums(curriculums.map(c => c.id === activeSubjectId ? { ...c, topics: updatedTopics } : c));
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
      const updatedTopics = [...cur.topics, newTopicName.trim()];
      await setDoc(doc(db, "curriculums", activeSubjectId), { topics: updatedTopics }, { merge: true });
      
      setCurriculums(curriculums.map(c => c.id === activeSubjectId ? { ...c, topics: updatedTopics } : c));
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
       const updatedTopics = cur.topics.filter((_, i) => i !== topicIndex);
       await setDoc(doc(db, "curriculums", activeSubjectId), { topics: updatedTopics }, { merge: true });
       
       setCurriculums(curriculums.map(c => c.id === activeSubjectId ? { ...c, topics: updatedTopics } : c));
       setStatus("Topic removed");
     } catch (err: any) {
       setStatus("Error: " + err.message);
     } finally {
       setIsUploading(false);
     }
  };

  useEffect(() => {
    const loadConfigObj = async () => {
      try {
        const configRef = doc(db, "settings", "google_sheets");
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.spreadsheetId) setConfiguredSheetId(data.spreadsheetId);
          if (data.spreadsheetUrl) setSheetUrl(data.spreadsheetUrl);
        }
      } catch (err) {
        console.error("Error loading config", err);
      }
    };
    loadConfigObj();
  }, [db]);

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

  const syncAllToMasterSheet = async () => {
    setIsSyncing(true);
    setStatus("Syncing Master Database...");
    setSheetUrl("");
    
    try {
      let token = sessionStorage.getItem("google_access_token");
      
      if (!token) {
        setStatus("Authorizing Google Sheets...");
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/spreadsheets');
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
           token = credential.accessToken;
           sessionStorage.setItem("google_access_token", token);
        } else {
           throw new Error("Failed to get Google Access Token");
        }
      }

      // 1. Fetch Feedbacks & Complaints
      setStatus("Fetching Feedbacks...");
      const qFeedbacks = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
      const fSnap = await getDocs(qFeedbacks);
      const feedbackRows = [["Date", "User ID", "Name", "Email", "Category/Type", "Message", "Attachment URL/Data"]];
      fSnap.forEach(d => {
        const data = d.data();
        const date = data.createdAt?.toDate?.()?.toISOString() || (data.createdAt ? new Date(data.createdAt).toISOString() : "N/A");
        feedbackRows.push([date, data.userId || "", data.name || "", data.email || "", String(data.rating || ""), data.message || "", data.attachment || "No Attachment"]);
      });

      // 2. Fetch Reviews
      setStatus("Fetching App Reviews...");
      const qReviews = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
      const rSnap = await getDocs(qReviews);
      const reviewRows = [["Date", "User ID", "Rating", "Review"]];
      rSnap.forEach(d => {
        const data = d.data();
        const date = data.createdAt?.toDate?.()?.toISOString() || new Date(data.createdAt).toISOString();
        reviewRows.push([date, data.userId || "", String(data.rating || ""), data.review || ""]);
      });

      // 3. Fetch Premium Users
      setStatus("Fetching Premium Users...");
      const qUsers = query(collection(db, "users"), where("tier", "==", "pro"));
      const uSnap = await getDocs(qUsers);
      const userRows = [["Join Date", "Full Name", "Email", "User ID", "Exams Taken"]];
      uSnap.forEach(d => {
        const data = d.data();
        const date = data.createdAt?.toDate?.()?.toISOString() || "N/A";
        userRows.push([date, data.name || "", data.email || "", d.id, String(data.examCount || 0)]);
      });

      let spreadsheetId = configuredSheetId.trim();

      if (!spreadsheetId) {
        setStatus("Creating Master Google Sheet...");
        const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            properties: { title: `Exam City Master Database` },
            sheets: [
              { properties: { title: "Complaints & Feedbacks" } },
              { properties: { title: "App Reviews" } },
              { properties: { title: "Premium Users" } },
              { properties: { title: "Subject Curriculum" } }
            ]
          })
        });

        if (!createRes.ok) {
          const errMsg = await createRes.text();
          let detail = "";
          try {
             const cleanedObj = JSON.parse(errMsg);
             detail = cleanedObj.error?.message || errMsg;
          } catch(e) {
             detail = errMsg;
          }
          throw new Error(`Failed to create Master Google Sheet: ${detail}`);
        }
        const sheetData = await createRes.json();
        spreadsheetId = sheetData.spreadsheetId;
        const newUrl = sheetData.spreadsheetUrl;
        
        setConfiguredSheetId(spreadsheetId);
        setSheetUrl(newUrl);

        await setDoc(doc(db, "settings", "google_sheets"), {
          spreadsheetId,
          spreadsheetUrl: newUrl,
          updatedAt: serverTimestamp()
        });
      }

      setStatus("Syncing data to tabs...");

      const syncTab = async (tabName: string, headers: string[], rows: any[][]) => {
         setStatus(`Syncing ${tabName}...`);
         
         if (tabName === "Subject Curriculum") {
            // First clear the sheet values in that tab
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabName}'!A1:Z1000:clear`, {
               method: "POST",
               headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
            });
            // Then PUT the new values
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabName}'!A1?valueInputOption=USER_ENTERED`, {
               method: "PUT",
               headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
               body: JSON.stringify({ values: [headers, ...rows] })
            });
            return;
         }

         // 1. Check if sheet is empty by trying to get first row
         const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabName}'!A1:1`, {
            headers: { "Authorization": `Bearer ${token}` }
         });
         const getData = await getRes.json();
         const isSheetEmpty = !getData.values || getData.values.length === 0;

         // 2. Prepare payload: Include headers only if empty
         const valuesToSync = isSheetEmpty ? [headers, ...rows] : rows;
         
         if (valuesToSync.length === 0) return;

         // 3. Append data
         await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${tabName}'!A1:append?valueInputOption=USER_ENTERED`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ values: valuesToSync })
         });
      };

      const curriculumRows = [["Subject Name", "Icon", "Topics (Comma Separated)"]];
      curriculums.forEach(c => {
         curriculumRows.push([c.name, (c as any).icon || "None", c.topics.join(", ")]);
      });

      try {
        await syncTab("Complaints & Feedbacks", ["Date", "User ID", "Name", "Email", "Category/Type", "Message", "Attachment URL/Data"], feedbackRows.slice(1));
        await syncTab("App Reviews", ["Date", "User ID", "Rating", "Review"], reviewRows.slice(1));
        await syncTab("Premium Users", ["Join Date", "Full Name", "Email", "User ID", "Exams Taken"], userRows.slice(1));
        await syncTab("Subject Curriculum", ["Subject Name", "Icon", "Topics (Comma Separated)"], curriculumRows.slice(1));
      } catch (tabErr: any) {
        // If tabs missing, we might need a batch update to create them
        console.error("Tab sync error - attempting to create tabs", tabErr);
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                requests: [
                    { addSheet: { properties: { title: "Complaints & Feedbacks" } } },
                    { addSheet: { properties: { title: "App Reviews" } } },
                    { addSheet: { properties: { title: "Premium Users" } } },
                    { addSheet: { properties: { title: "Subject Curriculum" } } }
                ]
            })
        });
        // Retry sync once
        await syncTab("Complaints & Feedbacks", ["Date", "User ID", "Name", "Email", "Category/Type", "Message", "Attachment URL/Data"], feedbackRows.slice(1));
        await syncTab("App Reviews", ["Date", "User ID", "Rating", "Review"], reviewRows.slice(1));
        await syncTab("Premium Users", ["Join Date", "Full Name", "Email", "User ID", "Exams Taken"], userRows.slice(1));
        await syncTab("Subject Curriculum", ["Subject Name", "Icon", "Topics (Comma Separated)"], curriculumRows.slice(1));
      }

      setStatus("Success! Master Database synced successfully.");
      const configRef = doc(db, "settings", "google_sheets");
      const docSnap = await getDoc(configRef);
      if (docSnap.exists()) setSheetUrl(docSnap.data().spreadsheetUrl);
      
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-dim font-body-md text-on-surface flex flex-col w-full">
      <Navbar />

      {/* Mobile Top Navigation (only visible under md:breakpoint) */}
      <nav className="bg-surface px-6 py-4 shadow-sm border-b border-outline-variant/30 sticky top-0 z-50 md:hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <Logo />
          </Link>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-primary font-bold text-sm hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="flex-1 min-w-0 overflow-y-auto w-full">
        <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 w-full">
        {/* Questions Upload Section */}
        <div className="bg-surface p-10 rounded-3xl shadow-sm border border-outline-variant/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-headline-md">
                Admin Database Panel
              </h1>
              <p className="text-on-surface-variant font-medium">
                Upload question banks to Firestore
              </p>
            </div>
          </div>

          <label
            className={`border-2 border-dashed border-primary/30 rounded-2xl p-12 block ${isUploading ? 'opacity-50 cursor-not-allowed bg-primary/5' : 'cursor-pointer hover:bg-primary/5'} transition-colors mb-6 text-center group`}
          >
            {isUploading ? (
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            ) : (
              <Upload className="w-12 h-12 text-primary/50 mx-auto mb-4 group-hover:text-primary transition-colors group-hover:-translate-y-1" />
            )}
            <span className="font-bold text-lg text-on-surface block mb-2">
              {isUploading ? "Uploading..." : "Select JSON File"}
            </span>
            <span className="text-on-surface-variant text-sm font-medium">
              {isUploading ? "Please wait while we process the questions" : "Drag and drop or click to browse"}
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading || isSyncing}
            />
          </label>
        </div>

        {/* Curriculum Management Section */}
        <div className="bg-surface p-10 rounded-3xl shadow-sm border border-outline-variant/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center">
              <Database className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-headline-md">
                Subject Curriculum
              </h2>
              <p className="text-on-surface-variant font-medium">
                Manage Subjects and override parsed topics
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
             {/* Subjects List */}
             <div className="w-full md:w-1/3 bg-surface-dim rounded-2xl p-4 border border-outline-variant/30 flex flex-col gap-3">
                <h3 className="font-bold text-sm tracking-wide text-on-surface uppercase mb-1">Subjects</h3>
                
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-2">
                   {curriculums.map(sub => {
                      const isEditing = editingSubjectId === sub.id;
                      return (
                         <div
                            key={sub.id}
                            onClick={() => !isEditing && setActiveSubjectId(sub.id)}
                            className={`group flex items-center justify-between p-2 pl-3 rounded-xl border transition-all ${
                               isEditing 
                               ? "bg-surface border-secondary"
                               : activeSubjectId === sub.id 
                               ? "bg-secondary text-white border-secondary shadow-md shadow-secondary/20 font-bold" 
                               : "bg-surface text-on-surface-variant hover:bg-surface-dim/80 border-outline-variant/30 font-medium"
                            } ${!isEditing ? "cursor-pointer" : ""}`}
                         >
                            {isEditing ? (
                               <div className="flex flex-col gap-1.5 w-full" onClick={e => e.stopPropagation()}>
                                  <input
                                     type="text"
                                     value={editingSubjectName}
                                     onChange={e => setEditingSubjectName(e.target.value)}
                                     className="px-2 py-1 text-xs bg-surface-dim text-on-surface border border-outline-variant/60 rounded-lg outline-none focus:border-secondary w-full"
                                     placeholder="Subject Name"
                                  />
                                  <input
                                     type="text"
                                     value={editingSubjectIcon}
                                     onChange={e => setEditingSubjectIcon(e.target.value)}
                                     className="px-2 py-1 text-xs bg-surface-dim text-on-surface border border-outline-variant/60 rounded-lg outline-none focus:border-secondary w-full"
                                     placeholder="Icon (e.g. Activity)"
                                  />
                                  <div className="flex justify-end gap-1 mt-1">
                                     <button
                                        onClick={() => setEditingSubjectId(null)}
                                        className="p-1 hover:bg-surface-dim rounded text-on-surface-variant"
                                     >
                                        <X className="w-3.5 h-3.5" />
                                     </button>
                                     <button
                                        onClick={() => handleEditSubjectSave(sub.id)}
                                        className="p-1 bg-secondary text-white hover:bg-secondary-dim rounded"
                                     >
                                        <Check className="w-3.5 h-3.5" />
                                     </button>
                                  </div>
                               </div>
                            ) : (
                               <>
                                  <span className="text-sm select-none break-words flex-1 pr-2">{sub.name}</span>
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button
                                        onClick={(e) => {
                                           e.stopPropagation();
                                           setEditingSubjectId(sub.id);
                                           setEditingSubjectName(sub.name);
                                           setEditingSubjectIcon((sub as any).icon || "");
                                        }}
                                        title="Rename Subject"
                                        className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors ${activeSubjectId === sub.id ? 'text-white' : 'text-on-surface-variant'}`}
                                     >
                                        <Edit2 className="w-3.5 h-3.5" />
                                     </button>
                                     <button
                                        onClick={(e) => {
                                           e.stopPropagation();
                                           handleDeleteSubject(sub.id, sub.name);
                                        }}
                                        title="Delete Subject"
                                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-error transition-colors"
                                     >
                                        <Trash2 className="w-3.5 h-3.5" />
                                     </button>
                                  </div>
                               </>
                            )}
                         </div>
                      );
                   })}
                   {curriculums.length === 0 && (
                      <div className="text-xs text-on-surface-variant p-2 italic text-center">No subjects yet</div>
                   )}
                </div>

                <div className="mt-auto pt-4 border-t border-outline-variant/30 flex flex-col gap-2">
                   <button 
                      onClick={handleSeedAllSubjects}
                      disabled={isUploading}
                      className="py-2 bg-surface text-secondary border border-secondary text-[10px] font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 transition-colors mb-2"
                   >
                      Seed Core Subjects
                   </button>
                   <input
                      type="text"
                      placeholder="New subject..."
                      value={newSubjectName}
                      onChange={e => setNewSubjectName(e.target.value)}
                      className="px-3 py-2 text-sm bg-surface border border-outline-variant/60 rounded-xl focus:border-secondary outline-none"
                   />
                   <input
                      type="text"
                      placeholder="Icon name (e.g., BookOpen)"
                      value={newSubjectIcon}
                      onChange={e => setNewSubjectIcon(e.target.value)}
                      className="px-3 py-2 text-sm bg-surface border border-outline-variant/60 rounded-xl focus:border-secondary outline-none"
                   />
                   <button 
                      onClick={handleAddSubject}
                      disabled={!newSubjectName.trim() || isUploading}
                      className="py-2 bg-secondary text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors"
                   >
                      Add Subject
                   </button>
                </div>
             </div>

             {/* Topics List */}
             <div className="w-full md:w-2/3 bg-surface-dim rounded-2xl p-4 border border-outline-variant/30 flex flex-col min-h-[300px]">
                <h3 className="font-bold text-sm tracking-wide text-on-surface uppercase mb-3">
                   Topics for {curriculums.find(c => c.id === activeSubjectId)?.name || '...'}
                </h3>
                
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 mb-4">
                   {activeSubjectId && curriculums.find(c => c.id === activeSubjectId)?.topics.map((topic, i) => {
                      const isEditingTopic = editingTopicId?.subId === activeSubjectId && editingTopicId?.index === i;
                      return (
                         <div key={i} className="flex justify-between items-center px-4 py-2 bg-surface rounded-xl border border-outline-variant/50 group min-h-[44px]">
                            {isEditingTopic ? (
                               <div className="flex items-center gap-2 w-full">
                                  <input
                                     type="text"
                                     value={editingTopicName}
                                     onChange={e => setEditingTopicName(e.target.value)}
                                     className="flex-1 px-3 py-1.5 text-xs bg-surface-dim text-on-surface border border-outline-variant/60 rounded-lg outline-none focus:border-secondary"
                                     placeholder="Topic Name"
                                  />
                                  <button
                                     onClick={() => setEditingTopicId(null)}
                                     className="p-1 hover:bg-surface-dim rounded-lg text-on-surface-variant transition-colors"
                                  >
                                     <X className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                     onClick={() => handleEditTopicSave(i)}
                                     className="p-1 bg-secondary text-white hover:bg-secondary/90 rounded-lg transition-colors"
                                  >
                                     <Check className="w-3.5 h-3.5" />
                                  </button>
                               </div>
                            ) : (
                               <>
                                  <span className="text-sm font-medium text-on-surface flex-1 pr-2 break-all">{topic}</span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button 
                                        onClick={() => {
                                           setEditingTopicId({ subId: activeSubjectId, index: i });
                                           setEditingTopicName(topic);
                                        }}
                                        className="text-on-surface-variant p-1.5 hover:bg-surface-dim rounded-lg transition-all"
                                        title="Rename Topic"
                                     >
                                        <Edit2 className="w-3.5 h-3.5" />
                                     </button>
                                     <button 
                                        onClick={() => handleDeleteTopic(i)}
                                        className="text-error p-1.5 hover:bg-error/10 rounded-lg transition-all"
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
                   {activeSubjectId && curriculums.find(c => c.id === activeSubjectId)?.topics.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-sm text-on-surface-variant font-medium">
                         No topics added to this subject yet.
                      </div>
                   )}
                   {!activeSubjectId && (
                      <div className="flex-1 flex items-center justify-center text-sm text-on-surface-variant font-medium">
                         Select a subject to view topics.
                      </div>
                   )}
                </div>

                <div className="pt-3 border-t border-outline-variant/30 flex gap-2">
                   <input
                      type="text"
                      placeholder="Add a new topic..."
                      value={newTopicName}
                      onChange={e => setNewTopicName(e.target.value)}
                      disabled={!activeSubjectId}
                      className="flex-1 px-4 py-2 text-sm bg-surface border border-outline-variant/60 rounded-xl focus:border-secondary outline-none disabled:opacity-50"
                   />
                   <button 
                      onClick={handleAddTopic}
                      disabled={!activeSubjectId || !newTopicName.trim() || isUploading}
                      className="px-5 py-2 bg-secondary text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
                   >
                      Add Topic
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Feedback Sync Section */}
        <div className="bg-surface p-10 rounded-3xl shadow-sm border border-outline-variant/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-600/10 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-headline-md text-on-surface">
                Master Database Sync
              </h2>
              <p className="text-on-surface-variant font-medium">
                Sync complaints, reviews, and premium user data to Google Sheets.
              </p>
            </div>
          </div>

          <div className="mb-6">
            {sheetUrl && (
              <div className="p-4 bg-surface-dim rounded-xl border border-outline-variant/30 flex justify-between items-center">
                <div className="text-xs text-on-surface-variant font-medium">
                  <span className="text-gray-400">Current Sheet:</span>{" "}
                  <a href={sheetUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                    Master Analytics Database
                  </a>
                </div>
                <Database className="w-4 h-4 text-primary/40" />
              </div>
            )}
          </div>
          
          <button
             onClick={syncAllToMasterSheet}
             disabled={isSyncing || isUploading}
             className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl flex justify-center items-center gap-3 hover:bg-green-700 transition-all disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-green-500/20 active:scale-[0.98]"
          >
             {isSyncing ? (
               <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
             ) : (
               <>
                 <FileSpreadsheet className="w-6 h-6" />
                 Sync Master Databases
               </>
             )}
          </button>
        </div>

        {status && (
          <div
            className={`p-4 rounded-xl border font-semibold flex items-center gap-3 ${status.startsWith("Error") ? "bg-error/10 border-error/20 text-error" : status.startsWith("Success") ? "bg-green-600/10 border-green-600/20 text-green-600" : "bg-primary/10 border-primary/20 text-primary"}`}
          >
            {status.startsWith("Error") ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            ) : status.startsWith("Success") ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            <span>{status}</span>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
