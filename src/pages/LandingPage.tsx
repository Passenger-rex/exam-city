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
  Bot,
  Shield,
  Lock,
  Linkedin
} from "lucide-react";
import { Logo } from "../components/Logo";
import { ExamConfigModal } from "../components/ExamConfigModal";
import { InteractiveBackground } from "../components/InteractiveBackground";

export default function LandingPage() {
  const navigate = useNavigate();
  const [showConfig, setShowConfig] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md overflow-x-hidden selection:bg-primary/20 selection:text-primary relative transition-colors duration-500">
      <ExamConfigModal 
        isOpen={showConfig} 
        onClose={() => setShowConfig(false)} 
        userTier="free" 
        testsTakenThisMonth={0} 
        isDemo={true}
      />
      {/* Header */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isHeaderVisible ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30"></div>
        <div className="max-w-7xl mx-auto px-5 md:px-6 h-20 flex justify-between items-center relative z-10">
          <Link to="/" className="hover:opacity-90 transition-opacity hover-jelly z-50 relative">
            <Logo />
          </Link>

          <div className="hidden md:flex items-center gap-6">
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

          <div className="md:hidden flex items-center gap-3 z-50 relative">
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-dim text-on-surface-variant border border-outline-variant/30"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-24 left-4 right-4 bg-surface rounded-3xl shadow-2xl shadow-surface-dim/50 border border-outline-variant/50 overflow-hidden md:hidden z-40 origin-top"
            >
              <div className="p-5 flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center font-bold text-on-surface py-4 rounded-2xl hover:bg-surface-dim transition-colors border border-transparent hover:border-outline-variant/50"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-4 bg-primary text-center text-on-primary font-bold rounded-2xl shadow-md shadow-primary/20 active:scale-95 transition-transform"
                >
                  Sign up
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 md:pb-32 px-5 md:px-6 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
        <div className="absolute inset-0 z-0">
          <InteractiveBackground />
        </div>
        
        <div className="max-w-7xl mx-auto text-center w-full relative z-10 flex flex-col">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center justify-center text-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-secondary/10 text-secondary font-bold md:font-semibold text-[11px] sm:text-xs md:text-sm mb-5 md:mb-6 border border-secondary/20 hover-jelly backdrop-blur-sm shadow-sm dark:shadow-none max-w-[90vw] whitespace-normal md:whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary flex-shrink-0" />
              <span>The Next Evolution in Testing</span>
            </span>
            <h1 className="font-headline-xl text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-4 md:mb-8 text-on-surface leading-[1.1] md:leading-[1.1]">
              Master Exams. <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary relative flex flex-col sm:inline-block z-10 w-fit sm:w-auto mx-auto sm:mx-0 pb-1 md:pb-0">
                Stress Less.
                <svg
                  className="absolute w-full h-3 md:h-4 -bottom-1 left-0 text-secondary opacity-50 -z-10 hidden md:block"
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
            <p className="text-base sm:text-xl text-on-surface-variant max-w-2xl mx-auto mb-8 md:mb-12 font-medium px-2 md:px-0 leading-relaxed md:leading-normal">
              The smartest study companion. AI coaching, authentic past papers, and instantly graded mock tests designed to help you ace your exams.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4 sm:px-0">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary font-bold rounded-2xl md:rounded-full hover:bg-primary/90 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 text-base md:text-lg flex items-center justify-center gap-2"
              >
                Start Free Trial
                <TrendingUp className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setShowConfig(true)}
                className="w-full sm:w-auto px-8 py-4 bg-surface-dim/80 text-on-surface font-bold rounded-2xl md:rounded-full hover:bg-surface-container backdrop-blur-md transition-all active:scale-95 text-base md:text-lg shadow-sm border border-outline-variant flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Try a Demo
              </button>
            </div>
            
            <div className="mt-10 md:hidden flex items-center justify-center gap-3">
               <div className="flex -space-x-3">
                 <div className="w-10 h-10 rounded-full border-2 border-surface bg-blue-100 flex items-center justify-center text-base sm:text-lg overflow-hidden shrink-0">👨‍🎓</div>
                 <div className="w-10 h-10 rounded-full border-2 border-surface bg-green-100 flex items-center justify-center text-base sm:text-lg overflow-hidden shrink-0">👩‍🔬</div>
                 <div className="w-10 h-10 rounded-full border-2 border-surface bg-purple-100 flex items-center justify-center text-base sm:text-lg overflow-hidden shrink-0">👨‍💻</div>
               </div>
               <p className="text-sm font-bold text-on-surface-variant">
                 Trusted by <span className="text-on-surface">10,000+</span> Students
               </p>
            </div>
          </motion.div>

          {/* Bento Grid Preview Section */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mt-16 md:mt-24 w-full"
          >
            {/* Desktop Grid Layout */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
            </div>

            {/* Mobile Stacked Format */}
            <div className="md:hidden flex flex-col gap-6 w-full mt-10">
               {/* Card 1 */}
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.6 }}
                 className="w-full bg-surface rounded-3xl p-6 md:p-8 border border-outline-variant/60 shadow-2xl shadow-surface-dim flex flex-col text-left"
               >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 shrink-0 border border-primary/20">
                    <Target className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface mb-3 tracking-snug">Authentic Questions</h3>
                  <p className="text-on-surface-variant font-medium leading-relaxed mb-8 flex-1 text-[15px]">
                    Practice with thousands of real past questions carefully formatted to match the exact experience of the real exams, building your confidence instantly.
                  </p>
                  
                  {/* Visual representation */}
                  <div className="w-full h-48 bg-surface-dim rounded-2xl border border-outline-variant/60 p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                    <div className="absolute top-8 left-4 right-4 bg-surface rounded-[20px] shadow-xl border border-outline-variant/30 p-5 transform -rotate-2">
                       <div className="w-20 h-3 bg-outline-variant rounded-full mb-5"></div>
                       <div className="w-full h-2.5 bg-on-surface-variant/50 rounded-full mb-3"></div>
                       <div className="w-4/5 h-2.5 bg-on-surface-variant/50 rounded-full mb-6"></div>
                       <div className="space-y-3">
                         <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-primary bg-primary/5">
                           <div className="w-5 h-5 rounded-full border-[3px] border-primary flex items-center justify-center bg-primary shrink-0">
                             <div className="w-1.5 h-1.5 bg-on-primary rounded-full"></div>
                           </div>
                           <div className="w-2/3 h-2.5 bg-primary/80 rounded-full"></div>
                         </div>
                       </div>
                    </div>
                  </div>
               </motion.div>

               {/* Card 2 */}
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.6, delay: 0.1 }}
                 className="w-full bg-surface rounded-3xl p-6 md:p-8 border border-outline-variant/60 shadow-2xl shadow-surface-dim flex flex-col text-left"
               >
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-6 shrink-0 border border-secondary/20">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface mb-3 tracking-snug">AI Study Coach</h3>
                  <p className="text-on-surface-variant font-medium leading-relaxed mb-8 flex-1 text-[15px]">
                    Stuck on a tricky concept? Get instant, tailored, step-by-step explanations exactly when you need them.
                  </p>
                  
                  {/* Visual representation */}
                  <div className="w-full h-48 bg-surface-container rounded-2xl border border-outline-variant/60 p-5 flex flex-col justify-end gap-4 pb-6 overflow-hidden relative shadow-inner">
                     <div className="flex gap-3 mb-2 w-full pr-6 items-end">
                       <div className="w-9 h-9 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center border border-primary/20 shadow-sm">
                          <User className="w-4 h-4 text-primary" />
                       </div>
                       <div className="bg-surface self-start rounded-2xl rounded-bl-none p-3.5 border border-outline-variant/40 shadow-sm text-xs w-full font-semibold text-on-surface">Why is option C correct?</div>
                     </div>
                     <div className="flex gap-3 w-full pl-6 items-end">
                       <div className="bg-gradient-to-br from-secondary/10 to-primary/10 self-end rounded-2xl rounded-br-none p-3.5 border border-secondary/20 shadow-sm text-xs w-full text-right font-semibold text-on-surface">C clearly follows the rule exactly.</div>
                       <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-primary flex-shrink-0 flex items-center justify-center text-white border border-secondary shadow-md">
                          <Bot className="w-4.5 h-4.5 text-white" />
                       </div>
                     </div>
                  </div>
               </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Transparency Section */}
      <section className="relative py-20 px-5 md:px-6 z-10 border-t border-outline-variant/30 bg-surface/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-4 border border-primary/20">
              <Shield className="w-3.5 h-3.5" />
              <span>Trust & Transparency</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-on-surface mb-3">
              Your Data. Fully Protected.
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto font-medium text-sm sm:text-base leading-relaxed">
              At <strong className="text-on-surface">Exam City</strong>, we are transparent about our identity, features, and the ways we protect and use your information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Brand Representation */}
            <div className="bg-surface border border-outline-variant/50 rounded-3xl p-6 sm:p-8 flex flex-col text-left hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 border border-primary/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">01. App & Brand Identity</h3>
              <p className="text-on-surface-variant font-medium text-sm leading-relaxed">
                <strong className="text-on-surface">Exam City</strong> is a dedicated student-success software. We make study tools, authentic testing modules, and educational feedback systems. We explicitly state our brand on every page, maintaining absolute alignment who we are and what we build.
              </p>
            </div>

            {/* Column 2: App Functionality */}
            <div className="bg-surface border border-outline-variant/50 rounded-3xl p-6 sm:p-8 flex flex-col text-left hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-6 border border-secondary/20">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">02. Fully Described Features</h3>
              <p className="text-on-surface-variant font-medium text-sm leading-relaxed">
                Our platform provides clear, real features to help students review: from generating dynamic past paper assessments aligned to custom grade-levels and academic subjects, to conducting smart tutor chat discussions, uploading study notes or summaries, and tracking historical quiz performance.
              </p>
            </div>

            {/* Column 3: Data Requests & Purpose */}
            <div className="bg-surface border border-outline-variant/40 rounded-3xl p-6 sm:p-8 flex flex-col text-left hover:shadow-lg transition-all duration-300 relative overflow-hidden ring-1 ring-primary/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none"></div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 border border-primary/30">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">03. Transparent Data Use</h3>
              <p className="text-on-surface-variant font-medium text-sm leading-relaxed">
                We only request user data that is strictly essential for service operation: your email/name to handle secure sign-in verification and progress monitoring, and uploaded files (such as PDFs, DOCX, and screenshots) to extract textual study matter so our AI generator can formulate customized mock questions.
              </p>
            </div>
          </div>

          <div className="mt-8 p-5 bg-surface-dim/50 border border-outline-variant/40 rounded-2xl text-left flex flex-col sm:flex-row items-center gap-4 justify-between">
            <p className="text-xs font-semibold text-on-surface-variant leading-relaxed">
              We pledge to never sell your documents, monitor your off-app activity, or share data with non-educational advertising entities. Read our complete policies for absolute detail.
            </p>
            <div className="inline-flex gap-4 shrink-0 text-xs font-bold">
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              <span className="text-outline-variant">|</span>
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-dim pt-20 pb-10 px-6 border-t border-outline-variant/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo />
          <div className="text-center md:text-left">
            <p className="text-on-surface-variant font-medium text-sm">
              &copy; 2026 exam city. All rights reserved.
            </p>
            <div className="flex justify-center md:justify-start gap-4 mt-2 text-xs font-semibold text-on-surface-variant/70">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
          <div className="flex gap-4">
            <a 
              href="https://www.linkedin.com/company/exam-city/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              aria-label="LinkedIn"
              id="linkedin-footer-link"
            >
              <Linkedin className="w-4 h-4" />
            </a>
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
