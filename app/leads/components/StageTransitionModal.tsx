'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lead, LifecycleStage } from '@/lib/api.leads';
import { STAGE_LABELS } from './StageBadge';

// Only show valid forward/lateral transitions in the picker
// (state machine enforced on backend — this is UX-only pre-filter)
const ALLOWED_FROM: Record<string, LifecycleStage[]> = {
  new:           ['attempted', 'connected', 'interested', 'qualified', 'lost', 'dnd'],
  attempted:     ['connected', 'interested', 'lost', 'dnd'],
  connected:     ['interested', 'qualified', 'lost', 'dnd'],
  interested:    ['qualified', 'proposal_sent', 'lost', 'dnd'],
  qualified:     ['proposal_sent', 'negotiation', 'lost', 'dnd'],
  proposal_sent: ['negotiation', 'converted', 'lost', 'dnd'],
  negotiation:   ['converted', 'lost', 'dnd'],
  converted:     [],
  lost:          ['new'],
  dnd:           [],
};

interface Props {
  lead: Lead;
  onClose: () => void;
  onConfirm: (toStage: string, note?: string) => Promise<void>;
}

export default function StageTransitionModal({ lead, onClose, onConfirm }: Props) {
  const allowed = ALLOWED_FROM[lead.lifecycle_stage] ?? [];
  const [toStage, setToStage] = useState<LifecycleStage | ''>(allowed[0] ?? '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDnd = toStage === 'dnd';

  const handleConfirm = async () => {
    if (!toStage) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm(toStage, note.trim() || undefined);
      onClose();
    } catch (e: any) {
      setError(e?.detail ?? 'Transition failed — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl border border-slate-200 w-96 p-6 shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">Move Lead Stage</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        {/* From / To */}
        <p className="text-xs text-slate-500 mb-4">
          Current stage: <strong>{STAGE_LABELS[lead.lifecycle_stage] ?? lead.lifecycle_stage}</strong>
        </p>

        {allowed.length === 0 ? (
          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            No further transitions available for this stage.
          </p>
        ) : (
          <>
            {/* Stage picker */}
            <div className="mb-4">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                Move to
              </label>
              <div className="flex flex-wrap gap-2">
                {allowed.map((s) => (
                  <button
                    key={s}
                    onClick={() => setToStage(s)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      toStage === s
                        ? s === 'dnd'
                          ? 'bg-rose-500 text-white border-rose-500'
                          : s === 'lost'
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-cyan-500 text-white border-cyan-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {STAGE_LABELS[s] ?? s}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="mb-4">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add context for this stage change…"
                className="w-full text-xs border border-slate-200 rounded-lg p-3 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            {/* DND warning */}
            {isDnd && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200">
                <p className="text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  This lead will be blocked from all future dialing. Only an admin can remove DND.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs text-red-600 mb-3 bg-red-50 rounded-lg p-2">{error}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!toStage || loading}
                className={cn(
                  'px-5 py-1.5 text-xs text-white rounded-lg font-semibold disabled:opacity-50',
                  isDnd
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : toStage === 'lost'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-cyan-500 hover:bg-cyan-600',
                )}
              >
                {loading ? 'Moving…' : `Move to ${STAGE_LABELS[toStage] ?? toStage}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
