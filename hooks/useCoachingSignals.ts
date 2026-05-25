'use client';
/**
 * WP-8.1 — Real-Time AI Coaching hook.
 *
 * Subscribes to the WebSocket channel for three event types:
 *   coaching.suggestion  — LLM-generated next-step / objection reframe
 *   coaching.signal      — rule-based alerts (silence, fast_pace)
 *   transcript.segment   — live partial / final transcript segments
 *
 * Usage:
 *   const { suggestion, signal, liveTranscript, markUsed, dismissSuggestion, dismissSignal } =
 *     useCoachingSignals(callId);
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { wsClient } from '@/lib/ws';
import type {
  WsCoachingSuggestionEvent,
  WsCoachingSignalEvent,
  WsTranscriptSegmentEvent,
  WsEvent,
} from '@/lib/ws';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CoachingSuggestion {
  nextStep: string;
  objection: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  signalId: string;
  used: boolean;
}

export interface CoachingSignal {
  signalType: 'silence' | 'fast_pace';
  detail: string | null;
}

export interface LiveTranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface UseCoachingSignalsResult {
  suggestion: CoachingSuggestion | null;
  signal: CoachingSignal | null;
  liveTranscript: LiveTranscriptSegment[];
  markUsed: () => void;
  dismissSuggestion: () => void;
  dismissSignal: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCoachingSignals(callId: string | null): UseCoachingSignalsResult {
  const [suggestion, setSuggestion] = useState<CoachingSuggestion | null>(null);
  const [signal, setSignal] = useState<CoachingSignal | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<LiveTranscriptSegment[]>([]);

  // Stable ref to callId so the subscription closure doesn't go stale
  const callIdRef = useRef<string | null>(callId);
  useEffect(() => { callIdRef.current = callId; }, [callId]);

  // Reset state whenever the call changes
  useEffect(() => {
    setSuggestion(null);
    setSignal(null);
    setLiveTranscript([]);
  }, [callId]);

  useEffect(() => {
    if (!callId) return;

    const unsub = wsClient.subscribe((event: WsEvent) => {
      // Always check against the current callId via ref to avoid stale captures
      const currentCallId = callIdRef.current;
      if (!currentCallId) return;

      if (event.type === 'coaching.suggestion') {
        const e = event as WsCoachingSuggestionEvent;
        if (e.call_id !== currentCallId) return;
        setSuggestion({
          nextStep: e.next_step,
          objection: e.objection,
          sentiment: e.sentiment,
          signalId: e.signal_id,
          used: false,
        });
      }

      else if (event.type === 'coaching.signal') {
        const e = event as WsCoachingSignalEvent;
        if (e.call_id !== currentCallId) return;
        setSignal({ signalType: e.signal_type, detail: e.detail });
        // Auto-dismiss signal after 8 seconds
        setTimeout(() => setSignal(null), 8000);
      }

      else if (event.type === 'transcript.segment') {
        const e = event as WsTranscriptSegmentEvent;
        if (e.call_id !== currentCallId) return;
        const seg = e.segment as {
          id: string; speaker: string; text: string;
          timestamp?: number; is_final?: boolean;
        };
        setLiveTranscript((prev) => {
          // If final, replace any existing partial with same id; else just append
          const filtered = prev.filter((s) => s.id !== seg.id);
          return [
            ...filtered,
            {
              id: seg.id,
              speaker: seg.speaker,
              text: seg.text,
              timestamp: seg.timestamp ?? 0,
              isFinal: seg.is_final ?? false,
            },
          ].slice(-100); // keep last 100 segments
        });
      }
    });

    return unsub;
  }, [callId]);

  const markUsed = useCallback(() => {
    setSuggestion((s) => s ? { ...s, used: true } : null);
  }, []);

  const dismissSuggestion = useCallback(() => setSuggestion(null), []);
  const dismissSignal     = useCallback(() => setSignal(null), []);

  return { suggestion, signal, liveTranscript, markUsed, dismissSuggestion, dismissSignal };
}
