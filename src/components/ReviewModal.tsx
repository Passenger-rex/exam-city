import React, { useState } from "react";
import { Star, Send, X, MessageSquare, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: any;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, context = {} }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      const reviewData = {
        userId: user?.uid || "anonymous",
        userEmail: user?.email || "anonymous@example.com",
        rating,
        comment,
        context,
        createdAt: serverTimestamp(),
      };

      // Save to Firestore for persistence
      await addDoc(collection(db, "reviews"), reviewData);

      // Trigger the backend Feedback API for AI analysis / logging
      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid || "anonymous",
          rating,
          comment,
          category: "exam_review",
          context
        })
      }).catch(err => console.warn("Background feedback API failed:", err));

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset state
        setRating(0);
        setComment("");
        setIsSuccess(false);
      }, 2500);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to send review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-surface w-full max-w-[400px] rounded-[28px] overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col max-h-[85vh] relative"
          >
            {isSuccess ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                  <ShieldCheck className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold font-headline-md mb-2 text-on-surface">Feedback Received!</h2>
                <p className="text-on-surface-variant font-medium">Thank you for helping us improve Exam City.</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center shrink-0 bg-surface/50 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold font-headline-md text-on-surface">Ace Experience</h2>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-surface-dim rounded-full transition-colors text-on-surface-variant"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                  <div className="mb-6">
                    <p className="text-on-surface-variant font-medium text-sm leading-relaxed">
                      How was your experience with this {context.subject ? <strong>{context.subject}</strong> : 'study'} session? Your feedback directly improves our core engine.
                    </p>
                    {context.score !== undefined && (
                      <div className="mt-3 flex items-center gap-2 text-xs font-bold text-primary/70 uppercase tracking-wider">
                        <span>Score: {context.score}/{context.total}</span>
                        <span className="w-1 h-1 bg-primary/30 rounded-full"></span>
                        <span>{Math.round((context.score/context.total)*100)}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-2 mb-8 bg-surface-dim/50 py-6 rounded-2xl border border-outline-variant/20">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform active:scale-90 relative"
                      >
                        <Star
                          className={`w-10 h-10 transition-all duration-300 ${
                            (hoverRating || rating) >= star
                              ? "fill-primary text-primary scale-110 drop-shadow-[0_0_8px_rgba(129,51,255,0.4)]"
                              : "text-outline-variant"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 ml-1">
                      Additional Comments
                    </label>
                    <textarea
                      placeholder="What could we improve? or what did you like?..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full h-32 p-4 rounded-2xl bg-surface-dim border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface font-medium resize-none shadow-inner"
                    />
                  </div>

                  <button
                    disabled={rating === 0 || isSubmitting}
                    onClick={handleSubmit}
                    className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 group"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
