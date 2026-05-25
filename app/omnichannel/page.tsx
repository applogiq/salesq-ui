'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Plus, Phone, Calendar, MoreHorizontal, Send, Paperclip, Smile, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { threadsApi, messagesApi } from '@/lib/api.messages';
import { useInbox } from '@/hooks/useInbox';
import type { Thread, Message } from '@/lib/api.types';

const PIPELINE_STAGES = ['New', 'Contacted', 'Demo', 'Proposal', 'Won'];
const CURRENT_STAGE = 'Proposal';
const CHANNEL_ICON: Record<string, string> = { whatsapp: '💬', email: '✉️', sms: '📱' };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-purple-500', 'bg-blue-400', 'bg-blue-500', 'bg-amber-500',
  'bg-pink-400', 'bg-slate-400', 'bg-emerald-500', 'bg-cyan-500',
];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function OmnichannelPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'whatsapp' | 'email' | 'sms'>('all');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { onNewMessage } = useInbox();

  // ── Fetch thread list ────────────────────────────────────────────────────────
  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab !== 'all' ? { channel: activeTab } : {};
      const data = await threadsApi.list(params);
      setThreads(data);
      if (!selectedThread && data.length > 0) {
        setSelectedThread(data[0]);
      }
    } catch (err) {
      console.error('Failed to load threads', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadThreads(); }, [loadThreads]);

  // ── Fetch messages when thread changes ────────────────────────────────────────
  useEffect(() => {
    if (!selectedThread) return;
    (async () => {
      try {
        const detail = await threadsApi.get(selectedThread.id);
        setMessages(detail.messages);
        // Update unread count in list
        setThreads(prev =>
          prev.map(t => t.id === selectedThread.id ? { ...t, unread_count: 0 } : t)
        );
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    })();
  }, [selectedThread?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll to bottom on new message ─────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── Real-time inbound message subscription ───────────────────────────────────
  useEffect(() => {
    const unsub = onNewMessage((msg) => {
      // If the active thread just got a new message, refresh it
      if (selectedThread && msg.threadId === selectedThread.id) {
        messagesApi.list(selectedThread.id).then(setMessages).catch(console.error);
      }
      // Refresh thread list to update previews and unread counts
      loadThreads();
    });
    return unsub;
  }, [selectedThread, onNewMessage, loadThreads]);

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!selectedThread || !composeText.trim() || sending) return;
    setSending(true);
    try {
      const msg = await threadsApi.send(selectedThread.id, {
        body: composeText.trim(),
        channel: selectedThread.channel,
      });
      setMessages(prev => [...prev, msg]);
      setComposeText('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const filtered = activeTab === 'all'
    ? threads
    : threads.filter(t => t.channel === activeTab);

  const TABS = [
    { key: 'all' as const,      label: 'All',      count: threads.length },
    { key: 'whatsapp' as const, label: 'WhatsApp', count: threads.filter(t => t.channel === 'whatsapp').length },
    { key: 'email' as const,    label: 'Email',    count: threads.filter(t => t.channel === 'email').length },
    { key: 'sms' as const,      label: 'SMS',      count: threads.filter(t => t.channel === 'sms').length },
  ];

  const totalUnread = threads.reduce((sum, t) => sum + (t.unread_count || 0), 0);

  return (
    <div className="flex h-full gap-0 -m-5 overflow-hidden">
      {/* Thread list */}
      <div className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-sm font-bold text-slate-900">Omnichannel Inbox</h1>
              <p className="text-[10px] text-slate-400">WhatsApp · Email · SMS — unified threads</p>
            </div>
            <button className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-semibold rounded-lg">
              <Plus className="w-3 h-3" />New
            </button>
          </div>
          {/* Channel tabs */}
          <div className="flex gap-1 mt-3">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={cn('flex-1 py-1.5 text-[10px] font-semibold rounded-lg flex flex-col items-center gap-0.5 transition-colors border',
                  activeTab === t.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}>
                <span>{t.label}</span>
                <span className={cn('text-[9px]', activeTab === t.key ? 'text-slate-300' : 'text-slate-400')}>· {t.count}</span>
              </button>
            ))}
          </div>
          {/* Filter */}
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input placeholder="Filter threads..." className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none" />
          </div>
        </div>

        {/* Thread items */}
        <div className="flex-1 overflow-y-auto">
          {loading && threads.length === 0 && (
            <p className="text-[11px] text-slate-400 text-center py-6">Loading…</p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-[11px] text-slate-400 text-center py-6">No threads yet</p>
          )}
          {filtered.map(t => {
            const color = avatarColor(t.id);
            const name = t.lead_id ?? t.contact_id ?? 'Unknown';
            return (
              <div key={t.id} onClick={() => setSelectedThread(t)}
                className={cn('flex items-start gap-2.5 px-3 py-3 cursor-pointer border-b border-slate-50 transition-colors',
                  selectedThread?.id === t.id ? 'bg-cyan-50' : 'hover:bg-slate-50')}>
                <div className="relative shrink-0">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold', color)}>
                    {initials(name)}
                  </div>
                  <span className="absolute -bottom-0.5 -left-0.5 text-[10px]">{CHANNEL_ICON[t.channel]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-800 truncate">{name}</p>
                    <span className="text-[9px] text-slate-400 shrink-0 ml-1">
                      {t.last_message_at ? new Date(t.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{t.channel}</p>
                </div>
                {(t.unread_count || 0) > 0 && (
                  <span className="w-4 h-4 bg-cyan-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    {t.unread_count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      {selectedThread ? (
        <div className="flex-1 flex flex-col bg-white border-r border-slate-200 min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 shrink-0">
            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold', avatarColor(selectedThread.id))}>
              {initials(selectedThread.lead_id ?? selectedThread.contact_id ?? 'UK')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">{selectedThread.lead_id ?? selectedThread.contact_id ?? 'Unknown'}</p>
                <span className="text-[10px] bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded font-medium">
                  {CHANNEL_ICON[selectedThread.channel]}&nbsp;
                  {selectedThread.channel === 'whatsapp' ? 'WhatsApp' : selectedThread.channel === 'email' ? 'Email' : 'SMS'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {selectedThread.subject ?? `Thread ${selectedThread.id.slice(0, 8)}`}
                &nbsp;·&nbsp;{selectedThread.status}
              </p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"><Phone className="w-3.5 h-3.5" />Call</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"><Calendar className="w-3.5 h-3.5" />Schedule</button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50"><MoreHorizontal className="w-4 h-4 text-slate-400" /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="flex justify-center">
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">TODAY</span>
            </div>
            {messages.map(msg => {
              const isMe = msg.direction === 'outbound';
              const color = isMe ? 'bg-purple-400' : avatarColor(selectedThread.id);
              const ini = isMe ? 'ME' : initials(selectedThread.lead_id ?? 'UK');
              return (
                <div key={msg.id} className={cn('flex gap-2.5', isMe ? 'flex-row-reverse' : 'flex-row')}>
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 self-end', color)}>{ini}</div>
                  <div className={cn('max-w-[65%] space-y-1', isMe ? 'items-end flex flex-col' : '')}>
                    <div className={cn('px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                      isMe ? 'bg-cyan-500 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm')}>
                      {msg.body}
                    </div>
                    <p className={cn('text-[10px] text-slate-400 px-1', isMe ? 'text-right' : '')}>
                      {msg.sent_at
                        ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && msg.status !== 'pending' && (
                        <span className="ml-1 opacity-60">· {msg.status}</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && (
              <p className="text-[11px] text-slate-400 text-center py-8">No messages yet</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Compose area */}
          <div className="border-t border-slate-100 px-5 pt-3 pb-4 shrink-0">
            <div className="flex items-center gap-4 mb-2">
              <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"><Plus className="w-3.5 h-3.5" />Template</button>
              <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"><Calendar className="w-3.5 h-3.5" />Schedule send</button>
              <button className="flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-700 font-medium"><Sparkles className="w-3.5 h-3.5" />AI assist</button>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
              <input
                value={composeText}
                onChange={e => setComposeText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`Reply via ${selectedThread.channel}…`}
                className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button className="text-slate-400 hover:text-slate-600"><Paperclip className="w-4 h-4" /></button>
                  <button className="text-slate-400 hover:text-slate-600"><Smile className="w-4 h-4" /></button>
                  <span className="text-[10px] text-slate-400 ml-2">
                    {CHANNEL_ICON[selectedThread.channel]}&nbsp;{selectedThread.channel}
                  </span>
                </div>
                <button
                  onClick={handleSend}
                  disabled={sending || !composeText.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg">
                  {sending ? 'Sending…' : 'Send'} <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <p className="text-slate-400 text-sm">Select a thread to start messaging</p>
        </div>
      )}

      {/* Right contact panel */}
      <div className="w-64 bg-white flex flex-col shrink-0 overflow-y-auto">
        {selectedThread ? (
          <>
            {/* Avatar + name */}
            <div className="p-5 border-b border-slate-100 flex flex-col items-center text-center">
              <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3', avatarColor(selectedThread.id))}>
                {initials(selectedThread.lead_id ?? selectedThread.contact_id ?? 'UK')}
              </div>
              <p className="text-sm font-bold text-slate-900">{selectedThread.lead_id ?? selectedThread.contact_id ?? 'Unknown'}</p>
              <p className="text-[11px] text-slate-400 capitalize">{selectedThread.channel} thread</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium',
                  selectedThread.status === 'open' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500')}>
                  {selectedThread.status}
                </span>
              </div>
            </div>

            {/* Channels */}
            <div className="p-4 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">CHANNEL</p>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>{CHANNEL_ICON[selectedThread.channel]}</span>
                <span className="capitalize">{selectedThread.channel}</span>
              </div>
            </div>

            {/* Pipeline */}
            <div className="p-4 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">PIPELINE</p>
              <div className="flex items-center gap-1">
                {PIPELINE_STAGES.map((s, i) => {
                  const currentIdx = PIPELINE_STAGES.indexOf(CURRENT_STAGE);
                  const done = i <= currentIdx;
                  return (
                    <div key={s} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className={cn('w-4 h-4 rounded-full flex items-center justify-center border-2', done ? 'bg-cyan-500 border-cyan-500' : 'border-slate-200 bg-white')}>
                          {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className={cn('text-[8px] font-medium whitespace-nowrap', done ? 'text-cyan-600' : 'text-slate-400')}>{s}</span>
                      </div>
                      {i < PIPELINE_STAGES.length - 1 && (
                        <div className={cn('h-0.5 flex-1 -mt-4', i < currentIdx ? 'bg-cyan-500' : 'bg-slate-200')} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div className="p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">QUICK ACTIONS</p>
              <div className="space-y-1.5">
                {[{ icon: '📝', label: 'Add note' }, { icon: '🏷️', label: 'Update stage' }, { icon: '⚠️', label: 'Mark as DND' }].map((a) => (
                  <button key={a.label} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-left">
                    <span>{a.icon}</span>{a.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[11px] text-slate-400 text-center px-4">Select a thread to see contact details</p>
          </div>
        )}
      </div>
    </div>
  );
}
