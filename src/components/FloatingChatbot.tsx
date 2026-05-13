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
         setMessages(prev => [...prev, {role: 'model', text: 'Sorry, I am having trouble connecting right now.'}]);
       }
    } catch(e) {
       setMessages(prev => [...prev, {role: 'model', text: 'Error connecting to the Study Coach.'}]);
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
              className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all outline-none focus:ring-4 focus:ring-primary/20"
              aria-label="Open Study Coach"
           >
              <MessageSquare className="w-7 h-7 fill-white" />
              <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-surface animate-bounce" />
           </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] sm:h-[600px] max-h-[calc(100vh-4rem)] bg-surface rounded-[24px] sm:rounded-[2rem] shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden"
          >
             {/* Header */}
             <div className="p-4 bg-primary text-white flex justify-between items-center z-10 shadow-sm relative">
                <div className="absolute inset-0 overflow-hidden rounded-t-[2rem]">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                   <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
                      <Sparkles className="w-5 h-5 text-white fill-white" />
                   </div>
                   <div>
                      <h3 className="font-bold text-lg leading-tight">Study Coach</h3>
                      <p className="text-xs text-white/80 font-medium tracking-wide">AI Tutor & Mentor</p>
                   </div>
                </div>
                <button
                   onClick={() => setIsOpen(false)}
                   className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10"
                   aria-label="Close Study Coach"
                >
                   <X className="w-5 h-5" />
                </button>
             </div>

             {/* Messages */}
             <div className="flex-1 bg-surface-dim overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                {messages.map((m, idx) => (
                   <div key={idx} className={`flex max-w-[85%] ${m.role === 'model' ? 'self-start' : 'self-end'}`}>
                      {m.role === 'model' && (
                         <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mr-2 mt-auto">
                            <Bot className="w-4 h-4" />
                         </div>
                      )}
                      <div className={`p-4 rounded-2xl text-sm ${m.role === 'model' ? 'bg-surface border border-outline-variant/50 text-on-surface rounded-bl-none shadow-sm' : 'bg-primary text-white rounded-br-none shadow-md shadow-primary/20'}`}>
                         {m.role === 'user' ? (
                            <p className="font-medium whitespace-pre-wrap">{m.text}</p>
                         ) : (
                            <div className="markdown-body prose prose-sm max-w-none text-on-surface">
                               <Markdown>{m.text}</Markdown>
                            </div>
                         )}
                      </div>
                   </div>
                ))}
                {isLoading && (
                   <div className="flex self-start max-w-[80%] items-end">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mr-2">
                         <Bot className="w-4 h-4" />
                      </div>
                      <div className="p-4 rounded-2xl bg-surface border border-outline-variant/50 rounded-bl-none shadow-sm flex items-center gap-1.5 h-12">
                         <div className="w-2 h-2 bg-on-surface-variant/40 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-on-surface-variant/40 rounded-full animate-bounce delay-75"></div>
                         <div className="w-2 h-2 bg-on-surface-variant/40 rounded-full animate-bounce delay-150"></div>
                      </div>
                   </div>
                )}
                <div ref={messagesEndRef} />
             </div>

             {/* Input */}
             <div className="p-4 bg-surface border-t border-outline-variant/30 flex gap-2 w-full">
                <input
                   type="text"
                   value={inputValue}
                   onChange={e => setInputValue(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleSend()}
                   placeholder="Ask me a question..."
                   className="flex-1 bg-surface-dim border border-outline-variant/50 px-4 py-3 rounded-full text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                   onClick={handleSend}
                   disabled={!inputValue.trim() || isLoading}
                   className="w-12 h-12 shrink-0 bg-primary text-white flex items-center justify-center rounded-full hover:bg-primary/90 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:hover:bg-primary"
                   aria-label="Send message"
                >
                   <Send className="w-5 h-5 -ml-1 mt-1 fill-white" />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
