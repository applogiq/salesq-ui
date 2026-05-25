'use client';
import { Headphones, Volume2, Eye, Mic, AlertTriangle } from 'lucide-react';

const TEAM = [
  { initials: 'MP', color: 'bg-purple-500', name: 'Maya Patel',     status: 'On Call',  statusColor: 'text-green-600 bg-green-100',   activity: 'Talking with +1·202·555·0148', duration: '02:35', sentiment: 'Positive', sentColor: 'text-green-600', actions: ['headphones', 'whisper'] },
  { initials: 'EH', color: 'bg-cyan-600',   name: 'Esther Howard',  status: 'On Call',  statusColor: 'text-green-600 bg-green-100',   activity: 'Talking with +1·203·555·0187', duration: '01:58', sentiment: 'Neutral',  sentColor: 'text-slate-500', actions: ['headphones', 'whisper'] },
  { initials: 'WW', color: 'bg-slate-500',  name: 'Wade Warren',    status: 'Wrap-Up',  statusColor: 'text-amber-600 bg-amber-100',   activity: 'Logging call notes',           duration: '00:24', sentiment: 'Neutral',  sentColor: 'text-slate-500', actions: ['eye'] },
  { initials: 'CF', color: 'bg-orange-500', name: 'Cody Fisher',    status: 'Dialing',  statusColor: 'text-blue-600 bg-blue-100',     activity: 'Dialing +1·202·555·0176',      duration: '00:12', sentiment: 'Neutral',  sentColor: 'text-slate-500', actions: ['eye'] },
  { initials: 'TW', color: 'bg-teal-500',   name: 'Theresa Webb',   status: 'Break',    statusColor: 'text-slate-500 bg-slate-100',   activity: 'On break since 11:30am',       duration: '15:30', sentiment: '—',        sentColor: 'text-slate-400', actions: ['eye'] },
  { initials: 'BS', color: 'bg-cyan-500',   name: 'Brooklyn Simmons', status: 'On Call', statusColor: 'text-green-600 bg-green-100', activity: 'Talking with +44·20·7946·0958', duration: '04:12', sentiment: 'Negative', sentColor: 'text-red-500',   actions: ['headphones', 'whisper', 'barge'] },
  { initials: 'GH', color: 'bg-indigo-500', name: 'Guy Hawkins',    status: 'Wrap-Up',  statusColor: 'text-amber-600 bg-amber-100',   activity: 'Filling lead form',            duration: '00:48', sentiment: 'Positive', sentColor: 'text-green-600', actions: ['eye'] },
];

const FUNNEL = [
  { label: 'Total Leads',  value: 5263, pct: 100, change: '',     color: '#06B6D4' },
  { label: 'Contacted',    value: 3842, pct: 73,  change: '+12%', color: '#06B6D4' },
  { label: 'Interested',   value: 1256, pct: 24,  change: '+8%',  color: '#22D3EE' },
  { label: 'Qualified',    value: 842,  pct: 16,  change: '+5%',  color: '#67E8F9' },
  { label: 'Converted',    value: 298,  pct: 6,   change: '+2.3%', color: '#A5F3FC' },
];

const INSIGHTS = [
  { level: 'HIGH',   color: 'text-red-600 bg-red-50',    icon: AlertTriangle, title: 'Objection spike', detail: '"Too expensive" up 34% this week vs last — review pricing scripts' },
  { level: 'MEDIUM', color: 'text-amber-600 bg-amber-50', icon: AlertTriangle, title: 'Talk ratio drift', detail: 'Wade Warren averaging 68% talk time — coach on active listening' },
];

function SentimentDot({ val }: { val: string }) {
  const color = val === 'Positive' ? 'bg-green-500' : val === 'Negative' ? 'bg-red-500' : 'bg-slate-400';
  if (val === '—') return <span className="text-slate-400">—</span>;
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {val}
    </span>
  );
}

