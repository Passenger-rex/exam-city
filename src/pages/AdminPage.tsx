import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Upload, Database, CheckCircle2, AlertCircle } from "lucide-react";
import { Logo } from "../components/Logo";

export default function AdminPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("Reading file...");
    setIsUploading(true);

    try {
      const text = await file.text();
      const questions = JSON.parse(text);

      if (!Array.isArray(questions)) {
        throw new Error("File must contain a JSON array of questions");
      }

      setStatus(`Uploading to exam city DB... (${questions.length} questions)`);

      const questionsRef = collection(db, "questions");
      let count = 0;

      for (const q of questions) {
        await addDoc(questionsRef, {
          ...q,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        count++;
        setStatus(
          `Uploading to exam city DB... (${count}/${questions.length})`,
        );
      }

      setStatus(`Successfully uploaded ${count} questions!`);
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-dim font-body-md text-on-surface">
      <nav className="bg-surface px-6 py-4 shadow-sm border-b border-outline-variant/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <Logo />
          </Link>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-primary font-bold text-sm hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-surface p-10 rounded-3xl shadow-sm border border-outline-variant/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-headline-md">
                Admin Database Panel
              </h1>
              <p className="text-on-surface-variant font-medium">
                Upload question banks to Firestore
              </p>
            </div>
          </div>

          <label
            className={`border-2 border-dashed border-primary/30 rounded-2xl p-12 block ${isUploading ? 'opacity-50 cursor-not-allowed bg-primary/5' : 'cursor-pointer hover:bg-primary/5'} transition-colors mb-6 text-center group`}
          >
            {isUploading ? (
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            ) : (
              <Upload className="w-12 h-12 text-primary/50 mx-auto mb-4 group-hover:text-primary transition-colors group-hover:-translate-y-1" />
            )}
            <span className="font-bold text-lg text-on-surface block mb-2">
              {isUploading ? "Uploading..." : "Select JSON File"}
            </span>
            <span className="text-on-surface-variant text-sm font-medium">
              {isUploading ? "Please wait while we process the questions" : "Drag and drop or click to browse"}
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>

          {status && (
            <div
              className={`p-4 rounded-xl border font-semibold flex items-center gap-3 ${status.startsWith("Error") ? "bg-error/10 border-error/20 text-error" : status.startsWith("Success") ? "bg-green-600/10 border-green-600/20 text-green-600" : "bg-primary/10 border-primary/20 text-primary"}`}
            >
              {status.startsWith("Error") ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              ) : status.startsWith("Success") ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
              <span>{status}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Temporary Link import for convenience
import { Link } from "react-router-dom";
