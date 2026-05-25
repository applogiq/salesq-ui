'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { leadsApi, type LeadCreate } from '@/lib/api.leads';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddLeadModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<Partial<LeadCreate>>({
    lifecycle_stage: 'new',
    deal_currency: 'USD',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof LeadCreate, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { setError('Name and phone are required.'); return; }
    setLoading(true);
    setError(null);
    try {
      await leadsApi.create(form as LeadCreate);
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e?.detail ?? 'Failed to create lead.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-400';
  const labelCls = 'text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl border border-slate-200 w-[480px] p-6 shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-slate-900">Add Lead</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input required value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="John Smith" />
            </div>
            <div>
              <label className={labelCls}>Phone *</label>
              <input required value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} className={inputCls} placeholder="+1 555 000 0000" />
            </div>
          </div>

          {/* Email + Company */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} className={inputCls} placeholder="john@acme.com" />
            </div>
            <div>
              <label className={labelCls}>Company</label>
              <input value={form.company ?? ''} onChange={(e) => set('company', e.target.value)} className={inputCls} placeholder="Acme Corp" />
            </div>
          </div>

          {/* Job title + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Job Title</label>
              <input value={form.job_title ?? ''} onChange={(e) => set('job_title', e.target.value)} className={inputCls} placeholder="VP Sales" />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} className={inputCls} placeholder="New York, USA" />
            </div>
          </div>

          {/* Deal value + Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Deal Value (USD)</label>
              <input type="number" min="0" value={form.deal_value ?? ''} onChange={(e) => set('deal_value', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Initial Stage</label>
              <select value={form.lifecycle_stage} onChange={(e) => set('lifecycle_stage', e.target.value as any)} className={inputCls}>
                {['new','attempted','connected','interested','qualified'].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} className={`${inputCls} resize-none h-16`} placeholder="Any context about this lead…" />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold disabled:opacity-50">
              {loading ? 'Creating…' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
