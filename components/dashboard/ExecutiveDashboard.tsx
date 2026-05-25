'use client';
import { useState, useEffect } from 'react';
import { Phone, TrendingUp, CheckSquare, Square, MessageSquare } from 'lucide-react';
import { dashboardApi, type ExecutiveDashboardData } from '@/lib/api';
import { leadsApi, type Lead } from '@/lib/api.leads';
import { useAuth } from '@/context/AuthContext';
import StageBadge from '@/app/leads/components/StageBadge';
import Link from 'next/link';

/* ── Circular Progress Ring ── */
function Ring({ pct, size = 100, stroke = 10 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e2d47" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#06B6D4" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Sparkline ── */
function Sparkline({ color = '#06B6D4', points }: { color?: string; points: number[] }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const h = 40; const w = 80;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / (max - min || 1)) * h;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="opacity-80">
      <defs>
        <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path + ` L ${w} ${h} L 0 ${h} Z`} fill={`url(#g-${color})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Score bar ── */
function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#06B6D4' : '#F59E0B';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-5">{value}</span>
    </div>
  );
}

const QUEUE = [
  { rank: 1, initials: 'RF', color: 'bg-purple-500', name: 'Robert Fox', company: 'Acme Corp', reason: 'Demo follow-up · 3 days overdue', bestTime: '10:30am ET', score: 92 },
  { rank: 2, initials: 'LA', color: 'bg-amber-500', name: 'Leslie Alexander', company: 'TechFlow Inc.', reason: 'Proposal sent · response due', bestTime: '11:00am ET', score: 88 },
  { rank: 3, initials: 'BS', color: 'bg-cyan-600', name: 'Brooklyn Simmons', company: 'Bright Future', reason: 'High intent · viewed pricing 4x', bestTime: '11:30am GMT', score: 84 },
  { rank: 4, initials: 'CF', color: 'bg-orange-500', name: 'Cody Fisher', company: 'Vertex Inc.', reason: 'New lead · matches ideal profile', bestTime: '2:00pm PT', score: 78 },
  { rank: 5, initials: 'TW', color: 'bg-teal-500', name: 'Theresa Webb', company: 'Meridian Corp', reason: 'Renewal · contract ends in 14 days', bestTime: '3:30pm ET', score: 71 },
];

const TASKS = [
  { done: true, label: 'Follow up with Robert Fox (Acme)', time: '10:30am', icon: Phone },
  { done: true, label: 'Send proposal to Leslie Alexander', time: '11:00am', icon: MessageSquare },
  { done: false, label: 'Demo call — Brooklyn Simmons', time: '11:30am', icon: Phone },
  { done: false, label: 'Review pricing sheet with Cody Fisher', time: '2:00pm', icon: MessageSquare },
  { done: false, label: 'Renewal discussion — Theresa Webb', time: '3:30pm', icon: Phone },
];

const BADGES = [
  { icon: '🔥', label: '12-day streak', color: 'from-orange-500/20 to-red-500/20' },
  { icon: '🎯', label: 'Sharp shooter', color: 'from-purple-500/20 to-pink-500/20' },
  { icon: '⚡', label: 'Speed demon', color: 'from-yellow-500/20 to-amber-500/20' },
  { icon: '🏆', label: 'Top performer', color: 'from-amber-500/20 to-orange-500/20' },
];

const PERF_POINTS = [65, 70, 68, 75, 80, 78, 82, 85, 83, 88, 90, 92, 91, 97];

// Avatar initials helper
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['bg-purple-500', 'bg-amber-500', 'bg-cyan-600', 'bg-orange-500', 'bg-teal-500'];

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [queue, setQueue] = useState<Lead[]>([]);

  useEffect(() => {
    dashboardApi.executive().then(setData).catch(() => {});
    leadsApi.list({ page_size: 5, sort: 'next_followup_at', order: 'asc' })
      .then(r => setQueue(r.items))
      .catch(() => {});
  }, []);

  const callsToday = data?.calls_today ?? 0;
  const callsConnected = data?.calls_connected ?? 0;
  const convRate = data?.conversion_rate ?? 0;
  const activeLeads = data?.active_leads ?? 0;
  const followupsDue = data?.followups_due ?? 0;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          {user?.full_name?.split(' ')[0] ?? 'there'} 👋
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">
          {followupsDue > 0
            ? <><span className="font-semibold text-amber-600">{followupsDue}</span> follow-up{followupsDue !== 1 ? 's' : ''} due today · <span className="font-semibold text-slate-700">{activeLeads}</span> active leads in pipeline</>
            : <><span className="font-semibold text-slate-700">{activeLeads}</span> active leads in pipeline · no follow-ups due</>}
        </p>
      </div>

      {/* Metric row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Daily Target */}
        <div className="col-span-1 rounded-2xl p-5 flex flex-col gap-4" style={{ background: 'linear-gradient(135deg, #0D1526, #1a2744)' }}>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Daily Target</p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Ring pct={Math.min(convRate * 2, 100)} size={90} stroke={9} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{convRate.toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <p className="text-white text-3xl font-bold leading-none">{callsToday}</p>
              <p className="text-slate-400 text-xs mt-1">calls placed today</p>
              <p className="text-cyan-400 text-xs font-medium mt-0.5">{callsConnected} connected</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
            {[
              ['CONNECTED', String(callsConnected)],
              ['CONV. RATE', `${convRate.toFixed(1)}%`],
              ['PIPELINE', String(activeLeads)],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-slate-500 text-[9px] font-semibold uppercase tracking-wider">{l}</p>
                <p className="text-white text-sm font-bold mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Score */}
        <div className="bg-white rounded-2xl p-5 flex flex-col justify-between border border-slate-100">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">My AI Score</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-slate-900">92</p>
              <p className="text-green-500 text-xs font-medium mt-0.5">↑ +4.2 <span className="text-slate-400">/100</span></p>
            </div>
            <Sparkline points={[70, 72, 75, 73, 78, 80, 82, 85, 84, 88, 90, 92]} />
          </div>
        </div>

        {/* Talk/Listen */}
        <div className="bg-white rounded-2xl p-5 flex flex-col justify-between border border-slate-100">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Talk / Listen</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-slate-900">48/52</p>
              <p className="text-green-500 text-xs font-medium mt-0.5">↑ <span className="text-slate-400">ideal</span></p>
            </div>
            <Sparkline color="#10B981" points={[55, 52, 58, 50, 49, 48, 47, 50, 49, 48, 48, 48]} />
          </div>
        </div>

        {/* Active Leads */}
        <div className="bg-white rounded-2xl p-5 flex flex-col justify-between border border-slate-100">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Leads</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-slate-900">{activeLeads}</p>
              <p className="text-amber-500 text-xs font-medium mt-0.5">
                {followupsDue > 0 ? `${followupsDue} follow-ups due` : 'All caught up ✓'}
              </p>
            </div>
            <Sparkline color="#8B5CF6" points={[210, 218, 225, 220, 228, 232, 235, 238, 242, 240, 245, activeLeads || 247]} />
          </div>
        </div>
      </div>

      {/* Smart Queue + Coach side-by-side */}
      <div className="grid grid-cols-3 gap-4">
        {/* Smart Queue */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-slate-900 text-sm">Smart Queue · Today</h3>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">AI-prioritized · 12 calls</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold transition-colors">
                <Phone className="w-3 h-3" />Auto-dial
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-medium w-8">#</th>
                <th className="text-left px-4 py-2.5 font-medium">Lead</th>
                <th className="text-left px-4 py-2.5 font-medium">Stage</th>
                <th className="text-left px-4 py-2.5 font-medium">Follow-up</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {queue.length > 0 ? queue.map((lead, i) => (
                <tr key={lead.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-medium text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`}>
                      <div className="flex items-center gap-2.5 group">
                        <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {initials(lead.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs group-hover:text-cyan-600 transition-colors">{lead.name}</p>
                          <p className="text-slate-400 text-[11px]">{lead.company ?? lead.phone}</p>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StageBadge stage={lead.lifecycle_stage} />
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs font-medium whitespace-nowrap">
                    {lead.next_followup_at
                      ? new Date(lead.next_followup_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`}>
                      <button className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap">
                        <Phone className="w-3 h-3" />Call
                      </button>
                    </Link>
                  </td>
                </tr>
              )) : (
                /* Fallback to mock data when API hasn't loaded */
                QUEUE.map((lead) => (
                  <tr key={lead.rank} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-medium text-xs">{lead.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${lead.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {lead.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">{lead.name}</p>
                          <p className="text-slate-400 text-[11px]">{lead.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px]">{lead.reason}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs font-medium whitespace-nowrap">{lead.bestTime}</td>
                    <td className="px-4 py-3">
                      <a href="/dialpad">
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap">
                          <Phone className="w-3 h-3" />Call
                        </button>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Coach's Note */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-cyan-500/15 rounded-lg flex items-center justify-center">
                <span className="text-cyan-500 text-sm">✦</span>
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Coach's Note</p>
                <p className="text-slate-400 text-xs">From your last 5 calls</p>
              </div>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed mb-4">
              You're closing 32% faster after lunch — keep complex demos in the morning when energy is highest.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Strengths</p>
                {['Discovery questions', 'Empathy'].map((s) => (
                  <div key={s} className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    <span className="text-slate-600 text-xs">{s}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Work On</p>
                {['Closing urgency', 'ROI framing'].map((s) => (
                  <div key={s} className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-slate-600 text-xs">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-slate-800 text-sm">Badges & Streak</p>
              <span className="text-cyan-500 text-xs font-semibold">+124 XP today</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {BADGES.map((b) => (
                <div key={b.label} className={`flex flex-col items-center gap-1 p-2 rounded-xl bg-gradient-to-b ${b.color}`}>
                  <span className="text-xl">{b.icon}</span>
                  <span className="text-[9px] text-slate-600 font-medium text-center leading-tight">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks + Performance */}
      <div className="grid grid-cols-2 gap-4">
        {/* Today's Tasks */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Today's Tasks</h3>
              <p className="text-slate-400 text-xs">3 of 8 done</p>
            </div>
            <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors">
              <span className="text-lg font-light">+</span> Add
            </button>
          </div>
          <div className="space-y-2.5">
            {TASKS.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                {t.done
                  ? <CheckSquare className="w-4 h-4 text-cyan-500 shrink-0" />
                  : <Square className="w-4 h-4 text-slate-300 shrink-0" />}
                <span className={`flex-1 text-sm ${t.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.label}</span>
                <span className="text-xs text-slate-400">{t.time}</span>
                <t.icon className="w-3.5 h-3.5 text-slate-300" />
              </div>
            ))}
          </div>
        </div>

        {/* My Performance */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">My Performance · 7 Days</h3>
              <p className="text-slate-400 text-xs">Compared to team avg</p>
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="relative h-32">
            <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Team avg line */}
              <path d="M 0 60 Q 100 55 200 58 Q 300 61 400 56" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 3" />
              {/* User line */}
              {(() => {
                const pts = PERF_POINTS;
                const step = 400 / (pts.length - 1);
                const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${120 - (p / 100) * 110}`).join(' ');
                return (
                  <>
                    <path d={path + ` L 400 120 L 0 120 Z`} fill="url(#perfGrad)" />
                    <path d={path} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="400" cy={120 - (PERF_POINTS[PERF_POINTS.length - 1] / 100) * 110} r="5" fill="#06B6D4" />
                  </>
                );
              })()}
            </svg>
            <div className="absolute top-0 left-0 text-xs text-slate-400">97</div>
            <div className="absolute bottom-0 left-0 text-xs text-slate-400">65</div>
          </div>
        </div>
      </div>
    </div>
  );
}
