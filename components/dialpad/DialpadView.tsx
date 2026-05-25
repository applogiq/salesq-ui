'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  MicOff, Pause, Circle, Shuffle, Phone, X,
  CheckCircle, RotateCcw, ChevronRight, Mail,
  Globe, Building, Sparkles, FileText, StickyNote, Clock, ChevronDown,
  Loader2, AlertTriangle,
} from 'lucide-react';
import { useSoftphone } from '@/hooks/useSoftphone';
import { useCoachingSignals } from '@/hooks/useCoachingSignals';
import { transcriptsApi, recordingsApi } from '@/lib/api';
import type { TranscriptSegment } from '@/lib/api.types';

const PIPELINE_STAGES = ['New', 'Contacted', 'Demo', 'Proposal', 'Won'];

function Waveform() {
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="waveform-bar w-1 rounded-full bg-cyan-400"
          style={{
            height: '100%',
            animationDelay: `${(i % 10) * 0.1}s`,
            animationDuration: `${0.8 + (i % 5) * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

function DialKey({ label, sub, onClick }: { label: string; sub?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center h-12 rounded-xl bg-white/5 hover:bg-white/15 active:bg-white/20 transition-colors"
    >
      <span className="text-white text-base font-semibold leading-tight">{label}</span>
      {sub && <span className="text-slate-500 text-[8px] tracking-widest">{sub}</span>}
    </button>
  );
}

export default function DialpadView() {
  const [elapsed, setElapsed] = useState(0);
  const [dialInput, setDialInput] = useState('');
  const [activeTab, setActiveTab] = useState<'coach' | 'lead' | 'script' | 'notes' | 'history'>('coach');

  // Phase 6 — post-call transcript state
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string | null>(null);
  const [completedCallId, setCompletedCallId] = useState<string | null>(null);

  const {
    isRegistered, isCalling, callStatus, callId,
    muted, onHold, error,
    dial, hangup, mute, unmute, hold, resume,
  } = useSoftphone();

  // Phase 8 — live coaching signals
  const {
    suggestion, signal: coachingSignal, liveTranscript,
    markUsed, dismissSuggestion, dismissSignal,
  } = useCoachingSignals(isCalling ? (callId ?? null) : null);

  const callActive = isCalling;

  useEffect(() => {
    if (!callActive) { setElapsed(0); return; }
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [callActive]);

  // Phase 6 — when a call completes, poll for transcript
  useEffect(() => {
    if (callStatus !== 'completed' || !completedCallId) return;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout>;

    const pollTranscript = async () => {
      try {
        const meta = await recordingsApi.getMeta(completedCallId);
        if (cancelled) return;
        setTranscriptionStatus(meta.transcription_status);
        if (meta.transcription_status === 'done') {
          const segs = await transcriptsApi.get(completedCallId);
          if (!cancelled) setTranscript(segs);
        } else if (meta.transcription_status === 'pending' || meta.transcription_status === 'processing') {
          pollTimer = setTimeout(pollTranscript, 5000);
        }
      } catch {
        // ignore — transcript may not exist yet
      }
    };

    pollTranscript();
    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
    };
  }, [callStatus, completedCallId]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  function press(digit: string) {
    setDialInput((prev) => prev + digit);
  }

  return (
    <div className="flex h-full gap-0 rounded-2xl overflow-hidden border border-slate-200 bg-white" style={{ minHeight: 'calc(100vh - 96px)' }}>
      {/* ── Left: Dialpad ── */}
      <div className="w-72 flex flex-col shrink-0" style={{ background: '#0D1526' }}>
        {/* Live call header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-semibold uppercase tracking-wide">Live Call · {mm}:{ss}</span>
          </div>
          <span className="text-slate-500 text-xs">HD · Telnyx</span>
        </div>

        {/* Contact info */}
        <div className="flex flex-col items-center pt-6 pb-4 px-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-3">
            <span className="text-white text-2xl font-bold">RF</span>
          </div>
          <h2 className="text-white text-lg font-bold">Robert Fox</h2>
          <p className="text-slate-400 text-xs mt-0.5">+1 202-555-0148</p>
          <p className="text-slate-500 text-xs">VP Sales · Acme Corp</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-semibold">Sentiment · Positive</span>
            <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-semibold">Lead score 82</span>
          </div>
        </div>

        {/* Talk ratio */}
        <div className="px-4 pb-3">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>You · <span className="text-white font-semibold">Talk 46%</span></span>
            <span>Customer · <span className="text-white font-semibold">54%</span></span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full" style={{ width: '46%' }} />
          </div>
        </div>

        {/* Waveform */}
        <div className="px-4 pb-3">
          <Waveform />
        </div>

        {/* Dialpad number input */}
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <button className="text-slate-400 text-xs flex items-center gap-1">
                <Globe className="w-3 h-3" /> US +1 <ChevronDown className="w-3 h-3" />
              </button>
              <span className="text-white text-sm font-mono">{dialInput}</span>
            </div>
            <button onClick={() => setDialInput((p) => p.slice(0, -1))} className="text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Keys */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {[['1',''],['2','ABC'],['3','DEF'],['4','GHI'],['5','JKL'],['6','MNO'],['7','PQRS'],['8','TUV'],['9','WXYZ'],['*',''],['0',''],['#','']].map(([k, s]) => (
            <DialKey key={k} label={k} sub={s || undefined} onClick={() => press(k)} />
          ))}
        </div>

        {/* Connection status if not in call */}
        {!callActive && (
          <div className="px-4 pb-2">
            <p className="text-center text-xs text-slate-500">
              {isRegistered ? '● Ready to dial' : '○ Connecting…'}
              {error && <span className="text-red-400 ml-2">{error}</span>}
            </p>
          </div>
        )}

        {/* Call controls */}
        <div className="grid grid-cols-4 gap-2 px-4 pb-3">
          <button
            onClick={() => muted ? unmute() : mute()}
            disabled={!callActive}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-colors disabled:opacity-40 ${
              muted ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <MicOff className="w-4 h-4" />
            <span className="text-[10px] font-medium">{muted ? 'Unmute' : 'Mute'}</span>
          </button>
          <button
            onClick={() => onHold ? resume() : hold()}
            disabled={!callActive}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-colors disabled:opacity-40 ${
              onHold ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <Pause className="w-4 h-4" />
            <span className="text-[10px] font-medium">{onHold ? 'Resume' : 'Hold'}</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 transition-colors">
            <Circle className="w-4 h-4" />
            <span className="text-[10px] font-medium">Rec</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors">
            <Shuffle className="w-4 h-4" />
            <span className="text-[10px] font-medium">Trans.</span>
          </button>
        </div>

        {/* Dial / End Call */}
        <div className="px-4 pb-6">
          {callActive ? (
            <button
              onClick={hangup}
              className="w-full py-3.5 bg-red-500 hover:bg-red-600 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 rotate-[135deg]" />
              End Call
            </button>
          ) : (
            <button
              onClick={() => dialInput && dial(dialInput, '', '')}
              disabled={!isRegistered || !dialInput}
              className="w-full py-3.5 bg-green-500 hover:bg-green-600 disabled:opacity-40 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {callStatus === 'dialing' ? 'Dialing…' : 'Call'}
            </button>
          )}
        </div>
      </div>

      {/* ── Middle: AI Coach Panel ── */}
      <div className="flex-1 flex flex-col border-x border-slate-200 min-w-0">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 shrink-0">
          {([
            ['coach',   'AI Coach',  '2'],
            ['lead',    'Lead Info',  ''],
            ['script',  'Script',     ''],
            ['notes',   'Notes',      ''],
            ['history', 'History',    ''],
          ] as const).map(([tab, label, badge]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-cyan-600 border-cyan-500 bg-white'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              {tab === 'coach' && <Sparkles className="w-3.5 h-3.5" />}
              {tab === 'lead' && <FileText className="w-3.5 h-3.5" />}
              {tab === 'script' && <FileText className="w-3.5 h-3.5" />}
              {tab === 'notes' && <StickyNote className="w-3.5 h-3.5" />}
              {tab === 'history' && <Clock className="w-3.5 h-3.5" />}
              {label}
              {badge && (
                <span className="w-4 h-4 bg-cyan-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'coach' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* AI status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-cyan-500/15 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Real-time AI Assistant</p>
                  <p className="text-xs text-slate-400">Listening · Processing 0.4s ago</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Active
              </span>
            </div>

            {/* Live / post-call Transcript */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {isCalling ? 'Live Transcript' : 'Transcript'}
              </p>

              {/* Phase 8 — live segments while call is active */}
              {isCalling && liveTranscript.length > 0 && (
                <div className="space-y-3 mb-3">
                  {liveTranscript.map((seg) => {
                    const mins = String(Math.floor(seg.timestamp / 60000)).padStart(2, '0');
                    const secs = String(Math.floor((seg.timestamp % 60000) / 1000)).padStart(2, '0');
                    return (
                      <div
                        key={seg.id}
                        className="flex items-start gap-3"
                        style={{ opacity: seg.isFinal ? 1 : 0.6 }}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 ${
                          seg.speaker === 'contact' ? 'bg-purple-500' : 'bg-cyan-500'
                        }`}>
                          {seg.speaker === 'contact' ? 'C' : 'A'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-700 capitalize">{seg.speaker}</span>
                            {seg.timestamp > 0 && (
                              <span className="text-[10px] text-slate-400">{mins}:{secs}</span>
                            )}
                            {!seg.isFinal && (
                              <span className="text-[9px] text-slate-400 italic">transcribing…</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{seg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Phase 6 — post-call transcript once call ends */}
              {!isCalling && (transcriptionStatus === 'processing' || transcriptionStatus === 'pending') ? (
                <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing transcript…</span>
                </div>
              ) : !isCalling && transcript.length > 0 ? (
                <div className="space-y-3">
                  {transcript.map((seg) => {
                    const mins = String(Math.floor(seg.timestamp / 60000)).padStart(2, '0');
                    const secs = String(Math.floor((seg.timestamp % 60000) / 1000)).padStart(2, '0');
                    return (
                      <div key={seg.id} className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 ${
                          seg.speaker === 'contact' ? 'bg-purple-500' : 'bg-cyan-500'
                        }`}>
                          {seg.speaker === 'contact' ? 'C' : 'A'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-700 capitalize">{seg.speaker}</span>
                            <span className="text-[10px] text-slate-400">{mins}:{secs}</span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{seg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !isCalling ? (
                <p className="text-xs text-slate-400 italic">Transcript will appear here after the call.</p>
              ) : liveTranscript.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Listening…</p>
              ) : null}
            </div>

            {/* Phase 8 — Rule-based signal banner (silence / fast pace) */}
            {coachingSignal && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">
                    {coachingSignal.signalType === 'silence' ? 'Long Silence Detected' : 'Slow Down Your Pace'}
                  </p>
                  {coachingSignal.detail && (
                    <p className="text-xs text-slate-600">{coachingSignal.detail}</p>
                  )}
                </div>
                <button
                  onClick={dismissSignal}
                  className="text-slate-400 hover:text-slate-600 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Phase 8 — Suggested Next Step (live from coaching LLM) */}
            <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Suggested Next Step
                </span>
                {suggestion?.sentiment && (
                  <span className={`ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                    suggestion.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                    suggestion.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {suggestion.sentiment}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                {suggestion?.nextStep ?? (
                  <span className="text-slate-400 italic">
                    {isCalling ? 'AI is listening…' : 'Start a call to activate real-time coaching.'}
                  </span>
                )}
              </p>
              {suggestion && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={markUsed}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      suggestion.used ? 'bg-green-100 text-green-700' : 'bg-cyan-500 text-white hover:bg-cyan-600'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {suggestion.used ? 'Used!' : 'Used this'}
                  </button>
                  <button
                    onClick={dismissSuggestion}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Phase 8 — Objection Detected (from coaching LLM) */}
            {suggestion?.objection && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 relative">
                <button
                  onClick={dismissSuggestion}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">⚠ Objection Detected</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{suggestion.objection}</p>
              </div>
            )}

            {/* Consent captured */}
            <div className="flex items-center gap-2 text-green-600 text-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Consent for recording captured at 00:08 · GDPR ✓</span>
            </div>
          </div>
        )}

        {activeTab === 'lead' && (
          <div className="flex-1 overflow-y-auto p-5">
            <p className="text-sm text-slate-500">Lead details panel — shows full CRM profile, interaction history, and enrichment data.</p>
          </div>
        )}
        {activeTab === 'script' && (
          <div className="flex-1 overflow-y-auto p-5">
            <p className="text-sm text-slate-500">Script panel — shows the active call script with dynamic highlights based on conversation context.</p>
          </div>
        )}
        {activeTab === 'notes' && (
          <div className="flex-1 overflow-y-auto p-5">
            <textarea className="w-full h-40 p-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-400" placeholder="Add call notes..." />
          </div>
        )}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-5">
            <p className="text-sm text-slate-500">Call history — previous interactions with this contact.</p>
          </div>
        )}
      </div>

      {/* ── Right: Lead Info ── */}
      <div className="w-72 shrink-0 overflow-y-auto p-5 space-y-5">
        {/* Contact card */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            RF
          </div>
          <div>
            <p className="font-semibold text-slate-900">Robert Fox</p>
            <p className="text-slate-400 text-xs">VP Sales · Acme Corp</p>
          </div>
        </div>

        {/* Contact details */}
        <div className="space-y-2.5">
          {[
            { icon: Mail,     text: 'r.fox@acme.com' },
            { icon: Phone,    text: '+1 202-555-0148' },
            { icon: Globe,    text: 'New York, USA · UTC-05:00' },
            { icon: Building, text: '200-500 employees · SaaS' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 text-xs text-slate-600">
              <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {text}
            </div>
          ))}
        </div>

        {/* Lead Score */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Lead Score</p>
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold text-slate-900">82</span>
            <span className="text-xs text-slate-400">/100</span>
            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">High quality</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: '82%' }} />
          </div>
        </div>

        {/* Pipeline Stage */}
        <div>
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-3">Pipeline Stage</p>
          <div className="flex items-center justify-between">
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    i <= 3 ? 'bg-cyan-500' : 'bg-slate-200'
                  }`}>
                    {i <= 3
                      ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                      : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 font-medium">{stage}</span>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className={`h-px w-6 mx-0.5 mb-3 ${i < 3 ? 'bg-cyan-500' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-3">Recent activity</p>
          <div className="space-y-3">
            {[
              { icon: Phone,   label: 'Call · Demo walkthrough',  time: '2 days ago',  color: 'text-cyan-500' },
              { icon: Mail,    label: 'Email · Sent proposal',     time: '5 days ago',  color: 'text-purple-500' },
              { icon: Globe,   label: 'WhatsApp · Follow-up',      time: '1 wk ago',    color: 'text-green-500' },
            ].map(({ icon: Icon, label, time, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{label}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
