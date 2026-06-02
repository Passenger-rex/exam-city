import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, BookOpen, AlertCircle, Check, Mail, Globe } from "lucide-react";
import { Logo } from "../components/Logo";

export default function TermsPage() {
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
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Platform Guidelines</span>
          </div>

          <h1 className="text-4xl font-black text-on-surface tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-on-surface-variant mb-10 leading-relaxed font-medium">
            Last Updated: June 2, 2026. Please read these Terms of Service carefully before registering, subscribing, or interacting with the Exam City academic training portals.
          </p>

          <div className="border-t border-outline-variant/50 pt-8 space-y-10">
            {/* Agreement */}
            <section className="bg-amber-50/45 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-5 flex gap-4">
              <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-amber-900 dark:text-amber-400">Acceptance of Terms</h4>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-500/80 leading-relaxed">
                  By accessing, registering for, or using Exam City, you represent that you agree to be bound by these Terms of Service in their entirety. If you do not accept these policies, you must immediately suspend activity on our platform.
                </p>
              </div>
            </section>

            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
                <span className="text-primary font-mono text-sm block">01.</span>
                User Requirements and Eligibility
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                To sign up and create keys on the platform, you must verify that all registered fields correspond to your real identity. During enrollment, users must input approved and authentic email services (e.g. Gmail, Yahoo, Outlook) to prevent platform congestion and verify legitimate user credentials.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
                <span className="text-primary font-mono text-sm block">02.</span>
                Academic Intellectual Property
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                All material displayed or generated on this application—including question schemas, mathematics LaTeX formulas, formatting arrays, visual exam diagrams, solutions, and intelligent tutoring responses—belongs strictly to Exam City.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                {[
                  "You may download or print PDF offline sheets only for individual, non-commercial exam preparatory study.",
                  "Any automated scraping, systematic dataset harvesting, or sharing of exam databases is strictly prohibited."
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 text-xs text-on-surface-variant font-medium bg-surface-dim/40 rounded-xl p-3 border border-outline-variant/10">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
                <span className="text-primary font-mono text-sm block">03.</span>
                Premium Operations and Refunds
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Exam City provides selective pro tiers to enrich testing capability. Subscription charges and upgrades are processed through secure digital corridors. All completed upgraded actions are immediately synchronized into the database. If any billing disputes develop, the user may request diagnostic records by checking out through correct administrative channels. Refund models are governed by the specific billing agreements made upon pro registration.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
                <span className="text-primary font-mono text-sm block">04.</span>
                Disclaimer and Limitation of Liability
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Exam City serves strictly as an adaptive study assistant. Although we work with qualified teachers and accurate AI tutoring APIs to generate compliant tests, we do not promise specific grading metrics or positive success rates on physical state examinations. The service is provided 'as is' without additional active guarantees.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
                <span className="text-primary font-mono text-sm block">05.</span>
                System Termination
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                We reserve the right to suspend accounts, invalidate user records, or deny portal entries for users found in violation of acceptable academic behavior directives, system scraping constraints, or authentication policy abuse.
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
