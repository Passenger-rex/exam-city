import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function DarkModeToggle() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  if (location.pathname !== "/profile") {
    return null;
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      onClick={() => setIsDark(!isDark)}
      className="print:hidden fixed bottom-6 left-6 z-50 p-3 bg-surface border border-outline-variant rounded-full shadow-lg text-on-surface hover:text-primary transition-colors flex items-center justify-center group focus:outline-none"
      aria-label="Toggle dark mode"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ y: -10, rotate: -90, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: 10, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex items-center justify-center"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
