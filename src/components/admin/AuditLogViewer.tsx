import React, { useState, useEffect } from 'react';
import { Activity, Search, RefreshCw, Shield, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { AuditLog } from '../../types/index';

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
      l.entityType.toLowerCase().includes(search.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">System Security &amp; Audit Trail</h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable log of all administrator operations, configuration updates, and CRM state modifications.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by action, user email, or affected entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading security logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No activity recorded.</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-900/40 transition-colors space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase">
                      {log.action}
                    </span>
                    <span className="text-xs font-mono text-slate-400">[{log.entityType}]</span>
                    {log.entityId && (
                      <span className="text-[10px] text-slate-500 font-mono">#{log.entityId}</span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                {log.details && (
                  <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    {log.details}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Authorized by: {log.adminEmail}</span>
                  <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
