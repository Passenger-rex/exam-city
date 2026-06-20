import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { MessageSquare, Send, User as UserIcon, Reply } from "lucide-react";
import { Skeleton } from "./Skeleton";

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorId: string;
  createdAt: any;
  parentId?: string;
}

export function ArticleComments({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!articleId) return;
    
    const q = query(
      collection(db, "article_comments"),
      where("articleId", "==", articleId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedComments = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[];
      
      fetchedComments.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        // Oldest first for replies usually makes sense, but the prompt says sort descending? 
        // We'll reverse it so top-level is newest first, but let's stick to the existing sorting.
        return dateB - dateA; 
      });
      
      setComments(fetchedComments);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error in article_comments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [articleId]);

  // Separate comments into top-level and replies
  const topLevelComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => {
    // Sort replies from oldest to newest visually
    const replies = comments.filter(c => c.parentId === parentId);
    return replies.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateA - dateB;
    });
  };

  return (
    <div className="mt-16 pt-10 border-t border-neutral-100">
      <h3 className="text-2xl font-black font-sans mb-8 text-neutral-900 flex items-center gap-3">
        <MessageSquare className="w-6 h-6 text-primary" />
        Comments ({loading ? "..." : comments.length})
      </h3>

      <CommentForm articleId={articleId} user={user} />

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : topLevelComments.length > 0 ? (
          topLevelComments.map((comment) => (
            <CommentThread 
              key={comment.id} 
              comment={comment} 
              replies={getReplies(comment.id)} 
              articleId={articleId} 
              user={user} 
            />
          ))
        ) : (
          <div className="text-center py-10 border border-dashed border-neutral-200 rounded-2xl">
            <p className="text-neutral-400 font-medium">No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentThread({ comment, replies, articleId, user }: { comment: Comment, replies: Comment[], articleId: string, user: any }) {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 p-5 rounded-xl border border-neutral-100 bg-white">
        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
          <span className="font-bold text-neutral-500">
            {comment.authorName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-2">
            <span className="font-bold text-neutral-900">{comment.authorName}</span>
            <span className="text-xs text-neutral-400 font-medium">
              {comment.createdAt?.toDate 
                ? comment.createdAt.toDate().toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : "Just now"}
            </span>
          </div>
          <p className="text-neutral-700 font-serif leading-relaxed whitespace-pre-wrap text-[15px]">
            {comment.content}
          </p>
          <div className="mt-3 flex justify-start">
            <button
               onClick={() => setIsReplying(!isReplying)}
               className="text-sm text-neutral-500 font-bold hover:text-primary transition-colors flex items-center gap-1"
            >
              <Reply className="w-4 h-4" /> Reply
            </button>
          </div>
        </div>
      </div>
      
      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-10 sm:ml-14 space-y-4">
          {replies.map(reply => (
            <div key={reply.id} className="flex gap-4 p-4 rounded-xl border border-primary/10 bg-primary/5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                <span className="font-bold text-neutral-500 text-xs">
                  {reply.authorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-bold text-neutral-900 text-sm">{reply.authorName}</span>
                  <span className="text-xs text-neutral-400 font-medium">
                    {reply.createdAt?.toDate 
                      ? reply.createdAt.toDate().toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : "Just now"}
                  </span>
                </div>
                <p className="text-neutral-700 font-serif leading-relaxed whitespace-pre-wrap text-[14px]">
                  {reply.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {isReplying && (
        <div className="ml-10 sm:ml-14 mt-2">
          <CommentForm 
            articleId={articleId} 
            user={user} 
            parentId={comment.id} 
            onSuccess={() => setIsReplying(false)} 
            placeholder={`Reply to ${comment.authorName}...`} 
          />
        </div>
      )}
    </div>
  );
}

function CommentForm({ articleId, user, parentId, onSuccess, placeholder = "Join the discussion..." }: { articleId: string, user: any, parentId?: string, onSuccess?: () => void, placeholder?: string }) {
  const [newComment, setNewComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !articleId) return;

    try {
      setSubmitting(true);
      await addDoc(collection(db, "article_comments"), {
        articleId,
        content: newComment.trim(),
        authorName: user?.displayName || guestName.trim() || "Anonymous",
        authorId: user?.uid || "anonymous",
        createdAt: serverTimestamp(),
        ...(parentId && { parentId })
      });
      setNewComment("");
      setGuestName("");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex gap-3 sm:gap-4">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
      </div>
      <div className="flex-1">
        {!user && (
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Your Name (optional)"
            className="w-full mb-2 sm:mb-3 p-2 sm:p-3 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans text-sm sm:text-base"
            disabled={submitting}
          />
        )}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[80px] sm:min-h-[100px] p-3 sm:p-4 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-sans text-sm sm:text-base"
          disabled={submitting}
        />
        <div className="flex justify-end mt-2 sm:mt-3">
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 text-xs py-2 sm:px-6 sm:py-2.5 sm:text-sm bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? "Posting..." : "Post"}
            {!submitting && <Send className="w-3 h-3 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>
    </form>
  );
}