export default function TeamDashboard() {
  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">Morning, David</h2>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Team on track
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Your team has placed <span className="font-semibold text-slate-700">1,256</span> calls today — 82% of daily goal</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            📅 Today ▾
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold transition-colors">
            👁 Listen Live
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'TEAM CALLS',     value: '1,256', sub: '↑ +8.2%', sub2: 'of 1,540 goal', pct: 82, color: 'bg-cyan-500' },
          { label: 'CONNECTED',      value: '842',   sub: '↑ +67.0%', sub2: 'connected of 1,256', pct: 67, color: 'bg-green-500' },
          { label: 'CONVERSION',     value: '23.7%', sub: '↑ +2.5%',  sub2: 'vs. 21.2% last wk', pct: 24, color: 'bg-purple-500' },
          { label: 'AVG. TALK TIME', value: '04:32', sub: '↓ -12s',   sub2: 'target 04:00', pct: 87, color: 'bg-amber-500', negative: true },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{m.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{m.value}</p>
            <p className={`text-xs font-semibold mt-1 ${m.negative ? 'text-red-500' : 'text-green-600'}`}>
              {m.sub} <span className="text-slate-400 font-normal">{m.sub2}</span>
            </p>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${m.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Live Team Activity + Funnel */}
      <div className="grid grid-cols-3 gap-4">
        {/* Live Activity */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <h3 className="font-semibold text-slate-900 text-sm">Live Team Activity</h3>
              <span className="text-xs text-slate-400">8 on call · 3 wrap · 1 break</span>
            </div>
            <button className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1">
              View all ›
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase tracking-wider bg-slate-50/50">
                {['Executive', 'Status', 'Current Activity', 'Duration', 'Sentiment', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEAM.map((m) => (
                <tr key={m.name} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${m.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                        {m.initials}
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${m.statusColor}`}>{m.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{m.activity}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{m.duration}</td>
                  <td className="px-4 py-3"><SentimentDot val={m.sentiment} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {m.actions.includes('headphones') && (
                        <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                          <Headphones className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {m.actions.includes('whisper') && (
                        <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {m.actions.includes('barge') && (
                        <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-100 hover:bg-red-200 text-red-500 transition-colors">
                          <Mic className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {m.actions.includes('eye') && (
                        <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-sm">Team Conversion Funnel</h3>
            <span className="text-xs text-slate-400">This week</span>
          </div>
          <div className="space-y-3">
            {FUNNEL.map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600">{f.label}</span>
                  <div className="flex items-center gap-2">
                    {f.change && <span className="text-[10px] text-green-600 font-semibold">{f.change}</span>}
                    <span className="text-xs font-semibold text-slate-700">{f.value.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">· {f.pct}%</span>
                  </div>
                </div>
                <div className="h-5 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all"
                    style={{ width: `${f.pct}%`, background: f.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights + Quality Trend */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-cyan-500/15 rounded-lg flex items-center justify-center">
              <span className="text-cyan-500 text-sm">✦</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Recent AI Insights</h3>
              <p className="text-slate-400 text-xs">Auto-generated · Last 24h</p>
            </div>
          </div>
          <div className="space-y-3">
            {INSIGHTS.map((ins) => (
              <div key={ins.title} className={`flex gap-3 p-3 rounded-xl ${ins.color.split(' ')[1]}`}>
                <ins.icon className={`w-4 h-4 mt-0.5 shrink-0 ${ins.color.split(' ')[0]}`} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ins.color}`}>{ins.level}</span>
                    <span className="text-xs font-semibold text-slate-800">{ins.title}</span>
                  </div>
                  <p className="text-xs text-slate-600">{ins.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call Quality Trend */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-slate-900 text-sm">Call Quality Score Trend</h3>
            <span className="text-xs text-slate-400">Last 7 days</span>
          </div>
          <div className="flex items-center justify-end gap-2 mb-3">
            <span className="text-xs text-slate-400">Team avg</span>
            <span className="text-lg font-bold text-slate-900">78</span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
          <div className="relative h-28">
            <svg width="100%" height="100%" viewBox="0 0 400 110" preserveAspectRatio="none">
              <defs>
                <linearGradient id="qualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 55 Q 80 50 160 52 Q 240 54 320 40 L 400 25" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 3" />
              <path d="M 0 60 Q 60 58 120 55 Q 200 50 280 35 Q 340 22 400 15" fill="url(#qualGrad)" />
              <path d="M 0 60 Q 60 58 120 55 Q 200 50 280 35 Q 340 22 400 15" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="400" cy="15" r="5" fill="#06B6D4" />
            </svg>
            <div className="absolute top-0 left-0 text-xs text-slate-400">98</div>
          </div>
        </div>
      </div>
    </div>
  );
}
