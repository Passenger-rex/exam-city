import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Lock } from 'lucide-react';

function OTPVerifyContent() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const userId   = params.get('userId');
  const email    = params.get('email');

  const [otp, setOtp]               = useState('');
  const [trustDevice, setTrust]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [attemptsLeft, setAttempts] = useState(5);
  const [locked, setLocked]         = useState(false);
  const [cooldown, setCooldown]     = useState(0);
  const [resendsLeft, setResends]   = useState(3);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => c <= 1 ? (clearInterval(t), 0) : c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleVerify() {
    if (otp.length !== 6 || locked) return;
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otpCode: otp, trustDevice }) // using otpCode as expected by our server
      });
      const data = await res.json();
      setLoading(false);
      
      if (!res.ok) {
        setError(data.error);
        if (data.attemptsLeft !== undefined) setAttempts(data.attemptsLeft);
        if (data.locked) setLocked(true);
        return;
      }
      setSuccess("Verified successfully");
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch(err: any) {
       setError(err.message);
       setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resendsLeft <= 0 || locked) return;
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      setLoading(false);
      
      if (!res.ok) {
        setError(data.error);
        if (data.cooldownSeconds) setCooldown(data.cooldownSeconds);
        if (data.maxReached || data.resendsLeft === 0) setResends(0);
        return;
      }
      setResends(data.resendsLeft);
      setAttempts(5);
      setOtp('');
      setCooldown(60);
      setSuccess('New code sent — check your email.');
      setTimeout(() => setSuccess(''), 3000);
    } catch(err: any) {
        setError(err.message);
        setLoading(false);
    }
  }

  // Auto-submit when 6 digits entered
  useEffect(() => { if (otp.length === 6 && !locked) handleVerify(); }, [otp]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'var(--color-surface, #F9FAFB)', color: 'var(--color-on-surface, #1A1A1A)' }}>
      <div style={{ width: '100%', maxWidth: 400, backgroundColor: 'white', padding: 32, borderRadius: 24, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(234, 179, 8, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 24
          }}>
            <ShieldCheck style={{ color: '#EAB308', width: 28, height: 28 }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 8px' }}>Verify your login</h1>
          <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        {/* OTP Input */}
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          disabled={locked}
          onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="000000"
          style={{
            width: '100%', fontSize: 36, letterSpacing: 16,
            textAlign: 'center', padding: '18px 0',
            border: `1px solid ${locked ? '#FCA5A5' : '#E5E7EB'}`,
            borderRadius: 12,
            background: locked ? '#FEF2F2' : '#FFFFFF',
            marginBottom: 16, boxSizing: 'border-box',
            outline: 'none',
            fontFamily: 'monospace'
          }}
          autoFocus
        />

        {/* Trust device */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: locked ? 'not-allowed' : 'pointer' }}>
          <input
            type="checkbox"
            checked={trustDevice}
            disabled={locked}
            onChange={e => setTrust(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary"
          />
          <span style={{ fontSize: 14, color: '#666' }}>
            Trust this device for 30 days
          </span>
        </label>

        {/* Attempt counter */}
        {attemptsLeft < 5 && !locked && (
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: 'rgba(234, 179, 8, 0.1)',
            color: '#CA8A04',
            fontSize: 13, marginBottom: 12,
            display: 'flex', alignItems: 'center'
          }}>
            <AlertTriangle style={{ marginRight: 8, width: 16, height: 16 }} />
            {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining
          </div>
        )}

        {/* Locked state */}
        {locked && (
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: '#FEF2F2',
            color: '#DC2626',
            fontSize: 13, marginBottom: 12,
            display: 'flex', alignItems: 'center'
          }}>
            <Lock style={{ marginRight: 8, width: 16, height: 16 }} />
            Too many attempts. Request a new code below.
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12, textAlign: 'center' }}>{error}</p>
        )}

        {/* Success */}
        {success && (
          <p style={{ fontSize: 13, color: '#16A34A', marginBottom: 12, textAlign: 'center' }}>{success}</p>
        )}

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={loading || locked || otp.length !== 6}
          style={{
            width: '100%', padding: '13px 0', marginBottom: 10,
            background: '#1A1A1A',
            color: '#FFFFFF',
            border: 'none', borderRadius: 12,
            fontSize: 15, cursor: locked ? 'not-allowed' : 'pointer',
            opacity: (loading || locked || otp.length !== 6) ? 0.5 : 1,
            fontWeight: 500
          }}
        >
          {loading ? 'Verifying...' : 'Verify login'}
        </button>

        {/* Resend button */}
        <button
          onClick={handleResend}
          disabled={loading || cooldown > 0 || resendsLeft <= 0}
          style={{
            width: '100%', padding: '12px 0',
            background: 'transparent',
            color: cooldown > 0 || resendsLeft <= 0 ? '#9CA3AF' : '#4B5563',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            fontSize: 14, cursor: cooldown > 0 || resendsLeft <= 0 ? 'not-allowed' : 'pointer',
            fontWeight: 500
          }}
        >
          {cooldown > 0
            ? `Resend in ${cooldown}s`
            : resendsLeft <= 0
            ? 'No resends remaining'
            : `Resend code (${resendsLeft} left)`}
        </button>

      </div>
    </div>
  );
}

export default function VerifyLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OTPVerifyContent />
    </Suspense>
  );
}
