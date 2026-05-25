'use client';
/**
 * Phase 10 — Real-Time Inbox hook.
 *
 * Subscribes to the WebSocket channel for two event types:
 *   message.new      — new inbound message on any thread
 *   thread.updated   — thread metadata changed (unread count, last_message_at)
 *
 * Usage:
 *   const { totalUnread, recentThreadIds, onNewMessage, resetUnread } = useInbox();
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { wsClient } from '@/lib/ws';
import type { WsMessageEvent, WsThreadUpdatedEvent, WsEvent } from '@/lib/ws';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InboxMessage {
  threadId: string;
  messageId: string;
  leadId: string | null;
  channel: string;
  bodyPreview: string;
  receivedAt: number;  // Date.now()
}

export interface UseInboxResult {
  totalUnread: number;
  recentThreadIds: string[];
  latestMessage: InboxMessage | null;
  onNewMessage: (cb: (msg: InboxMessage) => void) => () => void;
  resetUnread: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useInbox(): UseInboxResult {
  const [totalUnread, setTotalUnread] = useState(0);
  const [recentThreadIds, setRecentThreadIds] = useState<string[]>([]);
  const [latestMessage, setLatestMessage] = useState<InboxMessage | null>(null);

  // Registry of external callbacks registered via onNewMessage()
  const listenersRef = useRef<Set<(msg: InboxMessage) => void>>(new Set());

  const onNewMessage = useCallback(
    (cb: (msg: InboxMessage) => void): (() => void) => {
      listenersRef.current.add(cb);
      return () => listenersRef.current.delete(cb);
    },
    []
  );

  const resetUnread = useCallback(() => {
    setTotalUnread(0);
  }, []);

  useEffect(() => {
    const unsub = wsClient.subscribe((event: WsEvent) => {
      if (event.type === 'message.new') {
        const e = event as WsMessageEvent;
        if (e.direction !== 'inbound') return;  // only count inbound for badge

        const msg: InboxMessage = {
          threadId: e.thread_id,
          messageId: e.message_id,
          leadId: e.lead_id,
          channel: e.channel,
          bodyPreview: e.body_preview,
          receivedAt: Date.now(),
        };

        setTotalUnread(prev => prev + 1);
        setLatestMessage(msg);
        setRecentThreadIds(prev => {
          const filtered = prev.filter(id => id !== e.thread_id);
          return [e.thread_id, ...filtered].slice(0, 20);
        });

        // Notify external listeners
        listenersRef.current.forEach(cb => cb(msg));
      }

      if (event.type === 'thread.updated') {
        const e = event as WsThreadUpdatedEvent;
        // Track the thread as recently active regardless of unread count
        setRecentThreadIds(prev => {
          const filtered = prev.filter(id => id !== e.thread_id);
          return [e.thread_id, ...filtered].slice(0, 20);
        });
      }
    });

    return unsub;
  }, []);

  return { totalUnread, recentThreadIds, latestMessage, onNewMessage, resetUnread };
}
