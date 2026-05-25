'use client';

import { ChevronDown, MoreHorizontal, Search, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lead } from '@/lib/api.leads';
import StageBadge from './StageBadge';

// ── Avatar helpers ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-purple-500', 'bg-blue-500', 'bg-cyan-500', 'bg-amber-500',
  'bg-pink-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-rose-500',
  'bg-teal-500', 'bg-orange-400',
];

function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Score bar ──────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 85 ? 'bg-green-500' :
    score >= 70 ? 'bg-cyan-500' :
    score >= 55 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="font-semibold text-slate-700">{score}</span>
    </div>
  );
}

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Filter bar ────────────────────────────────────────────────────────────────

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  duplicateCount: number;
  onShowDuplicates: () => void;
}

export function LeadsFilterBar({
  search, onSearch, duplicateCount, onShowDuplicates,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 flex-wrap">
      <div className="relative flex-1 max-w-48">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Quick filter..."
          className="pl-7 pr-3 py-1 text-xs border border-slate-200 rounded-lg w-full bg-slate-50 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        />
      </div>

      {[
        { label: 'All campaigns' },
        { label: 'All owners' },
        { label: 'All tags' },
        { label: 'Last 30 days' },
      ].map((f) => (
        <button
          key={f.label}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
        >
          {f.label} <ChevronDown className="w-3 h-3 ml-0.5" />
        </button>
      ))}

      {duplicateCount > 0 && (
        <button
          onClick={onShowDuplicates}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] border border-amber-200 bg-amber-50 rounded-lg text-amber-700"
        >
          <AlertTriangle className="w-3 h-3" />
          {duplicateCount} duplicates
        </button>
      )}

      <button className="ml-auto">
        <MoreHorizontal className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

interface TableProps {
  leads: Lead[];
  selectedId: string | null;
  onSelect: (lead: Lead) => void;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  loading?: boolean;
}

export default function LeadsTable({
  leads, selectedId, onSelect, total, page, pageSize, onPageChange, loading,
}: TableProps) {
  const totalPages = Math.ceil(total / pageSize);
  const showing = Math.min(page * pageSize, total);

  return (
    <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col min-w-0 overflow-hidden">

      {/* Table body */}
      <div className="overflow-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-xs text-slate-400">
            Loading leads…
          </div>
        ) : leads.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-slate-400">
            No leads found
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                <th className="w-8 px-4 py-2">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left px-3 py-2">Lead</th>
                <th className="text-left px-3 py-2">Stage</th>
                <th className="text-left px-3 py-2">Owner</th>
                <th className="text-left px-3 py-2">Value</th>
                <th className="text-left px-3 py-2">Last Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => onSelect(lead)}
                  className={cn(
                    'hover:bg-slate-50 cursor-pointer transition-colors',
                    selectedId === lead.id && 'bg-cyan-50/60',
                  )}
                >
                  <td className="px-4 py-2.5">
                    <input type="checkbox" className="rounded" checked={selectedId === lead.id} readOnly />
                  </td>

                  {/* Lead name + company */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0',
                        avatarColor(lead.name),
                      )}>
                        {initials(lead.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{lead.name}</p>
                        <p className="text-[10px] text-slate-400">{lead.company ?? '—'}</p>
                      </div>
                      {lead.dnd_flag && (
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-600 uppercase tracking-wide">
                          DND
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Stage */}
                  <td className="px-3 py-2.5">
                    <StageBadge stage={lead.lifecycle_stage} />
                  </td>

                  {/* Owner avatar */}
                  <td className="px-3 py-2.5">
                    {lead.owner_id ? (
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold',
                        avatarColor(lead.owner_id),
                      )}>
                        {lead.owner_id.slice(0, 1).toUpperCase()}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Deal value */}
                  <td className="px-3 py-2.5 font-semibold text-slate-700">
                    {lead.deal_value != null
                      ? `${lead.deal_currency} ${lead.deal_value.toLocaleString()}`
                      : '—'}
                  </td>

                  {/* Last contact */}
                  <td className="px-3 py-2.5 text-slate-400">
                    {relativeTime(lead.last_contacted_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 text-xs text-slate-500">
        <span>Showing {showing.toLocaleString()} of {total.toLocaleString()} leads</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-lg disabled:opacity-40"
          >‹</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  'w-7 h-7 rounded-lg text-xs font-medium',
                  p === page ? 'bg-cyan-500 text-white' : 'hover:bg-slate-100 text-slate-500',
                )}
              >
                {p}
              </button>
            );
          })}
          {totalPages > 5 && <span className="px-1 text-slate-400">…</span>}
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-lg disabled:opacity-40"
          >›</button>
        </div>
      </div>
    </div>
  );
}
