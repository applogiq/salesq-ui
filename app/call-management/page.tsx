'use client';
import { useEffect, useState } from 'react';
import { Search, Download, Filter, Bell, ChevronDown, Headphones, Mic, MicOff, MoreHorizontal, X, PauseCircle, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { callControlApi, apiFetch } from '@/lib/api';

const METRIC_TILES = [
  { label: 'ACTIVE CALLS', value: '128', badge: 'LIVE', badgeColor: 'bg-green-100 text-green-600', sub: null },
  { label: 'INBOUND QUEUE', value: '12', badge: 'Avg 00:14', badgeColor: 'bg-amber-100 text-amber-600', sub: null },
  { label: 'AVAILABLE AGENTS', value: '32', badge: null, sub: 'of 86' },
  { label: 'SERVICE LEVEL', value: '94%', badge: 'SLA met', badgeColor: 'bg-purple-100 text-purple-600', sub: null },
  { label: 'AVG WAIT TIME', value: '00:18', badge: '-3s', badgeColor: 'bg-green-100 text-green-600', sub: null },
];

const FILTER_TABS = [
  { label: 'All Active', count: 128 },
  { label: 'Inbound',    count: 42  },
  { label: 'Outbound',   count: 86  },
  { label: 'In Queue',   count: 12  },
  { label: 'High Risk',  count: 3   },
];

const SENTIMENT_BARS: Record<string, { bars: string; color: string }> = {
  Positive: { bars: '████', color: 'text-green-500'  },
  Neutral:  { bars: '███░', color: 'text-slate-400'  },
  Negative: { bars: '██░░', color: 'text-red-500'    },
};

const CALLS = [
  { id: 'C-8840', customer: 'Robert Fox',      phone: '+1 202-555-0148', company: 'Acme Corp',        agentInitials: 'MP', agentName: 'Maya Patel',    agentColor: 'bg-purple-500', queue: 'Summer Outbound', duration: '02:35', sentiment: 'Positive', ai: 'On track',       aiColor: 'text-green-600 bg-green-50'  },
  { id: 'C-8841', customer: 'Leslie Alexander', phone: '+1 203-555-0187', company: 'Global Tech',     agentInitials: 'EH', agentName: 'Esther Howard', agentColor: 'bg-orange-400', queue: 'Renewals Outbound',  duration: '01:58', sentiment: 'Neutral',  ai: 'Listening',      aiColor: 'text-slate-600 bg-slate-100' },
  { id: 'C-8842', customer: 'Brooklyn Simmons', phone: '+44 20-7946-0958', company: 'Bright Future Ltd', agentInitials: 'GH', agentName: 'Guy Hawkins',   agentColor: 'bg-emerald-500', queue: 'Support Inbound',  duration: '04:12', sentiment: 'Negative', ai: 'Objection: Price', aiColor: 'text-orange-600 bg-orange-50', selected: true },
  { id: 'C-8843', customer: 'Cody Fisher',      phone: '+1 415-555-0192', company: 'Velocity Inc.',  agentInitials: 'WW', agentName: 'Wade Warren',   agentColor: 'bg-cyan-500',   queue: 'Demo Outbound',   duration: '00:42', sentiment: 'Neutral',  ai: 'Dialing…',       aiColor: 'text-slate-500 bg-slate-100' },
  { id: 'C-8844', customer: 'Theresa Webb',     phone: '+1 718-555-0134', company: 'Pivotal',        agentInitials: 'FM', agentName: 'Floyd Miles',   agentColor: 'bg-indigo-400', queue: 'Summer Outbound', duration: '03:18', sentiment: 'Positive', ai: 'Closing signal', aiColor: 'text-green-600 bg-green-50'  },
  { id: 'C-8845', customer: 'Dianne Russell',   phone: '+1 312-555-0167', company: 'NextGen Solutions', agentInitials: 'JW', agentName: 'Jenny Wilson', agentColor: 'bg-rose-400', queue: 'Summer Outbound', duration: '00:24', sentiment: 'Neutral',  ai: 'Wrap-up',        aiColor: 'text-slate-600 bg-slate-100' },
];

const TRANSCRIPT = [
  { speaker: 'GH', name: 'Guy Hawkins',     time: '03:42', text: '…and that\'s why our enterprise tier includes priority support.', tag: null },
  { speaker: 'BS', name: 'Brooklyn Simmons', time: '03:52', text: 'I appreciate that, but the price is still 40% higher than what we\'re paying now.', tag: 'Objection · Price', tagColor: 'bg-red-100 text-red-600', highlight: 'price is still 40% higher' },
  { speaker: 'GH', name: 'Guy Hawkins',     time: '04:01', text: 'I understand. Let me show you the ROI calculator for…', tag: null },
];

function Waveform({ color }: { color: string }) {
  const heights = [3, 6, 9, 12, 8, 14, 10, 7, 11, 5, 9, 13, 8, 6, 10, 7, 12, 9, 5, 8];
  return (
    <div className="flex items-center gap-[2px] h-6">
      {heights.map((h, i) => (
        <div key={i} className={`w-1 rounded-full ${color}`} style={{ height: `${h}px` }} />
      ))}
    </div>
  );
}

export default function CallManagementPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCall, setSelectedCall] = useState(CALLS[2]);
  const [activeControl, setActiveControl] = useState<'listen' | 'whisper' | 'barge'>('whisper');
  const [calls, setCalls] = useState(CALLS);

  // Fetch real calls from API on mount; fall back to mock if empty or error
  useEffect(() => {
    apiFetch<any[]>('/calls')
      .then(data => { if (data?.length > 0) setCalls(data as any); })
      .catch(() => {});
  }, []);

  const handleHold = async (callId: string) => {
    try { await callControlApi.hold(callId); } catch {}
  };

  const handleHangup = async (callId: string) => {
    try {
      await callControlApi.hangup(callId);
      setCalls(prev => prev.map(c => c.id === callId ? { ...c, status: 'completed' } : c));
    } catch {}
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Call Management</h1>
          <p className="text-xs text-slate-500">Monitor, whisper, and intervene on any active call</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input placeholder="Search by agent, customer, or number..." className="pl-8 pr-10 py-1.5 text-xs border border-slate-200 rounded-lg w-64 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-slate-100 px-1 rounded">⌘K</span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600"><Filter className="w-3.5 h-3.5" />Filters</button>
        <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-white hover:bg-slate-50"><Download className="w-4 h-4 text-slate-500" /></button>
        <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-white hover:bg-slate-50 relative">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-5 gap-3">
        {METRIC_TILES.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{m.label}</p>
              {m.badge && <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', m.badgeColor)}>{m.badge}</span>}
            </div>
            <p className="text-2xl font-bold text-slate-900">{m.value}</p>
            {m.sub && <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Calls table */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col min-w-0">
          {/* Filter tabs + dropdowns */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 flex-wrap">
            <div className="flex gap-1">
              {FILTER_TABS.map((t, i) => (
                <button key={t.label} onClick={() => setActiveTab(i)}
                  className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', activeTab === i ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100')}>
                  {t.label} <span className="ml-1 opacity-60">{t.count}</span>
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"><span>🌐</span>All regions<ChevronDown className="w-3 h-3" /></button>
              <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">All campaigns<ChevronDown className="w-3 h-3" /></button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5">Customer</th>
                  <th className="text-left px-3 py-2.5">Agent</th>
                  <th className="text-left px-3 py-2.5">Queue · Campaign</th>
                  <th className="text-left px-3 py-2.5">Duration</th>
                  <th className="text-left px-3 py-2.5">Live Sentiment</th>
                  <th className="text-left px-3 py-2.5">AI</th>
                  <th className="text-right px-4 py-2.5">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {calls.map((call) => {
                  const sent = SENTIMENT_BARS[call.sentiment];
                  return (
                    <tr key={call.id} onClick={() => setSelectedCall(call)}
                      className={cn('cursor-pointer transition-colors', selectedCall.id === call.id ? 'bg-cyan-50 border-l-2 border-l-cyan-500' : 'hover:bg-slate-50')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <span className="text-blue-500 text-xs">📞</span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{call.customer}</p>
                            <p className="text-[10px] text-slate-400">{call.phone}</p>
                            <p className="text-[10px] text-slate-400">· {call.company}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', call.agentColor)}>{call.agentInitials}</div>
                          <span className="font-medium text-slate-700">{call.agentName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{call.queue}</td>
                      <td className="px-3 py-3 font-mono font-semibold text-slate-800">{call.duration}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('font-bold tracking-tighter', sent.color)}>{sent.bars}</span>
                          <span className={cn('text-xs font-medium', sent.color)}>{call.sentiment}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded', call.aiColor)}>{call.ai}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"><Headphones className="w-3.5 h-3.5" /></button>
                            <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"><Mic className="w-3.5 h-3.5" /></button>
                            <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400"><MicOff className="w-3.5 h-3.5" /></button>
                            <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                            {/* Live call controls */}
                            {(call as any).status === 'in_progress' && (
                              <>
                                <button
                                  onClick={e => { e.stopPropagation(); handleHold(call.id); }}
                                  title="Hold"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-50 text-amber-500"
                                >
                                  <PauseCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); handleHangup(call.id); }}
                                  title="Hangup"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500"
                                >
                                  <PhoneOff className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                          {/* Recording indicator */}
                          {(call as any).recording_status === 'recording' && (
                            <span className="flex items-center gap-1 text-[10px] text-red-500 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              REC
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 bg-white rounded-xl border border-slate-200 flex flex-col shrink-0 overflow-hidden">
          {/* Call header */}
          <div className="px-4 py-3 bg-slate-900 text-white rounded-t-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />LIVE · CALL #{selectedCall.id}</span>
              <span className="text-sm font-mono font-bold text-white">{selectedCall.duration}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0', selectedCall.agentColor)}>{selectedCall.agentInitials}</div>
              <div>
                <p className="text-sm font-bold text-white">{selectedCall.customer}</p>
                <p className="text-[10px] text-slate-400">{selectedCall.phone}</p>
                <p className="text-[10px] text-slate-400">{selectedCall.company} · Lead score 82</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700">
              <div><p className="text-[9px] text-slate-500">Agent</p><p className="text-xs font-medium text-white">{selectedCall.agentName}</p></div>
              <div className="text-right"><p className="text-[9px] text-slate-500">Campaign</p><p className="text-xs font-medium text-white">Support</p></div>
            </div>
          </div>

          {/* Live audio */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-700">Live Audio</p>
              <span className="text-[10px] text-slate-400">HD · Telnyx</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 w-14">Agent</span>
                <Waveform color="bg-cyan-400" />
                <span className="text-[10px] text-slate-400 w-10 text-right">-12 dB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 w-14">Customer</span>
                <Waveform color="bg-purple-400" />
                <span className="text-[10px] text-slate-400 w-10 text-right">-18 dB</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              {(['listen', 'whisper', 'barge'] as const).map((ctrl) => (
                <button key={ctrl} onClick={() => setActiveControl(ctrl)}
                  className={cn('flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors flex flex-col items-center gap-1',
                    activeControl === ctrl
                      ? ctrl === 'barge' ? 'bg-red-500 text-white' : 'bg-cyan-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                  <span>{ctrl === 'listen' ? '🎧' : ctrl === 'whisper' ? '🔊' : '📞'}</span>
                  <span>{ctrl.charAt(0).toUpperCase() + ctrl.slice(1)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Real-time transcript */}
          <div className="flex-1 px-4 py-3 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-700">Real-Time Transcript</p>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">Whisper · EN-US</span>
            </div>
            <div className="space-y-3 text-xs">
              {TRANSCRIPT.map((t, i) => (
                <div key={i}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-bold text-slate-700">{t.name}</span>
                    <span className="text-slate-400 font-mono">{t.time}</span>
                    {t.tag && <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-semibold', t.tagColor)}>{t.tag}</span>}
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {t.highlight
                      ? t.text.split(t.highlight).map((part, pi) => (
                          <span key={pi}>{pi > 0 && <span className="bg-red-100 text-red-700 font-medium px-0.5 rounded">{t.highlight}</span>}{part}</span>
                        ))
                      : t.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Coach Whisper */}
          <div className="px-4 py-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">✨</span>
                <p className="text-xs font-bold text-slate-800">AI Coach Whisper</p>
              </div>
              <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">HIGH PRIORITY</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 leading-relaxed mb-2">
              <p className="font-semibold mb-1 text-slate-800">Try this rebuttal →</p>
              <p>"I hear you on price. Most clients see a <strong>3.2× return</strong> in 90 days from the AI coaching alone. Could we look at the 6-month TCO together?"</p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5">
                <span>📤</span>Send to Agent
              </button>
              <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50"><X className="w-3.5 h-3.5 text-slate-400" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
