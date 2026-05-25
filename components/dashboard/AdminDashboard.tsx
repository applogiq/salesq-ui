'use client';
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Download, Plus, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';

const HOURLY = [
  { time: '7a', calls: 120, avg: 80 },  { time: '8a', calls: 280, avg: 160 },
  { time: '9a', calls: 420, avg: 250 },  { time: '10a', calls: 520, avg: 350 },
  { time: '11a', calls: 610, avg: 420 }, { time: '12p', calls: 580, avg: 400 },
  { time: '1p', calls: 640, avg: 430 },  { time: '2p', calls: 710, avg: 470 },
  { time: '3p', calls: 792, avg: 510 },  { time: '4p', calls: 760, avg: 490 },
  { time: '5p', calls: 680, avg: 450 },  { time: '6p', calls: 520, avg: 380 },
  { time: '7p', calls: 350, avg: 290 },  { time: '8p', calls: 180, avg: 200 },
  { time: '9p', calls: 90,  avg: 120 },  { time: '10p', calls: 48, avg: 70  },
];

const REVENUE_CHANNELS = [
  { name: 'Outbound Voice', value: 41482, color: '#06B6D4', pct: 42 },
  { name: 'Inbound Voice',  value: 27654, color: '#8B5CF6', pct: 28 },
  { name: 'WhatsApp',       value: 17773, color: '#10B981', pct: 18 },
  { name: 'Email & SMS',    value: 11856, color: '#F59E0B', pct: 12 },
];

const CAMPAIGNS = [
  { name: 'Summer Outbound 2026', calls: 5263, connected: 4128, conv: '28.4%', trend: 'up',   revenue: '$24,568' },
  { name: 'Enterprise Q2 Push',   calls: 3841, connected: 2956, conv: '31.2%', trend: 'up',   revenue: '$31,200' },
  { name: 'Renewal Wave – June',  calls: 2190, connected: 1876, conv: '24.1%', trend: 'down', revenue: '$18,450' },
  { name: 'SMB Warm Leads',       calls: 4102, connected: 2980, conv: '19.8%', trend: 'up',   revenue: '$14,547' },
];

const LIVE_OPS = [
  { label: 'Live Calls',    value: '128',    sparkColor: '#06B6D4' },
  { label: 'Agents Online', value: '86/120', sparkColor: '#10B981' },
  { label: 'In Queue',      value: '12',     sparkColor: '#F59E0B' },
  { label: 'Avg Talk Time', value: '04:28',  sparkColor: '#8B5CF6' },
  { label: 'Telephony Cost', value: '$284',  sparkColor: '#EF4444' },
];

function MiniSparkline({ color }: { color: string }) {
  const pts = Array.from({ length: 8 }, (_, i) => 10 + Math.random() * 30);
  const max = Math.max(...pts);
  const step = 60 / 7;
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${35 - (p / max) * 30}`).join(' ');
  return (
    <svg width="60" height="35">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back, Sarah</h2>
          <p className="text-slate-500 text-sm mt-0.5">Here's how Acme is performing today, <span className="font-medium text-slate-700">May 23, 2026</span></p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            📅 Last 7 days ▾
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Campaign
          </button>
        </div>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'TOTAL CALLS',       value: '24,532', change: '+12.5%', up: true  },
          { label: 'CONNECTED',         value: '18,256', change: '+8.3%',  up: true  },
          { label: 'CONVERSION RATE',   value: '24.6%',  change: '+2.1%',  up: true  },
          { label: 'REVENUE GENERATED', value: '$98,765', change: '-1.2%', up: false },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{m.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{m.value}</p>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${m.up ? 'text-green-600' : 'text-red-500'}`}>
                {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.change}
              </span>
              <MiniSparkline color={m.up ? '#06B6D4' : '#EF4444'} />
            </div>
          </div>
        ))}
      </div>

      {/* Live Operations */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h3 className="font-semibold text-slate-900 text-sm">Live Operations</h3>
            <span className="text-xs text-slate-400">Real-time across all teams · Updated 2s ago</span>
          </div>
          <button className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">View live wallboard ›</button>
        </div>
        <div className="grid grid-cols-5 divide-x divide-slate-100">
          {LIVE_OPS.map((op) => (
            <div key={op.label} className="px-5 first:pl-0">
              <p className="text-slate-400 text-xs font-medium mb-1">{op.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-slate-900">{op.value}</p>
                <MiniSparkline color={op.sparkColor} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Call Volume Chart */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Call Volume & Connection Rate</h3>
              <p className="text-slate-400 text-xs">Hourly · Today vs. 7-day average</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-3 h-0.5 bg-cyan-500 rounded" />Calls placed
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-3 h-0.5 bg-slate-300 rounded" style={{ borderStyle: 'dashed' }} />7-day avg
              </div>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURLY} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 11 }}
                />
                <Area type="monotone" dataKey="avg" stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="4 3" fill="none" />
                <Area type="monotone" dataKey="calls" stroke="#06B6D4" strokeWidth={2.5} fill="url(#callGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Channel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-slate-900 text-sm">Revenue by Channel</h3>
            <button className="text-slate-400"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          <p className="text-slate-400 text-xs mb-4">$98.7k this week</p>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={REVENUE_CHANNELS} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={2} stroke="#fff">
                    {REVENUE_CHANNELS.map((c) => <Cell key={c.name} fill={c.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-base font-bold text-slate-900">$98.7k</p>
                <p className="text-[10px] text-slate-400">this week</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            {REVENUE_CHANNELS.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm" style={{ background: c.color }} />
                  <span className="text-slate-600">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">${(c.value / 1000).toFixed(1)}k</span>
                  <span className="text-slate-400">{c.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Campaigns + AI Coaching */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">Top Performing Campaigns</h3>
            <button className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">View all ›</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase tracking-wider bg-slate-50/50">
                {['Campaign', 'Calls', 'Connected', 'Conv.', 'Trend', 'Revenue'].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAMPAIGNS.map((c) => (
                <tr key={c.name} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-cyan-500/15 flex items-center justify-center">
                        <span className="text-cyan-500 text-xs">📢</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{c.calls.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{c.connected.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-green-600">{c.conv}</td>
                  <td className="px-4 py-3">
                    {c.trend === 'up'
                      ? <TrendingUp className="w-4 h-4 text-green-500" />
                      : <TrendingDown className="w-4 h-4 text-red-400" />}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-800">{c.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Coaching Impact */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-cyan-500/15 rounded-lg flex items-center justify-center">
              <span className="text-cyan-500 text-sm">✦</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">AI Coaching Impact</h3>
              <p className="text-slate-400 text-xs">This month</p>
            </div>
          </div>
          <div className="text-center py-4 border-b border-slate-100 mb-4">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Score Improvement</p>
            <p className="text-4xl font-extrabold text-cyan-500">+18.6%</p>
          </div>
          {[
            { label: 'Avg call quality', before: 62, after: 78 },
            { label: 'Objection handling', before: 55, after: 71 },
            { label: 'Talk ratio (ideal)', before: 44, after: 52 },
          ].map((m) => (
            <div key={m.label} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">{m.label}</span>
                <span className="text-slate-400">{m.before} → <span className="text-cyan-600 font-semibold">{m.after}</span></span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${m.after}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
