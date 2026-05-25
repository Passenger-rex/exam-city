import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  CheckCircle2,
  Star,
  Play,
  TrendingUp,
  Sparkles,
  Menu,
  X,
  Moon,
  Sun,
  Target,
  User,
  Bot
} from "lucide-react";
import { Logo } from "../components/Logo";
import { ExamConfigModal } from "../components/ExamConfigModal";
import { InteractiveBackground } from "../components/InteractiveBackground";

export default function LandingPage() {
  const navigate = useNavigate();
  const [showConfig, setShowConfig] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY <= 20) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsHeaderVisible(false); // Scrolled down
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true); // Scrolled up
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md overflow-x-hidden selection:bg-primary/20 selection:text-primary relative transition-colors duration-500">
      <ExamConfigModal 
        isOpen={showConfig} 
        onClose={() => setShowConfig(false)} 
        userTier="free" 
        testsTakenThisMonth={0} 
      />
      {/* Header */}
      <nav className={`fixed w-full top-0 z-50 bg-background/60 backdrop-blur-md border-b border-outline-variant/30 transition-all duration-300 ${isHeaderVisible ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link to="/" className="hover:opacity-90 transition-opacity hover-jelly z-50 relative">
            <Logo />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-surface-dim transition-colors text-on-surface-variant hover:text-on-surface hover-jelly"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link
              to="/login"
              className="font-semibold text-on-surface hover:text-primary transition-colors hover-jelly"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 inline-block hover-jelly"
            >
              Get Started
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-4 z-50 relative">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full text-on-surface-variant"
            >
               {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              className="p-2 text-on-surface-variant"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-surface border-b border-outline-variant/30 overflow-hidden"
            >
              <div className="px-6 py-6 flex flex-col gap-4">
                <Link
                  to="/login"
                  className="font-semibold text-lg text-on-surface py-2"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="w-full py-4 bg-primary text-center text-on-primary font-bold rounded-2xl"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
        <InteractiveBackground />
        
        <div className="max-w-7xl mx-auto text-center relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary font-semibold text-sm mb-6 border border-secondary/20 hover-jelly backdrop-blur-sm shadow-sm dark:shadow-none">
              <Sparkles className="w-4 h-4 text-primary" />
              The Next Evolution in Testing
            </span>
            <h1 className="font-headline-xl text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-6 md:mb-8 text-on-surface leading-tight">
              Master Exams. <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary relative inline-block z-10">
                Stress Less.
                <svg
                  className="absolute w-full h-3 md:h-4 -bottom-1 left-0 text-secondary opacity-50 -z-10"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 50 15 100 5"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-on-surface-variant max-w-2xl mx-auto mb-8 md:mb-12 font-medium px-4 md:px-0">
              Experience the smartest way to prepare. AI-powered explanations, authentic past questions, and personalized pathways designed to help you ace your exams.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary font-bold rounded-full hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/40 transition-all active:scale-95 text-lg flex items-center justify-center gap-2"
              >
                Start Free Trial
                <TrendingUp className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setShowConfig(true)}
                className="w-full sm:w-auto px-8 py-4 bg-surface-dim/80 text-on-surface font-bold rounded-full hover:bg-surface-container backdrop-blur-md transition-all active:scale-95 text-lg shadow-sm border border-outline-variant flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Try a Demo
              </button>
            </div>
          </motion.div>

          {/* Bento Grid Preview Section */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {/* Mock Question Feature */}
            <div className="md:col-span-2 bg-surface rounded-[2.5rem] p-2 flex flex-col md:flex-row border border-outline-variant/60 shadow-xl overflow-hidden relative">
               <div className="p-6 sm:p-8 md:p-12 flex-1 flex flex-col justify-center text-left">
                 <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6">
                   <Target className="w-7 h-7" />
                 </div>
                 <h3 className="text-3xl font-bold text-on-surface mb-4">Authentic Questions</h3>
                 <p className="text-on-surface-variant text-lg leading-relaxed md:pr-4">Practice with thousands of real past questions carefully formatted to match the exact experience of the real exams.</p>
               </div>
               
               {/* Decorative Graphic part of the card */}
               <div className="flex-1 bg-surface-dim/50 rounded-[2rem] p-6 m-1 mt-0 md:mt-1 relative overflow-hidden border border-outline-variant/30 hidden sm:block">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                 {/* Mock UI Card */}
                 <div className="absolute top-10 -right-4 w-full bg-surface rounded-2xl shadow-xl border border-outline-variant/40 p-6 transform -rotate-2">
                   <div className="w-20 h-4 bg-outline-variant/60 rounded-full mb-5"></div>
                   <div className="w-full h-3 bg-on-surface/70 rounded-full mb-3"></div>
                   <div className="w-3/4 h-3 bg-on-surface/70 rounded-full mb-8"></div>
                   
                   <div className="space-y-4">
                     {[1, 2, 3].map((i) => (
                       <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-outline-variant/40 bg-surface-dim/40 relative overflow-hidden">
                         {i === 2 && <div className="absolute inset-0 bg-primary/5"></div>}
                         <div className={`w-6 h-6 rounded-full border-2 ${i === 2 ? 'border-primary flex items-center justify-center bg-primary' : 'border-outline-variant/80'} relative z-10`}>
                           {i === 2 && <div className="w-2 h-2 bg-on-primary rounded-full"></div>}
                         </div>
                         <div className={`w-2/3 h-3 ${i === 2 ? 'bg-primary/80' : 'bg-on-surface-variant/40'} rounded-full relative z-10`}></div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
            </div>

            {/* AI Coach Feature */}
            <div className="bg-surface rounded-[2.5rem] p-2 flex flex-col border border-outline-variant/60 shadow-xl overflow-hidden group">
               <div className="p-6 sm:p-8 pb-4 text-left">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary/10 text-secondary mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-7 h-7" />
                  </div>
                 <h3 className="text-2xl font-bold text-on-surface mb-3">Study Coach</h3>
                 <p className="text-on-surface-variant leading-relaxed text-sm sm:text-base">Get instant, step-by-step explanations exactly when you need them.</p>
               </div>
               
               <div className="flex-1 p-4 flex flex-col justify-end min-h-[220px]">
                 {/* Mock Chat UI */}
                 <div className="relative bg-surface-container rounded-3xl p-5 border border-outline-variant/40 shadow-inner h-full flex flex-col justify-end pb-12 overflow-hidden">
                   <div className="flex gap-4 mb-5 items-end transform transition-transform duration-500 group-hover:-translate-y-2">
                     <div className="w-10 h-10 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center border border-primary/20 shadow-sm relative z-10">
                        <User className="w-5 h-5 text-primary" />
                     </div>
                     <div className="flex-1 bg-surface rounded-2xl rounded-bl-none p-4 border border-outline-variant/30 text-sm font-medium text-on-surface shadow-md relative z-10">
                       Why is option C correct here?
                     </div>
                   </div>
                   <div className="flex gap-4 items-end transform transition-transform duration-500 group-hover:-translate-y-2">
                     <div className="flex-1 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl rounded-br-none p-4 border border-secondary/20 shadow-md text-right relative z-10">
                       <div className="w-full h-3 bg-secondary/30 rounded-full mb-3"></div>
                       <div className="w-4/5 h-3 bg-secondary/30 rounded-full ml-auto"></div>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex-shrink-0 flex items-center justify-center text-white border border-secondary shadow-lg relative z-10 group-hover:animate-pulse">
                        <Bot className="w-5 h-5" />
                     </div>
                   </div>
                   {/* Gradient fade at bottom */}
                   <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface-container via-surface-container/80 to-transparent z-20 pointer-events-none"></div>
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-dim pt-20 pb-10 px-6 border-t border-outline-variant/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo />
          <p className="text-on-surface-variant font-medium text-sm">
            &copy; 2026 exam city. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span 
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              aria-label="Favorites"
            >
              <Star className="w-4 h-4" />
            </span>
            <span 
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              aria-label="Trending"
            >
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
