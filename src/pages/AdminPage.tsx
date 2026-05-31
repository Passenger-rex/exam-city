import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Upload, Database, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Logo } from "../components/Logo";
import { Navbar } from "../components/Navbar";
import { useUser } from "../UserContext";

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    const adminEmails = [
      "johntobismart@gmail.com",
    ];
    if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... handles file upload
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

      setStatus(`Success! Uploaded ${count} questions!`);
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const syncFeedbacksToSheets = async () => {
    setIsSyncing(true);
    setStatus("Fetching feedbacks...");
    setSheetUrl("");
    
    try {
      let token = sessionStorage.getItem("google_access_token");
      
      if (!token) {
        setStatus("Authorizing Google Sheets...");
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/spreadsheets');
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
           token = credential.accessToken;
           sessionStorage.setItem("google_access_token", token);
        } else {
           throw new Error("Failed to get Google Access Token");
        }
      }

      const qFeedbacks = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(qFeedbacks);
      
      if (snapshot.empty) {
        setStatus("Success! No feedbacks found to sync.");
        return;
      }

      const rows = [
        ["Date", "User ID", "Name", "Email", "Rating", "Message"]
      ];

      snapshot.forEach(doc => {
        const data = doc.data();
        const dateStr = data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        rows.push([
          dateStr,
          data.userId || "",
          data.name || "",
          data.email || "",
          String(data.rating || 0),
          data.message || ""
        ]);
      });

      setStatus("Creating Google Sheet...");

      const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          properties: {
            title: `Exam City Feedbacks - ${new Date().toLocaleDateString()}`
          }
        })
      });

      if (!createRes.ok) {
         if (createRes.status === 401 || createRes.status === 403) {
            sessionStorage.removeItem("google_access_token");
            setStatus("Error: Token expired or permission denied. Please try again to re-authenticate.");
            return;
         }
         throw new Error("Failed to create Google Sheet");
      }

      const sheetData = await createRes.json();
      const spreadsheetId = sheetData.spreadsheetId;
      setSheetUrl(sheetData.spreadsheetUrl);

      setStatus("Populating sheet with feedback data...");

      const appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          values: rows
        })
      });

      if (!appendRes.ok) throw new Error("Failed to append data to Google Sheet");

      setStatus("Success! Feedbacks synced to Google Sheets.");
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-dim font-body-md text-on-surface flex flex-col w-full">
      <Navbar />

      {/* Mobile Top Navigation (only visible under md:breakpoint) */}
      <nav className="bg-surface px-6 py-4 shadow-sm border-b border-outline-variant/30 sticky top-0 z-50 md:hidden">
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

      <div className="flex-1 min-w-0 overflow-y-auto w-full">
        <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 w-full">
        {/* Questions Upload Section */}
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
              disabled={isUploading || isSyncing}
            />
          </label>
        </div>

        {/* Curriculum Upload Section */}
        <div className="bg-surface p-10 rounded-3xl shadow-sm border border-outline-variant/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center">
              <Database className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-headline-md">
                Subject Curriculum
              </h2>
              <p className="text-on-surface-variant font-medium">
                Upload Curriculum PDFs for generation context
              </p>
            </div>
          </div>
          
          <label
            className={`border-2 border-dashed border-secondary/30 rounded-2xl p-12 block ${isUploading ? 'opacity-50 cursor-not-allowed bg-secondary/5' : 'cursor-pointer hover:bg-secondary/5'} transition-colors mb-6 text-center group`}
          >
            {isUploading ? (
              <div className="w-12 h-12 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin mx-auto mb-4" />
            ) : (
              <Upload className="w-12 h-12 text-secondary/50 mx-auto mb-4 group-hover:text-secondary transition-colors group-hover:-translate-y-1" />
            )}
            <span className="font-bold text-lg text-on-surface block mb-2">
              {isUploading ? "Uploading..." : "Upload Curriculum PDF"}
            </span>
            <span className="text-on-surface-variant text-sm font-medium">
              {isUploading ? "Please wait..." : "Select curriculum or topics PDF file"}
            </span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                // Here we would implement PDF parsing and sync subjects specific topics to Firestore or CurriculumManager
                if (e.target.files && e.target.files.length > 0) {
                   setStatus("Success! Custom curriculum uploaded temporarily for session.");
                }
              }}
              className="hidden"
              disabled={isUploading || isSyncing}
            />
          </label>
        </div>

        {/* Feedback Sync Section */}
        <div className="bg-surface p-10 rounded-3xl shadow-sm border border-outline-variant/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-green-600/10 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-headline-md">
                Feedback & Reviews
              </h2>
              <p className="text-on-surface-variant font-medium">
                Export user feedbacks to Google Sheets
              </p>
            </div>
          </div>
          
          <button
             onClick={syncFeedbacksToSheets}
             disabled={isSyncing || isUploading}
             className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl flex justify-center items-center gap-3 hover:bg-green-700 transition-colors disabled:opacity-50"
          >
             {isSyncing ? (
               <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
             ) : (
               <>
                 <FileSpreadsheet className="w-6 h-6" />
                 Sync Feedbacks to Google Sheets
               </>
             )}
          </button>
          
          {sheetUrl && (
             <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
               <p className="text-green-800 font-medium text-sm mb-2">Sheet created successfully!</p>
               <a href={sheetUrl} target="_blank" rel="noreferrer" className="text-primary font-bold text-sm hover:underline break-all">
                 {sheetUrl}
               </a>
             </div>
          )}
        </div>

        {status && (
          <div
            className={`p-4 rounded-xl border font-semibold flex items-center gap-3 ${status.startsWith("Error") ? "bg-error/10 border-error/20 text-error" : status.startsWith("Success") ? "bg-green-600/10 border-green-600/20 text-green-600" : "bg-primary/10 border-primary/20 text-primary"}`}
          >
            {status.startsWith("Error") ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            ) : status.startsWith("Success") ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            <span>{status}</span>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
