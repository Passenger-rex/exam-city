import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Bold, Italic, List, Code, FileText, Eye } from "lucide-react";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

interface TheoryEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function TheoryEditor({ value, onChange, placeholder }: TheoryEditorProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const recognitionRef = useRef<any>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onChange(value + (value ? " " : "") + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        if (isRecording) {
          recognition.start(); // auto-restart if still recording
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [value, onChange, isRecording]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const insertText = (prefix: string, suffix: string) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className="flex flex-col border-2 border-outline-variant/50 rounded-2xl overflow-hidden bg-surface-dim transition-all focus-within:border-primary focus-within:shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant/50 bg-surface">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("write")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${activeTab === "write" ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-dim"}`}
          >
            <FileText className="w-3.5 h-3.5" /> Write
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${activeTab === "preview" ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-dim"}`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          
          <div className="w-px h-4 bg-outline-variant/50 mx-1" />
          
          <button onClick={() => insertText("**", "**")} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-md" title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => insertText("*", "*")} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-md" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => insertText("\n- ", "")} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-md" title="Bullet List">
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => insertText("$$", "$$")} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-md" title="Math (KaTeX)">
            <span className="font-serif font-bold text-sm">∑</span>
          </button>
        </div>
        
        <button
          onClick={toggleRecording}
          className={`p-1.5 rounded-md flex items-center gap-1.5 px-3 text-xs font-bold transition-all ${isRecording ? "bg-red-500/10 text-red-600 animate-pulse" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
        >
          {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          {isRecording ? "Stop" : "Dictate"}
        </button>
      </div>

      {/* Editor / Preview Area */}
      {activeTab === "write" ? (
        <textarea
          ref={textAreaRef}
          placeholder={placeholder || "Type your comprehensive answer here... You can use Markdown and KaTeX ($$)."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[250px] p-5 bg-transparent outline-none font-medium text-on-surface resize-y custom-scrollbar text-base"
        />
      ) : (
        <div className="w-full min-h-[250px] p-5 bg-surface markdown-body overflow-y-auto">
          {value ? (
            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
              {value}
            </Markdown>
          ) : (
            <span className="text-on-surface-variant/50 italic">Nothing to preview.</span>
          )}
        </div>
      )}
    </div>
  );
}
