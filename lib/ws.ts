/**
 * WsClient — singleton WebSocket manager (Phase 3 WP-3.1).
 *
 * Usage:
 *   wsClient.connect(token)
 *   const unsub = wsClient.subscribe(event => { ... })
 *   wsClient.disconnect()
 */

import { tokenStore } from './api';

const BASE_WS = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000')
  .replace(/^http/, 'ws');

// ── Event types ───────────────────────────────────────────────────────────────

export interface WsCallStateEvent {
  type: 'call.state';
  call_id: string;
  status: string;
  lead_id: string | null;
  call_control_id: string | null;
  extra?: Record<string, unknown>;
}

export interface WsPresenceEvent {
  type: 'presence';
  user_id: string;
  status: 'online' | 'on_call' | 'offline';
}

export interface WsHeartbeatEvent {
  type: 'pong';
  ts: number;
}

export interface WsErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

// ── Phase 4 — Dialer events ───────────────────────────────────────────────────

export interface WsDialerPreviewEvent {
  type: 'dialer.preview';
  call_id: string;
  campaign_id: string;
  contact: { name: string; phone: string; company: string; lead_id: string | null };
}

export interface WsDialerAssignedEvent {
  type: 'dialer.assigned';
  call_id: string;
  campaign_id: string;
  contact: { name: string; phone: string; company: string; lead_id: string | null };
}

export interface WsDialerQueueEvent {
  type: 'dialer.queue';
  campaign_id: string;
  queued: number;
  active: number;
  completed: number;
}

// ── Phase 5 — Campaign script event ──────────────────────────────────────────

export interface WsScriptEvent {
  type: 'call.script';
  call_id: string;
  campaign_id: string;
  script: string;
  contact_name: string | null;
}

// ── Phase 6 — Recording & transcription events ────────────────────────────────

export interface WsRecordingReadyEvent {
  type: 'recording.ready';
  call_id: string;
  signed_url: string;
  expires_at: string;
  transcription_status: string;
}

export interface WsTranscriptSegmentEvent {
  type: 'transcript.segment';
  call_id: string;
  segment: {
    id: string;
    speaker: 'agent' | 'contact';
    text: string;
    timestamp: number;
  };
}

// ── Phase 7 — AI analysis events ─────────────────────────────────────────────

export interface WsAnalysisEvent {
  type: 'call.analysis';
  call_id: string;
  lead_id: string | null;
  status: 'done' | 'failed';
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  call_score: number | null;
  ai_score: number | null;    // updated lead AI score after re-scoring
  summary: string | null;     // first sentence only; full text in REST API
}

// ── Phase 8 — Real-Time AI Coaching events ────────────────────────────────────

export interface WsCoachingSuggestionEvent {
  type: 'coaching.suggestion';
  call_id: string;
  next_step: string;
  objection: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  signal_id: string;
}

export interface WsCoachingSignalEvent {
  type: 'coaching.signal';
  call_id: string;
  signal_type: 'silence' | 'fast_pace';
  detail: string | null;
}

// ── Phase 9 — Live Monitoring events ─────────────────────────────────────────

export interface WsLiveMonitoringEvent {
  type: 'live_ops.update';
  call_id: string;
  action: 'listen_start' | 'listen_stop' | 'barge_start' | 'barge_stop' | 'whisper';
  agent_id: string | null;
  supervisor_id: string | null;
}

// ── Phase 10 — Omnichannel Communication events ───────────────────────────────

export interface WsMessageEvent {
  type: 'message.new';
  thread_id: string;
  message_id: string;
  lead_id: string | null;
  channel: string;          // sms | whatsapp | email
  direction: string;        // inbound | outbound
  sender_type: string;      // agent | contact
  body_preview: string;     // first 100 chars
  assigned_agent_id: string | null;
}

export interface WsThreadUpdatedEvent {
  type: 'thread.updated';
  thread_id: string;
  lead_id: string | null;
  unread_count: number;
  last_message_at: string;  // ISO-8601
}

export type WsEvent =
  | WsCallStateEvent
  | WsPresenceEvent
  | WsHeartbeatEvent
  | WsErrorEvent
  | WsDialerPreviewEvent
  | WsDialerAssignedEvent
  | WsDialerQueueEvent
  | WsScriptEvent
  | WsRecordingReadyEvent
  | WsTranscriptSegmentEvent
  | WsAnalysisEvent
  | WsCoachingSuggestionEvent
  | WsCoachingSignalEvent
  | WsLiveMonitoringEvent
  | WsMessageEvent
  | WsThreadUpdatedEvent;

type Subscriber = (event: WsEvent) => void;

// ── WsClient ──────────────────────────────────────────────────────────────────

class WsClient {
  private ws: WebSocket | null = null;
  private subscribers: Set<Subscriber> = new Set();
  private closed = false;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  connect() {
    if (typeof window === 'undefined') return;          // SSR guard
    const token = tokenStore.getAccess();
    if (!token) return;

    this.closed = false;
    this._open(token);
  }

  private _open(token: string) {
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }

    const url = `${BASE_WS}/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectDelay = 1000;   // reset backoff on successful connect
      this._startPing();
    };

    ws.onmessage = (ev) => {
      try {
        const event: WsEvent = JSON.parse(ev.data as string);
        this.subscribers.forEach(fn => fn(event));
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {};          // handled via onclose

    ws.onclose = () => {
      this._stopPing();
      if (!this.closed) {
        // exponential backoff: 1 → 2 → 4 → 8 → cap 30 s
        setTimeout(() => {
          if (!this.closed) {
            const t = tokenStore.getAccess();
            if (t) this._open(t);
          }
        }, this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
      }
    };
  }

  private _startPing() {
    this._stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 20_000);
  }

  private _stopPing() {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  sendPresence(status: 'online' | 'on_call' | 'offline') {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'presence', status }));
    }
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  disconnect() {
    this.closed = true;
    this._stopPing();
    try { this.ws?.close(); } catch {}
    this.ws = null;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Export singleton
export const wsClient = new WsClient();
