import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronLeft } from "lucide-react";
import { useUser } from "../UserContext";
import Markdown from "react-markdown";
import { useNavigate } from "react-router-dom";

export default function TutorPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: 'Hi! I am your AI Study Coach. Need study tips or help with a tricky topic?' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
       const res = await fetch('/api/chatbot', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
             messages: [...messages, userMessage].map(m => ({
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
          setMessages(prev => [...prev, {role: 'model', text: `Server error (${res.status}): Please try again.`}]);
          return;
       }

       if(data.success) {
         setMessages(prev => [...prev, {role: 'model', text: data.text}]);
       } else {
         setMessages(prev => [...prev, {role: 'model', text: data.error || 'Sorry, I am having trouble connecting right now.'}]);
       }
    } catch(e: any) {
       setMessages(prev => [...prev, {role: 'model', text: 'Error connecting to the Study Coach: ' + e.message}]);
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans h-screen overflow-hidden">
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
                    <div className={`p-4 sm:p-5 rounded-3xl text-[15px] leading-relaxed ${m.role === 'model' ? 'bg-surface border border-outline-variant/40 text-on-surface rounded-bl-sm shadow-sm' : 'bg-gradient-to-tr from-primary to-primary/90 text-white rounded-br-sm shadow-md'}`}>
                       {m.role === 'user' ? (
                          <p className="font-medium whitespace-pre-wrap">{m.text}</p>
                       ) : (
                          <div className="markdown-body prose prose-sm max-w-none text-on-surface">
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
       <div className="p-4 sm:p-6 bg-surface border-t border-outline-variant/20 shrink-0">
          <div className="max-w-4xl mx-auto w-full flex gap-3 items-center relative">
              <div className="flex-1 relative">
                <input
                   type="text"
                   value={inputValue}
                   onChange={e => setInputValue(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleSend()}
                   placeholder="Ask a question or request a study plan..."
                   className="w-full bg-surface-dim/50 border border-outline-variant/60 pl-5 pr-12 py-4 rounded-full text-[15px] font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60"
                />
                <Sparkles className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40 pointer-events-none" />
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
  );
}
