'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronRight, Loader2, Mic, User } from 'lucide-react';
import { transcriptsApi, campaignsApi } from '@/lib/api';
import type { TranscriptSearchResult, CampaignOut } from '@/lib/api.types';

function msToTime(ms: number): string {
  const m = String(Math.floor(ms / 60000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  return `${m}:${s}`;
}

export default function TranscriptSearchPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [speaker, setSpeaker] = useState<'agent' | 'contact' | ''>('');
  const [results, setResults] = useState<TranscriptSearchResult[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    campaignsApi.list().then(setCampaigns).catch(() => {});
  }, []);

  async function doSearch(newOffset = 0) {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await transcriptsApi.search({
        q: q.trim(),
        campaign_id: campaignId || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        speaker: speaker || undefined,
        limit: LIMIT,
        offset: newOffset,
      });
      if (newOffset === 0) {
        setResults(res);
      } else {
        setResults((prev) => [...prev, ...res]);
      }
      setOffset(newOffset);
      setSearched(true);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') doSearch(0);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Transcript Search</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Full-text search across all call transcripts
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Search transcripts… e.g. "pricing" or "not interested"'
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <button
          onClick={() => doSearch(0)}
          disabled={loading || !q.trim()}
          className="px-4 py-2.5 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
        >
          <option value="">All Campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={speaker}
          onChange={(e) => setSpeaker(e.target.value as '' | 'agent' | 'contact')}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
        >
          <option value="">Both Speakers</option>
          <option value="agent">Agent</option>
          <option value="contact">Contact</option>
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Results */}
      {searched && results.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-400">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>No transcripts found for "{q}"</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 font-medium">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
          {results.map((r) => (
            <div
              key={r.call_id}
              onClick={() => router.push(`/call-management/${r.call_id}/transcript`)}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-cyan-300 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono text-slate-400">{r.call_id.slice(0, 8)}…</span>
                    {r.started_at && (
                      <span className="text-xs text-slate-400">
                        {new Date(r.started_at).toLocaleDateString()}
                      </span>
                    )}
                    {r.duration_seconds && (
                      <span className="text-xs text-slate-400">
                        {Math.floor(r.duration_seconds / 60)}m {r.duration_seconds % 60}s
                      </span>
                    )}
                    {r.transcription_language && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                        {r.transcription_language}
                      </span>
                    )}
                  </div>

                  {/* Snippet */}
                  {r.snippet && (
                    <p className="text-sm text-slate-700 leading-relaxed mb-2 italic">
                      "{r.snippet}"
                    </p>
                  )}

                  {/* Matched segments preview */}
                  {r.matched_segments.slice(0, 2).map((seg, i) => (
                    <div key={i} className="flex items-start gap-2 mt-1.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 ${
                          seg.speaker === 'contact' ? 'bg-purple-400' : 'bg-cyan-400'
                        }`}
                      >
                        {seg.speaker === 'contact' ? (
                          <User className="w-3 h-3" />
                        ) : (
                          <Mic className="w-3 h-3" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <span className="text-slate-400 mr-1">{msToTime(seg.timestamp)}</span>
                        {seg.text}
                      </p>
                    </div>
                  ))}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
              </div>
            </div>
          ))}

          {results.length === LIMIT + offset && (
            <button
              onClick={() => doSearch(offset + LIMIT)}
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
