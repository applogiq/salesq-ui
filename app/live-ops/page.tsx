'use client';

import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Headphones, Clock, Users, Activity, Mic, MicOff, MoreHorizontal, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { callControlApi, liveOpsApi } from '@/lib/api';
import type { LiveAgentStatus } from '@/lib/api.types';
import { wsClient } from '@/lib/ws';

const STATUS_CONFIG = {
  on_call:  { label: 'On Call',   dot: 'bg-green-500',  cls: 'bg-green-100 text-green-700'  },
  ringing:  { label: 'Ringing',   dot: 'bg-amber-500',  cls: 'bg-amber-100 text-amber-700'  },
  dialing:  { label: 'Dialing',   dot: 'bg-blue-400',   cls: 'bg-blue-100 text-blue-700'    },
  available:{ label: 'Available', dot: 'bg-slate-400',  cls: 'bg-slate-100 text-slate-600'  },
};

const AVATAR_COLORS = ['bg-purple-500','bg-blue-500','bg-cyan-500','bg-amber-500','bg-pink-500','bg-emerald-500','bg-indigo-500','bg-rose-500'];
function avatarColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
function dur(sec: number | null) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SENTIMENT_CONFIG = {
  positive: 'text-green-600',
  neutral:  'text-slate-500',
  negative: 'text-red-500',
};

