import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Laptop, Trash2, ShieldAlert, ArrowRight } from 'lucide-react';
import { useUser } from '../UserContext';
import { Logo } from '../components/Logo';

export default function DevicesPage() {
  const { user } = useUser();
  const userId = user?.uid;
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchDevices() {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/devices?userId=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDevices(data.devices || []);
    } catch (err: any) {
      setError(err.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }

  async function revoke(deviceId: string) {
    if (!userId) return;
    try {
      const res = await fetch('/api/auth/devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, deviceId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Device revoked successfully');
      fetchDevices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function revokeAll() {
    if (!userId) return;
    if (!window.confirm('Revoke all trusted devices? You will need to verify on your next login from each device.')) return;
    try {
      const res = await fetch('/api/auth/devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, revokeAll: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('All devices revoked successfully');
      fetchDevices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    fetchDevices();
  }, [userId]);

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
              Trusted Devices
            </h1>
            <p className="text-sm text-on-surface-variant max-w-sm">
              Manage the devices authorized to skip secondary login challenges on your account.
            </p>
          </div>
          {devices.length > 0 && (
            <button
              onClick={revokeAll}
              className="text-xs px-4 py-2 text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors font-medium flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Revoke All
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-2xl flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-4 pt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-surface rounded-2xl border border-outline-variant/30" />
            ))}
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-16 px-6 bg-surface border border-outline-variant/30 rounded-3xl">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Laptop className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">No trusted devices</h3>
            <p className="text-sm text-on-surface-variant max-w-xs mx-auto mt-2">
              You haven't trusted any devices yet. We'll ask you to verify on your next login from a new IP.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device, idx) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-5 bg-surface border border-outline-variant/30 rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[15px] font-mono">{device.ip_address || 'Unknown Origin'}</h4>
                    <div className="flex gap-3 text-xs text-on-surface-variant mt-1.5 font-medium">
                      <span className="flex items-center gap-1">
                        Status: <span className={device.isExpired ? "text-red-400" : "text-emerald-400"}>{device.status}</span>
                      </span>
                      <span>&bull;</span>
                      <span>Last Seen: {new Date(device.last_used).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => revoke(device.id)}
                  className="px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase bg-surface-dim hover:bg-red-500/10 hover:text-red-400 text-on-surface-variant border border-outline-variant/50 rounded-lg transition-colors"
                >
                  Revoke
                </button>
              </motion.div>
            ))}
          </div>
        )}
        
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
