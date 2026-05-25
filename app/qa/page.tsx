'use client';
import { useEffect, useState } from 'react';
import { Search, Filter, Settings, Plus, Play, Download, ChevronRight, Shield, CheckCircle2, X, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { callAnalysisApi, apiFetch, qaApi } from '@/lib/api';
import type { CallAnalysisOut, QaSummary, QaReviewOut } from '@/lib/api.types';

// ── Static data (compliance rules, audit log) ─────────────────────────────────

const METRIC_CARDS = [
  { label: 'QA SCORE AVG', value: '84/100', delta: '+3.2', up: true, color: 'text-green-500' },
  { label: 'AUTO-FAILS', value: '42', delta: '-12%', up: false, color: 'text-red-500' },
  { label: 'COMPLIANCE', value: '98.4%', delta: '+0.2%', up: true, color: 'text-green-500' },
  { label: 'PENDING REVIEW', value: '18', delta: 'urgent', up: false, color: 'text-red-500', urgent: true },
];

const COMPLIANCE_STATUS = [
  { label: 'Consent captured',    value: '100%',     color: 'text-green-600' },
  { label: 'DNC scrub',          value: '100%',     color: 'text-green-600' },
  { label: 'PII masking',        value: '98.4%',    color: 'text-green-600' },
  { label: 'GDPR · EU calls',    value: 'compliant', color: 'text-cyan-600', pill: true },
  { label: 'TCPA · US calls',    value: 'compliant', color: 'text-cyan-600', pill: true },
  { label: 'Recording disclosed', value: '99.7%',    color: 'text-green-600' },
];

const AUTO_FAIL_RULES = [
  { label: 'No consent within 30s',    count: '18 /wk' },
  { label: 'Discount without approval', count: '12 /wk' },
  { label: 'PII shared on chat',       count: '4 /wk'  },
  { label: 'Misleading claims detected', count: '2 /wk' },
  { label: 'Aggressive language',      count: '6 /wk'  },
];

const AUDIT_LOG = [
  { actor: 'Linda Park', action: 'Reviewed call', time: '2m ago' },
  { actor: 'AI Engine',  action: 'Auto-scored',   time: '5m ago' },
  { actor: 'David Chen', action: 'Escalated',     time: '18m ago' },
  { actor: 'AI Engine',  action: 'Score updated', time: '22m ago' },
];

const TAG_COLORS: Record<string, string> = {
  Compliance: 'bg-blue-50 text-blue-600',
  Objection: 'bg-orange-50 text-orange-600',
  Signal: 'bg-emerald-50 text-emerald-600',
  Compliance_critical: 'bg-red-100 text-red-700',
};

// ── Score ring ─────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const circumference = 213.6; // 2π×34
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f97316' : '#ef4444';
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
          strokeLinecap="round" transform="rotate(-90 40 40)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-900">{score}</span>
        <span className="text-[10px] text-slate-400">/100</span>
      </div>
    </div>
  );
}

