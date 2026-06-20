import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { ThumbsUp, Lightbulb, PartyPopper } from "lucide-react";
import { motion } from "motion/react";

interface Reactions {
  like: number;
  insightful: number;
  applaud: number;
}

export function ArticleReactions({ articleId }: { articleId: string }) {
  const [reactions, setReactions] = useState<Reactions>({ like: 0, insightful: 0, applaud: 0 });
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load local reactions to prevent spamming from the same browser
    const stored = localStorage.getItem(`reactions_${articleId}`);
    if (stored) {
      try {
        setUserReactions(JSON.parse(stored));
      } catch (e) {
        // ignore
      }
    }

    const unsub = onSnapshot(doc(db, "articles", articleId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.reactions) {
          setReactions({
            like: data.reactions.like || 0,
            insightful: data.reactions.insightful || 0,
            applaud: data.reactions.applaud || 0,
          });
        }
      }
    });

    return () => unsub();
  }, [articleId]);

  const handleReact = async (type: keyof Reactions) => {
    // Toggle reaction
    const hasReacted = userReactions[type];
    const newCount = hasReacted ? -1 : 1;
    
    // Optimistic update
    setReactions(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + newCount)
    }));
    
    const nextUserReactions = { ...userReactions, [type]: !hasReacted };
    setUserReactions(nextUserReactions);
    localStorage.setItem(`reactions_${articleId}`, JSON.stringify(nextUserReactions));

    try {
      await updateDoc(doc(db, "articles", articleId), {
        [`reactions.${type}`]: increment(newCount)
      });
    } catch (error) {
      console.error("Error updating reaction:", error);
      // Revert if it fails
      setReactions(prev => ({
        ...prev,
        [type]: Math.max(0, prev[type] - newCount)
      }));
      const revertedUserReactions = { ...nextUserReactions, [type]: hasReacted };
      setUserReactions(revertedUserReactions);
      localStorage.setItem(`reactions_${articleId}`, JSON.stringify(revertedUserReactions));
    }
  };

  const ReactionButton = ({ 
    type, 
    icon: Icon, 
    label, 
    hoverClass, 
    activeClass 
  }: { 
    type: keyof Reactions, 
    icon: any, 
    label: string, 
    hoverClass: string,
    activeClass: string
  }) => {
    const isActive = userReactions[type];
    const count = reactions[type];

    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleReact(type)}
        className={`flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full border-2 transition-all font-bold text-sm sm:text-base ${
          isActive 
            ? activeClass 
            : `bg-white border-neutral-100 text-neutral-500 ${hoverClass}`
        }`}
      >
        <motion.div
           animate={{ rotate: isActive ? [0, -15, 15, -15, 0] : 0, scale: isActive ? [1, 1.2, 1] : 1 }}
           transition={{ duration: 0.4 }}
        >
           <Icon className="w-5 h-5" fill={isActive ? "currentColor" : "none"} />
        </motion.div>
        <span>{count > 0 ? count : label}</span>
      </motion.button>
    );
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 my-8 pb-8 border-b border-neutral-100">
      <div className="w-full text-center mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">What do you think?</span>
      </div>
      <ReactionButton 
        type="like" 
        icon={ThumbsUp} 
        label="Like" 
        hoverClass="hover:border-blue-500 hover:text-blue-500"
        activeClass="bg-blue-50 border-blue-200 text-blue-600 shadow-sm shadow-blue-100"
      />
      <ReactionButton 
        type="insightful" 
        icon={Lightbulb} 
        label="Insightful" 
        hoverClass="hover:border-amber-500 hover:text-amber-500"
        activeClass="bg-amber-50 border-amber-200 text-amber-600 shadow-sm shadow-amber-100"
      />
      <ReactionButton 
        type="applaud" 
        icon={PartyPopper} 
        label="Applaud" 
        hoverClass="hover:border-emerald-500 hover:text-emerald-500"
        activeClass="bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm shadow-emerald-100"
      />
    </div>
  );
}
