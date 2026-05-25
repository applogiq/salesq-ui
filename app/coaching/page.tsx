'use client';
import { useEffect, useState } from 'react';
import { Search, Download, ChevronDown, TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { aiApi } from '@/lib/api';
import type { AiAnalyticsSummary } from '@/lib/api.types';

// ── Static fallback for Most Discussed Topics (not in AI summary API) ─────────

const TOPICS = [
  { label: 'pricing', count: 432, size: 'text-xl' },
  { label: 'integrations', count: 360, size: 'text-lg' },
  { label: 'support', count: 324, size: 'text-lg' },
  { label: 'features', count: 306, size: 'text-base' },
  { label: 'security', count: 270, size: 'text-base' },
  { label: 'onboarding', count: 252, size: 'text-base' },
  { label: 'roi', count: 234, size: 'text-sm' },
  { label: 'training', count: 216, size: 'text-sm' },
  { label: 'data privacy', count: 198, size: 'text-sm' },
  { label: 'contract', count: 180, size: 'text-sm' },
  { label: 'compliance', count: 126, size: 'text-xs' },
  { label: 'AI', count: 144, size: 'text-xs' },
];

const TOPIC_COLORS = [
  'bg-cyan-50 text-cyan-700', 'bg-purple-50 text-purple-700', 'bg-blue-50 text-blue-700',
  'bg-emerald-50 text-emerald-700', 'bg-orange-50 text-orange-700', 'bg-rose-50 text-rose-700',
  'bg-amber-50 text-amber-700', 'bg-slate-100 text-slate-600',
];

const OBJECTION_COLORS = [
  '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#22c55e', '#94a3b8',
  '#f97316', '#ec4899',
];

function Sparkline({ up }: { up: boolean }) {
  return (
    <svg width="72" height="28" viewBox="0 0 72 28" className="opacity-60">
      <polyline
        points={up ? '0,24 18,18 36,13 54,8 72,4' : '0,4 18,10 36,14 54,18 72,22'}
        fill="none" stroke={up ? '#22c55e' : '#ef4444'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
      <div className="h-3 w-24 bg-slate-200 rounded mb-2" />
      <div className="h-7 w-20 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-16 bg-slate-200 rounded" />
    </div>
  );
}

export default function CoachingPage() {
  const [data, setData] = useState<AiAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiApi.summary().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // ── Derived display values ─────────────────────────────────────────────────

  const totalObjCount = data?.top_objections.reduce((s, o) => s + o.count, 0) ?? 0;
  const maxObjCount = data?.top_objections[0]?.count ?? 1;

  // Sentiment trend: avg_score (-1..+1) → split into positive/negative/neutral for display
  const sentimentChartData = (data?.sentiment_trend ?? []).map((d) => ({
    day: d.date.slice(5), // MM-DD
    score: parseFloat(d.avg_score.toFixed(3)),
  }));

  // Competitor sentiment string
  const sentLabel = (avg: number) =>
    avg > 0.2 ? 'Positive' : avg < -0.2 ? 'Negative' : 'Neutral';
  const sentColor = (avg: number) =>
    avg > 0.2
      ? { text: 'text-green-500', dot: 'bg-green-500' }
      : avg < -0.2
      ? { text: 'text-red-500', dot: 'bg-red-500' }
      : { text: 'text-slate-500', dot: 'bg-slate-400' };

  const metrics = data
    ? [
        {
          label: 'CALLS ANALYZED',
          value: data.calls_analyzed.toLocaleString(),
          delta: data.calls_failed > 0 ? `${data.calls_failed} failed` : 'All succeeded',
          up: data.calls_failed === 0,
        },
        {
          label: 'AVG SENTIMENT',
          value: (data.avg_sentiment_score >= 0 ? '+' : '') + data.avg_sentiment_score.toFixed(2),
          delta: data.avg_sentiment_score >= 0 ? 'Positive' : 'Negative',
          up: data.avg_sentiment_score >= 0,
        },
        {
          label: 'OBJECTIONS FOUND',
          value: totalObjCount.toLocaleString(),
          delta: `${data.top_objections.length} types`,
          up: false,
        },
        {
          label: 'AVG CALL SCORE',
          value: `${Math.round(data.avg_call_score)}/100`,
          delta: `${(data.avg_closing_probability * 100).toFixed(0)}% close rate`,
          up: data.avg_call_score >= 60,
        },
      ]
    : null;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Conversation Intelligence</h1>
          <p className="text-xs text-slate-500">
            {data
              ? `AI analysis on ${data.calls_analyzed.toLocaleString()} calls · Powered by OpenAI · Whisper`
              : 'AI analysis · Powered by OpenAI · Whisper'}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input placeholder="Search transcripts, keywords, objections..." className="pl-8 pr-10 py-1.5 text-xs border border-slate-200 rounded-lg w-64 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-slate-100 px-1 rounded">⌘K</span>
        </div>
        <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600">Last 30 days<ChevronDown className="w-3 h-3 ml-1" /></button>
        <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600">All campaigns<ChevronDown className="w-3 h-3 ml-1" /></button>
        <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold"><Download className="w-3.5 h-3.5" />Export Report</button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : (metrics ?? []).map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{m.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{m.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs font-semibold flex items-center gap-1 ${m.up ? 'text-green-500' : 'text-red-500'}`}>
                    {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{m.delta}
                  </span>
                  <Sparkline up={m.up} />
                </div>
              </div>
            ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top Objections */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">⚠</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Top Objections Detected</p>
                <p className="text-[10px] text-slate-400">
                  {data ? `${totalObjCount.toLocaleString()} total · ${data.calls_analyzed.toLocaleString()} calls` : 'Loading…'}
                </p>
              </div>
            </div>
            <button><MoreHorizontal className="w-4 h-4 text-slate-400" /></button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.top_objections ?? []).slice(0, 6).map((o, i) => {
                const pct = Math.round((o.count / maxObjCount) * 100);
                const color = OBJECTION_COLORS[i % OBJECTION_COLORS.length];
                return (
                  <div key={o.type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-xs text-slate-700 font-medium capitalize">{o.type.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-10 text-right">{o.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sentiment Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-slate-900">Sentiment Trend</p>
            <span className="text-[10px] text-slate-400">Daily avg score · -1.0 to +1.0</span>
          </div>
          <div className="h-40">
            {loading ? (
              <div className="h-full bg-slate-50 rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis domain={[-1, 1]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(3), 'Avg Sentiment']}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center gap-6 mt-2">
            {data && [
              { label: 'AVG SCORE', value: (data.avg_sentiment_score >= 0 ? '+' : '') + data.avg_sentiment_score.toFixed(2), color: 'bg-cyan-500' },
              { label: 'CLOSE RATE', value: `${(data.avg_closing_probability * 100).toFixed(0)}%`, color: 'bg-emerald-500' },
              { label: 'FLAGS', value: data.compliance_flag_count.toString(), color: 'bg-red-400' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${s.color}`} />
                <span className="text-[10px] text-slate-500 font-medium">{s.label}</span>
                <span className="text-xs font-bold text-slate-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Most Discussed Topics (static) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-900 mb-3">Most Discussed Topics</p>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t, i) => (
              <span key={t.label} className={`${t.size} font-semibold px-2 py-0.5 rounded-lg cursor-pointer hover:opacity-80 ${TOPIC_COLORS[i % TOPIC_COLORS.length]}`}>
                {t.label} <span className="font-normal opacity-60 text-[10px]">{t.count}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Competitor Mentions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-900">Competitor Mentions</p>
            <span className="text-[10px] text-slate-400">
              {data ? `${data.competitor_mentions.length} tracked` : ''}
            </span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.competitor_mentions ?? []).slice(0, 5).map((c) => {
                const colors = sentColor(c.avg_sentiment);
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{c.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      <span className={`text-[10px] font-medium ${colors.text}`}>{sentLabel(c.avg_sentiment)}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-8 text-right">{c.count}</span>
                  </div>
                );
              })}
              {!data?.competitor_mentions.length && (
                <p className="text-xs text-slate-400 text-center py-4">No competitor mentions yet</p>
              )}
            </div>
          )}
        </div>

        {/* Buying Signals */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900">Buying Signals</p>
            <p className="text-[10px] text-slate-400">High-intent phrases</p>
          </div>
          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-5 bg-slate-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2.5">
              {(data?.top_buying_signals ?? []).slice(0, 6).map((s) => (
                <div key={s.signal} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="flex-1 text-xs text-slate-700 truncate italic">&ldquo;{s.signal}&rdquo;</span>
                  <span className="text-xs font-bold text-slate-700 w-8 text-right shrink-0">{s.count}</span>
                </div>
              ))}
              {!data?.top_buying_signals.length && (
                <p className="text-xs text-slate-400 text-center py-4">No buying signals detected yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
