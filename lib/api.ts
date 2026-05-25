'use client';

import type {
  AuditLogOut, LoginResponse, MFASetupOut, SessionOut,
  TeamOut, TokenPair, User, BackendRole,
  PhoneNumber, NumberSearchResult, RoutingRule, IvrNode,
  WebhookHealth, SipConnectionOut,
  CampaignQueueStatus, DialerSettingsUpdate,
  CampaignOut, CampaignCreate, CampaignMetrics,
  // Phase 6
  RecordingMeta, TranscriptSegment, TranscriptSearchResult,
  CampaignKeyword, KeywordMatch,
  // Phase 7
  CallAnalysisOut, LeadAiScoreOut, AiAnalyticsSummary,
  // Phase 9
  LiveAgentStatus, QaScorecardOut, QaReviewOut, QaSummary,
  DncEntryOut, ConsentRecordOut, ComplianceViolationOut,
} from './api.types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// ── Token storage ─────────────────────────────────────────────────────────────

export const tokenStore = {
  getAccess: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('salesq_access_token') : null,
  getRefresh: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('salesq_refresh_token') : null,
  set: (pair: TokenPair): void => {
    localStorage.setItem('salesq_access_token', pair.access_token);
    localStorage.setItem('salesq_refresh_token', pair.refresh_token);
  },
  clear: (): void => {
    localStorage.removeItem('salesq_access_token');
    localStorage.removeItem('salesq_refresh_token');
    localStorage.removeItem('salesq_user');
  },
};

// ── Core fetch with auto-refresh ──────────────────────────────────────────────

let _refreshing: Promise<boolean> | null = null;

async function _doRefresh(): Promise<boolean> {
  const rt = tokenStore.getRefresh();
  if (!rt) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) { tokenStore.clear(); return false; }
    const pair: TokenPair = await res.json();
    tokenStore.set(pair);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  };
  const token = tokenStore.getAccess();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${BASE}${path}`, { ...init, headers });

  // Auto-refresh on 401
  if (res.status === 401) {
    if (!_refreshing) _refreshing = _doRefresh().finally(() => { _refreshing = null; });
    const ok = await _refreshing;
    if (ok) {
      const newToken = tokenStore.getAccess();
      if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE}${path}`, { ...init, headers });
    }
  }

  if (!res.ok) {
    let detail = 'An error occurred';
    try { detail = (await res.json()).detail ?? detail; } catch {}
    throw { status: res.status, detail };
  }

  if (res.status === 204) return undefined as T;
  return res.json() as T;
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string, totp_code?: string) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, totp_code }),
    }),

  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),

  me: () => apiFetch<User>('/auth/me'),

  refresh: () =>
    apiFetch<TokenPair>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: tokenStore.getRefresh() }),
    }),

  sessions: () => apiFetch<SessionOut[]>('/auth/sessions'),

  revokeSession: (id: string) =>
    apiFetch<void>(`/auth/sessions/${id}`, { method: 'DELETE' }),

  mfaSetup: () => apiFetch<MFASetupOut>('/auth/mfa/setup', { method: 'POST' }),

  mfaConfirm: (code: string) =>
    apiFetch<void>('/auth/mfa/confirm', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  mfaDisable: () => apiFetch<void>('/auth/mfa', { method: 'DELETE' }),
};

