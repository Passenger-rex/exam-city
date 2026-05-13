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
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary font-semibold text-sm mb-6 border border-secondary/20 hover-jelly backdrop-blur-sm shadow-sm dark:shadow-none">
              <Sparkles className="w-4 h-4" />
              The Next Evolution in Testing
            </span>
            <h1 className="font-headline-xl text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 md:mb-8 text-on-surface leading-tight">
              Master Your Exams with <br className="hidden sm:block" />
              <span className="text-primary relative inline-block hover-jelly z-10">
                Premium Access
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
            <p className="text-lg sm:text-xl text-on-surface-variant max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed hover-jelly font-medium px-4 md:px-0">
              Experience the smartest way to prepare. Advanced analytics,
              real-time feedback, and personalized pathways designed for top
              achievers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary font-bold rounded-2xl hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/50 transition-all active:scale-95 text-lg flex items-center justify-center gap-2 hover-jelly"
              >
                Start Free Trial
                <TrendingUp className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setShowConfig(true)}
                className="w-full sm:w-auto px-8 py-4 bg-surface-dim/80 text-on-surface font-bold rounded-2xl hover:bg-surface-container backdrop-blur-md transition-all active:scale-95 text-lg shadow-sm border border-outline-variant/50 flex items-center justify-center gap-2 hover-jelly"
              >
                <Play className="w-5 h-5" />
                Try a Demo
              </button>
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
