import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, X } from "lucide-react";
import { auth } from "../firebase";

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignOutModal({ isOpen, onClose }: SignOutModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      // On sign out, the auth listener will typically trigger a redirect to /landing
      // But we can also force navigate if needed or just let the auth guard handle it.
    } catch (error) {
      console.error("Sign out error", error);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onClose}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 py-8 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface w-full max-w-sm rounded-[2rem] shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1),_0_0_0_1px_rgba(0,0,0,0.05)] pointer-events-auto overflow-hidden relative"
            >
              {/* Close Button */}
              {!loading && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-dim hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="p-8 pb-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-surface-dim border border-outline-variant/50 text-error rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <LogOut className="w-7 h-7" />
                </div>
                
                <h3 className="text-2xl font-bold font-headline-md text-on-surface mb-2">
                  Sign Out
                </h3>
                <p className="text-on-surface-variant text-sm mb-1">
                  Are you sure you want to sign out?
                </p>
                <p className="text-xs text-on-surface-variant/80">
                  You will need to sign back in to access your tests.
                </p>
              </div>

              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-surface text-on-surface font-semibold rounded-xl border border-outline-variant hover:bg-surface-dim transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-error text-white font-semibold rounded-xl hover:bg-error/90 transition-all active:scale-[0.98] shadow-sm flex justify-center items-center gap-2 relative overflow-hidden"
                >
                  {loading ? (
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Sign Out"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