function Sparkline({ up }: { up: boolean }) {
  return (
    <svg width="80" height="32" viewBox="0 0 80 32" className="opacity-60">
      <polyline
        points={up ? '0,28 20,22 40,18 60,12 80,6' : '0,6 20,14 40,18 60,22 80,26'}
        fill="none" stroke={up ? '#22c55e' : '#ef4444'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

interface CallListItem {
  id: string;
  status: string;
  started_at: string | null;
  duration_seconds: number | null;
  outcome: string | null;
}

export default function QACompliancePage() {
  const [calls, setCalls] = useState<CallListItem[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CallAnalysisOut | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [qaSummary, setQaSummary] = useState<QaSummary | null>(null);
  const [pendingReviews, setPendingReviews] = useState<QaReviewOut[]>([]);

  // Fetch recent completed calls for the picker
  useEffect(() => {
    apiFetch<CallListItem[]>('/calls').then((data) => {
      const completed = data.filter((c) => c.status === 'completed').slice(0, 20);
      setCalls(completed);
      if (completed.length > 0) setSelectedCallId(completed[0].id);
    }).catch(() => {});
  }, []);

  // Fetch QA summary + pending reviews
  useEffect(() => {
    qaApi.summary().then(setQaSummary).catch(() => {});
    qaApi.reviews.list({ status: 'pending' }).then(setPendingReviews).catch(() => {});
  }, []);

  // Fetch analysis for selected call
  useEffect(() => {
    if (!selectedCallId) return;
    setLoadingAnalysis(true);
    setAnalysis(null);
    callAnalysisApi.get(selectedCallId)
      .then(setAnalysis)
      .catch(() => {}) // 404 = not yet analyzed; show static defaults
      .finally(() => setLoadingAnalysis(false));
  }, [selectedCallId]);

  // Derive display values from analysis (or fall back to static mock)
  const score = analysis?.call_score ?? 62;
  const sentiment = analysis?.sentiment ?? null;
  const summaryText = analysis?.summary ?? null;
  const adherence = analysis?.script_adherence ?? null;

  // Map objections + buying signals + compliance flags to criteria rows
  const analysisRows: Array<{ pass: boolean; warn: boolean; text: string; tag: string; autofail?: boolean }> = [];

  if (analysis) {
    analysis.compliance_flags.forEach((f) => {
      analysisRows.push({
        pass: f.severity === 'info',
        warn: f.severity === 'warning',
        text: f.text,
        tag: f.severity === 'critical' ? 'Compliance_critical' : 'Compliance',
        autofail: f.severity === 'critical',
      });
    });
    analysis.objections.forEach((o) => {
      analysisRows.push({ pass: false, warn: true, text: `Objection: ${o.text.slice(0, 80)}`, tag: 'Objection' });
    });
    analysis.buying_signals.forEach((s) => {
      analysisRows.push({ pass: true, warn: false, text: `Signal: ${s.signal}`, tag: 'Signal' });
    });
  }

  // Script adherence percentage for the "criteria met" bar
  const adherencePct = adherence !== null ? Math.round(adherence * 100) : null;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">QA &amp; Compliance</h1>
          <p className="text-xs text-slate-500">Scorecards · Auto-fail rules · GDPR &amp; DNC enforcement</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input placeholder="Search calls by ID, agent, customer..." className="pl-8 pr-10 py-1.5 text-xs border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-cyan-400 bg-white" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-slate-100 px-1 rounded">⌘K</span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"><Filter className="w-3.5 h-3.5" />Filter</button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"><Settings className="w-3.5 h-3.5" />Configure rules</button>
        <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold"><Plus className="w-3.5 h-3.5" />New Scorecard</button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Metrics + Scorecard */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Metric cards — real data from qaApi.summary() */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'QA SCORE AVG',   value: qaSummary ? `${qaSummary.avg_score}/100` : '—',          up: true,  color: 'text-green-500' },
              { label: 'AUTO-FAILS',     value: qaSummary ? String(qaSummary.auto_failed) : '—',          up: false, color: 'text-red-500' },
              { label: 'PASSED',         value: qaSummary ? String(qaSummary.passed) : '—',               up: true,  color: 'text-green-500' },
              { label: 'PENDING REVIEW', value: String(pendingReviews.length), up: pendingReviews.length === 0, color: pendingReviews.length > 0 ? 'text-red-500' : 'text-slate-500', urgent: pendingReviews.length > 0 },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{m.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{m.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs font-semibold flex items-center gap-1 ${m.color}`}>
                    {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {m.urgent ? 'urgent' : m.up ? 'good' : 'review'}
                  </span>
                  <Sparkline up={m.up} />
                </div>
              </div>
            ))}
          </div>

          {/* Call scorecard */}
          <div className="bg-white rounded-xl border border-slate-200 flex-1 overflow-auto">
            {/* Call picker + header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {calls.length > 0 ? (
                  <select
                    value={selectedCallId ?? ''}
                    onChange={(e) => setSelectedCallId(e.target.value)}
                    className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border-0 outline-none cursor-pointer"
                  >
                    {calls.map((c) => (
                      <option key={c.id} value={c.id}>
                        CALL #{c.id.slice(0, 8).toUpperCase()} · {c.started_at ? c.started_at.slice(0, 10) : '—'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">NO CALLS YET</span>
                )}
                {analysis && (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 capitalize">
                      {sentiment ? `${sentiment} sentiment` : 'Analyzed'}
                    </p>
                    <p className="text-xs text-slate-400 truncate max-w-xs">{summaryText?.slice(0, 60) ?? 'AI post-call analysis'}</p>
                  </div>
                )}
                {loadingAnalysis && <p className="text-xs text-slate-400 italic">Loading analysis…</p>}
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 border border-slate-200 rounded-lg"><Play className="w-3.5 h-3.5" />Listen</button>
                <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50"><Download className="w-3.5 h-3.5 text-slate-500" /></button>
              </div>
            </div>

            {/* Score + categories */}
            <div className="flex items-start gap-6 px-5 py-4 border-b border-slate-100">
              <ScoreRing score={score} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    score >= 80 ? 'bg-green-100 text-green-700' :
                    score >= 60 ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {score >= 80 ? 'EXCELLENT' : score >= 60 ? 'NEEDS REVIEW' : 'ACTION REQUIRED'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {analysis ? 'AI-scored · Model: ' + (analysis.model ?? 'GPT') : 'Auto-scored by AI'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Call Score', score: score, max: 100, color: score >= 80 ? '#22c55e' : score >= 60 ? '#f97316' : '#ef4444' },
                    { label: 'Script', score: adherencePct ?? 80, max: 100, color: '#3b82f6' },
                    { label: 'Close Prob', score: Math.round((analysis?.closing_probability ?? 0.35) * 100), max: 100, color: '#8b5cf6' },
                    { label: 'Talk Ratio', score: Math.round((analysis?.talk_ratio_agent ?? 0.55) * 100), max: 100, color: '#06b6d4' },
                  ].map((cat) => (
                    <div key={cat.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">{cat.label}</span>
                        <span className="text-xs font-semibold text-slate-700">{cat.score}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${cat.score}%`, background: cat.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Analysis criteria / findings */}
            <div className="px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-3">
                {analysis ? 'AI FINDINGS' : 'SCORECARD CRITERIA'}
              </p>
              {loadingAnalysis ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : analysisRows.length > 0 ? (
                <div className="space-y-2">
                  {analysisRows.slice(0, 10).map((c, i) => (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                      c.autofail ? 'bg-red-50 border-red-200' :
                      c.warn && !c.pass ? 'bg-amber-50 border-amber-200' :
                      c.pass ? 'bg-green-50/50 border-green-100' :
                      'bg-slate-50 border-slate-100'
                    }`}>
                      {c.pass
                        ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        : c.warn
                          ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          : <X className="w-4 h-4 text-red-500 shrink-0" />
                      }
                      <span className={`flex-1 text-sm font-medium truncate ${c.autofail ? 'text-red-700' : c.warn && !c.pass ? 'text-amber-700' : 'text-slate-700'}`}>{c.text}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${TAG_COLORS[c.tag] ?? 'bg-slate-100 text-slate-600'}`}>{c.tag.replace('_critical', '')}</span>
                      {c.autofail && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold shrink-0">auto-fail</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  {selectedCallId ? 'No analysis available yet — trigger analysis to populate this section.' : 'Select a call to view AI findings.'}
                </p>
              )}

              {/* Action items from analysis */}
              {analysis?.action_items && analysis.action_items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">ACTION ITEMS</p>
                  <div className="space-y-1">
                    {analysis.action_items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 flex flex-col gap-4 shrink-0">
          {/* Compliance Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Compliance Status</p>
                <p className="text-[10px] text-slate-400">
                  {analysis
                    ? `${analysis.compliance_flags.length} flag${analysis.compliance_flags.length !== 1 ? 's' : ''} on this call`
                    : 'Last 24h'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {COMPLIANCE_STATUS.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs text-slate-600">{s.label}</span>
                  </div>
                  {s.pill
                    ? <span className="text-[10px] bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded font-medium">{s.value}</span>
                    : <span className={`text-xs font-semibold ${s.color}`}>{s.value}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Auto-Fail Rules — from QA summary top_fail_reasons */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">Top Fail Reasons</p>
              <button className="text-slate-400 hover:text-slate-600"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {(qaSummary?.top_fail_reasons ?? []).length > 0
                ? qaSummary!.top_fail_reasons.map((r, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-xs text-slate-600 truncate max-w-[160px]">{r.reason}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{r.count}×</span>
                    </div>
                  ))
                : AUTO_FAIL_RULES.map((r) => (
                    <div key={r.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-xs text-slate-600">{r.label}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{r.count}</span>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Audit Log */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">Audit Log</p>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              {AUDIT_LOG.map((l, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 shrink-0">
                    {l.actor === 'AI Engine' ? 'AI' : l.actor.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700">{l.actor}</p>
                    <p className="text-[10px] text-slate-400">{l.action}</p>
                  </div>
                  <span className="text-[10px] text-cyan-600 font-medium shrink-0">{l.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
