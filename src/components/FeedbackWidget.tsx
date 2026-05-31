import React, { useState } from "react";
import { MessageSquare, X, Send, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useUser } from "../UserContext";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export function FeedbackWidget() {
  const { user, profile } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"feedback" | "complaint">("feedback");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 500 * 1024) {
        setError("File size must be less than 500KB.");
        return;
      }
      setAttachment(file);
      setError("");
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const appendComplaintToSheet = async (token: string, data: {
    userId: string;
    name: string;
    email: string;
    message: string;
    hasAttachment: boolean;
  }) => {
    let spreadsheetId = localStorage.getItem("complaints_spreadsheet_id");

    if (!spreadsheetId) {
      // Create spreadsheet
      const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          properties: {
            title: `Exam City - Payment Complaints`
          }
        })
      });

      if (!createRes.ok) {
         if (createRes.status === 401 || createRes.status === 403) {
            sessionStorage.removeItem("google_access_token");
         }
         throw new Error("Failed to create Google Sheet for complaints tracker.");
      }

      const sheetData = await createRes.json();
      spreadsheetId = sheetData.spreadsheetId;
      if (spreadsheetId) {
        localStorage.setItem("complaints_spreadsheet_id", spreadsheetId);
        
        // Add header row first
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            values: [
              ["Date", "User ID", "Name", "Email", "Details of Complaint", "Screenshot/Receipt Attached?"]
            ]
          })
        });
      }
    }

    if (spreadsheetId) {
      const row = [
        new Date().toISOString(),
        data.userId,
        data.name,
        data.email,
        data.message,
        data.hasAttachment ? "Yes" : "No"
      ];

      const appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          values: [row]
        })
      });

      if (!appendRes.ok) {
        if (appendRes.status === 401 || appendRes.status === 403) {
           sessionStorage.removeItem("google_access_token");
        }
        throw new Error("Failed to append complaint row to the sheet.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && rating === 0) {
      setError("Please provide a rating or a message.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    const userName = profile?.name || user?.displayName || user?.name || "Anonymous User";
    let token = sessionStorage.getItem("google_access_token");

    // If it's a payment complaint, ensure Google Sheets authorization is obtained
    if (type === "complaint" && !token) {
      setError("Authorizing Google Sheets for secure complaint sync...");
      try {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/spreadsheets');
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          token = credential.accessToken;
          sessionStorage.setItem("google_access_token", token);
          setError("");
        } else {
          throw new Error("Failed to retrieve Google Auth access token");
        }
      } catch (err: any) {
        console.error("Sheets Auth collection failed:", err);
        setError("To submit a payment complaint, Google Sheets login/authorization is required. Please try again.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      let attachmentRef = null;
      if (attachment && type === "complaint") {
        const dataUrl = await readFileAsDataURL(attachment);
        const attachmentDoc = await addDoc(collection(db, "attachments"), {
          dataUrl,
          fileName: attachment.name,
          fileType: attachment.type,
          createdAt: serverTimestamp(),
          userId: user?.uid || "anonymous"
        });
        attachmentRef = attachmentDoc; // DocumentReference
      }

      await addDoc(collection(db, "feedbacks"), {
        userId: user?.uid || "anonymous",
        name: userName,
        email: user?.email || "N/A",
        type,
        message: message.trim(),
        rating,
        attachmentRef: attachmentRef || null,
        createdAt: serverTimestamp()
      });

      // If it is a payment complaint, sync directly to the Google Sheet too!
      if (type === "complaint" && token) {
        setError("Syncing complaint to Google Sheet...");
        try {
          await appendComplaintToSheet(token, {
            userId: user?.uid || "anonymous",
            name: userName,
            email: user?.email || "N/A",
            message: message.trim(),
            hasAttachment: !!attachment
          });
        } catch (sheetErr: any) {
          console.error("Google Sheets sync failed:", sheetErr);
          // Don't fail the raw Firestore submission if the row append fails, but warn the user
          setError("Submitted to database! Note: failed to append to Google Sheet.");
          setIsSuccess(true);
          setTimeout(() => {
            setIsOpen(false);
            setIsSuccess(false);
            setMessage("");
            setRating(0);
            setType("feedback");
            setAttachment(null);
            setError("");
          }, 4000);
          return;
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setMessage("");
        setRating(0);
        setType("feedback");
        setAttachment(null);
        setError("");
      }, 3000);
    } catch (err: any) {
      console.error("Error submitting:", err);
      setError("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-surface border border-outline-variant rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="bg-primary p-4 text-on-primary flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Support & Feedback</h3>
                <p className="text-sm opacity-90">How can we help you today?</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-black/10 p-1.5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-primary mb-3" />
                  <h4 className="font-bold text-lg text-on-surface">Thank You!</h4>
                  <p className="text-on-surface-variant text-sm mt-1">We have received your submission.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">Issue Type</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setType("feedback")}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${type === "feedback" ? "bg-primary text-on-primary border-primary" : "bg-transparent border-outline-variant text-on-surface-variant"}`}
                      >
                        Feedback & Review
                      </button>
                      <button
                        type="button"
                        onClick={() => setType("complaint")}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${type === "complaint" ? "bg-primary text-on-primary border-primary" : "bg-transparent border-outline-variant text-on-surface-variant"}`}
                      >
                        Payment Complaint
                      </button>
                    </div>
                  </div>

                  {type !== "complaint" && (
                    <div>
                      <label className="block text-sm font-medium text-on-surface mb-2">How would you rate your experience?</label>
                      <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-2xl transition-colors ${rating >= star ? "text-amber-400" : "text-outline-variant"}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      {type === "complaint" ? "Describe your issue" : "Your message"}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={type === "complaint" ? "Please provide details about your payment issue including transaction references if any..." : "Tell us what you love or what we could improve..."}
                      className="w-full h-24 bg-surface-dim border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-3 text-sm resize-none text-on-surface transition-all"
                    ></textarea>
                  </div>

                  {type === "complaint" && (
                    <div>
                      <label className="block text-sm font-medium text-on-surface mb-2">
                        Attachment (Receipt / Screenshot)
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                      />
                    </div>
                  )}
                  
                  {error && <p className="text-error text-xs">{error}</p>}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit {type === "complaint" ? "Complaint" : "Feedback"}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 hover:-translate-y-1 transition-all"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
