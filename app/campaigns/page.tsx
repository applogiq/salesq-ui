'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Plus, Pause, Play, MoreHorizontal, Settings,
  ChevronDown, TrendingUp, Target, DollarSign, Clock, X,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { campaignsApi, dialerApi } from '@/lib/api';
import type { CampaignOut, CampaignCreate, CampaignMetrics } from '@/lib/api.types';

// ── Static / Mock helpers ─────────────────────────────────────────────────────

const DAILY_DATA = [
  { day: 'M', calls: 210, connected: 140 },
  { day: 'T', calls: 265, connected: 195 },
  { day: 'W', calls: 290, connected: 220 },
  { day: 'T', calls: 320, connected: 250 },
  { day: 'F', calls: 340, connected: 270 },
  { day: 'S', calls: 180, connected: 120 },
  { day: 'S', calls: 90,  connected: 55  },
  { day: 'M', calls: 230, connected: 165 },
  { day: 'T', calls: 280, connected: 210 },
  { day: 'W', calls: 310, connected: 240 },
  { day: 'T', calls: 350, connected: 275 },
  { day: 'F', calls: 360, connected: 290 },
  { day: 'S', calls: 200, connected: 145 },
  { day: 'S', calls: 110, connected: 70  },
];

const EXECUTIVES = [
  { initials: 'MP', name: 'Maya Patel',       color: 'bg-purple-500', calls: 264, conn: 206, conv: '34.2%', up: true  },
  { initials: 'BS', name: 'Brooklyn Simmons', color: 'bg-blue-500',   calls: 240, conn: 184, conv: '28.6%', up: true  },
  { initials: 'EH', name: 'Esther Howard',   color: 'bg-orange-400', calls: 228, conn: 174, conv: '24.1%', up: false },
  { initials: 'GH', name: 'Guy Hawkins',     color: 'bg-emerald-500',calls: 198, conn: 150, conv: '19.8%', up: false },
];

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Phoenix', 'Europe/London',
  'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney',
];

