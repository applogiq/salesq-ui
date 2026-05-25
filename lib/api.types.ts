// ── Auth / User types ─────────────────────────────────────────────────────────

export type BackendRole = 'executive' | 'manager' | 'admin';
export type UIRole = 'executive' | 'team-lead' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: BackendRole;
  team_id: string | null;
  is_active: boolean;
  mfa_enabled: boolean;
  created_at?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

export interface LoginResponse extends TokenPair {
  // Backend returns just tokens; we fetch /auth/me separately
}

export interface SessionOut {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
  revoked_at: string | null;
}

export interface MFASetupOut {
  uri: string;
  qr_svg: string;
}

export interface AuditLogOut {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface TeamOut {
  id: string;
  name: string;
  region: string | null;
  manager_id: string | null;
  created_at: string;
}

export interface ApiError {
  status: number;
  detail: string;
}

// ── Telephony types ────────────────────────────────────────────────────────────

export interface PhoneNumber {
  id: string;
  number: string;
  telnyx_number_id: string;
  number_type: 'local' | 'toll_free' | 'mobile';
  country_code: string;
  region: string | null;
  status: 'active' | 'porting' | 'suspended' | 'released';
  sip_connection_id: string | null;
  telnyx_app_id: string | null;
  assignment_type: 'team' | 'user' | 'campaign' | 'pool' | null;
  assigned_team_id: string | null;
  assigned_user_id: string | null;
  assigned_campaign_id: string | null;
  monthly_cost_usd: number | null;
  purchased_at: string | null;
  released_at: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface NumberSearchResult {
  number: string;
  number_type: string;
  country_code: string;
  region: string | null;
  monthly_cost_usd: number;
}

export interface RoutingRule {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  rule_active: boolean;
  conditions: Array<{ field: string; operator: string; value: string }>;
  action: { type: string; [k: string]: unknown };
  campaign_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface IvrNode {
  id: string;
  campaign_id: string;
  node_type: 'greeting' | 'menu' | 'transfer' | 'hangup' | 'record';
  label: string;
  sequence_order: number;
  config: Record<string, unknown>;
  branches: Array<{ digit: string; next_node_id: string }>;
  is_active: boolean;
  created_at: string;
}

export interface WebhookHealth {
  event_type: string;
  total: number;
  failed: number;
  ok: number;
  retry: number;
}

export interface SipConnectionOut {
  id: string;
  telnyx_connection_id: string;
  name: string;
  sip_domain: string | null;
  username: string | null;
  transport: string;
  inbound_enabled: boolean;
  outbound_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

// ── Dialer types (Phase 4) ────────────────────────────────────────────────────

export type DialMode = 'predictive' | 'preview' | 'power' | 'manual';
export type DistributionStrategy = 'round_robin' | 'skill_based' | 'priority';

export interface CampaignQueueStatus {
  campaign_id: string;
  campaign_name: string;
  status: string;
  dial_mode: DialMode;
  concurrent_calls: number;
  queued: number;
  active: number;
  completed: number;
  failed: number;
  distribution_strategy: DistributionStrategy;
  dial_ratio: number;
  abandon_rate_target: number;
}

export interface DialerSettingsUpdate {
  dial_mode?: DialMode;
  concurrent_calls?: number;
  max_ring_seconds?: number;
  abandon_rate_target?: number;
  dial_ratio?: number;
  distribution_strategy?: DistributionStrategy;
  retry_rules?: string;
  voicemail_script?: string;
}

// ── Campaign types (Phase 5) ──────────────────────────────────────────────────

export interface CampaignOut {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  ai_agent_id: string;
  script: string;
  total_contacts: number;
  dialed_count: number;
  completed_count: number;
  created_at: string;
  scheduled_at: string | null;
  // Dialer
  dial_mode: string;
  concurrent_calls: number;
  distribution_strategy: string;
  // Scheduling
  campaign_timezone: string;
  calling_window_start: string | null;
  calling_window_end: string | null;
  calling_days: string | null;
  end_date: string | null;
  // Goals & cost
  goal_calls: number | null;
  goal_conversions: number | null;
  budget_usd: number | null;
  cost_per_minute_usd: number;
  spent_usd: number;
}

export interface CampaignCreate {
  name: string;
  ai_agent_id?: string;
  script?: string;
  scheduled_at?: string | null;
  dial_mode?: string;
  concurrent_calls?: number;
  distribution_strategy?: string;
  retry_rules?: string | null;
  voicemail_script?: string | null;
  campaign_timezone?: string;
  calling_window_start?: string | null;
  calling_window_end?: string | null;
  calling_days?: string | null;
  end_date?: string | null;
  goal_calls?: number | null;
  goal_conversions?: number | null;
  budget_usd?: number | null;
  cost_per_minute_usd?: number;
}

export interface CampaignMetrics {
  campaign_id: string;
  goal_calls: number | null;
  calls_made: number;
  goal_conversions: number | null;
  conversions: number;
  calls_pct: number;
  conversions_pct: number;
  budget_usd: number | null;
  spent_usd: number;
  budget_remaining_usd: number | null;
  cost_per_call: number | null;
  cost_per_conversion: number | null;
  revenue_usd: number;
  roi_percent: number | null;
  outcome_breakdown: Record<string, number>;
  days_elapsed: number | null;
  days_total: number | null;
}

// ── Phase 6 — Recording & Transcript types ───────────────────────────────────

export interface TranscriptSegment {
  id: string;
  speaker: 'agent' | 'contact';
  text: string;
  timestamp: number; // ms from call start
}

export interface RecordingMeta {
  call_id: string;
  recording_status: string | null;
  recording_s3_key: string | null;
  signed_url: string | null;
  signed_url_expires_seconds: number | null;
  recording_duration_ms: number | null;
  s3_expires_at: string | null;
  transcription_status: string | null;
}

export interface TranscriptSearchResult {
  call_id: string;
  campaign_id: string | null;
  lead_id: string | null;
  assigned_agent_id: string | null;
  started_at: string | null;
  duration_seconds: number | null;
  matched_segments: TranscriptSegment[];
  snippet: string;
  transcription_language: string | null;
}

export interface CampaignKeyword {
  id: string;
  campaign_id: string;
  keyword: string;
  is_regex: boolean;
  is_active: boolean;
  created_at: string;
}

export interface KeywordMatch {
  id: string;
  call_id: string;
  keyword_id: string;
  keyword_text: string;
  segment_id: string;
  speaker: string;
  timestamp_ms: number;
  match_context: string | null;
  created_at: string;
}

// ── Phase 7 — AI Analysis types ───────────────────────────────────────────────

export interface CallAnalysisOut {
  id: string;
  call_id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  error: string | null;
  provider: string | null;
  model: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  sentiment_score: number | null;       // -1.0 to +1.0
  intent: string | null;
  objections: Array<{ type: string; text: string; timestamp_ms: number }>;
  buying_signals: Array<{ signal: string; confidence: number }>;
  competitor_mentions: Array<{ name: string; sentiment: string }>;
  summary: string | null;
  action_items: string[];
  follow_up_suggestion: string | null;
  talk_ratio_agent: number | null;      // 0.0–1.0
  call_score: number | null;            // 0–100
  script_adherence: number | null;      // 0.0–1.0
  closing_probability: number | null;   // 0.0–1.0
  next_best_action: string | null;
  compliance_flags: Array<{ rule: string; severity: 'info' | 'warning' | 'critical'; text: string }>;
  created_at: string;
}

export interface LeadAiScoreOut {
  lead_id: string;
  ai_score: number | null;
  priority_rank: 'hot' | 'warm' | 'cold' | 'dormant' | null;
  ai_score_updated_at: string | null;
}

export interface AiAnalyticsSummary {
  calls_analyzed: number;
  calls_pending: number;
  calls_failed: number;
  avg_sentiment_score: number;          // -1.0 to +1.0
  avg_call_score: number;               // 0–100
  avg_closing_probability: number;      // 0.0–1.0
  top_objections: Array<{ type: string; count: number }>;
  top_buying_signals: Array<{ signal: string; count: number }>;
  competitor_mentions: Array<{ name: string; count: number; avg_sentiment: number }>;
  sentiment_trend: Array<{ date: string; avg_score: number }>;
  compliance_flag_count: number;
}

// ── Phase 8 — Coaching types ──────────────────────────────────────────────────

export interface CoachingSignal {
  id: string;
  call_id: string;
  agent_id: string | null;
  signal_type: 'suggestion' | 'objection' | 'silence' | 'fast_pace' | 'compliance';
  content: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  call_elapsed_seconds: number | null;
  llm_model: string | null;
  llm_latency_ms: number | null;
  llm_tokens: number | null;
  created_at: string;
}

// WebSocket script event (Phase 5)
export interface WsScriptEvent {
  type: 'call.script';
  call_id: string;
  campaign_id: string;
  script: string;
  contact_name: string | null;
}

// WebSocket dialer events
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

// ── Phase 9 — Live Monitoring, QA & Compliance ────────────────────────────────

export interface LiveAgentStatus {
  user_id: string;
  full_name: string | null;
  presence: 'online' | 'on_call' | 'offline';
  call_id: string | null;
  call_status: string | null;
  lead_name: string | null;
  campaign_name: string | null;
  duration_seconds: number | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  supervisor_id: string | null;
}

export interface QaScorecardCriterion {
  id: string;
  label: string;
  max_points: number;
  weight: number;
  category: string;
}

export interface QaAutoFailRule {
  rule: string;
  severity?: string;
  threshold?: number;
  auto_fail: boolean;
}

export interface QaScorecardOut {
  id: string;
  name: string;
  description: string | null;
  criteria: QaScorecardCriterion[];
  auto_fail_rules: QaAutoFailRule[];
  passing_score: number;
  campaign_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface QaReviewScore {
  criterion_id: string;
  score: number;
  note: string;
}

export interface QaReviewOut {
  id: string;
  call_id: string;
  scorecard_id: string | null;
  reviewer_id: string | null;
  status: string;
  scores: QaReviewScore[];
  total_score: number | null;
  passed: boolean | null;
  auto_failed: boolean;
  auto_fail_reason: string | null;
  override_score: number | null;
  notes: string | null;
  reviewed_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface QaSummary {
  total_reviews: number;
  passed: number;
  failed: number;
  auto_failed: number;
  avg_score: number;
  top_fail_reasons: Array<{ reason: string; count: number }>;
  score_trend: Array<{ date: string; avg: number }>;
}

export interface DncEntryOut {
  id: string;
  phone_number: string;
  reason: string | null;
  source: string;
  added_by_user_id: string | null;
  created_at: string;
}

export interface ConsentRecordOut {
  id: string;
  lead_id: string;
  call_id: string | null;
  consent_type: string;
  granted: boolean;
  method: string;
  captured_at: string;
  expires_at: string | null;
  notes: string | null;
}

export interface ComplianceViolationOut {
  call_id: string;
  agent_id: string | null;
  compliance_flags: Array<{ rule: string; severity: 'info' | 'warning' | 'critical'; text: string }>;
  call_score: number | null;
  created_at: string;
}

// ── Phase 10 — Omnichannel Communication ─────────────────────────────────────

export interface Thread {
  id: string;
  lead_id: string | null;
  contact_id: string | null;
  channel: 'sms' | 'whatsapp' | 'email';
  subject: string | null;
  status: 'open' | 'closed' | 'archived';
  assigned_agent_id: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  lead_id: string | null;
  channel: 'sms' | 'whatsapp' | 'email';
  direction: 'inbound' | 'outbound';
  sender_type: 'agent' | 'contact';
  sender_id: string | null;
  body: string;
  html_body: string | null;
  from_address: string;
  to_address: string;
  provider_message_id: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments: string | null;    // JSON array
  template_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  created_at: string;
}

export interface ThreadDetail {
  thread: Thread;
  messages: Message[];
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'any';
  subject: string | null;
  body: string;
  variables: string[];
  approval_status: 'draft' | 'approved' | 'rejected';
  approved_at: string | null;
  created_by_id: string | null;
  created_at: string;
}

export interface SendMessageIn {
  body: string;
  channel: 'sms' | 'whatsapp' | 'email';
  template_id?: string;
  variables?: Record<string, string>;
  from_address?: string;
}

export interface ThreadPatchIn {
  status?: 'open' | 'closed' | 'archived';
  assigned_agent_id?: string;
  subject?: string;
}