export default function LiveOpsPage() {
  const [agents, setAgents] = useState<LiveAgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [whisperCallId, setWhisperCallId] = useState<string | null>(null);
  const [whisperText, setWhisperText] = useState('');
  const [busyCallId, setBusyCallId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAgents = () =>
    liveOpsApi.agents()
      .then(setAgents)
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchAgents();
    intervalRef.current = setInterval(fetchAgents, 15_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Re-fetch on relevant WS events
  useEffect(() => {
    const unsub = wsClient.subscribe((ev) => {
      if (ev.type === 'call.state' || ev.type === 'live_ops.update' || ev.type === 'presence') {
        fetchAgents();
      }
    });
    return unsub;
  }, []);

  // Derived KPIs
  const onCallCount   = agents.filter(a => a.call_status === 'in_progress').length;
  const agentsOnline  = agents.length;
  const avgDuration   = agents.length
    ? Math.round(agents.reduce((s, a) => s + (a.duration_seconds ?? 0), 0) / agents.length)
    : 0;

  const metrics = [
    { label: 'Active Calls',  value: onCallCount,     icon: Phone,     color: 'text-green-500' },
    { label: 'Agents Online', value: agentsOnline,    icon: Headphones,color: 'text-cyan-500'  },
    { label: 'Avg Duration',  value: dur(avgDuration),icon: Clock,     color: 'text-slate-500' },
    { label: 'Monitored',     value: agents.filter(a => a.supervisor_id).length, icon: Activity, color: 'text-amber-500' },
  ];

  const handleListen = async (agent: LiveAgentStatus) => {
    if (!agent.call_id) return;
    setBusyCallId(agent.call_id);
    try {
      if (agent.supervisor_id) {
        await callControlApi.listenStop(agent.call_id);
      } else {
        await callControlApi.listen(agent.call_id);
      }
      await fetchAgents();
    } catch {}
    setBusyCallId(null);
  };

  const handleWhisperSend = async (callId: string) => {
    if (!whisperText.trim()) return;
    setBusyCallId(callId);
    try {
      await callControlApi.whisper(callId, { text: whisperText });
      setWhisperText('');
      setWhisperCallId(null);
    } catch {}
    setBusyCallId(null);
  };

  const handleHangup = async (callId: string) => {
    setBusyCallId(callId);
    try {
      await callControlApi.hangup(callId);
      await fetchAgents();
    } catch {}
    setBusyCallId(null);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Live Ops</h1>
          <p className="text-xs text-slate-500">
            {onCallCount} calls in progress · Real-time agent monitor
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg font-medium">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
            <m.icon className={cn('w-8 h-8', m.color)} />
            <div>
              <p className="text-xl font-bold text-slate-900">{m.value}</p>
              <p className="text-xs text-slate-500">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Agent table */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Agent Status</h2>
          <button className="text-xs text-slate-400 hover:text-slate-600">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {loading && (
          <div className="p-4 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        )}

        {!loading && agents.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400 py-12">
            No active calls right now
          </div>
        )}

        {!loading && agents.length > 0 && (
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-4 py-2">Agent</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Campaign</th>
                  <th className="text-left px-3 py-2">Contact</th>
                  <th className="text-left px-3 py-2">Duration</th>
                  <th className="text-left px-3 py-2">Sentiment</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {agents.map((agent) => {
                  const statusKey = (agent.call_status ?? 'available') as keyof typeof STATUS_CONFIG;
                  const sc = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.available;
                  const isMonitored = !!agent.supervisor_id;
                  const isBusy = busyCallId === agent.call_id;

                  return (
                    <>
                      <tr key={agent.user_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', avatarColor(agent.full_name ?? agent.user_id))}>
                              {initials(agent.full_name ?? agent.user_id)}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800">{agent.full_name ?? agent.user_id}</span>
                              {isMonitored && (
                                <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-medium">Monitored</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot, agent.call_status === 'in_progress' ? 'animate-pulse' : '')} />
                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', sc.cls)}>{sc.label}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{agent.campaign_name ?? '—'}</td>
                        <td className="px-3 py-3 text-slate-600">{agent.lead_name ?? '—'}</td>
                        <td className={cn('px-3 py-3 font-mono font-semibold', (agent.duration_seconds ?? 0) > 300 ? 'text-red-500' : 'text-slate-700')}>
                          {dur(agent.duration_seconds)}
                        </td>
                        <td className={cn('px-3 py-3 font-medium capitalize', SENTIMENT_CONFIG[agent.sentiment as keyof typeof SENTIMENT_CONFIG] ?? 'text-slate-400')}>
                          {agent.sentiment ?? '—'}
                        </td>
                        <td className="px-3 py-3">
                          {agent.call_id && (
                            <div className="flex items-center gap-1">
                              {/* Listen / Stop listen */}
                              <button
                                disabled={isBusy}
                                onClick={() => handleListen(agent)}
                                className={cn(
                                  'p-1.5 rounded transition-colors',
                                  isMonitored
                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                    : 'hover:bg-blue-50 text-blue-500'
                                )}
                                title={isMonitored ? 'Stop listening' : 'Listen in'}
                              >
                                <Headphones className="w-3.5 h-3.5" />
                              </button>

                              {/* Whisper */}
                              <button
                                disabled={isBusy}
                                onClick={() => setWhisperCallId(whisperCallId === agent.call_id ? null : agent.call_id)}
                                className="p-1.5 rounded hover:bg-purple-50 text-purple-500 transition-colors"
                                title="Whisper to agent"
                              >
                                <Mic className="w-3.5 h-3.5" />
                              </button>

                              {/* Hangup */}
                              <button
                                disabled={isBusy}
                                onClick={() => agent.call_id && handleHangup(agent.call_id)}
                                className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                                title="Hang up"
                              >
                                <PhoneOff className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {/* Whisper input row */}
                      {whisperCallId === agent.call_id && (
                        <tr key={`whisper-${agent.user_id}`} className="bg-purple-50">
                          <td colSpan={7} className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <Mic className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              <input
                                autoFocus
                                value={whisperText}
                                onChange={e => setWhisperText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && agent.call_id && handleWhisperSend(agent.call_id)}
                                placeholder="Type whisper message…"
                                className="flex-1 text-xs bg-white border border-purple-200 rounded px-2 py-1 outline-none focus:border-purple-400"
                              />
                              <button
                                onClick={() => agent.call_id && handleWhisperSend(agent.call_id)}
                                disabled={!whisperText.trim() || isBusy}
                                className="p-1.5 rounded bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 transition-colors"
                              >
                                <Send className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => { setWhisperCallId(null); setWhisperText(''); }}
                                className="text-xs text-slate-400 hover:text-slate-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
