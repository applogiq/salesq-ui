'use client';

import { cn } from '@/lib/utils';
import type { TimelineEntry } from '@/lib/api.leads';

// Phase 2 event types
const ACTIVITY_ICONS: Record<string, string> = {
  stage_change: '🔄',
  call:         '📞',
  followup_set: '📅',
  import:       '📥',
  // Phase 3+ (shown gracefully if they appear)
  email:        '✉️',
  whatsapp:     '💬',
  note:         '📝',
  // Phase 10 — SMS messages
  sms:          '📱',
  message:      '💬',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

interface Props {
  items: TimelineEntry[];
  loading?: boolean;
  totalCount?: number;
}

export default function ActivityTimeline({ items, loading, totalCount }: Props) {
  return (
    <div className="p-4 flex-1 overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-700">Activity Timeline</p>
        {totalCount != null && (
          <span className="text-[10px] text-slate-400">{totalCount} interactions</span>
        )}
      </div>

      {loading ? (
        <div className="text-[11px] text-slate-400 text-center py-4">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-[11px] text-slate-400 text-center py-4">No activity yet</div>
      ) : (
        <div className="space-y-3">
          {items.map((entry) => (
            <div key={entry.id} className="flex gap-2.5">
              {/* Icon */}
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm shrink-0">
                {ACTIVITY_ICONS[entry.activity_type] ?? '•'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-slate-800">{entry.summary}</p>

                  {/* Call outcome score chip */}
                  {entry.activity_type === 'call' && typeof entry.detail?.outcome === 'string' && (
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                      entry.detail.outcome === 'interested'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-slate-100 text-slate-500',
                    )}>
                      {entry.detail.outcome.replace('-', ' ')}
                    </span>
                  )}
                </div>

                {/* Detail body */}
                {typeof entry.detail?.note === 'string' && (
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    {entry.detail.note}
                  </p>
                )}

                {/* Timestamp */}
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {relativeTime(entry.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
