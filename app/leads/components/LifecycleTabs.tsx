'use client';

import { cn } from '@/lib/utils';
import type { LifecycleStage } from '@/lib/api.leads';

export interface TabDef {
  label: string;
  stage: LifecycleStage | null;   // null = "All Leads"
}

export const LIFECYCLE_TABS: TabDef[] = [
  { label: 'All Leads',     stage: null            },
  { label: 'New',           stage: 'new'           },
  { label: 'Attempted',     stage: 'attempted'     },
  { label: 'Connected',     stage: 'connected'     },
  { label: 'Interested',    stage: 'interested'    },
  { label: 'Qualified',     stage: 'qualified'     },
  { label: 'Proposal Sent', stage: 'proposal_sent' },
  { label: 'Negotiation',   stage: 'negotiation'   },
  { label: 'Converted',     stage: 'converted'     },
  { label: 'Lost',          stage: 'lost'          },
  { label: 'DND',           stage: 'dnd'           },
];

interface Props {
  activeStage: LifecycleStage | null;
  counts: Partial<Record<LifecycleStage | 'all', number>>;
  onChange: (stage: LifecycleStage | null) => void;
}

export default function LifecycleTabs({ activeStage, counts, onChange }: Props) {
  return (
    <div className="flex gap-0.5 border-b border-slate-200 overflow-x-auto scrollbar-none">
      {LIFECYCLE_TABS.map((tab) => {
        const key = tab.stage ?? 'all';
        const count = counts[key as keyof typeof counts] ?? 0;
        const active = activeStage === tab.stage;

        return (
          <button
            key={key}
            onClick={() => onChange(tab.stage)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap shrink-0',
              active
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                active ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-500',
              )}
            >
              {count.toLocaleString()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
