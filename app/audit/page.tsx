'use client';
import { useState, useEffect } from 'react';
import { Shield, Search, ChevronDown, RefreshCw } from 'lucide-react';
import { auditApi } from '@/lib/api';
import type { AuditLogOut } from '@/lib/api.types';
import { cn } from '@/lib/utils';

const ACTION_COLORS: Record<string, string> = {
  'user.login':    'bg-green-100 text-green-700',
  'user.logout':   'bg-slate-100 text-slate-600',
  'user.register': 'bg-blue-100 text-blue-700',
  'user.invite':   'bg-purple-100 text-purple-700',
  'user.update':   'bg-amber-100 text-amber-700',
  'user.deactivate': 'bg-red-100 text-red-700',
  'mfa.enable':    'bg-cyan-100 text-cyan-700',
  'mfa.disable':   'bg-orange-100 text-orange-700',
  'session.revoke': 'bg-red-100 text-red-700',
  'team.create':   'bg-indigo-100 text-indigo-700',
  'team.update':   'bg-indigo-100 text-indigo-600',
  'team.delete':   'bg-red-100 text-red-600',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  async function load(pg = 1) {
    setLoading(true);
    setError('');
    try {
      const data = await auditApi.list({ page: pg });
      setLogs(data);
    } catch (e: any) {
      setError(e?.detail ?? 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, []);

  const filtered = logs.filter(l =>
    !search ||
    l.action.includes(search) ||
    l.user_id?.includes(search) ||
    l.target_id?.includes(search) ||
    l.ip_address?.includes(search)
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Audit Log</h1>
          <p className="text-xs text-slate-500">Track all sensitive actions across the platform</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            placeholder="Filter by action, user, IP…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>
        <button
          onClick={() => load(page)}
          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          {error ? (
            <div className="flex items-center justify-center h-40 text-red-500 text-sm gap-2">
              <Shield className="w-4 h-4" />{error}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Timestamp</th>
                  <th className="text-left px-4 py-3">Action</th>
                  <th className="text-left px-4 py-3">Actor (User ID)</th>
                  <th className="text-left px-4 py-3">Target</th>
                  <th className="text-left px-4 py-3">IP Address</th>
                  <th className="text-left px-4 py-3">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmt(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold', ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600')}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">{log.user_id?.slice(0, 8) ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.target_type && <span className="text-slate-400">{log.target_type}/</span>}
                      <span className="font-mono text-[10px]">{log.target_id?.slice(0, 8) ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[10px]">{log.ip_address ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{log.detail ?? '—'}</td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">No audit entries found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
          <span>{filtered.length} entries</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => { setPage(p => p - 1); load(page - 1); }}
              className="px-2 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
            >
              ← Prev
            </button>
            <span className="px-2">Page {page}</span>
            <button
              disabled={filtered.length < 50}
              onClick={() => { setPage(p => p + 1); load(page + 1); }}
              className="px-2 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
