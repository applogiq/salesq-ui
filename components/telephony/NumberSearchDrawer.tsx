'use client';

import { useState } from 'react';
import { X, Search, Loader2, Phone, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { phoneApi } from '@/lib/api';
import type { PhoneNumber, NumberSearchResult } from '@/lib/api.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onPurchased: (n: PhoneNumber) => void;
}

const COUNTRIES = [
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'CA', label: '🇨🇦 Canada' },
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'DE', label: '🇩🇪 Germany' },
  { code: 'IN', label: '🇮🇳 India' },
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'SG', label: '🇸🇬 Singapore' },
];

interface BalanceInfo {
  available_credit: number;
  balance: number;
  currency: string;
}

export default function NumberSearchDrawer({ open, onClose, onPurchased }: Props) {
  const [country, setCountry] = useState('US');
  const [numType, setNumType] = useState<'local' | 'toll_free'>('local');
  const [pattern, setPattern] = useState('');
  const [results, setResults] = useState<NumberSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmNum, setConfirmNum] = useState<NumberSearchResult | null>(null);
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  if (!open) return null;

  const doSearch = async () => {
    setSearching(true);
    setError(null);
    setResults([]);
    try {
      const r = await phoneApi.search({
        country,
        number_type: numType,
        contains: pattern.trim() || undefined,
        limit: 10,
      });
      setResults(r);
      if (r.length === 0) setError('No numbers found matching your criteria.');
    } catch (e: any) {
      setError(e?.detail ?? 'Search failed. Check your Telnyx API key.');
    } finally {
      setSearching(false);
    }
  };

  // Step 1: open confirmation modal and fetch balance
  const openConfirm = async (num: NumberSearchResult) => {
    setConfirmNum(num);
    setBalanceInfo(null);
    setBalanceLoading(true);
    try {
      const b = await phoneApi.balance();
      setBalanceInfo(b);
    } catch {
      // balance fetch failure is non-fatal — modal still shows without balance
      setBalanceInfo(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Step 2: confirmed — actually purchase
  const confirmPurchase = async () => {
    if (!confirmNum) return;
    const num = confirmNum;
    setConfirmNum(null);
    setBalanceInfo(null);
    setPurchasing(true);
    setError(null);
    try {
      const bought = await phoneApi.purchase({
        number: num.number,
        number_type: num.number_type,
      });
      onPurchased(bought);
      setResults(r => r.filter(x => x.number !== num.number));
    } catch (e: any) {
      setError(e?.detail ?? 'Purchase failed.');
    } finally {
      setPurchasing(false);
    }
  };

  const afterBalance = balanceInfo
    ? balanceInfo.available_credit - (confirmNum?.monthly_cost_usd ?? 0)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={() => { if (!confirmNum) onClose(); }}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col bg-white border-l border-slate-200 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Phone size={15} className="text-cyan-500" />
            <span className="text-sm font-semibold text-slate-800">Buy a Phone Number</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Country */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Country
            </label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Number Type
            </label>
            <div className="flex gap-2">
              {(['local', 'toll_free'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setNumType(t)}
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                    numType === t
                      ? 'bg-cyan-500 text-white border-cyan-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'
                  }`}
                >
                  {t === 'local' ? 'Local DID' : 'Toll-Free'}
                </button>
              ))}
            </div>
          </div>

          {/* Pattern */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Pattern (optional)
            </label>
            <input
              type="text"
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              placeholder="e.g. 555"
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              onKeyDown={e => e.key === 'Enter' && doSearch()}
            />
          </div>

          {/* Search button */}
          <button
            onClick={doSearch}
            disabled={searching}
            className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
          >
            {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            {searching ? 'Searching…' : 'Search Numbers'}
          </button>

          {/* Error */}
          {error && (
            <p className="text-[11px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertCircle size={12} className="shrink-0" />
              {error}
            </p>
          )}

          {/* Purchasing overlay */}
          {purchasing && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-cyan-600 font-medium">
              <Loader2 size={13} className="animate-spin" />
              Processing purchase…
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                  Available Numbers
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {results.map(num => (
                  <div
                    key={num.number}
                    className="flex items-center justify-between px-3 py-2 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-800">{num.number}</p>
                      <p className="text-[10px] text-slate-400">
                        {num.region ?? num.country_code} · ${num.monthly_cost_usd?.toFixed(2)}/mo
                      </p>
                    </div>
                    <button
                      onClick={() => openConfirm(num)}
                      disabled={purchasing}
                      className="flex items-center gap-1 text-[10px] font-semibold bg-cyan-50 hover:bg-cyan-100 text-cyan-600 border border-cyan-200 rounded px-2 py-1 transition-colors disabled:opacity-50"
                    >
                      Buy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Purchase Confirmation Modal ─────────────────────────────────────── */}
      {confirmNum && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Modal backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmNum(null)}
          />

          {/* Modal card */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
                <DollarSign size={16} className="text-cyan-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Confirm Purchase</p>
                <p className="text-[10px] text-slate-400">Review cost before completing</p>
              </div>
              <button
                onClick={() => setConfirmNum(null)}
                className="ml-auto p-1 rounded hover:bg-slate-100 text-slate-400"
              >
                <X size={14} />
              </button>
            </div>

            {/* Number */}
            <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Phone Number</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{confirmNum.number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Type</span>
                <span className="text-xs text-slate-700 capitalize">{confirmNum.number_type === 'toll_free' ? 'Toll-Free' : 'Local DID'}</span>
              </div>
              {confirmNum.region && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Region</span>
                  <span className="text-xs text-slate-700">{confirmNum.region}</span>
                </div>
              )}
            </div>

            {/* Cost & Balance */}
            <div className="space-y-2">
              {/* Monthly cost */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-600">Monthly cost</span>
                <span className="text-sm font-bold text-slate-900">
                  ${confirmNum.monthly_cost_usd?.toFixed(2) ?? '—'} / mo
                </span>
              </div>

              {/* Current balance */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-600">Available credit</span>
                {balanceLoading ? (
                  <Loader2 size={12} className="animate-spin text-slate-400" />
                ) : balanceInfo != null ? (
                  <span className="text-sm font-semibold text-slate-900">
                    ${balanceInfo.available_credit.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">unavailable</span>
                )}
              </div>

              {/* Balance after purchase */}
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-600">Balance after purchase</span>
                {balanceLoading ? (
                  <Loader2 size={12} className="animate-spin text-slate-400" />
                ) : afterBalance != null ? (
                  <span className={`text-sm font-bold ${afterBalance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    ${afterBalance.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">—</span>
                )}
              </div>
            </div>

            {/* Insufficient funds warning */}
            {afterBalance != null && afterBalance < 0 && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-red-600 font-medium">
                  Insufficient credit. Please top up your Telnyx account before purchasing.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmNum(null)}
                className="flex-1 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                disabled={afterBalance != null && afterBalance < 0}
                className="flex-1 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={12} />
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
