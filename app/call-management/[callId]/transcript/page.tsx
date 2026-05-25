'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, RefreshCw, Mic, User, Loader2 } from 'lucide-react';
import { transcriptsApi, recordingsApi, keywordMatchesApi } from '@/lib/api';
import { tokenStore } from '@/lib/api';
import type { TranscriptSegment, RecordingMeta, KeywordMatch } from '@/lib/api.types';

function msToTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function TranscriptPage() {
  const { callId } = useParams<{ callId: string }>();
  const router = useRouter();

  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [meta, setMeta] = useState<RecordingMeta | null>(null);
  const [matches, setMatches] = useState<KeywordMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!callId) return;
    Promise.all([
      transcriptsApi.get(callId),
      recordingsApi.getMeta(callId),
      keywordMatchesApi.list(callId),
    ])
      .then(([segs, m, kw]) => {
        setSegments(segs);
        setMeta(m);
        setMatches(kw);
      })
      .catch((e) => setError(e?.detail ?? 'Failed to load transcript'))
      .finally(() => setLoading(false));
  }, [callId]);

  const matchedSegmentIds = new Set(matches.map((m) => m.segment_id));

  function handleExport(format: 'json' | 'csv') {
    const token = tokenStore.getAccess();
    const url = `${transcriptsApi.exportUrl(callId, format)}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `transcript-${callId}.${format}`);
    // Add auth header via a fetch-based download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.click();
        URL.revokeObjectURL(blobUrl);
      });
  }

  async function handleReprocess() {
    try {
      await transcriptsApi.reprocess(callId);
      setError(null);
      setLoading(true);
      setTimeout(() => window.location.reload(), 2000);
    } catch (e: unknown) {
      setError((e as { detail?: string })?.detail ?? 'Failed to queue reprocessing');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading transcript…</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Call Transcript</h1>
            <p className="text-xs text-slate-400 font-mono">{callId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handleReprocess}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reprocess
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Audio player */}
      {meta?.signed_url && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recording</p>
          <audio controls src={meta.signed_url} className="w-full h-9" />
          {meta.recording_duration_ms && (
            <p className="text-xs text-slate-400 mt-1">
              Duration: {msToTime(meta.recording_duration_ms)}
              {meta.s3_expires_at && (
                <span className="ml-3">
                  Expires: {new Date(meta.s3_expires_at).toLocaleDateString()}
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Keyword matches summary */}
      {matches.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
            {matches.length} Keyword {matches.length === 1 ? 'Match' : 'Matches'} Detected
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(matches.map((m) => m.keyword_text))).map((kw) => (
              <span
                key={kw}
                className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-medium"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      {segments.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          {meta?.transcription_status === 'pending' || meta?.transcription_status === 'processing' ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p>Transcription in progress…</p>
            </div>
          ) : (
            <p>No transcript available for this call.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {segments.map((seg) => {
            const isMatch = matchedSegmentIds.has(seg.id);
            const segMatches = matches.filter((m) => m.segment_id === seg.id);
            return (
              <div
                key={seg.id}
                className={`flex items-start gap-4 p-4 rounded-xl ${
                  isMatch ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-100'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${
                    seg.speaker === 'contact' ? 'bg-purple-500' : 'bg-cyan-500'
                  }`}
                >
                  {seg.speaker === 'contact' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-700 capitalize">
                      {seg.speaker}
                    </span>
                    <span className="text-xs text-slate-400">{msToTime(seg.timestamp)}</span>
                    {segMatches.map((m) => (
                      <span
                        key={m.id}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700"
                      >
                        {m.keyword_text}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{seg.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
