import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bot } from "lucide-react";
import { motion } from "motion/react";
import { useUser } from "../UserContext";

export function FloatingTutor() {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Show floating tutor ONLY on the dashboard page and when the user is logged in
  if (!user || location.pathname !== "/dashboard") {
    return null;
  }

  return (
    <div className="print:hidden">
      {/* Mobile-Only Floating Layout: Slimmer, positioned higher (above mobile bottom navigation bar) */}
      <div className="md:hidden fixed bottom-[76px] right-4 z-[99]">
        <motion.button
          id="floating-tutor-btn-mobile"
          onClick={() => navigate("/tutor")}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative w-12 h-12 flex items-center justify-center bg-primary text-white rounded-full shadow-[0_4px_16px_rgba(129,51,255,0.3)] hover:bg-primary/95 transition-all outline-none border border-primary/20"
        >
          <Bot className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Desktop/Tablet Floating Layout: High premium visual, placed beautifully in bottom-8 right-8 */}
      <div className="hidden md:block fixed bottom-8 right-8 z-50">
        <motion.button
          id="floating-tutor-btn-desktop"
          onClick={() => navigate("/tutor")}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-14 h-14 flex items-center justify-center bg-primary text-white rounded-full shadow-[0_8px_30px_rgba(129,51,255,0.35)] hover:bg-primary/95 transition-all outline-none border border-white/10 group overflow-hidden"
        >
          {/* Hover highlight overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white group-hover:rotate-6 transition-transform duration-300" />
          </div>
        </motion.button>
      </div>
    </div>
  );
}
