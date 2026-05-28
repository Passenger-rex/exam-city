import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronLeft, ChevronRight, Mic, MicOff, History, Plus, Trash2, Clock, Edit2, Check, Award } from "lucide-react";
import { useUser } from "../UserContext";
import Markdown from "react-markdown";
import { useNavigate } from "react-router-dom";
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
  const [isListening, setIsListening] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Session History State
  const { profile } = useUser();
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setMicPermissionDenied(true);
        }
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue((prev) => (prev ? prev + " " : "") + transcript);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      setMicPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          if (event.error === 'not-allowed') {
            setMicPermissionDenied(true);
          }
          setIsListening(false);
        };
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue((prev) => (prev ? prev + " " : "") + transcript);
        };
        recognitionRef.current = recognition;
        recognition.start();
      } else {
        alert("Speech recognition is not fully supported in this browser environment. Please make sure microphone access is enabled in your system preferences.");
      }
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setMicPermissionDenied(true);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      requestMicrophonePermission();
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Failed to start speech recognition directly, requesting media prompt:", e);
        requestMicrophonePermission();
      }
    }
  };

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
    
    const q = query(
      collection(db, "tutor_sessions"),
      where("userId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(loaded);
      setSessionsLoading(false);
    }, (error) => {
      console.error("Error on tutor_sessions snapshot:", error);
      handleFirestoreError(error, OperationType.LIST, "tutor_sessions");
      setSessionsLoading(false);
    });
    
    return () => unsubscribe();
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
    <div className="min-h-screen bg-surface flex flex-row font-sans h-screen overflow-hidden relative">
       {/* Backdrop on mobile */}
       {sidebarOpen && (
          <div 
             onClick={() => setSidebarOpen(false)}
             className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-all"
          />
       )}

       {/* Sidebar for tutoring history */}
       <aside className={`fixed inset-y-0 left-0 z-50 lg:relative bg-surface border-r border-outline-variant/30 flex flex-col h-full transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0 w-[80vw] sm:w-[320px] shrink-0' : '-translate-x-full lg:translate-x-0 lg:w-[320px] shrink-0'}`}>
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
                    <span className="text-[9px] text-primary font-bold">Refer 5 friends to unlock lifetime PRO!</span>
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

          {micPermissionDenied && (
            <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 shrink-0">
              <div className="max-w-4xl mx-auto text-sm text-red-600 font-medium flex justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0"></span>
                  <span>Microphone access was denied or speech recognition is not supported. Click Connect to grant device access.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={requestMicrophonePermission} 
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Connect
                  </button>
                  <button onClick={() => setMicPermissionDenied(false)} className="p-1 hover:bg-red-500/10 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

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
                                <Markdown>{m.text}</Markdown>
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
             <div className="max-w-4xl mx-auto w-full flex gap-2 sm:gap-3 items-center relative">
                 <div className="flex-1 relative flex items-center">
                   <input
                      type="text"
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      placeholder={isListening ? "Listening..." : "Ask a question or request a study plan..."}
                      className={`w-full bg-surface-dim/50 border border-outline-variant/60 pl-5 pr-14 py-4 rounded-full text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60 ${isListening ? "border-red-500/50 bg-red-500/5 ring-2 ring-red-500/20" : ""}`}
                   />
                   
                   <button
                     onClick={toggleListening}
                     className={`absolute right-3 p-2 rounded-full transition-colors ${isListening ? "text-red-500 animate-pulse bg-red-500/10" : "text-primary/60 hover:text-primary hover:bg-primary/10"}`}
                     aria-label={isListening ? "Stop listening" : "Start listening"}
                   >
                     {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                   </button>
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
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-surface border border-outline-variant/40 rounded-3xl p-6 sm:p-10 max-w-md w-full shadow-2xl text-center relative overflow-hidden font-sans"
             >
               <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary to-amber-500" />
               <button 
                 onClick={() => setShowUpgradeModal(false)}
                 className="absolute top-4 right-4 p-2 text-on-surface-variant/80 hover:text-on-surface hover:bg-surface-dim rounded-full transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
               
               <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/25">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
               </div>
               
               <h3 className="text-2xl font-black text-on-surface mb-3 tracking-tight">Daily Coach Limit Reached</h3>
               <p className="text-on-surface-variant text-sm font-medium leading-relaxed mb-8">
                 You have used all your **5 free daily questions**. Upgrade to a lifetime plan to unlock continuous live tutoring, infinite analytics, and no daily constraints ever again!
               </p>
               
               <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-primary text-white py-3 px-4 rounded-xl font-bold text-sm tracking-tight hover:bg-primary/95 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                     Upgrade Now
                  </button>
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full bg-surface border border-outline-variant/60 text-on-surface-variant py-3 px-4 rounded-xl font-bold text-sm tracking-tight hover:bg-surface-dim transition-colors"
                  >
                     Keep Studying
                  </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
}
