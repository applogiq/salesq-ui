'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Phone, Mail, MapPin, Building, DollarSign, Calendar,
  ArrowLeft, Edit2, Loader2, AlertCircle, Trash2, Send,
} from 'lucide-react';
import { leadsApi, type Lead, type LeadNote, type LeadCallSummary, type TimelineEntry } from '@/lib/api.leads';
import { callAnalysisApi, leadsAiApi } from '@/lib/api';
import type { CallAnalysisOut, LeadAiScoreOut } from '@/lib/api.types';
import StageBadge from '@/app/leads/components/StageBadge';
import ActivityTimeline from '@/app/leads/components/ActivityTimeline';
import StageTransitionModal from '@/app/leads/components/StageTransitionModal';
import LeadMessagesPanel from '@/app/leads/components/LeadMessagesPanel';
import { useCallContext } from '@/context/CallContext';
import { useSoftphone } from '@/hooks/useSoftphone';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(secs: number | null): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LeadWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { activeCalls } = useCallContext();
  const softphone = useSoftphone();

  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [calls, setCalls] = useState<LeadCallSummary[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noteBody, setNoteBody] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const [showStageModal, setShowStageModal] = useState(false);
  const [followupDate, setFollowupDate] = useState('');

  // Middle column tab
  const [midTab, setMidTab] = useState<'notes' | 'messages'>('notes');

  // Phase 7 — AI score + per-call analysis
  const [aiScore, setAiScore] = useState<LeadAiScoreOut | null>(null);
  const [callAnalyses, setCallAnalyses] = useState<Map<string, CallAnalysisOut>>(new Map());

  // Detect live call on this lead
  const liveCall = lead
    ? Array.from(activeCalls.values()).find(c => c.leadId === lead.id)
    : null;

  // ── Load workspace ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // Try composite workspace endpoint first; fallback to individual calls
      try {
        const ws = await leadsApi.workspace(id);
        setLead(ws.lead);
        setNotes(ws.notes);
        setCalls(ws.calls);
        setTimeline(ws.timeline);
      } catch {
        // fallback
        const [l, n, t] = await Promise.all([
          leadsApi.get(id),
          leadsApi.listNotes(id),
          leadsApi.timeline(id),
        ]);
        setLead(l);
        setNotes(n);
        setTimeline(t);
      }
    } catch (e: unknown) {
      setError((e as { detail?: string })?.detail ?? 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Fetch AI score and per-call analyses after lead + calls are loaded
  useEffect(() => {
    if (!id) return;
    leadsAiApi.getScore(id).then(setAiScore).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!calls.length) return;
    // Fire parallel analysis fetches for the first 5 completed calls
    const completedCalls = calls.filter(c => c.status === 'completed').slice(0, 5);
    completedCalls.forEach(c => {
      callAnalysisApi.get(c.id).then(analysis => {
        setCallAnalyses(prev => new Map(prev).set(c.id, analysis));
      }).catch(() => {}); // 404 = not analyzed yet; silently skip
    });
  }, [calls]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const addNote = async () => {
    if (!noteBody.trim() || !id) return;
    setSavingNote(true);
    try {
      const note = await leadsApi.createNote(id, noteBody.trim());
      setNotes(prev => [note, ...prev]);
      setNoteBody('');
      // also refresh timeline
      const t = await leadsApi.timeline(id);
      setTimeline(t);
    } catch {}
    setSavingNote(false);
  };

  const deleteNote = async (noteId: string) => {
    if (!id) return;
    await leadsApi.deleteNote(id, noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const handleStageTransition = async (toStage: string, note?: string) => {
    if (!id) return;
    const updated = await leadsApi.transitionStage(id, toStage as Lead['lifecycle_stage'], note);
    setLead(updated);
    const t = await leadsApi.timeline(id);
    setTimeline(t);
  };

  const handleFollowup = async () => {
    if (!id || !followupDate) return;
    const updated = await leadsApi.scheduleFollowup(id, followupDate);
    setLead(updated);
    setFollowupDate('');
  };

  const handleCall = () => {
    if (!lead) return;
    softphone.dial(lead.phone, lead.id, '');
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }
  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p>{error ?? 'Lead not found'}</p>
        <button onClick={() => router.push('/leads')} className="text-cyan-500 text-sm hover:underline">
          ← Back to Leads
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <button
          onClick={() => router.push('/leads')}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-bold text-slate-900 truncate">{lead.name}</h1>
            <StageBadge stage={lead.lifecycle_stage} />
            {lead.dnd_flag && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold">DND</span>
            )}
            {liveCall && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold animate-pulse">
                ● Live Call
              </span>
            )}
            {/* Phase 7 — AI score badge */}
            {aiScore?.ai_score != null && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                aiScore.priority_rank === 'hot'     ? 'bg-red-100 text-red-700' :
                aiScore.priority_rank === 'warm'    ? 'bg-orange-100 text-orange-700' :
                aiScore.priority_rank === 'cold'    ? 'bg-blue-100 text-blue-700' :
                                                      'bg-slate-100 text-slate-500'
              }`}
                title={`AI Score: ${aiScore.ai_score}/100 · ${aiScore.priority_rank}`}
              >
                AI {aiScore.ai_score} · {aiScore.priority_rank}
              </span>
            )}
          </div>
          {lead.company && (
            <p className="text-xs text-slate-400 mt-0.5">{lead.company} · {lead.job_title}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStageModal(true)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <Edit2 className="w-3 h-3 inline mr-1" />
            Update Stage
          </button>
          <button
            onClick={handleCall}
            disabled={lead.dnd_flag || softphone.isCalling}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            {softphone.isCalling && softphone.callId ? 'In Call' : 'Call'}
          </button>
        </div>
      </div>

      {/* ── Three-column workspace ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left col: Contact card + call history + follow-up ──── */}
        <div className="w-72 shrink-0 border-r border-slate-200 overflow-y-auto bg-slate-50/50 p-5 space-y-5">

          {/* Contact card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Contact</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href={`tel:${lead.phone}`} className="hover:text-cyan-600">{lead.phone}</a>
              </div>
              {lead.email && (
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={`mailto:${lead.email}`} className="hover:text-cyan-600 truncate">{lead.email}</a>
                </div>
              )}
              {lead.location && (
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{lead.location}</span>
                </div>
              )}
              {lead.company && (
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{lead.company}</span>
                </div>
              )}
              {lead.deal_value != null && (
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{lead.deal_currency} {Number(lead.deal_value).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Follow-up scheduler */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Schedule Follow-up</p>
            {lead.next_followup_at && (
              <p className="text-xs text-cyan-700 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(lead.next_followup_at).toLocaleString()}
              </p>
            )}
            <input
              type="datetime-local"
              value={followupDate}
              onChange={e => setFollowupDate(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <button
              onClick={handleFollowup}
              disabled={!followupDate}
              className="w-full py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Set Follow-up
            </button>
          </div>

          {/* Call history summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Call History</p>
            {calls.length === 0 ? (
              <p className="text-xs text-slate-400">No calls yet</p>
            ) : (
              <div className="space-y-2">
                {calls.slice(0, 5).map(c => {
                  const analysis = callAnalyses.get(c.id);
                  return (
                    <div key={c.id} className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-medium ${c.status === 'completed' ? 'text-green-600' : c.status === 'failed' ? 'text-red-500' : 'text-slate-600'}`}>
                            {c.status}
                          </span>
                          {c.outcome && <span className="text-slate-400">· {c.outcome}</span>}
                          {/* Sentiment chip */}
                          {analysis?.sentiment && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              analysis.sentiment === 'positive' ? 'bg-green-50 text-green-700' :
                              analysis.sentiment === 'negative' ? 'bg-red-50 text-red-600' :
                              'bg-slate-100 text-slate-500'
                            }`}>{analysis.sentiment}</span>
                          )}
                          {/* Call score chip */}
                          {analysis?.call_score != null && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700">
                              {analysis.call_score}/100
                            </span>
                          )}
                        </div>
                        <div className="text-right text-slate-400 shrink-0">
                          <p>{formatDuration(c.duration_seconds)}</p>
                          <p className="text-[10px]">{relativeTime(c.created_at)}</p>
                        </div>
                      </div>
                      {analysis?.summary && (
                        <p className="text-[10px] text-slate-400 truncate" title={analysis.summary}>
                          {analysis.summary}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Middle col: Notes / Messages ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="px-6 py-3 border-b border-slate-200 bg-white shrink-0 flex items-center gap-3">
            <button
              onClick={() => setMidTab('notes')}
              className={`text-xs font-semibold pb-0.5 border-b-2 transition-colors ${
                midTab === 'notes' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >Notes</button>
            <button
              onClick={() => setMidTab('messages')}
              className={`text-xs font-semibold pb-0.5 border-b-2 transition-colors ${
                midTab === 'messages' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >Messages</button>
          </div>

          {/* Messages tab */}
          {midTab === 'messages' && <LeadMessagesPanel leadId={id} />}

          {/* Notes tab */}
          {midTab === 'notes' && <>
          {/* Note input */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
            <textarea
              value={noteBody}
              onChange={e => setNoteBody(e.target.value)}
              placeholder="Add a note about this lead…"
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400 bg-white placeholder-slate-400"
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) addNote(); }}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-slate-400">Ctrl+Enter to save</span>
              <button
                onClick={addNote}
                disabled={!noteBody.trim() || savingNote}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Save Note
              </button>
            </div>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {notes.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm">No notes yet</p>
                <p className="text-xs mt-1">Add the first note above</p>
              </div>
            ) : (
              notes.map(note => (
                <div key={note.id} className="bg-white rounded-xl border border-slate-200 p-4 group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-700 leading-relaxed flex-1">{note.body}</p>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">{relativeTime(note.created_at)}</p>
                </div>
              ))
            )}
          </div>
          </>}
        </div>

        {/* ── Right col: Activity Timeline ─────────────────────────────────── */}
        <div className="w-72 shrink-0 border-l border-slate-200 overflow-y-auto">
          <ActivityTimeline
            items={timeline}
            totalCount={timeline.length}
          />
        </div>
      </div>

      {/* ── Stage transition modal ─────────────────────────────────────────── */}
      {showStageModal && (
        <StageTransitionModal
          lead={lead}
          onClose={() => setShowStageModal(false)}
          onConfirm={handleStageTransition}
        />
      )}
    </div>
  );
}
