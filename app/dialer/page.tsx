'use client';

import { useState } from 'react';
import { Zap, Eye, BarChart2, Hand, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const DIALER_MODES = [
  {
    id: 'predictive',
    icon: Zap,
    label: 'Predictive',
    tagline: 'Max call volume · AI-driven pacing',
    description:
      'The dialer automatically initiates calls before an agent finishes their current call. The AI predicts agent availability and adjusts the call rate in real time to minimize idle time while keeping abandon rates within compliance thresholds.',
    kpi: { 'Calls/Hour': '45–65', 'Abandon Rate': '< 3%', 'Agent Idle': '< 5%', 'Best For': 'Large lists' },
    color: 'cyan',
  },
  {
    id: 'power',
    icon: BarChart2,
    label: 'Power',
    tagline: 'One call per agent · Controlled pace',
    description:
      'Exactly one call is dialled per available agent. No double-dialling means zero abandoned calls. The dialer waits for the previous call to fully complete before starting the next. Ideal when list quality is uncertain.',
    kpi: { 'Calls/Hour': '20–35', 'Abandon Rate': '0%', 'Agent Idle': '< 15%', 'Best For': 'SMB lists' },
    color: 'blue',
  },
  {
    id: 'preview',
    icon: Eye,
    label: 'Preview',
    tagline: 'Agent reviews lead before dialling',
    description:
      'Each agent sees the lead record and decides when to dial. Maximises personalisation and context — ideal for high-value enterprise prospects where call quality matters more than volume.',
    kpi: { 'Calls/Hour': '8–15', 'Abandon Rate': '0%', 'Agent Idle': '30–50%', 'Best For': 'Enterprise' },
    color: 'purple',
  },
  {
    id: 'manual',
    icon: Hand,
    label: 'Manual',
    tagline: 'Agent dials every number manually',
    description:
      'Full manual control. No automation. Used for compliance-sensitive campaigns (TCPA regulated) or custom outreach where every dial decision must be a deliberate human action.',
    kpi: { 'Calls/Hour': '4–10', 'Abandon Rate': '0%', 'Agent Idle': 'Varies', 'Best For': 'Regulated' },
    color: 'amber',
  },
];

const COLOR_MAP: Record<string, { card: string; icon: string; badge: string }> = {
  cyan:   { card: 'border-cyan-200 bg-cyan-50/30',   icon: 'text-cyan-500',  badge: 'bg-cyan-100 text-cyan-700'   },
  blue:   { card: 'border-blue-200 bg-blue-50/30',   icon: 'text-blue-500',  badge: 'bg-blue-100 text-blue-700'   },
  purple: { card: 'border-purple-200 bg-purple-50/30',icon: 'text-purple-500',badge: 'bg-purple-100 text-purple-700'},
  amber:  { card: 'border-amber-200 bg-amber-50/30', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
};

export default function DialerPage() {
  const [active, setActive] = useState('predictive');

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <h1 className="text-base font-semibold text-slate-900">Dialer Modes</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Choose the dialling strategy for your campaigns. The active mode can also be overridden per-campaign.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        {DIALER_MODES.map((mode) => {
          const clr = COLOR_MAP[mode.color];
          const isActive = active === mode.id;
          return (
            <div
              key={mode.id}
              onClick={() => setActive(mode.id)}
              className={cn(
                'bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-sm',
                isActive ? clr.card + ' shadow-sm' : 'border-slate-200',
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <mode.icon className={cn('w-7 h-7', isActive ? clr.icon : 'text-slate-400')} />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{mode.label}</p>
                    <p className="text-xs text-slate-500">{mode.tagline}</p>
                  </div>
                </div>
                {isActive && (
                  <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full', clr.badge)}>
                    <CheckCircle2 className="w-3 h-3" /> Default
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">{mode.description}</p>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(mode.kpi).map(([k, v]) => (
                  <div key={k} className="bg-white/80 rounded-lg px-3 py-1.5 border border-slate-100">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{k}</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
        <p>
          The selected default mode applies to new campaigns. Existing campaigns keep their individual dialler setting
          unless explicitly changed in Campaign → Settings. Predictive dialling requires a minimum of 3 agents to maintain
          healthy abandon rates.
        </p>
      </div>
    </div>
  );
}
