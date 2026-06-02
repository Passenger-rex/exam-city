import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Shield, CheckCircle, Mail, Globe } from "lucide-react";
import { Logo } from "../components/Logo";

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-dim text-on-surface flex flex-col selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="text-xl md:text-2xl" />
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-surface-container hover:bg-surface-dim hover:text-primary transition-all cursor-pointer border border-outline-variant/30"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-surface border border-outline-variant/50 rounded-3xl p-8 md:p-12 shadow-sm"
        >
          {/* Cover Section */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Trust & Security</span>
          </div>

          <h1 className="text-4xl font-black text-on-surface tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-on-surface-variant mb-10 leading-relaxed font-medium">
            Last Updated: June 2, 2026. This Privacy Policy describes how Exam City ("we", "our", or "us") collects, uses, and safeguards your information when you register, log in, or interact with our learning management and testing platform.
          </p>

          <div className="border-t border-outline-variant/50 pt-8 space-y-10">
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
                <span className="text-primary font-mono text-sm block">01.</span>
                Information We Collect
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                We collect personal information that you voluntarily provide to us when registering on the platform, signing up for full-access academic prep material, or requesting AI-powered tutor services:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                {[
                  "Account registration credentials (Full Name, Password, and approved Email formats).",
                  "Performance trackers (records of custom mock examinations, selected quiz types, and total count).",
                  "Academic inputs and questions dispatched to our AI smart tutoring workspace.",
                  "Diagnostic error reports, browser details, and localized system logs."
                ].map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-on-surface-variant font-medium leading-normal bg-surface-dim/40 p-3 rounded-xl border border-outline-variant/20">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
                <span className="text-primary font-mono text-sm block">02.</span>
                How We Use Your Information
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                The operations performed with your processed dataset are strictly focused on maintaining and enhancing educational services:
              </p>
              <div className="space-y-3 pl-2">
                <div className="p-4 bg-surface-dim/40 border border-outline-variant/30 rounded-2xl">
                  <h3 className="font-bold text-xs text-on-surface mb-1">Authentic Practice Grading</h3>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Analyzing user question patterns allows us to score results correctly, calculate instant percentage weights, and format precise performance reviews.
                  </p>
                </div>
                <div className="p-4 bg-surface-dim/40 border border-outline-variant/30 rounded-2xl">
                  <h3 className="font-bold text-xs text-on-surface mb-1">Tutoring Recommendations and Categorization</h3>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    When you consult our smart tutor modules, we pass non-identifying math and science datasets to secure backend models in order to deliver fractions, subscript solutions, and formulas.
                  </p>
                </div>
                <div className="p-4 bg-surface-dim/40 border border-outline-variant/30 rounded-2xl">
                  <h3 className="font-bold text-xs text-on-surface mb-1">Administrative Synchronization</h3>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    User activity metadata, feedback issues, and past rating histories are synchronized securely via administrative interfaces to enable consistent technical support.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
                <span className="text-primary font-mono text-sm block">03.</span>
                Cookies and Local Session Persistence
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                To guarantee smooth exam progress and avoid data loss in the middle of active assessments, we preserve necessary diagnostic parameters using standard Web Storage APIs (such as local and session storage variables). No tracking pixels, third-party advertising cookie bundles, or non-educational tracking services are utilized by Exam City.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
                <span className="text-primary font-mono text-sm block">04.</span>
                Data Security Protocols
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                We are committed to securing your database footprint. All authentic user registrations, grading frameworks, and AI interaction transcripts are stored within encrypted Firebase Cloud infrastructure. Access to these resources requires specialized secure keys, keeping external actors from accessing your record.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
                <span className="text-primary font-mono text-sm block">05.</span>
                User Rights & Subject Requests
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                You maintain direct sovereignty over your personal account. In compliance with active web safety mandates, you holding the right to review your registered profiles, inspect graded results, or request complete removal of your personal exam profiles from our systems. For data inquiries, reach out through the official support options provided in the administrative module.
              </p>
            </section>
          </div>

          {/* Footer Contact Info */}
          <div className="mt-12 pt-8 border-t border-outline-variant/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold text-on-surface-variant">
            <div className="flex items-center gap-2 bg-surface-container py-2.5 px-4 rounded-xl border border-outline-variant/30">
              <Mail className="w-4 h-4 text-primary" />
              <span>johntobismart@gmail.com</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container py-2.5 px-4 rounded-xl border border-outline-variant/30">
              <Globe className="w-4 h-4 text-primary" />
              <span>examcity.netlify.app</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Outer Footer */}
      <footer className="py-8 text-center text-xs text-on-surface-variant/60 border-t border-outline-variant/20 bg-surface-dim">
        <p>&copy; 2026 exam city. All rights reserved.</p>
      </footer>
    </div>
  );
}
