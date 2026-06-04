import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, Loader2, XCircle } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function VerifyLoginPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your device... Please wait.');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided. Link may be malformed.');
      return;
    }

    async function verifyToken() {
      try {
        const docRef = doc(db, 'login_verifications', token as string);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          setStatus('error');
          setMessage('Verification link is invalid or has expired.');
          return;
        }

        const data = snap.data();
        if (data.used || data.verified) {
          setStatus('error');
          setMessage('This link has already been used.');
          return;
        }

        const expiresAt = new Date(data.expires_at).getTime();
        if (Date.now() > expiresAt) {
          setStatus('error');
          setMessage('This verification link has expired. Please try signing in again.');
          return;
        }

        await updateDoc(docRef, {
          verified: true,
          used: true
        });

        setStatus('success');
        setMessage('Your device has been verified successfully. You can return to your original browser tab and you will be signed in automatically.');
      } catch (err: any) {
        console.error('Verification error:', err);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    }

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-on-surface">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-outline-variant/30 text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-bold tracking-tight mb-2">Verifying...</h2>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-3">Device Verified</h2>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-3">Verification Failed</h2>
          </div>
        )}

        <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
          {message}
        </p>

        {status === 'success' && (
          <div className="mt-8 p-4 bg-surface-dim rounded-2xl border border-outline-variant/30 text-xs text-on-surface-variant">
            You can safely close this tab or window.
          </div>
        )}
      </div>
    </div>
  );
}
