'use client';

import { cn } from '@/lib/utils';
import type { LifecycleStage } from '@/lib/api.leads';

export const STAGE_COLORS: Record<string, string> = {
  new:           'bg-slate-100 text-slate-600',
  attempted:     'bg-amber-100 text-amber-700',
  connected:     'bg-cyan-100 text-cyan-700',
  interested:    'bg-blue-100 text-blue-700',
  qualified:     'bg-violet-100 text-violet-700',
  proposal_sent: 'bg-purple-100 text-purple-700',
  negotiation:   'bg-indigo-100 text-indigo-700',
  converted:     'bg-green-100 text-green-700',
  lost:          'bg-red-100 text-red-700',
  dnd:           'bg-rose-100 text-rose-700',
};

export const STAGE_LABELS: Record<string, string> = {
  new:           'New',
  attempted:     'Attempted',
  connected:     'Connected',
  interested:    'Interested',
  qualified:     'Qualified',
  proposal_sent: 'Proposal Sent',
  negotiation:   'Negotiation',
  converted:     'Converted',
  lost:          'Lost',
  dnd:           'DND',
};

interface Props {
  stage: LifecycleStage | string;
  className?: string;
}

export default function StageBadge({ stage, className }: Props) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-[10px] font-semibold',
        STAGE_COLORS[stage] ?? 'bg-slate-100 text-slate-600',
        className,
      )}
    >
      {STAGE_LABELS[stage] ?? stage}
    </span>
  );
}
