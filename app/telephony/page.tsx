'use client';
import { useEffect, useState } from 'react';
import { Search, Settings, Plus, Globe, Filter, TrendingUp, TrendingDown, CheckCircle2, RefreshCw, AlertCircle, Loader2, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { phoneApi, routingApi, webhookApi, dialerApi } from '@/lib/api';
import type { PhoneNumber, RoutingRule, WebhookHealth, CampaignQueueStatus, DialMode } from '@/lib/api.types';
import NumberSearchDrawer from '@/components/telephony/NumberSearchDrawer';

// ── Static metric cards (live data from Telnyx billing API is a future phase) ──
const METRICS = [
  { label: 'TOTAL NUMBERS',  value: '—',     delta: 'live',    up: true  },
  { label: 'MINUTES TODAY',  value: '—',     delta: 'live',    up: true  },
  { label: 'AVG LATENCY',    value: '142ms', delta: '-12ms',   up: true  },
  { label: 'DROPPED CALLS',  value: '0.18%', delta: '-0.04%',  up: true  },
  { label: 'TELEPHONY COST', value: '—',     delta: 'today',   up: false },
];

const DIALER_MODE_META: Record<DialMode, { icon: string; label: string; sub: string }> = {
  predictive: { icon: '⚡', label: 'Predictive', sub: 'High volume auto-dial' },
  preview:    { icon: '📞', label: 'Preview',    sub: 'Review before dialing' },
  power:      { icon: '🔁', label: 'Power',      sub: 'Fixed dial ratio' },
  manual:     { icon: '📋', label: 'Manual',     sub: 'Agent-initiated only' },
};

const FLAG: Record<string, string> = {
  US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', IN: '🇮🇳', AU: '🇦🇺',
  CA: '🇨🇦', FR: '🇫🇷', SG: '🇸🇬', NL: '🇳🇱', BR: '🇧🇷',
};

function Sparkline({ up }: { up: boolean }) {
  return (
    <svg width="72" height="28" viewBox="0 0 72 28" className="opacity-60">
      <polyline
        points={up ? '0,24 18,16 36,12 54,7 72,4' : '0,4 18,10 36,18 54,22 72,24'}
        fill="none" stroke={up ? '#22c55e' : '#ef4444'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    active:    'text-green-600',
    porting:   'text-amber-500',
    suspended: 'text-red-500',
    released:  'text-slate-400',
  };
  const dotCfg: Record<string, string> = {
    active:    'bg-green-500',
    porting:   'bg-amber-400',
    suspended: 'bg-red-500',
    released:  'bg-slate-300',
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={cn('flex items-center justify-end gap-1 text-[10px] font-semibold', cfg[status] ?? 'text-slate-400')}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dotCfg[status] ?? 'bg-slate-300')} />
      {label}
    </span>
  );
}

