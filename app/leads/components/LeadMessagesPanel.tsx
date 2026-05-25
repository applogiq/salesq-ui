'use client';

/**
 * Phase 10 — Messages tab panel for the Lead Workspace.
 *
 * Shows all message threads for this lead grouped by channel.
 * Quick-action buttons navigate to the omnichannel inbox for that thread.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { threadsApi } from '@/lib/api.messages';
import type { Thread } from '@/lib/api.types';

const CHANNEL_ICON: Record<string, string> = { whatsapp: '💬', email: '✉️', sms: '📱' };

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  leadId: string;
}

export default function LeadMessagesPanel({ leadId }: Props) {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    threadsApi.list({ lead_id: leadId })
      .then(setThreads)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [leadId]);

  const openThread = (threadId: string) => {
    router.push(`/omnichannel?thread_id=${threadId}`);
  };

  const startNew = (channel: 'sms' | 'whatsapp' | 'email') => {
    router.push(`/omnichannel?new=${channel}&lead_id=${leadId}`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Quick-action bar */}
      <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center gap-2 shrink-0">
        <button
          onClick={() => startNew('sms')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />Send SMS
        </button>
        <button
          onClick={() => startNew('whatsapp')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />Send WhatsApp
        </button>
        <button
          onClick={() => startNew('email')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />Send Email
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {loading && (
          <p className="text-[11px] text-slate-400 text-center py-6">Loading…</p>
        )}
        {!loading && threads.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Send the first message above</p>
          </div>
        )}
        {threads.map(t => (
          <button
            key={t.id}
            onClick={() => openThread(t.id)}
            className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{CHANNEL_ICON[t.channel]}</span>
                <span className="text-xs font-semibold text-slate-700 capitalize">{t.channel}</span>
                {(t.unread_count || 0) > 0 && (
                  <span className="w-4 h-4 bg-cyan-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {t.unread_count}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                  t.status === 'open' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500')}>
                  {t.status}
                </span>
                <span className="text-[10px] text-slate-400">{relativeTime(t.last_message_at)}</span>
              </div>
            </div>
            {t.subject && (
              <p className="text-xs text-slate-500 truncate">{t.subject}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5 group-hover:text-cyan-600 transition-colors">
              Open in inbox →
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
