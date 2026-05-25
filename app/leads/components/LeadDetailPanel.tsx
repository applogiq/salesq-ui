'use client';

import { useState, useEffect } from 'react';
import {
  Phone, Mail, MessageSquare, MoreHorizontal,
  ChevronDown, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lead, TimelineEntry } from '@/lib/api.leads';
import { leadsApi } from '@/lib/api.leads';
import StageBadge from './StageBadge';
import PipelineProgress from './PipelineProgress';
import ActivityTimeline from './ActivityTimeline';
import StageTransitionModal from './StageTransitionModal';

// Avatar helper
const AVATAR_COLORS = [
  'bg-purple-500','bg-blue-500','bg-cyan-500','bg-amber-500',
  'bg-pink-500','bg-emerald-500','bg-indigo-500','bg-rose-500',
];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

interface Props {
  lead: Lead;
  onLeadUpdated: (lead: Lead) => void;
}

export default function LeadDetailPanel({ lead, onLeadUpdated }: Props) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [stageModalOpen, setStageModalOpen] = useState(false);

  useEffect(() => {
    setTimelineLoading(true);
    leadsApi.timeline(lead.id).then(setTimeline).finally(() => setTimelineLoading(false));
  }, [lead.id]);

  const handleStageTransition = async (toStage: string, note?: string) => {
    const updated = await leadsApi.transitionStage(lead.id, toStage as any, note);
    onLeadUpdated(updated);
    // Refresh timeline
    const entries = await leadsApi.timeline(lead.id);
    setTimeline(entries);
  };

  const infoFields = [
    { label: 'PHONE',      value: lead.phone },
    { label: 'EMAIL',      value: lead.email ?? '—' },
    { label: 'SOURCE',     value: lead.source ?? '—' },
    { label: 'DEAL VALUE', value: lead.deal_value != null ? `${lead.deal_currency} ${lead.deal_value.toLocaleString()}` : '—' },
    { label: 'LOCATION',   value: lead.location ?? '—' },
    { label: 'OWNER',      value: lead.owner_id ? lead.owner_id.slice(0, 8) + '…' : '—' },
  ];

  return (
    <div className="w-80 bg-white rounded-xl border border-slate-200 flex flex-col shrink-0 overflow-hidden">

      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0', avatarColor(lead.name))}>
              {initials(lead.name)}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{lead.name}</p>
              <p className="text-[10px] text-slate-400">
                {lead.job_title ?? 'Contact'}{lead.company ? ` · ${lead.company}` : ''}
              </p>
            </div>
          </div>
          <button><MoreHorizontal className="w-4 h-4 text-slate-400" /></button>
        </div>

        {/* Stage + tags row */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <StageBadge stage={lead.lifecycle_stage} />
          {lead.dnd_flag && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">DND</span>
          )}
          {lead.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button className="flex items-center justify-center gap-1.5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold">
            <Phone className="w-3.5 h-3.5" /> Call
          </button>
          <button className="flex items-center justify-center gap-1.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium">
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
          <button className="flex items-center justify-center gap-1.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium">
            <MessageSquare className="w-3.5 h-3.5" /> WA
          </button>
        </div>

        {/* Move stage button */}
        {!lead.dnd_flag && (
          <button
            onClick={() => setStageModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium"
          >
            Move stage <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Contact info */}
      <div className="p-4 border-b border-slate-100">
        <div className="grid grid-cols-2 gap-3 text-xs">
          {infoFields.map((d) => (
            <div key={d.label}>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{d.label}</p>
              <p className="font-medium text-slate-800 mt-0.5 truncate">{d.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up */}
      {lead.next_followup_at && (
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Follow-up</p>
            <p className="text-xs font-medium text-slate-800">
              {new Date(lead.next_followup_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      )}

      {/* Pipeline progress */}
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-700 mb-3">Pipeline progress</p>
        <PipelineProgress currentStage={lead.lifecycle_stage} />
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline items={timeline} loading={timelineLoading} />

      {/* Stage Transition Modal */}
      {stageModalOpen && (
        <StageTransitionModal
          lead={lead}
          onClose={() => setStageModalOpen(false)}
          onConfirm={handleStageTransition}
        />
      )}
    </div>
  );
}
