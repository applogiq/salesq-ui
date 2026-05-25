'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, Phone, Trophy, MoreHorizontal, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usersApi, teamsApi } from '@/lib/api';
import type { User, TeamOut } from '@/lib/api.types';

const AVATAR_COLORS = ['bg-purple-500','bg-blue-500','bg-cyan-500','bg-amber-500','bg-pink-500','bg-emerald-500','bg-indigo-500','bg-rose-500'];
function avatarColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

const ROLE_BADGE: Record<string, string> = {
  admin:     'bg-amber-100 text-amber-700',
  manager:   'bg-cyan-100 text-cyan-700',
  executive: 'bg-purple-100 text-purple-700',
};

// Simulated per-agent stats (will come from analytics API in future)
function fakeStat(id: string, max: number) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return Math.floor((h % max) + max * 0.3);
}

export default function TeamPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    usersApi.list()
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = members.filter((m) =>
    search
      ? (m.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const active = members.filter((m) => m.is_active).length;

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">My Team</h1>
          <p className="text-xs text-slate-500">{members.length} members · {active} active</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team…"
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Members', value: members.length, icon: Users,    color: 'text-cyan-500'  },
          { label: 'Active',        value: active,         icon: UserCheck, color: 'text-green-500' },
          { label: 'Executives',    value: members.filter((m) => m.role === 'executive').length, icon: Phone, color: 'text-purple-500' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
            <m.icon className={cn('w-7 h-7', m.color)} />
            <div>
              <p className="text-xl font-bold text-slate-900">{m.value}</p>
              <p className="text-xs text-slate-500">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Team Members</h2>
        </div>
        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-4 py-2">Member</th>
                  <th className="text-left px-3 py-2">Role</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Calls Today</th>
                  <th className="text-left px-3 py-2">Conv. Rate</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', avatarColor(member.full_name ?? member.email))}>
                          {initials(member.full_name ?? member.email)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{member.full_name ?? '—'}</p>
                          <p className="text-slate-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', ROLE_BADGE[member.role] ?? 'bg-slate-100 text-slate-600')}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('w-1.5 h-1.5 rounded-full', member.is_active ? 'bg-green-500' : 'bg-slate-300')} />
                        <span className="text-slate-600">{member.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-700">{fakeStat(member.id, 30)}</td>
                    <td className="px-3 py-3">
                      <span className={cn('font-semibold', fakeStat(member.id + 'r', 40) >= 25 ? 'text-green-600' : 'text-amber-600')}>
                        {fakeStat(member.id + 'r', 40)}%
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button className="p-1 rounded hover:bg-slate-100">
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
