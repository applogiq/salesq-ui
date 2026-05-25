'use client';

/**
 * useSoftphone — browser WebRTC calling via Telnyx (Phase 3 WP-3.2).
 *
 * • Dynamically imports @telnyx/webrtc to avoid Next.js SSR crash
 * • Silently skips init when backend returns 503 (credentials not configured)
 * • Exports dial / hangup / mute / unmute / hold / resume / transfer
 * • Syncs callStatus from CallContext when callId is known
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { softphoneApi } from '@/lib/api';
import { callControlApi } from '@/lib/api';
import { useCallContext } from '@/context/CallContext';

export interface SoftphoneState {
  isRegistered: boolean;
  isCalling: boolean;
  callId: string | null;
  callStatus: string | null;
  muted: boolean;
  onHold: boolean;
  error: string | null;
}

export interface SoftphoneActions {
  dial: (to: string, leadId: string, fromNumber: string) => Promise<void>;
  hangup: () => Promise<void>;
  mute: () => void;
  unmute: () => void;
  hold: () => Promise<void>;
  resume: () => Promise<void>;
  transfer: (to: string) => Promise<void>;
}

export function useSoftphone(): SoftphoneState & SoftphoneActions {
  const { activeCalls, sendPresence } = useCallContext();

  const [isRegistered, setIsRegistered] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // References to SDK objects (not state — we don't want re-renders on every SDK event)
  const rtcRef = useRef<unknown>(null);
  const activeCallRef = useRef<unknown>(null);

  // ── Boot TelnyxRTC on mount ────────────────────────────────────────────────
  useEffect(() => {
    let destroyed = false;

    async function init() {
      try {
        const creds = await softphoneApi.credentials();
        // Dynamic import — avoids SSR crash (window is not defined)
        const { TelnyxRTC } = await import('@telnyx/webrtc');

        const client = new TelnyxRTC({
          login: creds.sip_user,
          password: creds.sip_pass,
        });

        client.on('telnyx.ready', () => {
          if (!destroyed) setIsRegistered(true);
        });

        client.on('telnyx.error', (err: unknown) => {
          if (!destroyed) setError(String(err));
        });

        client.on('telnyx.notification', (notification: { type: string; call?: unknown }) => {
          if (destroyed) return;
          if (notification.type === 'callUpdate') {
            const call = notification.call as { state?: string } | undefined;
            const state = call?.state;
            if (state) setCallStatus(state);
            if (state === 'hangup' || state === 'destroy') {
              setIsCalling(false);
              setCallId(null);
              activeCallRef.current = null;
              setMuted(false);
              setOnHold(false);
              sendPresence('online');
            }
          }
        });

        client.connect();
        rtcRef.current = client;
      } catch (err: unknown) {
        // 503 = unconfigured — silently skip, no crash
        if ((err as { status?: number })?.status === 503) return;
        if (!destroyed) setError(String(err));
      }
    }

    init();
    return () => {
      destroyed = true;
      try { (rtcRef.current as { disconnect?: () => void })?.disconnect?.(); } catch {}
    };
  }, [sendPresence]);

  // ── Sync callStatus from CallContext WS events ────────────────────────────
  useEffect(() => {
    if (!callId) return;
    const wsCall = activeCalls.get(callId);
    if (wsCall) setCallStatus(wsCall.status);
  }, [activeCalls, callId]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const dial = useCallback(async (to: string, leadId: string, fromNumber: string) => {
    try {
      setError(null);
      const result = await softphoneApi.dial({ to, lead_id: leadId, from_number: fromNumber });
      setCallId(result.call_id);
      setIsCalling(true);
      setCallStatus('dialing');
      sendPresence('on_call');

      // Also initiate WebRTC call if SDK is ready
      if (rtcRef.current && isRegistered) {
        const client = rtcRef.current as { newCall: (opts: unknown) => unknown };
        const call = client.newCall({ destinationNumber: to, callerNumber: fromNumber });
        activeCallRef.current = call;
      }
    } catch (err) {
      setError((err as { detail?: string })?.detail ?? 'Dial failed');
    }
  }, [isRegistered, sendPresence]);

  const hangup = useCallback(async () => {
    // Dual path: WebRTC + REST for reliability
    try {
      (activeCallRef.current as { hangup?: () => void })?.hangup?.();
    } catch {}
    if (callId) {
      try { await callControlApi.hangup(callId); } catch {}
    }
    setIsCalling(false);
    setCallId(null);
    setCallStatus(null);
    activeCallRef.current = null;
    setMuted(false);
    setOnHold(false);
    sendPresence('online');
  }, [callId, sendPresence]);

  const mute = useCallback(() => {
    (activeCallRef.current as { muteAudio?: () => void })?.muteAudio?.();
    setMuted(true);
  }, []);

  const unmute = useCallback(() => {
    (activeCallRef.current as { unmuteAudio?: () => void })?.unmuteAudio?.();
    setMuted(false);
  }, []);

  const hold = useCallback(async () => {
    if (callId) await callControlApi.hold(callId);
    setOnHold(true);
  }, [callId]);

  const resume = useCallback(async () => {
    if (callId) await callControlApi.resume(callId);
    setOnHold(false);
  }, [callId]);

  const transfer = useCallback(async (to: string) => {
    if (callId) await callControlApi.transfer(callId, to);
  }, [callId]);

  return {
    isRegistered,
    isCalling,
    callId,
    callStatus,
    muted,
    onHold,
    error,
    dial,
    hangup,
    mute,
    unmute,
    hold,
    resume,
    transfer,
  };
}
