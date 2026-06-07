import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useUser } from '../UserContext';
import { Logo } from '../components/Logo';

export default function DevicesPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-background text-on-background py-16 px-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex justify-center mb-10">
          <Logo />
        </div>
        
        <div className="flex items-end justify-between border-b border-outline-variant/30 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Device Security
            </h1>
            <p className="text-sm text-on-surface-variant max-w-sm">
              Account security is now managed securely via email OTP verification on sign-in.
            </p>
          </div>
        </div>

        <div className="text-center py-16 px-6 bg-surface border border-outline-variant/30 rounded-3xl">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold">Your Account is Secure</h3>
          <p className="text-sm text-on-surface-variant max-w-xs mx-auto mt-2">
            Exam City secures your account using email verification. You will receive an OTP code to your registered email address whenever you need to verify your identity.
          </p>
        </div>
        
        <div className="pt-8 text-center border-t border-outline-variant/30">
           <a href="/" className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
             <ArrowRight className="w-4 h-4 rotate-180" />
             Return to Dashboard
           </a>
        </div>
      </div>
    </div>
  );
}
