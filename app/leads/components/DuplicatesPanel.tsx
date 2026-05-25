'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { leadsApi, type Lead } from '@/lib/api.leads';

// Avatar helpers
const COLORS = ['bg-purple-500','bg-blue-500','bg-cyan-500','bg-amber-500','bg-emerald-500'];
const avatarColor = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xff; return COLORS[h % COLORS.length]; };
const initials = (n: string) => { const p = n.trim().split(/\s+/); return p.length === 1 ? p[0].slice(0,2).toUpperCase() : (p[0][0]+p[p.length-1][0]).toUpperCase(); };

interface Props {
  onClose: () => void;
  onResolved: () => void;   // tells parent to refresh lead list
}

export default function DuplicatesPanel({ onClose, onResolved }: Props) {
  const [pairs, setPairs] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leadsApi.duplicates().then(setPairs).finally(() => setLoading(false));
  }, []);

  const handleMerge = async (dupe: Lead) => {
    if (!dupe.duplicate_of_id) return;
    await leadsApi.merge(dupe.id, dupe.duplicate_of_id);
    setPairs((p) => p.filter((x) => x.id !== dupe.id));
    onResolved();
  };

  const handleIgnore = async (dupe: Lead) => {
    await leadsApi.ignoreDuplicate(dupe.id);
    setPairs((p) => p.filter((x) => x.id !== dupe.id));
    onResolved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-end z-50 p-4">
      <div className="w-96 bg-white rounded-xl border border-slate-200 flex flex-col max-h-[80vh] shadow-xl">

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <p className="text-xs font-bold text-slate-900">
            Duplicate Review
            {pairs.length > 0 && (
              <span className="ml-1.5 text-amber-600">({pairs.length})</span>
            )}
          </p>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        {/* Body */}
        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-24 text-xs text-slate-400">Loading…</div>
          ) : pairs.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-xs text-slate-400">No duplicates to review 🎉</div>
          ) : (
            pairs.map((dupe) => (
              <div key={dupe.id} className="px-4 py-3 border-b border-slate-50 last:border-0">

                {/* Incoming lead (the dupe) */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', avatarColor(dupe.name))}>
                    {initials(dupe.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{dupe.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{dupe.phone}{dupe.company ? ` · ${dupe.company}` : ''}</p>
                  </div>
                  <span className="text-[9px] bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded font-medium shrink-0">IMPORT</span>
                </div>

                {/* Match indicator */}
                <div className="flex items-center gap-1 mb-2">
                  <div className="h-px flex-1 bg-amber-200" />
                  <span className="text-[9px] text-amber-600 font-semibold px-1.5">matched on phone/email</span>
                  <div className="h-px flex-1 bg-amber-200" />
                </div>

                {/* Existing lead */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', avatarColor(dupe.duplicate_of_id ?? 'x'))}>
                    ?
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500 truncate">Existing lead ID: {dupe.duplicate_of_id?.slice(0, 8)}…</p>
                  </div>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium shrink-0">EXISTING</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMerge(dupe)}
                    className="flex-1 py-1.5 text-[11px] bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold"
                  >
                    Merge into existing
                  </button>
                  <button
                    onClick={() => handleIgnore(dupe)}
                    className="flex-1 py-1.5 text-[11px] border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                  >
                    Keep both
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
