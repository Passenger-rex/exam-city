import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronLeft, Mic, MicOff, History, Plus, Trash2, Clock } from "lucide-react";
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
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setMicPermissionDenied(true); // Or we could add a new state for browserNotSupported, but reusing this banner is fine for now
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
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
       <aside className={`fixed inset-y-0 left-0 z-50 lg:relative bg-surface border-r border-outline-variant/30 flex flex-col h-full transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0 w-[80vw] sm:w-80 shrink-0' : '-translate-x-full lg:-translate-x-full lg:w-0 shrink-0'}`}>
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
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
             {sessionsLoading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                   <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-xs text-on-surface-variant/70 font-bold">Loading history...</p>
                </div>
             ) : sessions.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                   <MessageSquare className="w-8 h-8 text-on-surface-variant/40 mx-auto" />
                   <p className="text-xs text-on-surface-variant/70 font-bold">No previous chats yet.</p>
                </div>
             ) : (
                sessions.map((sess) => {
                  const isActive = currentSessionId === sess.id;
                  const dateStr = sess.updatedAt?.toDate 
                     ? sess.updatedAt.toDate().toLocaleDateString()
                     : "Just now";
                  
                  return (
                     <div
                        key={sess.id}
                        onClick={() => {
                           navigate(`/tutor?session=${sess.id}`, { replace: true });
                           setSidebarOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl flex items-start gap-3 border text-sm transition-all cursor-pointer group relative ${isActive ? 'bg-primary/5 border-primary/20 text-on-surface' : 'bg-transparent border-transparent text-on-surface-variant hover:bg-surface-dim hover:text-on-surface'}`}
                     >
                        <MessageSquare className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-primary' : 'text-on-surface-variant/60'}`} />
                        <div className="pr-6 overflow-hidden w-full">
                           <p className="font-bold truncate text-xs leading-tight">{sess.title || "Untitled Session"}</p>
                           <p className="text-[10px] text-on-surface-variant/50 font-bold mt-1.5 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {dateStr}
                           </p>
                        </div>
                        
                        {/* Delete Session Button */}
                        <button
                           onClick={(e) => handleDeleteSession(sess.id, e)}
                           className="p-1 hover:bg-red-500/10 text-on-surface-variant/40 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 z-10"
                           title="Delete history"
                        >
                           <Trash2 className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  );
                })
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
              <div className="max-w-4xl mx-auto text-sm text-red-600 font-medium flex justify-between items-center">
                <span>Microphone access was denied or speech recognition is not supported by your browser.</span>
                <button onClick={() => setMicPermissionDenied(false)} className="p-1 hover:bg-red-500/10 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
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
                       <div className={`p-4 sm:p-5 rounded-3xl text-sm font-medium font-sans leading-normal tracking-wide ${m.role === 'model' ? 'bg-surface border border-outline-variant/40 text-on-surface rounded-bl-sm shadow-sm' : 'bg-gradient-to-tr from-primary to-primary/90 text-white rounded-br-sm shadow-md'}`}>
                          {m.role === 'user' ? (
                             <p className="whitespace-pre-wrap font-medium">{m.text}</p>
                          ) : (
                             <div className="markdown-body prose prose-sm max-w-none prose-p:font-medium prose-headings:font-semibold prose-strong:font-bold text-on-surface font-medium">
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
    </div>
  );
}
