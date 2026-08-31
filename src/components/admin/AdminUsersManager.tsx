import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, CheckCircle2, AlertCircle, X, Loader2, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { AdminUser } from '../../types/index';
import { useAuth } from '../../context/AuthContext';

export function AdminUsersManager() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'superadmin' | 'admin' | 'editor'>('editor');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load admin users' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.createAdminUser({
        email: newEmail,
        name: newName,
        password: newPassword,
        role: newRole,
      });
      setFeedback({ type: 'success', text: `Admin user ${newEmail} created successfully` });
      setShowAddModal(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      await loadUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to create user' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleDeleteUser = async (userToDelete: AdminUser) => {
    if (userToDelete.id === currentUser?.id) {
      setFeedback({ type: 'error', text: 'You cannot delete your own active administrator session account.' });
      return;
    }

    if (!confirm(`Are you sure you want to remove administrator access for ${userToDelete.name} (${userToDelete.email})?`)) {
      return;
    }

    try {
      await api.deleteAdminUser(userToDelete.id);
      setFeedback({ type: 'success', text: `Removed administrator ${userToDelete.email}` });
      await loadUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete user' });
    } finally {
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const isSuperadmin = currentUser?.role === 'superadmin';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Administrator Access &amp; RBAC</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage user accounts with authorization to access the business administration console.
          </p>
        </div>

        {isSuperadmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all self-start cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Admin User</span>
          </button>
        )}
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

      {/* Modal to add user */}
      {showAddModal && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/50 bg-slate-900/95 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-display">Create Administrator User</h3>
            <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Sarah Connor"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="sarah@apexgrowth.digital"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="editor">Editor (Content &amp; CRM Access)</option>
                  <option value="admin">Admin (Content, CRM &amp; Audit Logs)</option>
                  <option value="superadmin">Superadmin (Full Control &amp; User Provisioning)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Create User</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-3">
        {users.map((u) => {
          const isMe = currentUser?.email === u.email;
          return (
            <div
              key={u.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{u.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300">
                    {u.role}
                  </span>
                  {isMe && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      (Current Session)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{u.email}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Last Login: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never logged in'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-400" />
                {isSuperadmin && !isMe && (
                  <button
                    onClick={() => handleDeleteUser(u)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/50 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    title={`Delete user ${u.email}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
