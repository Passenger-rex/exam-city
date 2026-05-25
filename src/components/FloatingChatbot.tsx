import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Bot, User, Sparkles } from "lucide-react";
import { useUser } from "../UserContext";
import Markdown from "react-markdown";

export function FloatingChatbot() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
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
  }, [messages, isOpen]);

  // If not logged in, you can hide the chatbot or restrict it, but let's show it only if user is logged in
  if (!user) return null;

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
       const data = await res.json();
       if(data.success) {
         setMessages(prev => [...prev, {role: 'model', text: data.text}]);
       } else {
         setMessages(prev => [...prev, {role: 'model', text: data.error || 'Sorry, I am having trouble connecting right now.'}]);
       }
    } catch(e) {
       setMessages(prev => [...prev, {role: 'model', text: 'Error connecting to the Study Coach: ' + e.message}]);
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
             <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-16 h-16 bg-gradient-to-tr from-primary to-primary/80 text-white rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(var(--primary),0.3)] hover:scale-105 transition-all outline-none group"
                aria-label="Open Study Coach"
             >
                <MessageSquare className="w-7 h-7 fill-white group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-surface animate-pulse" />
             </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
              className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[550px] sm:h-[650px] max-h-[calc(100vh-4rem)] bg-surface/95 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-primary/10 border border-outline-variant/30 flex flex-col overflow-hidden"
            >
               {/* Header */}
               <div className="p-5 bg-gradient-to-r from-primary via-primary to-primary/80 text-white flex justify-between items-center relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                  
                  <div className="flex items-center gap-4 relative z-10">
                     <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                        <Sparkles className="w-6 h-6 text-white" />
                     </div>
                     <div>
                        <h3 className="font-bold text-xl tracking-tight">Study Coach</h3>
                        <p className="text-xs text-white/90 font-medium flex items-center gap-1.5 mt-0.5">
                           <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                           Online
                        </p>
                     </div>
                  </div>
                  <button
                     onClick={() => setIsOpen(false)}
                     className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors relative z-10"
                     aria-label="Close Study Coach"
                  >
                     <X className="w-5 h-5" />
                  </button>
               </div>

               {/* Messages */}
               <div className="flex-1 bg-surface-dim/30 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar scroll-smooth">
                  {messages.map((m, idx) => (
                     <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx} 
                        className={`flex max-w-[88%] ${m.role === 'model' ? 'self-start' : 'self-end'}`}
                     >
                        {m.role === 'model' && (
                           <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 text-primary flex items-center justify-center mr-3 mt-auto shadow-sm">
                              <Bot className="w-4.5 h-4.5" />
                           </div>
                        )}
                        <div className={`p-4 rounded-3xl text-[15px] leading-relaxed ${m.role === 'model' ? 'bg-surface border border-outline-variant/40 text-on-surface rounded-bl-sm shadow-sm' : 'bg-gradient-to-tr from-primary to-primary/90 text-white rounded-br-sm shadow-md'}`}>
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
                        <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 text-primary flex items-center justify-center mr-3">
                           <Bot className="w-4.5 h-4.5" />
                        </div>
                        <div className="px-5 py-4 rounded-3xl bg-surface border border-outline-variant/40 rounded-bl-sm shadow-sm flex items-center gap-2 h-12 relative overflow-hidden">
                           <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                           <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce delay-75"></div>
                           <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce delay-150"></div>
                        </div>
                     </motion.div>
                  )}
                  <div ref={messagesEndRef} className="h-2" />
               </div>

               {/* Input */}
               <div className="p-4 sm:p-5 bg-surface border-t border-outline-variant/20 flex gap-3 w-full items-center shrink-0">
                  <div className="flex-1 relative">
                    <input
                       type="text"
                       value={inputValue}
                       onChange={e => setInputValue(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && handleSend()}
                       placeholder="Ask me a question..."
                       className="w-full bg-surface-dim/50 border border-outline-variant/60 pl-5 pr-12 py-3.5 rounded-full text-[15px] font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60"
                    />
                    <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 pointer-events-none" />
                  </div>
                  <button
                     onClick={handleSend}
                     disabled={!inputValue.trim() || isLoading}
                     className="w-12 h-12 shrink-0 bg-primary text-white flex items-center justify-center rounded-full hover:bg-primary/90 hover:scale-105 active:scale-95 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-primary shadow-md"
                     aria-label="Send message"
                  >
                     <Send className="w-5 h-5 -ml-0.5 mt-0.5 fill-white" />
                  </button>
               </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
