'use client';
import { useState, useEffect } from 'react';
import { Monitor, Shield, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import type { SessionOut } from '@/lib/api.types';
import { cn } from '@/lib/utils';

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function parseUA(ua: string | null): string {
  if (!ua) return 'Unknown browser';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return ua.slice(0, 40);
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setSessions(await authApi.sessions());
    } catch (e: any) {
      setError(e?.detail ?? 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function revoke(id: string) {
    setRevoking(id);
    try {
      await authApi.revokeSession(id);
      await load();
    } catch (e: any) {
      setError(e?.detail ?? 'Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  }

  const active = sessions.filter(s => !s.revoked_at);
  const revoked = sessions.filter(s => s.revoked_at);

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Active Sessions</h1>
          <p className="text-xs text-slate-500">Manage where you're signed in · Revoke suspicious sessions</p>
        </div>
        <button
          onClick={load}
          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', loading && 'animate-spin')} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Active sessions */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Active ({active.length})</p>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-48 animate-pulse" />
                  <div className="h-2.5 bg-slate-100 rounded w-32 animate-pulse" />
                </div>
              </div>
            ))
          ) : active.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">No active sessions.</div>
          ) : (
            active.map((s) => (
              <div key={s.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{parseUA(s.user_agent)}</p>
                  <p className="text-xs text-slate-400">
                    IP: <span className="font-mono">{s.ip_address ?? 'unknown'}</span>
                    {' · '}Last seen: {fmt(s.last_seen_at)}
                    {' · '}Started: {fmt(s.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => revoke(s.id)}
                  disabled={revoking === s.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {revoking === s.id ? 'Revoking…' : 'Revoke'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Revoked sessions (collapsed) */}
      {revoked.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-500">Revoked / Expired ({revoked.length})</p>
          </div>
          <div className="divide-y divide-slate-50">
            {revoked.slice(0, 5).map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-center gap-4 opacity-50">
                <Monitor className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">{parseUA(s.user_agent)}</p>
                  <p className="text-[10px] text-slate-400">
                    Revoked: {fmt(s.revoked_at!)} · IP: <span className="font-mono">{s.ip_address ?? 'unknown'}</span>
                  </p>
                </div>
                <span className="text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-semibold">REVOKED</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security tip */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
        <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-amber-700">
          If you see a session you don't recognize, revoke it immediately and change your password.
          Enable MFA for extra protection.
        </p>
      </div>
    </div>
  );
}
