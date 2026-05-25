'use client';

/**
 * Typed API client for the Phase 10 Omnichannel endpoints.
 * Uses the same apiFetch from lib/api.ts.
 */

import { apiFetch } from './api';
import type {
  Thread,
  ThreadDetail,
  Message,
  MessageTemplate,
  SendMessageIn,
  ThreadPatchIn,
} from './api.types';

// ── Query param helper ────────────────────────────────────────────────────────

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

// ── Thread list params ────────────────────────────────────────────────────────

export interface ThreadListParams {
  lead_id?: string;
  channel?: 'sms' | 'whatsapp' | 'email';
  status?: 'open' | 'closed' | 'archived';
  unread_only?: boolean;
  page?: number;
}

// ── threadsApi ────────────────────────────────────────────────────────────────

export const threadsApi = {
  list: (params: ThreadListParams = {}) =>
    apiFetch<Thread[]>(`/messages/threads${qs(params as Record<string, unknown>)}`),

  get: (threadId: string) =>
    apiFetch<ThreadDetail>(`/messages/threads/${threadId}`),

  send: (threadId: string, body: SendMessageIn) =>
    apiFetch<Message>(`/messages/threads/${threadId}/send`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  markRead: (threadId: string) =>
    apiFetch<{ ok: boolean }>(`/messages/threads/${threadId}/read`, {
      method: 'POST',
    }),

  patch: (threadId: string, body: ThreadPatchIn) =>
    apiFetch<Thread>(`/messages/threads/${threadId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};

// ── messagesApi ───────────────────────────────────────────────────────────────

export const messagesApi = {
  list: (threadId: string, page = 1) =>
    apiFetch<Message[]>(`/messages/threads/${threadId}/messages?page=${page}`),
};

// ── templatesApi ──────────────────────────────────────────────────────────────

export interface TemplateCreateIn {
  name: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'any';
  subject?: string;
  body: string;
  variables?: string[];
}

export interface TemplatePatchIn {
  name?: string;
  channel?: string;
  subject?: string;
  body?: string;
  variables?: string[];
  approval_status?: string;
}

export const templatesApi = {
  list: (channel?: string) =>
    apiFetch<MessageTemplate[]>(`/messages/templates${channel ? `?channel=${encodeURIComponent(channel)}` : ''}`),

  create: (body: TemplateCreateIn) =>
    apiFetch<MessageTemplate>('/messages/templates', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: (id: string, body: TemplatePatchIn) =>
    apiFetch<MessageTemplate>(`/messages/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/messages/templates/${id}`, {
      method: 'DELETE',
    }),
};
