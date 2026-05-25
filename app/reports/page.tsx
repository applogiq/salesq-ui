'use client';
import { useState } from 'react';
import { Search, Download, Plus, ChevronDown, TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

const METRICS = [
  { label: 'PIPELINE VALUE', value: '$1.42M', delta: '+18.2%', up: true  },
  { label: 'FORECAST (Q3)',  value: '$2.18M', delta: '92% conf.', up: true },
  { label: 'AVG DEAL SIZE',  value: '$5,840', delta: '+12%',    up: true  },
  { label: 'CYCLE LENGTH',   value: '18 days',delta: '~3 days', up: true  },
  { label: 'WIN RATE',       value: '24.6%',  delta: '+2.4%',   up: true  },
];

const REPORT_TABS = ['Overview', 'Executive Performance', 'Campaigns', 'Funnel', 'Forecasting', 'Country', 'Custom 7'];

// Heatmap data: [Mon-Sun][9a-8p]
const HOURS = ['9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p'];
const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HEATMAP: number[][] = [
  [40, 59, 75, 60, 62, 58, 39, 34, 17, 10, 10, 10],
  [40, 64, 69, 63, 64, 53, 45, 32, 15, 11, 10, 10],
  [40, 53, 77, 66, 60, 53, 43, 39, 13, 10, 10, 10],
  [40, 63, 81, 66, 66, 58, 36, 29, 11, 11, 10, 10],
  [40, 61, 73, 64, 58, 63, 33, 40, 11, 10, 10, 10],
  [10, 12, 20, 30, 37, 34, 19, 10, 10, 10, 10, 10],
  [10, 23, 29, 27, 25, 28, 25, 14, 10, 10, 10, 10],
];

const FUNNEL = [
  { label: 'Leads created', value: 12408, pct: 100, color: 'bg-blue-500' },
  { label: 'Connected',     value: 8264,  pct: 67,  color: 'bg-cyan-400'  },
  { label: 'Demo booked',   value: 3142,  pct: 25,  color: 'bg-cyan-300'  },
  { label: 'Proposal sent', value: 1826,  pct: 15,  color: 'bg-teal-300'  },
  { label: 'Won',           value: 842,   pct: 7,   color: 'bg-green-400' },
];

const REVENUE_DATA = [
  { month: 'Jan', actual: 237, forecast: null },
  { month: 'Feb', actual: 280, forecast: null },
  { month: 'Mar', actual: 310, forecast: null },
  { month: 'Apr', actual: 355, forecast: null },
  { month: 'May', actual: 400, forecast: null },
  { month: 'Jun', actual: 473, forecast: 473  },
  { month: 'Jul', actual: null, forecast: 520 },
  { month: 'Aug', actual: null, forecast: 580 },
  { month: 'Sep', actual: null, forecast: 650 },
];

const COUNTRIES = [
  { flag: '🇺🇸', name: 'United States', sub: '4,128 leads · 78% conn.', value: '$684k', color: 'bg-cyan-500'  },
  { flag: '🇬🇧', name: 'United Kingdom', sub: '2,156 leads · 81% conn.', value: '$284k', color: 'bg-purple-500' },
  { flag: '🇩🇪', name: 'Germany',        sub: '1,402 leads · 72% conn.', value: '$198k', color: 'bg-blue-400'  },
  { flag: '🇮🇳', name: 'India',          sub: '1,256 leads · 68% conn.', value: '$142k', color: 'bg-indigo-400' },
  { flag: '🇦🇺', name: 'Australia',      sub: '412 leads · 75% conn.',   value: '$94k',  color: 'bg-teal-400'  },
];

function heatColor(val: number) {
  if (val >= 75) return 'bg-blue-700 text-white';
  if (val >= 65) return 'bg-blue-500 text-white';
  if (val >= 55) return 'bg-blue-400 text-white';
  if (val >= 45) return 'bg-blue-300 text-slate-800';
  if (val >= 35) return 'bg-blue-200 text-slate-700';
  if (val >= 20) return 'bg-blue-100 text-slate-600';
  return 'bg-slate-100 text-slate-400';
}

function Sparkline({ up }: { up: boolean }) {
  return (
    <svg width="72" height="28" viewBox="0 0 72 28" className="opacity-60">
      <polyline points={up ? '0,24 24,16 48,9 72,3' : '0,4 24,12 48,18 72,22'}
        fill="none" stroke={up ? '#22c55e' : '#ef4444'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Reports &amp; Business Intelligence</h1>
          <p className="text-xs text-slate-500">Funnel · Forecasting · Heatmaps · Country-wise breakdowns</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input placeholder="Search reports, metrics, dimensions..." className="pl-8 pr-10 py-1.5 text-xs border border-slate-200 rounded-lg w-60 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-slate-100 px-1 rounded">⌘K</span>
        </div>
        <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600">Last 30 days<ChevronDown className="w-3 h-3 ml-1" /></button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600"><Download className="w-3.5 h-3.5" />Export PDF</button>
        <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold"><Plus className="w-3.5 h-3.5" />New Report</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 -mb-1">
        {REPORT_TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={cn('px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
              activeTab === i ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700')}>
            {t}
          </button>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-5 gap-3">
        {METRICS.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{m.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1 leading-tight">{m.value}</p>
            <div className="flex items-center justify-between mt-1">
              <span className={cn('text-xs font-semibold flex items-center gap-1', m.up ? 'text-green-500' : 'text-red-500')}>
                {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{m.delta}
              </span>
              <Sparkline up={m.up} />
            </div>
          </div>
        ))}
      </div>

      {/* Middle row: heatmap + funnel */}
      <div className="grid grid-cols-3 gap-4">
        {/* Heatmap */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Best Time to Call · Connect Rate Heatmap</p>
              <p className="text-[10px] text-slate-400">By weekday × hour · Last 30 days</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>Low</span>
              <div className="flex gap-0.5">
                {['bg-blue-100','bg-blue-200','bg-blue-300','bg-blue-400','bg-blue-500','bg-blue-700'].map(c => (
                  <div key={c} className={`w-4 h-3 rounded-sm ${c}`} />
                ))}
              </div>
              <span>High</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="text-[10px] w-full">
              <thead>
                <tr>
                  <th className="w-10" />
                  {HOURS.map(h => <th key={h} className="text-center font-medium text-slate-400 pb-1 w-10">{h}</th>)}
                </tr>
              </thead>
              <tbody className="space-y-1">
                {DAYS.map((day, di) => (
                  <tr key={day}>
                    <td className="text-slate-500 font-medium pr-2 py-0.5">{day}</td>
                    {HEATMAP[di].map((val, hi) => (
                      <td key={hi} className="px-0.5 py-0.5">
                        <div className={cn('w-9 h-7 rounded flex items-center justify-center font-semibold text-[10px]', heatColor(val))}>
                          {val}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 text-[10px]">
            <span className="text-green-600 font-semibold">✓ Best window: Tue–Thu, 10–12 ET</span>
            <span className="text-red-500 font-semibold">Avoid: Fri after 4p, weekends</span>
          </div>
        </div>

        {/* Org-wide Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-900">Org-wide Funnel</p>
            <p className="text-[10px] text-slate-400">Last 30 days · 12,408 leads</p>
          </div>
          <div className="space-y-3">
            {FUNNEL.map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700">{f.label}</span>
                  <div className="flex items-center gap-2">
                    {f.pct < 100 && <span className="text-[10px] text-slate-400">{f.pct}%</span>}
                    <span className="text-xs font-bold text-slate-800">{f.value.toLocaleString()}</span>
                    {f.pct < 100 && <span className="text-[10px] text-slate-400">· {f.pct}%</span>}
                  </div>
                </div>
                <div className="h-5 bg-slate-100 rounded-md overflow-hidden">
                  <div className={cn('h-full rounded-md', f.color)} style={{ width: `${f.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: revenue chart + countries */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Revenue & Forecast */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Revenue &amp; Forecast</p>
              <p className="text-[10px] text-slate-400">Last 6 months · Forecast next 3</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-cyan-500 inline-block" />Actual</span>
              <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-slate-400 inline-block" />Forecast</span>
            </div>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v: number) => [`$${v}k`, '']} />
                <ReferenceLine x="Jun" stroke="#e2e8f0" strokeDasharray="4 2" />
                <Line type="monotone" dataKey="actual"   stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4, fill: '#06b6d4' }} connectNulls={false} />
                <Line type="monotone" dataKey="forecast" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-900">Top Countries by Revenue</p>
            <button><MoreHorizontal className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="space-y-3">
            {COUNTRIES.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-xl shrink-0">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', c.color)}
                        style={{ width: `${Math.round((parseInt(c.value.replace(/\D/g,'')) / 684) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400">{c.sub}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-800 shrink-0">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
