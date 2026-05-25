'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LifecycleStage } from '@/lib/api.leads';

// Terminal stages are not shown in the linear progress stepper
const PIPELINE_STAGES: LifecycleStage[] = [
  'new', 'attempted', 'connected', 'interested',
  'qualified', 'proposal_sent', 'negotiation', 'converted',
];

const STAGE_LABELS: Record<string, string> = {
  new: 'New', attempted: 'Tried', connected: 'Reached',
  interested: 'Interest', qualified: 'Qualified',
  proposal_sent: 'Proposal', negotiation: 'Nego.', converted: 'Won',
};

interface Props {
  currentStage: LifecycleStage | string;
}

export default function PipelineProgress({ currentStage }: Props) {
  const isTerminal = currentStage === 'lost' || currentStage === 'dnd';
  const currentIdx = PIPELINE_STAGES.indexOf(currentStage as LifecycleStage);

  if (isTerminal) {
    const label = currentStage === 'dnd' ? 'DND' : 'Lost';
    const color = currentStage === 'dnd' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-red-100 text-red-700 border-red-200';
    return (
      <div className={cn('px-3 py-2 rounded-lg border text-xs font-semibold text-center', color)}>
        Lead marked as {label}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-0">
      {PIPELINE_STAGES.map((stage, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const hasConnector = i < PIPELINE_STAGES.length - 1;

        return (
          <div key={stage} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors',
                  done
                    ? 'bg-cyan-500 border-cyan-500'
                    : 'border-slate-200 bg-white',
                )}
              >
                {done && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span
                className={cn(
                  'text-[8px] font-medium whitespace-nowrap leading-none',
                  isCurrent ? 'text-cyan-600 font-bold' : done ? 'text-cyan-500' : 'text-slate-400',
                )}
              >
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {hasConnector && (
              <div
                className={cn('h-0.5 flex-1 -mt-4 transition-colors', i < currentIdx ? 'bg-cyan-500' : 'bg-slate-200')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
