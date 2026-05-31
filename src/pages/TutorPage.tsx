import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronLeft, ChevronRight, History, Plus, Trash2, Clock, Edit2, Check, Award, Paperclip, FileText, Image } from "lucide-react";
import { useUser } from "../UserContext";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { db, auth } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function TutorPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: 'Hi! I am your AI Study Coach. Need study tips or help with a tricky topic?' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Session History State
  const { profile } = useUser();
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // File Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [documentDifficulty, setDocumentDifficulty] = useState<string>("standard");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const resultString = reader.result as string;
        const base64Data = resultString.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert("File size cannot exceed 10MB.");
        return;
      }
      setSelectedFile(file);
      setUploadError("");
    }
  };

  const handleProcessFile = async (action: "tutor" | "exam") => {
    if (!selectedFile) return;
    
    setIsFileUploading(true);
    setIsLoading(true);
    setUploadError("");
    sessionStorage.removeItem("customUploadedExam");
    
    if (profile?.tier !== "pro" && auth.currentUser) {
      const todayStr = new Date().toISOString().split('T')[0];
      const queriesUsedToday = profile?.lastTutorQueryDate === todayStr ? (profile?.tutorQueriesUsed || 0) : 0;
      if (queriesUsedToday >= 5) {
        setShowUpgradeModal(true);
        setIsFileUploading(false);
        setIsLoading(false);
        return;
      }
    }
    
    try {
      const base64Data = await fileToBase64(selectedFile);
      
      const res = await fetch("/api/process-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: selectedFile.type || "application/octet-stream",
          fileName: selectedFile.name,
          action: action,
          level: documentDifficulty,
          message: action === "tutor" ? "Summarize this file and list 5 important conceptual questions we can study." : ""
        })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process study material.");
      }
      
      if (action === "tutor") {
        const userMsgText = `Uploaded file "${selectedFile.name}" to study.`;
        const newUserMessage = { role: "user" as const, text: userMsgText };
        const responseMsg = { role: "model" as const, text: data.text };
        
        const finalMessages = [...messages, newUserMessage, responseMsg];
        setMessages(finalMessages);
        setSelectedFile(null);
        
        if (user) {
          try {
            if (currentSessionId) {
              const docRef = doc(db, "tutor_sessions", currentSessionId);
              await updateDoc(docRef, {
                messages: finalMessages,
                updatedAt: new Date()
              });
            } else {
              const newSessionRef = await addDoc(collection(db, "tutor_sessions"), {
                userId: user.uid,
                title: `Study of ${selectedFile.name}`,
                messages: finalMessages,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              setCurrentSessionId(newSessionRef.id);
              navigate(`/tutor?session=${newSessionRef.id}`, { replace: true });
            }
          } catch (fErr) {
            console.error("Failed to sync file session:", fErr);
          }
        }
      } else if (action === "exam") {
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          const examSubject = data.subject || "Uploaded Study Material";
          sessionStorage.setItem("customUploadedExam", JSON.stringify({
             subject: examSubject,
             questions: data.questions
          }));
          setSelectedFile(null);
          navigate(`/exam?uploaded_exam=true&type=standard&bank=premium&subject=${encodeURIComponent(examSubject)}&level=${documentDifficulty}`);
        } else {
          throw new Error("No questions were generated from the uploaded content.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "An error occurred while uploading. Please ensure file content is readable.");
    } finally {
      setIsFileUploading(false);
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);



  const handleRenameConfirm = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitleValue.trim()) return;
    try {
      const docRef = doc(db, "tutor_sessions", sessionId);
      await updateDoc(docRef, { title: editTitleValue.trim() });
      setEditingSessionId(null);
    } catch (err) {
      console.error("Error renaming session document:", err);
    }
  };

  // Real-time synchronization of past tutoring sessions list
  useEffect(() => {
    if (!user) return;
    setSessionsLoading(true);
    
    const safetyTimeout = setTimeout(() => {
      console.warn("Tutor sessions loading timeout.");
      setSessionsLoading(false);
    }, 4500);

    const q = query(
      collection(db, "tutor_sessions"),
      where("userId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      clearTimeout(safetyTimeout);
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(loaded);
      setSessionsLoading(false);
    }, (error) => {
      clearTimeout(safetyTimeout);
      console.error("Error on tutor_sessions snapshot:", error);
      handleFirestoreError(error, OperationType.LIST, "tutor_sessions");
      setSessionsLoading(false);
    });
    
    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, [user]);

  // Load a session if set in search params or fallback
  useEffect(() => {
    if (!user) return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const sessionIdParam = searchParams.get("session");
    
    if (sessionIdParam) {
      const loadSession = async (sessionId: string) => {
        setIsLoading(true);
        try {
          const docRef = doc(db, "tutor_sessions", sessionId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().userId === user.uid) {
            setMessages(docSnap.data().messages || []);
            setCurrentSessionId(sessionId);
          } else {
            console.error("Session does not exist or access denied.");
            setCurrentSessionId(null);
          }
        } catch (err) {
          console.error("Error loading tutor session:", err);
          handleFirestoreError(err, OperationType.GET, `tutor_sessions/${sessionId}`);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadSession(sessionIdParam);
    } else {
      setMessages([
        { role: 'model', text: 'Hi! I am your AI Study Coach. Need study tips or help with a tricky topic?' }
      ]);
      setCurrentSessionId(null);
    }
  }, [user, window.location.search]);

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat session?")) return;
    
    try {
      await deleteDoc(doc(db, "tutor_sessions", sessionId));
      if (currentSessionId === sessionId) {
        navigate("/tutor", { replace: true });
      }
    } catch (err) {
      console.error("Error deleting session:", err);
      handleFirestoreError(err, OperationType.DELETE, `tutor_sessions/${sessionId}`);
    }
  };

  const handleNewChat = () => {
    navigate("/tutor", { replace: true });
    setMessages([
      { role: 'model', text: 'Hi! I am your AI Study Coach. Need study tips or help with a tricky topic?' }
    ]);
    setCurrentSessionId(null);
    setSidebarOpen(false);
  };

  // If not logged in, optionally redirect or show a message
  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
         <h1 className="text-2xl font-bold mb-4">Please log in to chat with the Study Coach</h1>
         <button onClick={() => navigate('/login')} className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90">
            Log In
         </button>
      </div>
    );
  }

  const handleSend = async () => {
    if(!inputValue.trim()) return;

    if (profile?.tier !== "pro" && auth.currentUser) {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastQueryDate = profile.lastTutorQueryDate;
      const queriesUsedToday = lastQueryDate === todayStr ? (profile.tutorQueriesUsed || 0) : 0;
      if (queriesUsedToday >= 5) {
        setShowUpgradeModal(true);
        return;
      }
    }

    const userMessage = { role: 'user' as const, text: inputValue };
    const promptText = inputValue;
    
    const messagesBeforeResponse = [...messages, userMessage];
    setMessages(messagesBeforeResponse);
    setInputValue("");
    setIsLoading(true);

    let finalMessages = [...messagesBeforeResponse];

    try {
       const res = await fetch('/api/chatbot', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
             level: documentDifficulty,
             messages: messagesBeforeResponse.map(m => ({
               role: m.role,
               parts: [{text: m.text}]
             }))
          })
       });
       
       let data;
       try {
          const text = await res.text();
          data = JSON.parse(text);
       } catch (err) {
          console.error("Failed to parse response:", err);
          const errorMsg = {role: 'model' as const, text: `Server error (${res.status}): Please try again.`};
          finalMessages.push(errorMsg);
          setMessages(finalMessages);
          return;
       }

       if(data.success) {
         const responseMsg = {role: 'model' as const, text: data.text};
         finalMessages.push(responseMsg);
         setMessages(finalMessages);

         // Increment daily queries if free tier
         if (profile?.tier !== "pro" && auth.currentUser) {
            try {
               const todayStr = new Date().toISOString().split('T')[0];
               const lastQueryDate = profile.lastTutorQueryDate;
               const currentUsed = lastQueryDate === todayStr ? (profile.tutorQueriesUsed || 0) : 0;
               
               await updateDoc(doc(db, "users", auth.currentUser.uid), {
                  tutorQueriesUsed: currentUsed + 1,
                  lastTutorQueryDate: todayStr
               });
            } catch (updateErr) {
               console.error("Failed to update query count:", updateErr);
            }
         }
       } else {
         const errorMsg = {role: 'model' as const, text: data.error || 'Sorry, I am having trouble connecting right now.'};
         finalMessages.push(errorMsg);
         setMessages(finalMessages);
       }
    } catch(e: any) {
       const errorMsg = {role: 'model' as const, text: 'Error connecting to the Study Coach: ' + e.message};
       finalMessages.push(errorMsg);
       setMessages(finalMessages);
    } finally {
       setIsLoading(false);
       
       // Sync to Firestore in background
       if (user) {
         try {
           if (currentSessionId) {
             const docRef = doc(db, "tutor_sessions", currentSessionId);
             await updateDoc(docRef, {
               messages: finalMessages,
               updatedAt: new Date()
             });
           } else {
             const cleanTitle = promptText.length > 50 ? promptText.slice(0, 50) + "..." : promptText;
             const newSessionRef = await addDoc(collection(db, "tutor_sessions"), {
               userId: user.uid,
               title: cleanTitle,
               messages: finalMessages,
               createdAt: new Date(),
               updatedAt: new Date()
             });
             setCurrentSessionId(newSessionRef.id);
             navigate(`/tutor?session=${newSessionRef.id}`, { replace: true });
           }
         } catch (fErr) {
           console.error("Failed to save session:", fErr);
           handleFirestoreError(fErr, currentSessionId ? OperationType.UPDATE : OperationType.CREATE, "tutor_sessions");
         }
       }
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans h-screen overflow-hidden relative w-full">
       <Navbar />
       <div className="flex-1 flex flex-row relative overflow-hidden w-full h-full">
         {/* Backdrop on mobile and desktop */}
         {sidebarOpen && (
            <div 
               onClick={() => setSidebarOpen(false)}
               className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-all"
            />
         )}

         {/* Collapsible history drawer */}
         <aside className={`fixed inset-y-0 left-0 z-50 bg-surface border-r border-outline-variant/30 flex flex-col h-full transform transition-all duration-300 ease-in-out shadow-2xl ${sidebarOpen ? 'translate-x-0 w-[80vw] sm:w-[320px] shrink-0' : '-translate-x-full w-[80vw] sm:w-[320px] shrink-0'}`}>
          <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-on-surface tracking-tight text-base">Study History</h2>
             </div>
             
             <div className="flex items-center gap-2">
                {/* New Chat Button */}
                <button
                   onClick={handleNewChat}
                   className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-all flex items-center gap-1 font-bold text-xs"
                   title="Start New Chat"
                >
                   <Plus className="w-4.5 h-4.5" />
                   <span className="hidden sm:inline">New</span>
                </button>
                
                {/* Close sidebar button on mobile */}
                <button
                   onClick={() => setSidebarOpen(false)}
                   className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-dim transition-colors lg:hidden"
                   aria-label="Close history"
                >
                   <X className="w-4 h-4" />
                </button>
             </div>
          </div>

          {/* Past Sessions List */}
           <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
              {sessionsLoading ? (
                 <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-on-surface-variant/70 font-medium tracking-wide">Loading history...</p>
                 </div>
              ) : sessions.length === 0 ? (
                 <div className="text-center py-10 space-y-3 px-4">
                    <div className="w-12 h-12 bg-surface-dim rounded-full flex items-center justify-center mx-auto mb-2 border border-outline-variant/30">
                      <MessageSquare className="w-5 h-5 text-on-surface-variant/50" />
                    </div>
                    <p className="text-sm text-on-surface font-medium">No chat history</p>
                    <p className="text-xs text-on-surface-variant/70">Start a new conversation to see it here.</p>
                 </div>
              ) : (
                 (() => {
                    const now = new Date();
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

                    const grouped = sessions.reduce((acc, sess) => {
                       const time = sess.updatedAt?.toDate()?.getTime() || 0;
                       if (time >= todayStart) acc.today.push(sess);
                       else if (time >= weekStart) acc.week.push(sess);
                       else acc.older.push(sess);
                       return acc;
                    }, { today: [], week: [], older: [] } as { today: any[], week: any[], older: any[] });

                    const renderGroup = (title: string, list: any[]) => {
                       if (list.length === 0) return null;
                       return (
                          <div className="space-y-1">
                             <h3 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 ml-2 mb-2 mt-2">{title}</h3>
                             {list.map((sess) => {
                                const isActive = currentSessionId === sess.id;
                                const isEditing = editingSessionId === sess.id;
                                
                                return (
                                   <div
                                      key={sess.id}
                                      onClick={() => {
                                         if (!isEditing) {
                                            navigate(`/tutor?session=${sess.id}`, { replace: true });
                                            setSidebarOpen(false);
                                         }
                                      }}
                                      className={`w-full text-left p-2 rounded-xl flex items-center gap-3 border text-sm transition-all cursor-pointer group relative ${isActive ? 'bg-primary/5 border-primary/20 text-on-surface shadow-sm' : 'bg-transparent border-transparent text-on-surface-variant hover:bg-surface-dim hover:text-on-surface'}`}
                                   >
                                      {isEditing ? (
                                         <div 
                                           onClick={(e) => e.stopPropagation()} 
                                           className="w-full flex items-center gap-1 p-1 bg-surface-dim/80 rounded-lg border border-primary/40 relative z-20"
                                         >
                                           <input 
                                             type="text" 
                                             value={editTitleValue}
                                             onChange={(e) => setEditTitleValue(e.target.value)}
                                             onKeyDown={(e) => {
                                               if (e.key === 'Enter') handleRenameConfirm(sess.id, e as any);
                                               if (e.key === 'Escape') setEditingSessionId(null);
                                             }}
                                             autoFocus
                                             className="flex-1 bg-transparent border-0 text-xs px-2 py-1 outline-none font-medium text-on-surface"
                                           />
                                           <button 
                                             onClick={(e) => handleRenameConfirm(sess.id, e)} 
                                             className="p-1 text-green-500 hover:bg-green-500/15 rounded-md"
                                           >
                                             <Check className="w-3.5 h-3.5" />
                                          </button>
                                          <button 
                                            onClick={() => setEditingSessionId(null)} 
                                            className="p-1 text-on-surface-variant hover:bg-surface-bright rounded-md"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                     ) : (
                                        <>
                                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'bg-surface-dim group-hover:bg-primary/5 group-hover:text-primary text-on-surface-variant/60'}`}>
                                             <MessageSquare className="w-4 h-4" />
                                           </div>
                                           <div className="pr-16 overflow-hidden w-full">
                                              <p className={`truncate text-xs leading-tight transition-colors ${isActive ? 'font-bold text-primary' : 'font-medium group-hover:text-on-surface'}`}>{sess.title || "Untitled Session"}</p>
                                           </div>
                                           
                                           {/* Rename chat button */}
                                           <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingSessionId(sess.id);
                                                setEditTitleValue(sess.title || "Untitled Session");
                                              }}
                                              className="p-1 hover:bg-primary/10 text-on-surface-variant/40 hover:text-primary rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all absolute right-8 bg-surface/90 backdrop-blur-sm shadow-sm border border-outline-variant/10"
                                              title="Rename chat"
                                           >
                                              <Edit2 className="w-3.5 h-3.5" />
                                           </button>

                                           {/* Delete Session Button */}
                                           <button
                                              onClick={(e) => handleDeleteSession(sess.id, e)}
                                              className="p-1 hover:bg-red-500/10 text-on-surface-variant/40 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all absolute right-1.5 bg-surface/90 backdrop-blur-sm shadow-sm border border-outline-variant/10"
                                              title="Delete chat"
                                           >
                                              <Trash2 className="w-3.5 h-3.5" />
                                           </button>
                                        </>
                                     )}
                                  </div>
                               );
                            })}
                         </div>
                      );
                   };

                   return (
                      <div className="space-y-4">
                         {renderGroup("Today", grouped.today)}
                         {renderGroup("Previous 7 Days", grouped.week)}
                         {renderGroup("Older", grouped.older)}
                      </div>
                   );
                })()
             )}
          </div>

          {/* Sidebar Footer - Account Status */}
          <div className="p-3 border-t border-outline-variant/30 bg-surface-dim/40 shrink-0">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-outline-variant/40 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.email?.charAt(0).toUpperCase() || "S"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-on-surface truncate leading-none">
                    {user?.displayName || "Student User"}
                  </p>
                  <p className="text-[9px] text-on-surface-variant/60 font-medium truncate mt-0.5 leading-none">
                    {user?.email}
                  </p>
                </div>
              </div>
              {profile?.tier === "pro" ? (
                <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                  <Award className="w-2 h-2 animate-pulse" /> Pro
                </span>
              ) : (
                <button
                  onClick={() => navigate("/checkout")}
                  className="text-[8px] font-extrabold uppercase tracking-wider bg-primary text-white hover:bg-primary/95 px-1.5 py-0.5 rounded-full shrink-0 transition-all hover:scale-105 active:scale-95"
                >
                  Upgrade
                </button>
              )}
            </div>
            
            {/* Referral Link Quick Promo */}
            {profile?.tier !== "pro" && (
               <div onClick={() => navigate("/profile")} className="mt-1.5 p-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/10 flex items-center justify-between cursor-pointer group transition-all">
                 <div className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-primary" />
                    <span className="text-[9px] text-primary font-bold">Refer 12 friends to unlock lifetime PRO!</span>
                 </div>
                 <ChevronRight className="w-2.5 h-2.5 text-primary group-hover:translate-x-0.5 transition-transform" />
               </div>
            )}
          </div>
       </aside>

       {/* Chat Area */}
       <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Header */}
          <header className="bg-surface px-4 py-3 sm:py-4 shadow-sm z-10 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-3 sm:gap-4 max-w-4xl mx-auto w-full">
                <button
                   onClick={() => navigate(-1)}
                   className="p-2 -ml-2 rounded-lg text-on-surface-variant hover:bg-surface-dim transition-colors"
                   aria-label="Go back"
                >
                   <ChevronLeft className="w-6 h-6" />
                </button>
                
                <button
                   onClick={() => setSidebarOpen(!sidebarOpen)}
                   className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-dim transition-colors"
                   aria-label="Toggle history panel"
                   title="Study Coach History"
                >
                   <History className="w-5.5 h-5.5 text-primary" />
                </button>

                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                      <Sparkles className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                      <h1 className="font-bold text-lg text-on-surface tracking-tight">AI Study Coach</h1>
                      <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5 mt-0.5">
                         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                         Online
                      </p>
                   </div>
                </div>
             </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-dim/30 flex flex-col custom-scrollbar scroll-smooth">
             <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
                 {messages.map((m, idx) => (
                    <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       key={idx} 
                       className={`flex max-w-[88%] sm:max-w-[75%] ${m.role === 'model' ? 'self-start' : 'self-end'}`}
                    >
                       {m.role === 'model' && (
                          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 text-primary flex items-center justify-center mr-3 mt-auto shadow-sm hidden sm:flex">
                             <Bot className="w-5 h-5" />
                          </div>
                       )}
                       <div className={`p-4 sm:p-5 rounded-3xl text-sm font-normal font-sans leading-normal tracking-wide ${m.role === 'model' ? 'bg-surface border border-outline-variant/40 text-on-surface rounded-bl-sm shadow-sm' : 'bg-gradient-to-tr from-primary to-primary/90 text-white rounded-br-sm shadow-md'}`}>
                          {m.role === 'user' ? (
                             <p className="whitespace-pre-wrap font-normal">{m.text}</p>
                          ) : (
                             <div className="markdown-body prose prose-sm max-w-none prose-p:font-normal prose-headings:font-normal prose-strong:font-medium text-on-surface font-normal">
                                <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>{m.text}</Markdown>
                             </div>
                          )}
                       </div>
                    </motion.div>
                 ))}
                 {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex self-start max-w-[80%] items-end">
                       <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 text-primary items-center justify-center mr-3 hidden sm:flex">
                          <Bot className="w-5 h-5" />
                       </div>
                       <div className="px-5 py-4 rounded-3xl bg-surface border border-outline-variant/40 rounded-bl-sm shadow-sm flex items-center gap-2 h-12 relative overflow-hidden">
                          <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce delay-75"></div>
                          <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce delay-150"></div>
                       </div>
                    </motion.div>
                 )}
                 <div ref={messagesEndRef} className="h-4" />
             </div>
          </div>

          {/* Input */}
          <div className="px-5 py-4 sm:px-6 sm:py-6 bg-surface border-t border-outline-variant/20 shrink-0">
             {profile?.tier !== "pro" && (() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const queriesUsedToday = profile?.lastTutorQueryDate === todayStr ? (profile?.tutorQueriesUsed || 0) : 0;
                const queriesRemaining = Math.max(0, 5 - queriesUsedToday);
                return (
                   <div className="max-w-4xl mx-auto mb-3 flex flex-row items-center justify-between text-[11px] font-bold text-on-surface-variant/80 border border-outline-variant/30 bg-surface-dim/40 px-4 py-2 sm:py-2.5 sm:px-5 rounded-full select-none shadow-sm gap-2 w-full">
                      <span className="flex items-center gap-1.5 min-w-0">
                         <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse shrink-0" />
                         <span className="truncate">Free Tier: {queriesRemaining} of 5 daily tutor questions remaining</span>
                      </span>
                      <button 
                         onClick={() => navigate('/checkout')}
                         className="text-primary hover:text-primary/90 hover:underline flex items-center gap-1 shrink-0 font-extrabold"
                      >
                         Upgrade for unlimited →
                      </button>
                   </div>
                );
             })()}

             {/* File Preview Card */}
             {selectedFile && (
                <div className="max-w-4xl mx-auto w-full mb-3 bg-white hover:shadow-md border border-outline-variant/50 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-sm text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {selectedFile.type.startsWith("image/") ? (
                        <Image className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate max-w-[250px] sm:max-w-sm">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-on-surface-variant/60 font-semibold uppercase tracking-wider mt-0.5 font-mono">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto shrink-0">
                    <select
                      value={documentDifficulty}
                      onChange={(e) => setDocumentDifficulty(e.target.value)}
                      className="w-full sm:w-32 py-2.5 px-3 bg-surface-dim border border-outline-variant/40 rounded-xl outline-none text-xs font-semibold cursor-pointer appearance-none text-on-surface"
                      disabled={isLoading}
                    >
                      <option value="standard">Standard Level</option>
                      <option value="undergrad">Undergrad (100-300L)</option>
                      <option value="advanced">Advanced (400-600L)</option>
                      <option value="postgrad">Postgraduate</option>
                      <option value="professional">Professional</option>
                    </select>
                    
                    <button
                      type="button"
                      onClick={() => handleProcessFile("tutor")}
                      disabled={isLoading}
                      className="w-full sm:w-auto py-2.5 px-4 bg-primary/10 text-primary hover:bg-primary/15 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl font-bold text-xs cursor-pointer text-center"
                    >
                      {isFileUploading ? "Analyzing..." : "Generate Questions"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProcessFile("exam")}
                      disabled={isLoading}
                      className="w-full sm:w-auto py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Generate Mock Exam
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      disabled={isLoading}
                      className="p-2.5 text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer self-stretch flex items-center justify-center"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
             )}
              
             {uploadError && (
               <div className="max-w-4xl mx-auto w-full mb-3 text-red-600 text-xs font-semibold px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-left">
                 {uploadError}
               </div>
             )}

             <div className="max-w-4xl mx-auto w-full flex gap-2 sm:gap-3 items-center relative">
                 <div className="flex-1 relative flex items-center">
                   {/* Hidden File Input */}
                   <input
                     type="file"
                     ref={fileInputRef}
                     onChange={handleFileChange}
                     accept=".pdf,.docx,.doc,image/*"
                     className="hidden"
                   />
                   
                   {/* Paperclip Button */}
                   <button
                     type="button"
                     onClick={() => fileInputRef.current?.click()}
                     className="absolute left-3.5 p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-200 cursor-pointer z-10"
                     title="Upload pdf, document or image"
                   >
                     <Paperclip className="w-5 h-5" />
                   </button>

                   <input
                      type="text"
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      placeholder="Ask questions or upload docs/images to generate questions..."
                      className="w-full bg-surface-dim/50 border border-outline-variant/60 pl-12 pr-5 py-4 rounded-full text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60"
                   />
                 </div>
                 <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="w-14 h-14 shrink-0 bg-primary text-white flex items-center justify-center rounded-full hover:bg-primary/90 hover:scale-105 active:scale-95 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-primary shadow-md"
                    aria-label="Send message"
                 >
                    <Send className="w-6 h-6 -ml-0.5 mt-0.5 fill-white" />
                 </button>
             </div>
          </div>
       </div>

       {/* Upgrade Limit Dialog Modal */}
       <AnimatePresence>
         {showUpgradeModal && (
           <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="bg-surface border border-outline-variant/30 rounded-[32px] p-8 sm:p-10 max-w-md w-full shadow-2xl text-center relative overflow-hidden font-sans flex flex-col"
             >
               <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary to-amber-500" />
               <button 
                 onClick={() => setShowUpgradeModal(false)}
                 className="absolute top-4 right-4 p-2 text-on-surface-variant/80 hover:text-on-surface hover:bg-surface-dim rounded-full transition-all active:scale-90 border border-outline-variant/20"
               >
                 <X className="w-5 h-5" />
               </button>
               
               <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/25 rotate-3">
                  <Sparkles className="w-10 h-10 text-primary animate-pulse" />
               </div>
               
               <h3 className="text-2xl font-black text-on-surface mb-3 tracking-tight font-headline-md">Study Coach Limit</h3>
               <p className="text-on-surface-variant text-base font-medium leading-relaxed mb-10">
                 You've hit your **5 free daily questions**. Unlock unlimited coaching, predictive analytics, and premium question banks with Pro.
               </p>
               
               <div className="flex flex-col gap-3">
                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-primary text-on-primary py-4 px-6 rounded-2xl font-bold text-[15px] tracking-tight hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
                  >
                     Upgrade to Unlock All
                  </button>
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full bg-surface-dim border border-outline-variant/60 text-on-surface font-bold py-4 px-6 rounded-2xl text-[15px] tracking-tight hover:bg-surface-container transition-all active:scale-95"
                  >
                     Continue with Basics
                  </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
       </div>
    </div>
  );
}