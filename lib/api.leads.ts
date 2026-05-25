'use client';

/**
 * Typed API client for the Leads CRM endpoints (Phase 2).
 * Uses the same apiFetch / tokenStore from lib/api.ts.
 */

import { apiFetch, tokenStore } from './api';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// ── Types ─────────────────────────────────────────────────────────────────────

export type LifecycleStage =
  | 'new' | 'attempted' | 'connected' | 'interested'
  | 'qualified' | 'proposal_sent' | 'negotiation'
  | 'converted' | 'lost' | 'dnd';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  job_title: string | null;
  location: string | null;
  source: string | null;
  owner_id: string | null;
  team_id: string | null;
  lifecycle_stage: LifecycleStage;
  dnd_flag: boolean;
  dnd_reason: string | null;
  dnd_at: string | null;
  tags: string[];
  deal_value: number | null;
  deal_currency: string;
  notes: string | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  duplicate_of_id: string | null;
  duplicate_status: string | null;
  import_batch_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LeadListOut {
  total: number;
  page: number;
  page_size: number;
  items: Lead[];
}

export interface LeadCreate {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  job_title?: string;
  location?: string;
  source?: string;
  owner_id?: string;
  team_id?: string;
  lifecycle_stage?: LifecycleStage;
  tags?: string[];
  deal_value?: number;
  deal_currency?: string;
  notes?: string;
  custom_fields?: Record<string, unknown>;
}

export interface LeadPatch {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  job_title?: string;
  location?: string;
  owner_id?: string;
  team_id?: string;
  tags?: string[];
  deal_value?: number;
  deal_currency?: string;
  notes?: string;
  next_followup_at?: string;
  custom_fields?: Record<string, unknown>;
}

export interface ImportBatch {
  id: string;
  owner_id: string;
  file_name: string;
  total_rows: number;
  imported_count: number;
  duplicate_count: number;
  error_count: number;
  status: 'pending' | 'processing' | 'done' | 'failed';
  error_report: Array<{ row: number; field: string; error: string }> | null;
  dedup_keys: string[] | null;
  created_at: string;
}

export interface TimelineEntry {
  id: string;
  lead_id: string;
  actor_id: string | null;
  activity_type: string;
  summary: string;
  detail: Record<string, unknown> | null;
  ref_id: string | null;
  ref_type: string | null;
  created_at: string;
}

// ── Phase 3 types ─────────────────────────────────────────────────────────────

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export interface LeadCallSummary {
  id: string;
  status: string;
  direction: string;
  from_number: string | null;
  to_number: string | null;
  duration_seconds: number | null;
  started_at: string | null;
  ended_at: string | null;
  outcome: string | null;
  recording_url: string | null;
  created_at: string | null;
}

export interface LeadWorkspace {
  lead: Lead;
  notes: LeadNote[];
  calls: LeadCallSummary[];
  timeline: TimelineEntry[];
}

export interface LeadListParams {
  search?: string;
  stage?: string;
  owner_id?: string;
  team_id?: string;
  dnd?: boolean;
  import_batch?: string;
  sort?: 'created_at' | 'last_contacted_at' | 'deal_value' | 'name' | 'next_followup_at';
  order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

// ── leadsApi ──────────────────────────────────────────────────────────────────

export const leadsApi = {
  // ── CRUD ────────────────────────────────────────────────────────────────────

  list: (params: LeadListParams = {}) =>
    apiFetch<LeadListOut>(`/leads${qs(params as Record<string, unknown>)}`),

  get: (id: string) =>
    apiFetch<Lead>(`/leads/${id}`),

  create: (body: LeadCreate) =>
    apiFetch<Lead>('/leads', { method: 'POST', body: JSON.stringify(body) }),

  patch: (id: string, body: LeadPatch) =>
    apiFetch<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: (id: string) =>
    apiFetch<void>(`/leads/${id}`, { method: 'DELETE' }),

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  transitionStage: (id: string, to_stage: LifecycleStage, note?: string) =>
    apiFetch<Lead>(`/leads/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ to_stage, note }),
    }),

  // ── DND ─────────────────────────────────────────────────────────────────────

  setDnd: (id: string, reason?: string) =>
    apiFetch<Lead>(`/leads/${id}/dnd`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  removeDnd: (id: string) =>
    apiFetch<Lead>(`/leads/${id}/dnd`, { method: 'DELETE' }),

  // ── Follow-up ────────────────────────────────────────────────────────────────

  scheduleFollowup: (id: string, followup_at: string) =>
    apiFetch<Lead>(`/leads/${id}/followup`, {
      method: 'POST',
      body: JSON.stringify({ followup_at }),
    }),

  // ── Timeline & history ───────────────────────────────────────────────────────

  timeline: (id: string, page = 1, page_size = 20) =>
    apiFetch<TimelineEntry[]>(`/leads/${id}/timeline?page=${page}&page_size=${page_size}`),

  stageHistory: (id: string) =>
    apiFetch<unknown[]>(`/leads/${id}/stage-history`),

  // ── Duplicates ───────────────────────────────────────────────────────────────

  duplicates: (page = 1) =>
    apiFetch<Lead[]>(`/leads/duplicates?page=${page}`),

  merge: (id: string, target_id: string) =>
    apiFetch<Lead>(`/leads/${id}/merge?target_id=${encodeURIComponent(target_id)}`, {
      method: 'POST',
    }),

  ignoreDuplicate: (id: string) =>
    apiFetch<Lead>(`/leads/${id}/ignore-duplicate`, { method: 'POST' }),

  // ── Import ───────────────────────────────────────────────────────────────────

  /**
   * Upload a CSV or Excel file.
   * Uses a raw fetch (not apiFetch) because we send multipart/form-data.
   * Returns { batch_id, status }.
   */
  import: async (
    file: File,
    dedupKeys: string[] = ['phone', 'email'],
  ): Promise<{ batch_id: string; status: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dedup_keys', JSON.stringify(dedupKeys));

    const token = tokenStore.getAccess();
    const res = await fetch(`${BASE}/leads/import`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      let detail = 'Import failed';
      try { detail = (await res.json()).detail ?? detail; } catch {}
      throw { status: res.status, detail };
    }

    return res.json();
  },

  importStatus: (batchId: string) =>
    apiFetch<ImportBatch>(`/leads/import/${batchId}`),

  // ── Phase 3: Notes ───────────────────────────────────────────────────────────

  createNote: (leadId: string, body: string) =>
    apiFetch<LeadNote>(`/leads/${leadId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  listNotes: (leadId: string, page = 1, page_size = 50) =>
    apiFetch<LeadNote[]>(`/leads/${leadId}/notes?page=${page}&page_size=${page_size}`),

  deleteNote: (leadId: string, noteId: string) =>
    apiFetch<void>(`/leads/${leadId}/notes/${noteId}`, { method: 'DELETE' }),

  // ── Phase 3: Workspace ───────────────────────────────────────────────────────

  workspace: (leadId: string) =>
    apiFetch<LeadWorkspace>(`/leads/${leadId}/workspace`),

  // ── Export (triggers browser download) ───────────────────────────────────────

  exportCsv: (params: { stage?: string; owner_id?: string; dnd?: boolean } = {}) => {
    const token = tokenStore.getAccess();
    const url = `${BASE}/leads/export${qs(params as Record<string, unknown>)}`;
    const a = document.createElement('a');
    a.href = url;
    // Include auth token as query param only for download triggers
    // In production, use cookie auth or a signed download URL instead.
    a.setAttribute('data-bearer', token ?? '');
    // Simpler: open in new tab — backend streams the CSV
    window.open(url, '_blank');
  },
};
