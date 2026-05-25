'use client';

import { useEffect, useState } from 'react';
import { Phone, Target, Clock, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { aiApi } from '@/lib/api';
import type { AiAnalyticsSummary } from '@/lib/api.types';

const WEEKLY_DATA = [
  { day: 'Mon', calls: 28, connected: 18, converted: 3 },
  { day: 'Tue', calls: 34, connected: 22, converted: 5 },
  { day: 'Wed', calls: 31, connected: 19, converted: 4 },
  { day: 'Thu', calls: 42, connected: 27, converted: 7 },
  { day: 'Fri', calls: 38, connected: 25, converted: 6 },
  { day: 'Sat', calls: 12, connected: 7,  converted: 1 },
  { day: 'Sun', calls: 5,  connected: 3,  converted: 0 },
];

const maxCalls = Math.max(...WEEKLY_DATA.map((d) => d.calls));

const METRICS = [
  { label: 'Calls Made',     value: '190',  delta: '+12%',  up: true,  icon: Phone },
  { label: 'Connect Rate',   value: '65.3%',delta: '+3.1%', up: true,  icon: Target },
  { label: 'Conversions',    value: '26',   delta: '+5',    up: true,  icon: TrendingUp },
  { label: 'Avg Call Time',  value: '4:12', delta: '-0:18', up: true,  icon: Clock },
];

// Derive skill scores from AI analytics summary
function buildSkills(d: AiAnalyticsSummary) {
  const sentimentScore = Math.round(((d.avg_sentiment_score + 1) / 2) * 100); // -1..+1 → 0..100
  const closeScore = Math.round(d.avg_closing_probability * 100);
  const callScore = Math.round(d.avg_call_score);
  const compliance = d.compliance_flag_count === 0 ? 100 : Math.max(50, 100 - d.compliance_flag_count * 5);
  return [
    { label: 'Call Quality',   score: callScore },
    { label: 'Sentiment',      score: sentimentScore },
    { label: 'Closing',        score: closeScore },
    { label: 'Compliance',     score: compliance },
    { label: 'Calls Analyzed', score: Math.min(100, d.calls_analyzed) },
  ];
}

const FALLBACK_SKILLS = [
  { label: 'Opening',        score: 88 },
  { label: 'Discovery',      score: 74 },
  { label: 'Objections',     score: 65 },
  { label: 'Closing',        score: 81 },
  { label: 'Follow-through', score: 92 },
];

export default function ScorecardPage() {
  const { user } = useAuth();
  const name = user?.full_name ?? 'You';
  const [aiSummary, setAiSummary] = useState<AiAnalyticsSummary | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    aiApi.summary({ agent_id: user.id }).then(setAiSummary).catch(() => {});
  }, [user?.id]);

  const overallScore = aiSummary ? Math.round(aiSummary.avg_call_score) : 79;
  const skills = aiSummary ? buildSkills(aiSummary) : FALLBACK_SKILLS;

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">My Scorecard</h1>
          <p className="text-xs text-slate-500">
            {name} · This week
            {aiSummary && <span className="ml-2 text-slate-400">· {aiSummary.calls_analyzed} calls AI-analyzed</span>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span className="text-sm font-bold text-amber-700">{overallScore}</span>
          <span className="text-xs text-amber-600">/ 100</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3">
        {METRICS.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <m.icon className="w-4 h-4 text-slate-400" />
              <span className={cn('text-[10px] font-semibold flex items-center gap-0.5', m.up ? 'text-green-600' : 'text-red-500')}>
                {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.delta}
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900">{m.value}</p>
            <p className="text-xs text-slate-500">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
        {/* Bar chart */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Daily Activity</h2>
          <div className="flex-1 flex items-end gap-2">
            {WEEKLY_DATA.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5" style={{ height: '120px', justifyContent: 'flex-end' }}>
                  <div
                    className="w-full rounded-t bg-cyan-500"
                    style={{ height: `${(d.calls / maxCalls) * 100}%` }}
                    title={`${d.calls} calls`}
                  />
                </div>
                <p className="text-[10px] text-slate-400">{d.day}</p>
                <p className="text-[10px] font-semibold text-slate-700">{d.calls}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-500" /> Calls</span>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">AI Skill Scores</h2>
          <p className="text-[10px] text-slate-400 mb-3">
            {aiSummary ? 'From AI analysis · Last 30 days' : 'Estimated · Awaiting AI data'}
          </p>
          <div className="flex-1 space-y-3">
            {skills.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-slate-700">{s.label}</p>
                  <p className={cn('text-xs font-bold', s.score >= 85 ? 'text-green-600' : s.score >= 70 ? 'text-amber-600' : 'text-red-500')}>
                    {s.score}
                  </p>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', s.score >= 85 ? 'bg-green-500' : s.score >= 70 ? 'bg-amber-400' : 'bg-red-400')}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {aiSummary && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 space-y-0.5">
              <p>Close rate: {(aiSummary.avg_closing_probability * 100).toFixed(0)}%</p>
              <p>Compliance flags: {aiSummary.compliance_flag_count}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