function TrendLine({ up }: { up: boolean }) {
  return (
    <svg width="48" height="20" viewBox="0 0 48 20">
      <polyline
        points={up ? '0,16 16,11 32,7 48,3' : '0,4 16,8 32,12 48,16'}
        fill="none" stroke={up ? '#22c55e' : '#f59e0b'} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    active:    { cls: 'bg-green-100 text-green-700',   dot: 'bg-green-500',  label: 'Running' },
    paused:    { cls: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500',  label: 'Paused'  },
    draft:     { cls: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400',  label: 'Draft'   },
    completed: { cls: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', label: 'Done'    },
  }[status] ?? { cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', label: status };

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Progress bar helper ────────────────────────────────────────────────────────

function ProgressBar({ pct, color = 'bg-cyan-400' }: { pct: number; color?: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

// ── Metrics card ──────────────────────────────────────────────────────────────

function MetricsCard({ metrics }: { metrics: CampaignMetrics }) {
  const outcomeColors: Record<string, string> = {
    interested: '#22c55e',
    'not-interested': '#ef4444',
    callback:  '#06b6d4',
    voicemail: '#94a3b8',
    'no-answer': '#f59e0b',
    'do-not-call': '#f97316',
  };

  const outcomeEntries = Object.entries(metrics.outcome_breakdown);
  const totalOutcomes = outcomeEntries.reduce((s, [, v]) => s + v, 0);
  const pieData = outcomeEntries.map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
        <Target className="w-4 h-4 text-cyan-500" />
        Campaign Metrics
      </p>

      {/* Goal progress */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Calls Goal
          </p>
          <p className="text-lg font-bold text-slate-900">
            {metrics.calls_made.toLocaleString()}
            {metrics.goal_calls ? <span className="text-sm font-normal text-slate-400"> / {metrics.goal_calls.toLocaleString()}</span> : null}
          </p>
          {metrics.goal_calls && (
            <ProgressBar pct={metrics.calls_pct} color="bg-cyan-400" />
          )}
          {metrics.goal_calls && (
            <p className="text-[10px] text-slate-400 mt-0.5">{metrics.calls_pct.toFixed(1)}% of goal</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Conversions
          </p>
          <p className="text-lg font-bold text-slate-900">
            {metrics.conversions.toLocaleString()}
            {metrics.goal_conversions ? <span className="text-sm font-normal text-slate-400"> / {metrics.goal_conversions.toLocaleString()}</span> : null}
          </p>
          {metrics.goal_conversions && (
            <ProgressBar pct={metrics.conversions_pct} color="bg-green-400" />
          )}
          {metrics.goal_conversions && (
            <p className="text-[10px] text-slate-400 mt-0.5">{metrics.conversions_pct.toFixed(1)}% of goal</p>
          )}
        </div>
      </div>

      {/* Budget & ROI */}
      <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
            <DollarSign className="w-3 h-3 inline mr-0.5" />Budget
          </p>
          <p className="text-base font-bold text-slate-900">${metrics.spent_usd.toFixed(2)}</p>
          {metrics.budget_usd && (
            <>
              <ProgressBar
                pct={(metrics.spent_usd / metrics.budget_usd) * 100}
                color={metrics.spent_usd >= metrics.budget_usd * 0.9 ? 'bg-red-400' : 'bg-amber-400'}
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                ${metrics.budget_remaining_usd?.toFixed(2) ?? '—'} remaining
              </p>
            </>
          )}
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">ROI</p>
          <p className={cn('text-base font-bold', metrics.roi_percent !== null && metrics.roi_percent >= 0 ? 'text-green-600' : 'text-red-500')}>
            {metrics.roi_percent !== null ? `${metrics.roi_percent.toFixed(1)}%` : '—'}
          </p>
          <p className="text-[10px] text-slate-400">
            Revenue ${metrics.revenue_usd.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Outcome pie */}
      {pieData.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Outcomes</p>
          <div className="flex items-center gap-3">
            <PieChart width={80} height={80}>
              <Pie data={pieData} cx={35} cy={35} innerRadius={22} outerRadius={35} dataKey="value" strokeWidth={0}>
                {pieData.map((e, i) => (
                  <Cell key={i} fill={outcomeColors[e.name] ?? '#cbd5e1'} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-1">
              {outcomeEntries.slice(0, 5).map(([name, count]) => (
                <div key={name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: outcomeColors[name] ?? '#cbd5e1' }} />
                  <span className="flex-1 text-[10px] text-slate-600 capitalize">{name.replace(/-/g, ' ')}</span>
                  <span className="text-[10px] font-semibold text-slate-700">{count}</span>
                  {totalOutcomes > 0 && (
                    <span className="text-[9px] text-slate-400 w-7 text-right">
                      {((count / totalOutcomes) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pacing */}
      {metrics.days_elapsed !== null && (
        <div className="border-t border-slate-100 pt-3 flex items-center gap-3">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400">
              Day {metrics.days_elapsed}
              {metrics.days_total ? ` of ${metrics.days_total}` : ''}
            </p>
            {metrics.days_total && (
              <ProgressBar pct={(metrics.days_elapsed / metrics.days_total) * 100} color="bg-slate-300" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create Campaign Modal ─────────────────────────────────────────────────────

const EMPTY_FORM: CampaignCreate = {
  name: '',
  ai_agent_id: '',
  script: '',
  scheduled_at: null,
  dial_mode: 'preview',
  concurrent_calls: 1,
  distribution_strategy: 'round_robin',
  campaign_timezone: 'UTC',
  calling_window_start: null,
  calling_window_end: null,
  calling_days: null,
  end_date: null,
  goal_calls: null,
  goal_conversions: null,
  budget_usd: null,
  cost_per_minute_usd: 0.013,
};

function CreateCampaignModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (c: CampaignOut) => void;
}) {
  const [form, setForm] = useState<CampaignCreate>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CampaignCreate>(k: K, v: CampaignCreate[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const days = (() => {
    try { return form.calling_days ? JSON.parse(form.calling_days) as number[] : []; }
    catch { return []; }
  })();
  const toggleDay = (d: number) => {
    const next = days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort();
    set('calling_days', next.length ? JSON.stringify(next) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const campaign = await campaignsApi.create(form);
      onCreated(campaign);
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail;
      setError(detail ?? 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const labelCls = 'text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1';
  const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400';

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">New Campaign</p>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Basics */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-3">Basics</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <p className={labelCls}>Campaign Name *</p>
                <input required value={form.name} onChange={e => set('name', e.target.value)}
                  className={inputCls} placeholder="e.g. Summer 2026 Outbound" />
              </div>
              <div>
                <p className={labelCls}>Dialer Mode</p>
                <select value={form.dial_mode} onChange={e => set('dial_mode', e.target.value)} className={inputCls}>
                  <option value="preview">Preview</option>
                  <option value="power">Power</option>
                  <option value="predictive">Predictive</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <p className={labelCls}>Max Concurrent Calls</p>
                <input type="number" min={1} max={50} value={form.concurrent_calls ?? 1}
                  onChange={e => set('concurrent_calls', Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <p className={labelCls}>Distribution Strategy</p>
                <select value={form.distribution_strategy} onChange={e => set('distribution_strategy', e.target.value)} className={inputCls}>
                  <option value="round_robin">Round Robin</option>
                  <option value="skill_based">Skill Based</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
              <div>
                <p className={labelCls}>Scheduled Launch</p>
                <input type="datetime-local" value={form.scheduled_at?.slice(0, 16) ?? ''}
                  onChange={e => set('scheduled_at', e.target.value ? e.target.value + ':00' : null)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Calling window */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-700 mb-3">Calling Window</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className={labelCls}>Timezone</p>
                <select value={form.campaign_timezone} onChange={e => set('campaign_timezone', e.target.value)} className={inputCls}>
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div>
                <p className={labelCls}>Window Start</p>
                <input type="time" value={form.calling_window_start ?? ''}
                  onChange={e => set('calling_window_start', e.target.value || null)} className={inputCls} />
              </div>
              <div>
                <p className={labelCls}>Window End</p>
                <input type="time" value={form.calling_window_end ?? ''}
                  onChange={e => set('calling_window_end', e.target.value || null)} className={inputCls} />
              </div>
              <div>
                <p className={labelCls}>End Date</p>
                <input type="date" value={form.end_date ?? ''}
                  onChange={e => set('end_date', e.target.value || null)} className={inputCls} />
              </div>
              <div className="col-span-2">
                <p className={labelCls}>Calling Days</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[['M',1],['Tu',2],['W',3],['Th',4],['F',5],['Sa',6],['Su',7]].map(([label, d]) => (
                    <button key={d} type="button" onClick={() => toggleDay(d as number)}
                      className={cn('px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors',
                        days.includes(d as number)
                          ? 'bg-cyan-500 border-cyan-500 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-cyan-300')}>
                      {label}
                    </button>
                  ))}
                  <button type="button" onClick={() => set('calling_days', null)}
                    className="px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-slate-600">
                    All
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Goals & Budget */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-700 mb-3">Goals &amp; Budget</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={labelCls}>Call Goal</p>
                <input type="number" min={0} value={form.goal_calls ?? ''}
                  placeholder="No target"
                  onChange={e => set('goal_calls', e.target.value ? Number(e.target.value) : null)} className={inputCls} />
              </div>
              <div>
                <p className={labelCls}>Conversion Goal</p>
                <input type="number" min={0} value={form.goal_conversions ?? ''}
                  placeholder="No target"
                  onChange={e => set('goal_conversions', e.target.value ? Number(e.target.value) : null)} className={inputCls} />
              </div>
              <div>
                <p className={labelCls}>Budget (USD)</p>
                <input type="number" min={0} step={0.01} value={form.budget_usd ?? ''}
                  placeholder="No limit"
                  onChange={e => set('budget_usd', e.target.value ? Number(e.target.value) : null)} className={inputCls} />
              </div>
              <div>
                <p className={labelCls}>Cost / Minute (USD)</p>
                <input type="number" min={0} step={0.001} value={form.cost_per_minute_usd ?? 0.013}
                  onChange={e => set('cost_per_minute_usd', Number(e.target.value))} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Script */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-700 mb-3">Script</p>
            <textarea rows={4} value={form.script ?? ''} onChange={e => set('script', e.target.value)}
              placeholder="Hi {name}, this is {agent} from Acme Corp. We wanted to reach out about…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none" />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Cancel</button>
          <button type="submit" disabled={saving}
            className="px-5 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CampaignOut | null>(null);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Load campaigns
  const loadCampaigns = useCallback(async () => {
    try {
      const list = await campaignsApi.list();
      setCampaigns(list);
      if (!selected && list.length > 0) setSelected(list[0]);
    } catch {
      // silently fail — mock UI remains usable
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { loadCampaigns(); }, []);

  // Load metrics whenever selected campaign changes
  useEffect(() => {
    if (!selected) { setMetrics(null); return; }
    setMetricsLoading(true);
    campaignsApi.metrics(selected.id)
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setMetricsLoading(false));
  }, [selected?.id]);

  // Toggle campaign active/paused via dialer API
  const toggleCampaign = async (campaign: CampaignOut) => {
    setTogglingId(campaign.id);
    try {
      if (campaign.status === 'active') {
        await dialerApi.pause(campaign.id);
      } else {
        await dialerApi.start(campaign.id);
      }
      await loadCampaigns();
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const pausedCampaigns = campaigns.filter(c => c.status === 'paused').length;
  const draftCampaigns  = campaigns.filter(c => c.status === 'draft').length;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Campaigns</h1>
          <p className="text-xs text-slate-500">
            {loading ? 'Loading…' : `${activeCampaigns} active · ${pausedCampaigns} paused · ${draftCampaigns} draft`}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input placeholder="Search campaigns…" className="pl-8 pr-10 py-1.5 text-xs border border-slate-200 rounded-lg w-52 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400" />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600">
          <Filter className="w-3.5 h-3.5" />Filter
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600">
          Last 30 days<ChevronDown className="w-3 h-3 ml-1" />
        </button>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold">
          <Plus className="w-3.5 h-3.5" />New Campaign
        </button>
      </div>

      {/* Campaign cards row */}
      {!loading && campaigns.length > 0 && (
        <div className="space-y-2">
          {campaigns.slice(0, 3).map((c) => (
            <div key={c.id}
              onClick={() => setSelected(c)}
              className={cn(
                'bg-white rounded-xl border px-5 py-4 flex items-center gap-4 cursor-pointer transition-colors',
                selected?.id === c.id ? 'border-cyan-300 bg-cyan-50/40' : 'border-slate-200 hover:border-slate-300',
              )}>
              <div className="w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                  <StatusBadge status={c.status} />
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium capitalize">
                    {c.dial_mode} Dialer
                  </span>
                  {c.calling_window_start && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">
                      {c.calling_window_start}–{c.calling_window_end} {c.campaign_timezone}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {c.dialed_count} dialled · ${c.spent_usd.toFixed(2)} spent
                  {c.budget_usd ? ` / $${c.budget_usd.toFixed(0)} budget` : ''}
                  {c.end_date ? ` · ends ${c.end_date}` : ''}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); toggleCampaign(c); }}
                disabled={togglingId === c.id || c.status === 'completed'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50">
                {c.status === 'active'
                  ? <><Pause className="w-3.5 h-3.5" />Pause</>
                  : <><Play className="w-3.5 h-3.5" />Start</>}
              </button>
              <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50">
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Charts + Metrics row */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Daily Performance */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Daily Performance</p>
              <p className="text-[10px] text-slate-400">Calls placed vs connected · last 14 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-slate-300 inline-block" />Calls</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-cyan-400 inline-block" />Connected</span>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DAILY_DATA} barGap={2} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="calls"     fill="#cbd5e1" radius={[3,3,0,0]} maxBarSize={16} />
                <Bar dataKey="connected" fill="#22d3ee" radius={[3,3,0,0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metrics panel */}
        <div className="overflow-y-auto">
          {metricsLoading && (
            <div className="h-32 flex items-center justify-center text-xs text-slate-400">Loading metrics…</div>
          )}
          {!metricsLoading && metrics && <MetricsCard metrics={metrics} />}
          {!metricsLoading && !metrics && selected && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-center h-32">
              <p className="text-xs text-slate-400">No metrics yet for this campaign</p>
            </div>
          )}
          {!selected && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-center h-32">
              <p className="text-xs text-slate-400">Select a campaign to view metrics</p>
            </div>
          )}
        </div>
      </div>

      {/* Executive Performance + Campaign Settings */}
      <div className="grid grid-cols-3 gap-4">
        {/* Executive Performance */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-900">Executive Performance</p>
            <button className="text-xs text-cyan-600 font-medium hover:underline flex items-center gap-1">View all <span>›</span></button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                <th className="text-left pb-2">Executive</th>
                <th className="text-right pb-2">Calls</th>
                <th className="text-right pb-2">Conn.</th>
                <th className="text-right pb-2">Conv.</th>
                <th className="text-right pb-2">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {EXECUTIVES.map((e) => (
                <tr key={e.name} className="hover:bg-slate-50">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full ${e.color} flex items-center justify-center text-white text-[10px] font-bold`}>{e.initials}</div>
                      <span className="font-medium text-slate-800">{e.name}</span>
                    </div>
                  </td>
                  <td className="text-right text-slate-600">{e.calls}</td>
                  <td className="text-right text-slate-600">{e.conn}</td>
                  <td className="text-right font-semibold text-green-600">{e.conv}</td>
                  <td className="text-right"><TrendLine up={e.up} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Campaign Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-900">Campaign Settings</p>
            <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
              <Settings className="w-3.5 h-3.5" />Configure
            </button>
          </div>
          {selected ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                { label: 'DIALER MODE',    value: `${selected.dial_mode} · ${selected.concurrent_calls} max` },
                { label: 'DISTRIBUTION',   value: selected.distribution_strategy.replace(/_/g, ' ') },
                { label: 'TIMEZONE',       value: selected.campaign_timezone },
                { label: 'CALLING WINDOW', value: selected.calling_window_start
                    ? `${selected.calling_window_start}–${selected.calling_window_end}`
                    : 'All hours' },
                { label: 'END DATE',       value: selected.end_date ?? 'None' },
                { label: 'COST / MIN',     value: `$${selected.cost_per_minute_usd.toFixed(4)}` },
                { label: 'SCRIPT',         value: selected.script ? `${selected.script.slice(0, 30)}…` : 'None' },
                { label: 'CALL GOAL',      value: selected.goal_calls?.toLocaleString() ?? 'None' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-xs font-medium text-slate-800 mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Select a campaign above</p>
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => {
            setCampaigns(prev => [c, ...prev]);
            setSelected(c);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