// ── Users API ─────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (params?: { role?: string; team_id?: string }) => {
    const qs = params ? `?${new URLSearchParams(params as Record<string,string>)}` : '';
    return apiFetch<User[]>(`/users${qs}`);
  },

  invite: (data: { email: string; full_name?: string; role: BackendRole; team_id?: string; password?: string }) =>
    apiFetch<User>('/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  patch: (id: string, data: Partial<Pick<User, 'role' | 'team_id' | 'is_active' | 'full_name'>>) =>
    apiFetch<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ── Teams API ─────────────────────────────────────────────────────────────────

export const teamsApi = {
  list: () => apiFetch<TeamOut[]>('/teams'),

  create: (data: { name: string; region?: string }) =>
    apiFetch<TeamOut>('/teams', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Audit API ─────────────────────────────────────────────────────────────────

export const auditApi = {
  list: (params?: { action?: string; user_id?: string; page?: number }) => {
    const qs = params ? `?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)])))}` : '';
    return apiFetch<AuditLogOut[]>(`/audit${qs}`);
  },
};

// ── Phone Numbers API ─────────────────────────────────────────────────────────

export const phoneApi = {
  list: (params?: { country?: string; type?: string; assignment_type?: string }) => {
    const qs = params ? `?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v != null) as [string, string][]))}` : '';
    return apiFetch<PhoneNumber[]>(`/phone-numbers${qs}`);
  },

  search: (body: { country: string; number_type: string; contains?: string; limit?: number }) =>
    apiFetch<NumberSearchResult[]>('/phone-numbers/search', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  purchase: (body: { number: string; number_type: string }) =>
    apiFetch<PhoneNumber>('/phone-numbers/purchase', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  assign: (id: string, body: { assignment_type: string; assignment_id?: string }) =>
    apiFetch<PhoneNumber>(`/phone-numbers/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  release: (id: string) =>
    apiFetch<PhoneNumber>(`/phone-numbers/${id}/release`, { method: 'PATCH' }),

  sipConnections: () => apiFetch<SipConnectionOut[]>('/phone-numbers/sip-connections'),

  balance: () =>
    apiFetch<{ available_credit: number; balance: number; currency: string }>('/phone-numbers/balance'),
};

// ── Call Control API ──────────────────────────────────────────────────────────

export const callControlApi = {
  dial: (callId: string) =>
    apiFetch<void>(`/calls/${callId}/dial`, { method: 'POST' }),

  hold: (callId: string) =>
    apiFetch<void>(`/calls/${callId}/hold`, { method: 'POST' }),

  resume: (callId: string) =>
    apiFetch<void>(`/calls/${callId}/resume`, { method: 'POST' }),

  hangup: (callId: string) =>
    apiFetch<void>(`/calls/${callId}/hangup`, { method: 'POST' }),

  transfer: (callId: string, to: string) =>
    apiFetch<void>(`/calls/${callId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ to }),
    }),

  recordStart: (callId: string) =>
    apiFetch<void>(`/calls/${callId}/record/start`, { method: 'POST' }),

  recordStop: (callId: string) =>
    apiFetch<void>(`/calls/${callId}/record/stop`, { method: 'POST' }),

  // WP-9.1 — Live monitoring
  listen: (callId: string) =>
    apiFetch<{ status: string; call_id: string }>(`/calls/${callId}/listen`, { method: 'POST' }),

  listenStop: (callId: string) =>
    apiFetch<void>(`/calls/${callId}/listen/stop`, { method: 'POST' }),

  whisper: (callId: string, body: { text: string; voice?: string }) =>
    apiFetch<void>(`/calls/${callId}/whisper`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  barge: (callId: string, body: { supervisor_from_number: string }) =>
    apiFetch<{ status: string; call_id: string }>(`/calls/${callId}/barge`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  bargeStop: (callId: string) =>
    apiFetch<void>(`/calls/${callId}/barge/stop`, { method: 'POST' }),
};

// ── Routing Rules API ─────────────────────────────────────────────────────────

export const routingApi = {
  list: () => apiFetch<RoutingRule[]>('/calls/routing-rules'),

  create: (body: Partial<Omit<RoutingRule, 'id' | 'created_at'>>) =>
    apiFetch<RoutingRule>('/calls/routing-rules', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: (id: string, body: Partial<Omit<RoutingRule, 'id' | 'created_at'>>) =>
    apiFetch<RoutingRule>(`/calls/routing-rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  remove: (id: string) =>
    apiFetch<void>(`/calls/routing-rules/${id}`, { method: 'DELETE' }),
};

// ── IVR API ───────────────────────────────────────────────────────────────────

export const ivrApi = {
  list: (campaignId: string) =>
    apiFetch<IvrNode[]>(`/calls/campaigns/${campaignId}/ivr`),

  create: (campaignId: string, body: Partial<Omit<IvrNode, 'id' | 'campaign_id' | 'created_at'>>) =>
    apiFetch<IvrNode>(`/calls/campaigns/${campaignId}/ivr`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: (nodeId: string, body: Partial<Omit<IvrNode, 'id' | 'campaign_id' | 'created_at'>>) =>
    apiFetch<IvrNode>(`/calls/ivr-nodes/${nodeId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  remove: (nodeId: string) =>
    apiFetch<void>(`/calls/ivr-nodes/${nodeId}`, { method: 'DELETE' }),
};

// ── Webhooks API ──────────────────────────────────────────────────────────────

export const webhookApi = {
  health: () => apiFetch<WebhookHealth[]>('/webhooks/health'),
};

// ── Softphone API (Phase 3 WP-3.2) ───────────────────────────────────────────

export interface SoftphoneCredentials {
  sip_user: string;
  sip_pass: string;
  connection_id: string;
  app_id: string;
  webrtc_gateway: string;
}

export interface DialOut {
  call_id: string;
  status: string;
  lead_id: string;
}

export const softphoneApi = {
  credentials: () => apiFetch<SoftphoneCredentials>('/softphone/credentials'),

  dial: (body: { to: string; lead_id: string; from_number: string }) =>
    apiFetch<DialOut>('/softphone/dial', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ── Dashboard API (Phase 3 WP-3.3) ───────────────────────────────────────────

export interface RecentCallItem {
  call_id: string;
  lead_name: string | null;
  phone: string | null;
  status: string;
  duration_seconds: number | null;
  started_at: string | null;
}

export interface ExecutiveDashboardData {
  calls_today: number;
  calls_connected: number;
  conversion_rate: number;
  active_leads: number;
  followups_due: number;
  recent_calls: RecentCallItem[];
  stage_distribution: Record<string, number>;
}

export const dashboardApi = {
  executive: () => apiFetch<ExecutiveDashboardData>('/dashboard/executive'),
};

// ── Campaigns API (Phase 5) ───────────────────────────────────────────────────

export const campaignsApi = {
  list: () => apiFetch<CampaignOut[]>('/campaigns'),

  get: (id: string) => apiFetch<CampaignOut>(`/campaigns/${id}`),

  create: (body: CampaignCreate) =>
    apiFetch<CampaignOut>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<CampaignCreate> & { status?: string }) =>
    apiFetch<CampaignOut>(`/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  remove: (id: string) =>
    apiFetch<void>(`/campaigns/${id}`, { method: 'DELETE' }),

  metrics: (id: string) => apiFetch<CampaignMetrics>(`/campaigns/${id}/metrics`),
};

// ── Dialer API (Phase 4) ──────────────────────────────────────────────────────

export const dialerApi = {
  /** Activate a campaign — dialer_tick begins issuing calls immediately. */
  start: (campaignId: string) =>
    apiFetch<{ ok: boolean; status: string }>(`/dialer/campaigns/${campaignId}/start`, {
      method: 'POST',
    }),

  /** Pause a campaign — in-flight calls finish but no new dials are made. */
  pause: (campaignId: string) =>
    apiFetch<{ ok: boolean; status: string }>(`/dialer/campaigns/${campaignId}/pause`, {
      method: 'POST',
    }),

  /** Live slot / queue counts for one campaign. */
  status: (campaignId: string) =>
    apiFetch<CampaignQueueStatus>(`/dialer/campaigns/${campaignId}/status`),

  /** Summary queue status for all active/paused campaigns. */
  queue: () => apiFetch<CampaignQueueStatus[]>('/dialer/queue'),

  /** Update dialer settings (mode, concurrency, retry rules, etc.) */
  updateSettings: (campaignId: string, body: DialerSettingsUpdate) =>
    apiFetch<CampaignQueueStatus>(`/dialer/campaigns/${campaignId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};

// ── Phase 6 — Recordings API ──────────────────────────────────────────────────

export const recordingsApi = {
  getMeta: (callId: string) => apiFetch<RecordingMeta>(`/recordings/${callId}`),

  delete: (callId: string) => apiFetch<void>(`/recordings/${callId}`, { method: 'DELETE' }),
};

// ── Phase 6 — Transcripts API ─────────────────────────────────────────────────

export const transcriptsApi = {
  get: (callId: string) => apiFetch<TranscriptSegment[]>(`/transcripts/${callId}`),

  search: (params: {
    q: string;
    campaign_id?: string;
    agent_id?: string;
    from_date?: string;
    to_date?: string;
    speaker?: 'agent' | 'contact';
    limit?: number;
    offset?: number;
  }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
      )
    );
    return apiFetch<TranscriptSearchResult[]>(`/transcripts/search?${qs}`);
  },

  exportUrl: (callId: string, format: 'json' | 'csv') =>
    `${(typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : '') ?? 'http://localhost:4000'}/transcripts/${callId}/export?format=${format}`,

  reprocess: (callId: string) =>
    apiFetch<{ detail: string }>(`/transcripts/${callId}/reprocess`, { method: 'POST' }),
};

// ── Phase 6 — Campaign Keywords API ──────────────────────────────────────────

export const keywordsApi = {
  list: (campaignId: string) => apiFetch<CampaignKeyword[]>(`/campaigns/${campaignId}/keywords`),

  create: (campaignId: string, keyword: string, isRegex = false) =>
    apiFetch<CampaignKeyword>(`/campaigns/${campaignId}/keywords`, {
      method: 'POST',
      body: JSON.stringify({ keyword, is_regex: isRegex }),
    }),

  delete: (campaignId: string, keywordId: string) =>
    apiFetch<void>(`/campaigns/${campaignId}/keywords/${keywordId}`, { method: 'DELETE' }),
};

// ── Phase 6 — Keyword Matches API ────────────────────────────────────────────

export const keywordMatchesApi = {
  list: (callId: string) => apiFetch<KeywordMatch[]>(`/calls/${callId}/keyword-matches`),
};

// ── Phase 7 — AI Analysis API ─────────────────────────────────────────────────

export const callAnalysisApi = {
  /** Get the AI analysis for a completed call (404 if not yet analyzed). */
  get: (callId: string) =>
    apiFetch<CallAnalysisOut>(`/calls/${callId}/analysis`),

  /** Manually (re-)trigger post-call AI analysis. Returns 202. */
  trigger: (callId: string) =>
    apiFetch<void>(`/calls/${callId}/analysis`, { method: 'POST' }),
};

export const leadsAiApi = {
  /** Get the current AI score and priority rank for a lead. */
  getScore: (leadId: string) =>
    apiFetch<LeadAiScoreOut>(`/leads/${leadId}/ai-score`),

  /** Force a fresh AI score computation for a lead. Returns 202. */
  recomputeScore: (leadId: string) =>
    apiFetch<void>(`/leads/${leadId}/ai-score`, { method: 'POST' }),
};

export const aiApi = {
  /** Aggregated AI analytics. All params optional; defaults to last 30 days. */
  summary: (params?: {
    from_date?: string;
    to_date?: string;
    campaign_id?: string;
    agent_id?: string;
  }) => {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
          )
        ).toString()
      : '';
    return apiFetch<AiAnalyticsSummary>(`/analytics/ai-summary${qs}`);
  },
};

// ── Phase 9 — Live Ops API ────────────────────────────────────────────────────

export const liveOpsApi = {
  agents: () => apiFetch<LiveAgentStatus[]>('/live-ops/agents'),
};

// ── Phase 9 — QA API ─────────────────────────────────────────────────────────

function _qs(params?: Record<string, string | undefined>): string {
  if (!params) return '';
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  );
  const s = new URLSearchParams(filtered).toString();
  return s ? `?${s}` : '';
}

export const qaApi = {
  scorecards: {
    list: (params?: { campaign_id?: string }) =>
      apiFetch<QaScorecardOut[]>(`/qa/scorecards${_qs(params)}`),
    get: (id: string) => apiFetch<QaScorecardOut>(`/qa/scorecards/${id}`),
    create: (body: Partial<QaScorecardOut>) =>
      apiFetch<QaScorecardOut>('/qa/scorecards', { method: 'POST', body: JSON.stringify(body) }),
    patch: (id: string, body: Partial<QaScorecardOut>) =>
      apiFetch<QaScorecardOut>(`/qa/scorecards/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) => apiFetch<void>(`/qa/scorecards/${id}`, { method: 'DELETE' }),
  },
  reviews: {
    list: (params?: { status?: string; call_id?: string; agent_id?: string; campaign_id?: string }) =>
      apiFetch<QaReviewOut[]>(`/qa/reviews${_qs(params)}`),
    get: (id: string) => apiFetch<QaReviewOut>(`/qa/reviews/${id}`),
    submit: (id: string, body: { scores: object[]; override_score?: number; notes?: string }) =>
      apiFetch<QaReviewOut>(`/qa/reviews/${id}/submit`, { method: 'POST', body: JSON.stringify(body) }),
    dispute: (id: string) =>
      apiFetch<QaReviewOut>(`/qa/reviews/${id}/dispute`, { method: 'POST' }),
  },
  summary: (params?: { from_date?: string; to_date?: string; campaign_id?: string; agent_id?: string }) =>
    apiFetch<QaSummary>(`/qa/summary${_qs(params)}`),
};

// ── Phase 9 — Compliance API ─────────────────────────────────────────────────

export const complianceApi = {
  dnc: {
    list: (params?: { q?: string }) =>
      apiFetch<DncEntryOut[]>(`/compliance/dnc${_qs(params)}`),
    add: (body: { phone_number: string; reason?: string }) =>
      apiFetch<DncEntryOut>('/compliance/dnc', { method: 'POST', body: JSON.stringify(body) }),
    remove: (id: string) => apiFetch<void>(`/compliance/dnc/${id}`, { method: 'DELETE' }),
  },
  consent: {
    forLead: (leadId: string) =>
      apiFetch<ConsentRecordOut[]>(`/compliance/consent/${leadId}`),
    add: (leadId: string, body: { consent_type: string; granted: boolean; method: string; call_id?: string }) =>
      apiFetch<ConsentRecordOut>(`/compliance/consent/${leadId}`, { method: 'POST', body: JSON.stringify(body) }),
    forCall: (callId: string) =>
      apiFetch<ConsentRecordOut[]>(`/compliance/consent/call/${callId}`),
  },
  gdpr: {
    access: (leadId: string) =>
      apiFetch<object>(`/compliance/gdpr/access/${leadId}`, { method: 'POST' }),
    erase: (leadId: string) =>
      apiFetch<{ erased_at: string; lead_id: string }>(`/compliance/gdpr/erasure/${leadId}`, { method: 'POST' }),
  },
  violations: {
    list: (params?: { severity?: string; campaign_id?: string; from_date?: string }) =>
      apiFetch<ComplianceViolationOut[]>(`/compliance/violations${_qs(params)}`),
  },
};
