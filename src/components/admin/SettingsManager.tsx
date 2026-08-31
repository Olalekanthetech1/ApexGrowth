import React, { useState } from 'react';
import {
  Key,
  Shield,
  Server,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export function SettingsManager() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setFeedback({ type: 'error', text: 'Password must be at least 8 characters long' });
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setFeedback({ type: 'success', text: 'Password successfully changed! Use your new credentials on next login.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setSavingPassword(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">System Settings &amp; Security</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your administrator security credentials, session encryption, and system persistent stores.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/80 border border-red-500/40 text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Password Change Form */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Key className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-base font-bold text-white font-display">Change Administrator Password</h3>
            <p className="text-xs text-slate-400">Update the cryptographic password hash for {user?.email}</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password *</label>
            <input
              type="password"
              required
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password *</label>
              <input
                type="password"
                required
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-start">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow flex items-center gap-2"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* System Information Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Server className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-white font-display">System Infrastructure &amp; Runtime</h3>
            <p className="text-xs text-slate-400">Environment status and persistence health</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Persistence Layer</span>
            </div>
            <div className="text-sm font-bold text-white">PostgreSQL (Drizzle ORM)</div>
            <div className="text-[10px] text-emerald-400 font-mono">Cloud SQL Relational Engine</div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Auth Middleware</span>
            </div>
            <div className="text-sm font-bold text-white">JWT + Bcrypt (10 rounds)</div>
            <div className="text-[10px] text-slate-400 font-mono">Server-side Bearer Header &amp; Cookie</div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Backend API</span>
            </div>
            <div className="text-sm font-bold text-white">Express v4 / Node.js</div>
            <div className="text-[10px] text-slate-400 font-mono">Zod Validated &amp; Rate-Limited</div>
          </div>
        </div>
      </div>
    </div>
  );
}
