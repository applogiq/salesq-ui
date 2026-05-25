'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usersApi } from '@/lib/api';
import type { User } from '@/lib/api.types';

const AVATAR_COLORS = ['bg-purple-500','bg-blue-500','bg-cyan-500','bg-amber-500','bg-pink-500','bg-emerald-500','bg-indigo-500','bg-rose-500'];
function avatarColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
function fakeStat(id: string, seed: string, max: number, min = 0) {
  let h = 0; for (const c of id + seed) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return Math.floor(min + (h % (max - min)));
}

const PERIODS = ['This Week', 'This Month', 'Last Month', 'All Time'];
const TROPHY_COLORS = ['text-amber-400', 'text-slate-400', 'text-amber-600'];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('This Week');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.list({ role: 'executive' })
      .then((u) => setUsers(u.sort((a, b) => fakeStat(b.id, period, 100) - fakeStat(a.id, period, 100))))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  // Re-sort on period change
  const sorted = [...users].sort((a, b) => fakeStat(b.id, period, 100) - fakeStat(a.id, period, 100));

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Leaderboard</h1>
          <p className="text-xs text-slate-500">Top performers ranked by conversions</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-all',
                period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 flex-1">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-auto min-h-0">
          {/* Podium */}
          {top3.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-end justify-center gap-4 h-36">
                {/* 2nd */}
                {top3[1] && (
                  <div className="flex flex-col items-center gap-2">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-bold', avatarColor(top3[1].full_name ?? top3[1].email))}>
                      {initials(top3[1].full_name ?? top3[1].email)}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 max-w-[80px] text-center truncate">{top3[1].full_name ?? top3[1].email}</p>
                    <div className="w-20 bg-slate-200 rounded-t-lg flex flex-col items-center justify-end" style={{ height: '64px' }}>
                      <Medal className="w-5 h-5 text-slate-400 mb-1" />
                      <p className="text-xs font-bold text-slate-600">{fakeStat(top3[1].id, period, 50, 20)}</p>
                    </div>
                  </div>
                )}
                {/* 1st */}
                {top3[0] && (
                  <div className="flex flex-col items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400 fill-amber-300" />
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-amber-400', avatarColor(top3[0].full_name ?? top3[0].email))}>
                      {initials(top3[0].full_name ?? top3[0].email)}
                    </div>
                    <p className="text-xs font-bold text-slate-900 max-w-[80px] text-center truncate">{top3[0].full_name ?? top3[0].email}</p>
                    <div className="w-20 bg-amber-400 rounded-t-lg flex flex-col items-center justify-end" style={{ height: '96px' }}>
                      <p className="text-xs font-bold text-white mb-2">{fakeStat(top3[0].id, period, 80, 40)}</p>
                    </div>
                  </div>
                )}
                {/* 3rd */}
                {top3[2] && (
                  <div className="flex flex-col items-center gap-2">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-bold', avatarColor(top3[2].full_name ?? top3[2].email))}>
                      {initials(top3[2].full_name ?? top3[2].email)}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 max-w-[80px] text-center truncate">{top3[2].full_name ?? top3[2].email}</p>
                    <div className="w-20 bg-amber-600/40 rounded-t-lg flex flex-col items-center justify-end" style={{ height: '48px' }}>
                      <p className="text-xs font-bold text-amber-800 mb-1">{fakeStat(top3[2].id, period, 35, 10)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full rankings */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-2">Rank</th>
                    <th className="text-left px-3 py-2">Agent</th>
                    <th className="text-right px-3 py-2">Calls</th>
                    <th className="text-right px-3 py-2">Conv.</th>
                    <th className="text-right px-3 py-2">Rate</th>
                    <th className="text-right px-3 py-2">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sorted.map((user, idx) => {
                    const calls = fakeStat(user.id, period + 'c', 60, 10);
                    const convs = fakeStat(user.id, period + 'v', 20, 2);
                    const rate = Math.round((convs / calls) * 100);
                    const score = fakeStat(user.id, period, 100, 50);
                    return (
                      <tr key={user.id} className={cn('hover:bg-slate-50 transition-colors', idx < 3 ? 'bg-amber-50/40' : '')}>
                        <td className="px-4 py-2.5">
                          {idx < 3
                            ? <Trophy className={cn('w-4 h-4', TROPHY_COLORS[idx])} />
                            : <span className="font-mono text-slate-400">{idx + 1}</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', avatarColor(user.full_name ?? user.email))}>
                              {initials(user.full_name ?? user.email)}
                            </div>
                            <span className="font-semibold text-slate-800">{user.full_name ?? user.email}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-700 font-medium">{calls}</td>
                        <td className="px-3 py-2.5 text-right text-slate-700 font-medium">{convs}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-700">{rate}%</td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={cn('font-bold', score >= 80 ? 'text-green-600' : score >= 65 ? 'text-amber-600' : 'text-red-500')}>
                            {score}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
