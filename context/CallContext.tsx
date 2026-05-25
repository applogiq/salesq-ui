'use client';

/**
 * CallContext — real-time call & presence state (Phase 3 WP-3.1).
 *
 * Mounts WsClient once after auth, distributes events to consumers.
 */

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { wsClient, type WsEvent } from '@/lib/ws';
import { useAuth } from '@/context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CallState {
  callId: string;
  status: string;
  leadId: string | null;
  callControlId: string | null;
}

export interface ActiveScript {
  callId: string;
  campaignId: string;
  script: string;
  contactName: string | null;
}

interface CallContextValue {
  /** Active calls keyed by call_id */
  activeCalls: Map<string, CallState>;
  /** Presence keyed by user_id */
  presence: Map<string, string>;
  /** True once first pong received */
  wsReady: boolean;
  /** Push a presence update to the server */
  sendPresence: (status: 'online' | 'on_call' | 'offline') => void;
  /** WP-5.1 — Script delivered for the active call (null when not in a call or no script) */
  activeScript: ActiveScript | null;
  /** Clear the active script (e.g. when agent dismisses the panel) */
  clearScript: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const CallContext = createContext<CallContextValue>({
  activeCalls: new Map(),
  presence: new Map(),
  wsReady: false,
  sendPresence: () => {},
  activeScript: null,
  clearScript: () => {},
});

export function useCallContext() {
  return useContext(CallContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeCalls, setActiveCalls] = useState<Map<string, CallState>>(new Map());
  const [presence, setPresence] = useState<Map<string, string>>(new Map());
  const [wsReady, setWsReady] = useState(false);
  const [activeScript, setActiveScript] = useState<ActiveScript | null>(null);

  // Stable ref so the subscriber closure doesn't become stale
  const activeCallsRef = useRef(activeCalls);
  activeCallsRef.current = activeCalls;

  const handleEvent = useCallback((event: WsEvent) => {
    if (event.type === 'pong') {
      setWsReady(true);
      return;
    }

    if (event.type === 'call.state') {
      const terminal = ['completed', 'failed', 'transferred'].includes(event.status);
      setActiveCalls(prev => {
        const next = new Map(prev);
        if (terminal) {
          next.delete(event.call_id);
          // Clear script when call ends
          setActiveScript(prev => (prev?.callId === event.call_id ? null : prev));
        } else {
          next.set(event.call_id, {
            callId: event.call_id,
            status: event.status,
            leadId: event.lead_id,
            callControlId: event.call_control_id,
          });
        }
        return next;
      });
      return;
    }

    if (event.type === 'presence') {
      setPresence(prev => {
        const next = new Map(prev);
        if (event.status === 'offline') {
          next.delete(event.user_id);
        } else {
          next.set(event.user_id, event.status);
        }
        return next;
      });
      return;
    }

    // WP-5.1 — script delivery from call.answered
    if (event.type === 'call.script') {
      setActiveScript({
        callId: event.call_id,
        campaignId: event.campaign_id,
        script: event.script,
        contactName: event.contact_name,
      });
    }
  }, []);

  // Connect WsClient when user is authenticated
  useEffect(() => {
    if (!user) return;
    wsClient.connect();
    const unsub = wsClient.subscribe(handleEvent);
    return () => {
      unsub();
      wsClient.disconnect();
      setWsReady(false);
    };
  }, [user, handleEvent]);

  const sendPresence = useCallback((status: 'online' | 'on_call' | 'offline') => {
    wsClient.sendPresence(status);
  }, []);

  const clearScript = useCallback(() => {
    setActiveScript(null);
  }, []);

  return (
    <CallContext.Provider value={{ activeCalls, presence, wsReady, sendPresence, activeScript, clearScript }}>
      {children}
    </CallContext.Provider>
  );
}
