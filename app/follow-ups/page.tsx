'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, ChevronRight, Search, Filter, RefreshCw } from 'lucide-react';
import { leadsApi, type Lead } from '@/lib/api.leads';
import { cn } from '@/lib/utils';

const STAGE_COLORS: Record<string, string> = {
  new:           'bg-slate-100 text-slate-600',
  attempted:     'bg-orange-100 text-orange-700',
  connected:     'bg-blue-100 text-blue-700',
  interested:    'bg-cyan-100 text-cyan-700',
  qualified:     'bg-green-100 text-green-700',
  proposal_sent: 'bg-purple-100 text-purple-700',
  negotiation:   'bg-amber-100 text-amber-700',
  converted:     'bg-emerald-100 text-emerald-700',
  lost:          'bg-red-100 text-red-700',
  dnd:           'bg-rose-100 text-rose-700',
};

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

function formatFollowUp(iso: string): { label: string; urgent: boolean } {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMs < 0) return { label: 'Overdue', urgent: true };
  if (diffMin < 60) return { label: `In ${diffMin}m`, urgent: diffMin < 30 };
  if (diffHr < 24) return { label: `In ${diffHr}h`, urgent: diffHr < 2 };
  if (diffDay === 1) return { label: 'Tomorrow', urgent: false };
  return {
    label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    urgent: false,
  };
}

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      // Fetch leads that have a follow-up scheduled, sorted by follow-up date
      const data = await leadsApi.list({
        sort: 'next_followup_at',
        order: 'asc',
        page: 1,
        page_size: 100,
        ...(search ? { search } : {}),
      });
      // Filter to only leads with follow-up set
      const withFollowUp = data.items.filter((l) => l.next_followup_at);
      setLeads(withFollowUp);
      setTotal(withFollowUp.length);
    } catch {
      setLeads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [search]);

  const overdue = leads.filter((l) => l.next_followup_at && new Date(l.next_followup_at) < new Date());
  const upcoming = leads.filter((l) => l.next_followup_at && new Date(l.next_followup_at) >= new Date());

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Follow-ups</h1>
          <p className="text-xs text-slate-500">
            {total} scheduled · {overdue.length} overdue
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads…"
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>
        <button
          onClick={fetchFollowUps}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex-1 overflow-auto space-y-4 min-h-0">

        {/* Overdue */}
        {overdue.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              Overdue ({overdue.length})
            </h2>
            <div className="bg-white rounded-xl border border-red-200 overflow-hidden divide-y divide-slate-50">
              {overdue.map((lead) => (
                <FollowUpRow key={lead.id} lead={lead} onRefresh={fetchFollowUps} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : upcoming.length === 0 && overdue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Calendar className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-500">No follow-ups scheduled</p>
            <p className="text-xs text-slate-400 mt-1">Set follow-up dates from the Leads page</p>
          </div>
        ) : (
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Upcoming ({upcoming.length})
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-50">
              {upcoming.map((lead) => (
                <FollowUpRow key={lead.id} lead={lead} onRefresh={fetchFollowUps} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function FollowUpRow({ lead, onRefresh }: { lead: Lead; onRefresh: () => void }) {
  const fu = lead.next_followup_at ? formatFollowUp(lead.next_followup_at) : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
      {/* Avatar */}
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', avatarColor(lead.name))}>
        {initials(lead.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800 truncate">{lead.name}</p>
          {lead.dnd_flag && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 uppercase">DND</span>
          )}
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', STAGE_COLORS[lead.lifecycle_stage] ?? 'bg-slate-100 text-slate-600')}>
            {lead.lifecycle_stage.replace('_', ' ')}
          </span>
        </div>
        <p className="text-xs text-slate-400 truncate">
          {lead.company ?? lead.phone} {lead.notes ? `· ${lead.notes.slice(0, 50)}` : ''}
        </p>
      </div>

      {/* Follow-up time */}
      {fu && (
        <div className={cn('flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0', fu.urgent ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600')}>
          <Clock className="w-3 h-3" />
          {fu.label}
        </div>
      )}

      {/* Call button */}
      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold shrink-0">
        <Phone className="w-3 h-3" /> Call
      </button>
    </div>
  );
}
