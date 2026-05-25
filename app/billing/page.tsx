'use client';

import { useState } from 'react';
import { CreditCard, Download, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLAN = {
  name: 'Business',
  price: '$299',
  period: 'per month',
  seats: 25,
  usedSeats: 8,
  nextBilling: '2026-06-15',
  status: 'active',
};

const FEATURES = [
  'Up to 25 agent seats',
  'Unlimited outbound calls (usage billed separately)',
  'Predictive + Power + Preview dialler',
  'AI coaching & QA scoring',
  'CRM — unlimited leads',
  'CSV import (50,000 rows/batch)',
  'Telnyx telephony integration',
  'Priority support',
];

const USAGE = [
  { label: 'Minutes used',    value: 14280, limit: 25000, unit: 'min' },
  { label: 'Agent seats',     value: 8,     limit: 25,    unit: '' },
  { label: 'Leads in CRM',    value: 4210,  limit: null,  unit: '' },
  { label: 'SMS sent',        value: 380,   limit: 1000,  unit: '' },
];

const INVOICES = [
  { date: 'May 2026', amount: '$312.40', status: 'paid' },
  { date: 'Apr 2026', amount: '$298.80', status: 'paid' },
  { date: 'Mar 2026', amount: '$299.00', status: 'paid' },
  { date: 'Feb 2026', amount: '$299.00', status: 'paid' },
];

function UsageBar({ value, limit }: { value: number; limit: number | null }) {
  if (!limit) return <span className="text-xs text-slate-400">Unlimited</span>;
  const pct = Math.min(100, Math.round((value / limit) * 100));
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-cyan-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-slate-500 whitespace-nowrap">{pct}%</span>
    </div>
  );
}

export default function BillingPage() {
  const [tab, setTab] = useState<'overview' | 'invoices'>('overview');

  return (
    <div className="flex flex-col h-full gap-3">
      <div>
        <h1 className="text-base font-semibold text-slate-900">Billing</h1>
        <p className="text-xs text-slate-500">Manage your subscription, usage, and invoices</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(['overview', 'invoices'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 text-xs font-semibold rounded-md capitalize transition-all',
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
          {/* Plan card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4 h-fit">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Current Plan</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{PLAN.name}</p>
                <p className="text-sm text-slate-500">{PLAN.price} <span className="text-xs">{PLAN.period}</span></p>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Included features</p>
              <ul className="space-y-1.5">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
              <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="font-medium">Next billing: {new Date(PLAN.nextBilling).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-slate-400">Card ending •••• 4242</p>
              </div>
            </div>

            <button className="w-full py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
              Upgrade Plan
            </button>
          </div>

          {/* Usage */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 h-fit">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Usage This Month</h2>
            <div className="space-y-4">
              {USAGE.map((u) => (
                <div key={u.label}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-slate-700">{u.label}</p>
                    <p className="text-xs text-slate-500">
                      {u.value.toLocaleString()}{u.unit ? ' ' + u.unit : ''}
                      {u.limit ? ` / ${u.limit.toLocaleString()}${u.unit ? ' ' + u.unit : ''}` : ''}
                    </p>
                  </div>
                  <UsageBar value={u.value} limit={u.limit} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Invoice History</h2>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-4 py-2">Period</th>
                  <th className="text-left px-3 py-2">Amount</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {INVOICES.map((inv) => (
                  <tr key={inv.date} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{inv.date}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{inv.amount}</td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                        Paid
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700">
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