export default function TelephonyPage() {
  const [numbers, setNumbers]           = useState<PhoneNumber[]>([]);
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [webhookHealth, setWebhookHealth] = useState<WebhookHealth[]>([]);
  const [loading, setLoading]           = useState(true);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [toast, setToast]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [balance, setBalance]           = useState<{ available_credit: number; currency: string } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [dialerQueue, setDialerQueue]   = useState<CampaignQueueStatus[]>([]);
  const [dialerToggles, setDialerToggles] = useState<Record<string, boolean>>({});

  const metrics = [
    { ...METRICS[0], value: numbers.length > 0 ? String(numbers.length) : '0' },
    ...METRICS.slice(1, 4),
    {
      label: 'ACCOUNT BALANCE',
      value: balanceLoading ? '—' : balance != null ? `$${balance.available_credit.toFixed(2)}` : '—',
      delta: balance != null ? balance.currency : 'USD',
      up: true,
    },
  ];

  useEffect(() => {
    Promise.all([
      phoneApi.list().catch(() => [] as PhoneNumber[]),
      routingApi.list().catch(() => [] as RoutingRule[]),
      webhookApi.health().catch(() => [] as WebhookHealth[]),
    ]).then(([nums, rules, health]) => {
      setNumbers(nums);
      setRoutingRules(rules);
      setWebhookHealth(health);
    }).finally(() => setLoading(false));

    // Fetch Telnyx account balance independently
    phoneApi.balance()
      .then(b => setBalance(b))
      .catch(() => setBalance(null))
      .finally(() => setBalanceLoading(false));

    // Fetch dialer queue summary
    dialerApi.queue().then(setDialerQueue).catch(() => {});
  }, []);

  const handlePurchased = (pn: PhoneNumber) => {
    setNumbers(prev => [pn, ...prev]);
    setDrawerOpen(false);
    setToast(`${pn.number} purchased successfully`);
    setTimeout(() => setToast(null), 3500);
    // Refresh balance so the card reflects the deduction
    setBalanceLoading(true);
    phoneApi.balance()
      .then(b => setBalance(b))
      .catch(() => {})
      .finally(() => setBalanceLoading(false));
  };

  const toggleRule = async (rule: RoutingRule) => {
    try {
      const updated = await routingApi.patch(rule.id, { rule_active: !rule.rule_active });
      setRoutingRules(prev => prev.map(r => r.id === rule.id ? updated : r));
    } catch {}
  };

  const filtered = numbers.filter(n =>
    !search || n.number.includes(search) || (n.assignment_type ?? '').includes(search.toLowerCase())
  );

  const toggleCampaign = async (cq: CampaignQueueStatus) => {
    const campaignId = cq.campaign_id;
    setDialerToggles(t => ({ ...t, [campaignId]: true }));
    try {
      const isActive = cq.status === 'active';
      await (isActive ? dialerApi.pause(campaignId) : dialerApi.start(campaignId));
      const updated = await dialerApi.queue();
      setDialerQueue(updated);
    } catch {}
    finally { setDialerToggles(t => ({ ...t, [campaignId]: false })); }
  };

  const allOk = webhookHealth.every(w => w.failed === 0);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 size={13} /> {toast}
        </div>
      )}

      {/* Number search drawer */}
      <NumberSearchDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onPurchased={handlePurchased}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Telephony</h1>
          <p className="text-xs text-slate-500">
            Telnyx · {numbers.length} number{numbers.length !== 1 ? 's' : ''} provisioned · {routingRules.filter(r => r.rule_active).length} active routing rules
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search numbers, assignments…"
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-green-200 bg-green-50 text-green-700 rounded-lg font-medium">
          <Globe className="w-3.5 h-3.5" />Telnyx connected
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600">
          <Settings className="w-3.5 h-3.5" />SIP config
        </button>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />Buy Number
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-5 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className={cn(
            'bg-white rounded-xl border p-4',
            m.label === 'ACCOUNT BALANCE' ? 'border-cyan-200 bg-gradient-to-br from-cyan-50 to-white' : 'border-slate-200'
          )}>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{m.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {(loading && m.value === '0') || (m.label === 'ACCOUNT BALANCE' && balanceLoading)
                ? <Loader2 size={16} className="animate-spin text-slate-300" />
                : m.value}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className={cn('text-xs font-semibold flex items-center gap-1', m.up ? 'text-green-500' : 'text-red-500')}>
                {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{m.delta}
              </span>
              <Sparkline up={m.up} />
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Phone Numbers table */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-900">Phone Numbers</p>
              <p className="text-[10px] text-slate-400">DID · Toll-free · Mobile</p>
            </div>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
          <div className="overflow-auto flex-1">
            {loading ? (
              <div className="p-6 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <p className="text-sm font-medium">No numbers provisioned</p>
                <p className="text-xs mt-1">Click "Buy Number" to get started</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-2">Number</th>
                    <th className="text-left px-3 py-2">Country</th>
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="text-left px-3 py-2">Assigned</th>
                    <th className="text-right px-3 py-2">Cost/mo</th>
                    <th className="text-right px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50 cursor-pointer">
                      <td className="px-4 py-2.5 font-semibold text-slate-800 font-mono text-[11px]">{n.number}</td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm">{FLAG[n.country_code] ?? '🌐'}</span>
                          <span className="text-slate-500 text-[11px]">{n.country_code}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-medium',
                          n.number_type === 'toll_free' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'
                        )}>
                          {n.number_type === 'toll_free' ? 'Toll-free' : n.number_type === 'mobile' ? 'Mobile' : 'DID'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {n.assignment_type
                          ? <span className="capitalize">{n.assignment_type}</span>
                          : <span className="text-slate-300">Unassigned</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600 font-medium">
                        {n.monthly_cost_usd != null ? `$${n.monthly_cost_usd.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <StatusPill status={n.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="w-72 flex flex-col gap-4 shrink-0">
          {/* Call Routing */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Call Routing</p>
                <p className="text-[10px] text-slate-400">
                  {routingRules.filter(r => r.rule_active).length} active rule{routingRules.filter(r => r.rule_active).length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-6 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ) : routingRules.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No routing rules configured</p>
            ) : (
              <div className="space-y-2">
                {routingRules.map((r) => (
                  <div key={r.id} className="flex items-center gap-2.5 py-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-400 truncate capitalize">{r.action?.type ?? 'rule'} · priority {r.priority}</p>
                    </div>
                    <button
                      onClick={() => toggleRule(r)}
                      className={cn(
                        'relative inline-flex h-4 w-7 shrink-0 rounded-full border-2 transition-colors',
                        r.rule_active ? 'bg-cyan-500 border-cyan-500' : 'bg-slate-200 border-slate-200'
                      )}
                    >
                      <span className={cn(
                        'inline-block h-3 w-3 rounded-full bg-white shadow transition-transform',
                        r.rule_active ? 'translate-x-3' : 'translate-x-0'
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Webhook Health */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">Webhook Health</p>
              {!loading && (
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1',
                  allOk ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', allOk ? 'bg-green-500' : 'bg-red-500')} />
                  {allOk ? 'All good' : 'Issues'}
                </span>
              )}
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ) : webhookHealth.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No webhook events in the last 24 h</p>
            ) : (
              <div className="space-y-2.5">
                {webhookHealth.map((w) => (
                  <div key={w.event_type} className="flex items-start gap-2">
                    {w.failed > 0
                      ? <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                      : <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{w.event_type}</p>
                      <p className="text-[10px] text-slate-400">
                        {w.total.toLocaleString()} events
                        {w.failed > 0 && <span className="text-red-400"> · {w.failed} failed</span>}
                        {w.retry > 0 && <span className="text-amber-500"> · {w.retry} retry</span>}
                        {w.ok > 0 && <span className="text-green-500"> · {w.ok} ok</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dialer — active campaigns */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Dialer</p>
                <p className="text-[10px] text-slate-400">
                  {dialerQueue.filter(c => c.status === 'active').length} campaign{dialerQueue.filter(c => c.status === 'active').length !== 1 ? 's' : ''} running
                </p>
              </div>
            </div>

            {dialerQueue.length === 0 ? (
              <div className="space-y-2 mb-3">
                {/* Mode legend when no campaigns loaded */}
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(DIALER_MODE_META) as DialMode[]).map(mode => {
                    const m = DIALER_MODE_META[mode];
                    return (
                      <div key={mode} className="border border-slate-100 rounded-lg p-2 bg-slate-50">
                        <p className="text-sm mb-0.5">{m.icon}</p>
                        <p className="text-[11px] font-semibold text-slate-700">{m.label}</p>
                        <p className="text-[10px] text-slate-400">{m.sub}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 text-center pt-1">No active campaigns</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dialerQueue.map(cq => {
                  const meta = DIALER_MODE_META[cq.dial_mode] ?? DIALER_MODE_META.manual;
                  const isActive = cq.status === 'active';
                  const toggling = !!dialerToggles[cq.campaign_id];
                  return (
                    <div key={cq.campaign_id} className="border border-slate-100 rounded-lg p-2.5">
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-800 truncate">{cq.campaign_name}</p>
                          <p className="text-[10px] text-slate-400">
                            {meta.icon} {meta.label} · {cq.concurrent_calls} concurrent
                          </p>
                        </div>
                        <button
                          onClick={() => toggleCampaign(cq)}
                          disabled={toggling}
                          className={cn(
                            'shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border transition-colors',
                            isActive
                              ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                              : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
                            toggling && 'opacity-50 cursor-not-allowed',
                          )}
                        >
                          {toggling
                            ? <Loader2 size={10} className="animate-spin" />
                            : isActive ? <Pause size={10} /> : <Play size={10} />}
                          {isActive ? 'Pause' : 'Start'}
                        </button>
                      </div>
                      <div className="flex gap-2 text-[10px]">
                        <span className="text-slate-400">Q <span className="font-semibold text-slate-600">{cq.queued}</span></span>
                        <span className="text-slate-400">Active <span className="font-semibold text-cyan-600">{cq.active}</span></span>
                        <span className="text-slate-400">Done <span className="font-semibold text-green-600">{cq.completed}</span></span>
                        {cq.failed > 0 && <span className="text-slate-400">Fail <span className="font-semibold text-red-500">{cq.failed}</span></span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
