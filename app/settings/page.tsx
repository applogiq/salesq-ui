'use client';

import { useEffect, useState } from 'react';
import {
  Settings, Palette, Phone, Mic, Shield, FileText,
  Globe, Bell, Plug, Sparkles, ChevronRight, Check,
  Save, AlertCircle, Trash2, Plus, Search, AlertTriangle, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { complianceApi } from '@/lib/api';
import type { DncEntryOut } from '@/lib/api.types';

// ── Types ──────────────────────────────────────────────────────────────────────

type SettingSection =
  | 'general' | 'branding' | 'dialer' | 'recording'
  | 'mfa' | 'compliance' | 'gdpr' | 'notifications' | 'integrations' | 'ai';

// ── Helpers ────────────────────────────────────────────────────────────────────

const inputCls = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-400 bg-white';
const labelCls = 'block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1';

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {desc && <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label, desc, value, onChange,
}: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-800">{label}</p>
        {desc && <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          'w-10 h-5 rounded-full transition-colors shrink-0 relative mt-0.5',
          value ? 'bg-cyan-500' : 'bg-slate-200',
        )}
      >
        <span className={cn(
          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
          value ? 'translate-x-5' : 'translate-x-0.5',
        )} />
      </button>
    </div>
  );
}

function SaveButton({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        onClick={onClick}
        disabled={saving}
        className={cn(
          'flex items-center gap-1.5 px-5 py-1.5 text-xs rounded-lg font-semibold transition-colors',
          saved
            ? 'bg-green-500 text-white'
            : 'bg-cyan-500 hover:bg-cyan-600 text-white disabled:opacity-50',
        )}
      >
        {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}

// ── Section content components ─────────────────────────────────────────────────

function GeneralSection() {
  const [form, setForm] = useState({
    org_name: 'Acme Sales Ltd',
    org_slug: 'acme-sales',
    contact_email: 'admin@acmesales.io',
    support_email: 'support@acmesales.io',
    timezone: 'America/New_York',
    date_format: 'MM/DD/YYYY',
    language: 'en-US',
    fiscal_year_start: '01',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Organization Details" desc="Basic information about your workspace">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Organization Name</label>
            <input value={form.org_name} onChange={(e) => set('org_name', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Workspace Slug</label>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <span className="px-3 py-2 text-xs text-slate-400 bg-slate-50 border-r border-slate-200">salesq.io/</span>
              <input value={form.org_slug} onChange={(e) => set('org_slug', e.target.value)}
                className="flex-1 text-xs px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-400" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Admin Contact Email</label>
            <input type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Support Email</label>
            <input type="email" value={form.support_email} onChange={(e) => set('support_email', e.target.value)} className={inputCls} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Locale & Preferences" desc="Regional and formatting defaults">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Default Timezone</label>
            <select value={form.timezone} onChange={(e) => set('timezone', e.target.value)} className={inputCls}>
              {['UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Asia/Kolkata', 'Asia/Singapore'].map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date Format</label>
            <select value={form.date_format} onChange={(e) => set('date_format', e.target.value)} className={inputCls}>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Language</label>
            <select value={form.language} onChange={(e) => set('language', e.target.value)} className={inputCls}>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Fiscal Year Start</label>
            <select value={form.fiscal_year_start} onChange={(e) => set('fiscal_year_start', e.target.value)} className={inputCls}>
              {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                <option key={m} value={m}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      <SaveButton onClick={save} saving={saving} saved={saved} />
    </div>
  );
}

function BrandingSection() {
  const [color, setColor] = useState('#06B6D4');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Brand Identity" desc="Customize the look and feel of your workspace">
        {/* Logo upload */}
        <div>
          <label className={labelCls}>Company Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 cursor-pointer hover:border-cyan-400 hover:bg-cyan-50 transition-colors">
              <div className="text-center">
                <Palette className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-[10px] text-slate-400">Upload</p>
              </div>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p>Accepted: PNG, SVG, JPG</p>
              <p>Max size: 2 MB</p>
              <p>Recommended: 200×200px</p>
            </div>
          </div>
        </div>

        {/* Brand color */}
        <div>
          <label className={labelCls}>Primary Brand Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
            />
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-32 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
            />
            <div className="flex gap-1.5">
              {['#06B6D4','#8B5CF6','#10B981','#F59E0B','#EF4444','#3B82F6'].map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => setColor(c)}
                  className={cn('w-6 h-6 rounded-full border-2 transition-all', color === c ? 'border-slate-400 scale-110' : 'border-transparent')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Email domain */}
        <div>
          <label className={labelCls}>Email Sender Domain</label>
          <div className="flex items-center gap-2">
            <input defaultValue="mail.acmesales.io" className={cn(inputCls, 'flex-1')} />
            <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-1.5 rounded-lg whitespace-nowrap">
              <Check className="w-3 h-3" /> Verified
            </span>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Portal Customization">
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
              <span className="text-white font-bold text-xs">SQ</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Preview</p>
              <p className="text-[10px] text-slate-500">Login page & navigation will use your brand color</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SaveButton onClick={save} saving={saving} saved={saved} />
    </div>
  );
}

function DialerSection() {
  const [settings, setSettings] = useState({
    default_mode: 'preview',
    max_attempts: '3',
    retry_delay_mins: '60',
    call_timeout_secs: '45',
    wrap_up_secs: '30',
    auto_advance: true,
    play_ringback: true,
    local_presence: false,
    amd_enabled: true,
  });

  const set = (k: keyof typeof settings, v: string | boolean) => setSettings((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Dialer Defaults" desc="Organization-wide defaults for all campaigns">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Default Dialing Mode</label>
            <select value={settings.default_mode} onChange={(e) => set('default_mode', e.target.value)} className={inputCls}>
              <option value="preview">Preview (manual dial)</option>
              <option value="progressive">Progressive (auto-advance)</option>
              <option value="predictive">Predictive (AI-optimized)</option>
              <option value="power">Power (fixed ratio)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Max Attempts per Lead</label>
            <input type="number" value={settings.max_attempts}
              onChange={(e) => set('max_attempts', e.target.value)} className={inputCls} min={1} max={20} />
          </div>
          <div>
            <label className={labelCls}>Retry Delay (minutes)</label>
            <input type="number" value={settings.retry_delay_mins}
              onChange={(e) => set('retry_delay_mins', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Call Timeout (seconds)</label>
            <input type="number" value={settings.call_timeout_secs}
              onChange={(e) => set('call_timeout_secs', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Wrap-up Time (seconds)</label>
            <input type="number" value={settings.wrap_up_secs}
              onChange={(e) => set('wrap_up_secs', e.target.value)} className={inputCls} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Dialer Behavior">
        <ToggleRow label="Auto-advance after disposition" desc="Move to next lead automatically after wrap-up"
          value={settings.auto_advance} onChange={(v) => set('auto_advance', v)} />
        <ToggleRow label="Play ringback tone" desc="Audible ring sound while connecting"
          value={settings.play_ringback} onChange={(v) => set('play_ringback', v)} />
        <ToggleRow label="Local Presence Dialing" desc="Match caller ID to lead's area code"
          value={settings.local_presence} onChange={(v) => set('local_presence', v)} />
        <ToggleRow label="Answering Machine Detection (AMD)" desc="Skip voicemails in predictive mode"
          value={settings.amd_enabled} onChange={(v) => set('amd_enabled', v)} />
      </SectionCard>

      <SaveButton onClick={save} saving={saving} saved={saved} />
    </div>
  );
}

function RecordingSection() {
  const [settings, setSettings] = useState({
    record_all: true,
    record_inbound: true,
    record_outbound: true,
    announce: true,
    storage_days: '90',
    auto_transcribe: true,
    ai_summary: true,
    pii_redaction: false,
  });

  const set = (k: keyof typeof settings, v: string | boolean) => setSettings((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Recording Policy" desc="Control what gets recorded across the organization">
        <ToggleRow label="Record All Calls" desc="Override individual settings"
          value={settings.record_all} onChange={(v) => set('record_all', v)} />
        <ToggleRow label="Record Inbound Calls"
          value={settings.record_inbound} onChange={(v) => set('record_inbound', v)} />
        <ToggleRow label="Record Outbound Calls"
          value={settings.record_outbound} onChange={(v) => set('record_outbound', v)} />
        <ToggleRow label="Announce Recording to Caller" desc="Play beep / announcement before recording"
          value={settings.announce} onChange={(v) => set('announce', v)} />

        <div>
          <label className={labelCls}>Recording Retention (days)</label>
          <input type="number" value={settings.storage_days}
            onChange={(e) => set('storage_days', e.target.value)} className={cn(inputCls, 'w-32')} />
          <p className="text-[10px] text-slate-400 mt-1">Recordings deleted after this period. Min 30 days.</p>
        </div>
      </SectionCard>

      <SectionCard title="AI Processing" desc="Post-call AI analysis settings">
        <ToggleRow label="Auto-Transcription" desc="Generate full transcript for every recorded call"
          value={settings.auto_transcribe} onChange={(v) => set('auto_transcribe', v)} />
        <ToggleRow label="AI Call Summary" desc="Generate AI summary with key insights"
          value={settings.ai_summary} onChange={(v) => set('ai_summary', v)} />
        <ToggleRow label="PII Redaction" desc="Automatically redact credit cards, SSNs in transcripts"
          value={settings.pii_redaction} onChange={(v) => set('pii_redaction', v)} />
      </SectionCard>

      <SaveButton onClick={save} saving={saving} saved={saved} />
    </div>
  );
}

function MfaPolicySection() {
  const [settings, setSettings] = useState({
    require_mfa_admin: true,
    require_mfa_manager: false,
    require_mfa_executive: false,
    session_timeout_mins: '480',
    max_sessions: '3',
    ip_whitelist_enabled: false,
    ip_whitelist: '',
  });

  const set = (k: keyof typeof settings, v: string | boolean) => setSettings((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <SectionCard title="MFA Requirements" desc="Enforce multi-factor authentication by role">
        <ToggleRow label="Require MFA for Admins" desc="All admin accounts must enable MFA"
          value={settings.require_mfa_admin} onChange={(v) => set('require_mfa_admin', v)} />
        <ToggleRow label="Require MFA for Managers"
          value={settings.require_mfa_manager} onChange={(v) => set('require_mfa_manager', v)} />
        <ToggleRow label="Require MFA for Executives"
          value={settings.require_mfa_executive} onChange={(v) => set('require_mfa_executive', v)} />
      </SectionCard>

      <SectionCard title="Session & Access Policy">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Session Timeout (minutes)</label>
            <input type="number" value={settings.session_timeout_mins}
              onChange={(e) => set('session_timeout_mins', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Max Concurrent Sessions</label>
            <input type="number" value={settings.max_sessions}
              onChange={(e) => set('max_sessions', e.target.value)} className={inputCls} min={1} max={10} />
          </div>
        </div>

        <ToggleRow label="IP Allowlist" desc="Restrict access to specific IP ranges"
          value={settings.ip_whitelist_enabled} onChange={(v) => set('ip_whitelist_enabled', v)} />

        {settings.ip_whitelist_enabled && (
          <div>
            <label className={labelCls}>Allowed IPs / CIDR Ranges</label>
            <textarea
              value={settings.ip_whitelist}
              onChange={(e) => set('ip_whitelist', e.target.value)}
              className={cn(inputCls, 'h-20 resize-none font-mono')}
              placeholder="192.168.1.0/24&#10;10.0.0.1"
            />
          </div>
        )}
      </SectionCard>

      <SaveButton onClick={save} saving={saving} saved={saved} />
    </div>
  );
}

function ComplianceSection() {
  const [settings, setSettings] = useState({
    tcpa_enabled: true,
    dnd_registry_check: true,
    call_window_start: '08:00',
    call_window_end: '21:00',
    weekend_calling: false,
    max_daily_attempts: '3',
    consent_required: false,
  });
  const set = (k: keyof typeof settings, v: string | boolean) => setSettings((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── DNC list state ─────────────────────────────────────────────────────────
  const [dncEntries, setDncEntries] = useState<DncEntryOut[]>([]);
  const [dncLoading, setDncLoading] = useState(true);
  const [dncPhone, setDncPhone] = useState('');
  const [dncReason, setDncReason] = useState('');
  const [dncAdding, setDncAdding] = useState(false);
  const [dncRemoving, setDncRemoving] = useState<string | null>(null);

  useEffect(() => {
    complianceApi.dnc.list()
      .then(setDncEntries)
      .catch(() => {})
      .finally(() => setDncLoading(false));
  }, []);

  const handleAddDnc = async () => {
    if (!dncPhone.trim()) return;
    setDncAdding(true);
    try {
      const entry = await complianceApi.dnc.add({
        phone_number: dncPhone.trim(),
        reason: dncReason.trim() || undefined,
      });
      setDncEntries((prev) => [entry, ...prev]);
      setDncPhone('');
      setDncReason('');
    } catch {}
    setDncAdding(false);
  };

  const handleRemoveDnc = async (id: string) => {
    setDncRemoving(id);
    try {
      await complianceApi.dnc.remove(id);
      setDncEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {}
    setDncRemoving(null);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-800">Compliance Notice</p>
          <p className="text-[10px] text-amber-700 mt-0.5">
            These settings help ensure TCPA/GDPR compliance. Consult legal counsel for your jurisdiction.
          </p>
        </div>
      </div>

      <SectionCard title="TCPA / Do Not Call" desc="Protect against regulatory violations">
        <ToggleRow label="TCPA Mode" desc="Block calls outside permitted hours and DNC numbers"
          value={settings.tcpa_enabled} onChange={(v) => set('tcpa_enabled', v)} />
        <ToggleRow label="National DNC Registry Check" desc="Auto-block numbers on national DNC lists"
          value={settings.dnd_registry_check} onChange={(v) => set('dnd_registry_check', v)} />
        <ToggleRow label="Allow Weekend Calling"
          value={settings.weekend_calling} onChange={(v) => set('weekend_calling', v)} />
        <ToggleRow label="Require Explicit Consent" desc="Block calls to contacts without logged consent"
          value={settings.consent_required} onChange={(v) => set('consent_required', v)} />
      </SectionCard>

      <SectionCard title="Calling Hours" desc="Restrict calling to permitted windows (lead's local time)">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Window Start</label>
            <input type="time" value={settings.call_window_start}
              onChange={(e) => set('call_window_start', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Window End</label>
            <input type="time" value={settings.call_window_end}
              onChange={(e) => set('call_window_end', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Max Daily Attempts</label>
            <input type="number" value={settings.max_daily_attempts}
              onChange={(e) => set('max_daily_attempts', e.target.value)}
              className={inputCls} min={1} max={10} />
          </div>
        </div>
      </SectionCard>

      {/* ── DNC List Management ──────────────────────────────────────────────── */}
      <SectionCard title="DNC List" desc="Numbers on this list will never be dialed by the platform">
        {/* Add number form */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className={labelCls}>Phone Number (E.164)</label>
            <input
              value={dncPhone}
              onChange={(e) => setDncPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDnc()}
              placeholder="+15555550100"
              className={inputCls}
            />
          </div>
          <div className="flex-1">
            <label className={labelCls}>Reason (optional)</label>
            <input
              value={dncReason}
              onChange={(e) => setDncReason(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDnc()}
              placeholder="Customer request, TCPA complaint…"
              className={inputCls}
            />
          </div>
          <button
            onClick={handleAddDnc}
            disabled={!dncPhone.trim() || dncAdding}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            {dncAdding
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Plus className="w-3.5 h-3.5" />
            }
            Add
          </button>
        </div>

        {/* DNC entries table */}
        {dncLoading ? (
          <div className="space-y-2 mt-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : dncEntries.length === 0 ? (
          <p className="text-[11px] text-slate-400 text-center py-4">No numbers on the DNC list.</p>
        ) : (
          <div className="overflow-auto max-h-64 rounded-lg border border-slate-100">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-3 py-2">Number</th>
                  <th className="text-left px-3 py-2">Reason</th>
                  <th className="text-left px-3 py-2">Source</th>
                  <th className="text-left px-3 py-2">Added</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dncEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-mono font-semibold text-slate-800">{entry.phone_number}</td>
                    <td className="px-3 py-2 text-slate-600">{entry.reason ?? '—'}</td>
                    <td className="px-3 py-2">
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 text-slate-600 font-medium">
                        {entry.source}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleRemoveDnc(entry.id)}
                        disabled={dncRemoving === entry.id}
                        className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Remove from DNC list"
                      >
                        {dncRemoving === entry.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[10px] text-slate-400">
          {dncEntries.length} number{dncEntries.length !== 1 ? 's' : ''} blocked · Removing reinstates dialing ability
        </p>
      </SectionCard>

      <SaveButton onClick={save} saving={saving} saved={saved} />
    </div>
  );
}

function GdprSection() {
  const [settings, setSettings] = useState({
    data_retention_days: '365',
    right_to_erasure: true,
    data_portability: true,
    consent_logging: true,
    dpa_signed: true,
    privacy_policy_url: 'https://acmesales.io/privacy',
  });
  const set = (k: keyof typeof settings, v: string | boolean) => setSettings((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Data Subject Request state ─────────────────────────────────────────────
  const [dsrLeadId, setDsrLeadId] = useState('');
  const [dsrLoading, setDsrLoading] = useState(false);
  const [dsrResult, setDsrResult] = useState<Record<string, unknown> | null>(null);
  const [dsrError, setDsrError] = useState<string | null>(null);
  const [confirmErase, setConfirmErase] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [erasedAt, setErasedAt] = useState<string | null>(null);

  const handleAccess = async () => {
    if (!dsrLeadId.trim()) return;
    setDsrLoading(true);
    setDsrResult(null);
    setDsrError(null);
    setErasedAt(null);
    try {
      const data = await complianceApi.gdpr.access(dsrLeadId.trim());
      setDsrResult(data as Record<string, unknown>);
    } catch {
      setDsrError('No data found for that Lead ID, or an error occurred.');
    }
    setDsrLoading(false);
  };

  const handleErase = async () => {
    if (!dsrLeadId.trim()) return;
    setErasing(true);
    try {
      const res = await complianceApi.gdpr.erase(dsrLeadId.trim());
      setErasedAt(res.erased_at);
      setDsrResult(null);
      setConfirmErase(false);
    } catch {
      setDsrError('Erasure failed. Check the Lead ID and try again.');
    }
    setErasing(false);
  };

  const dsrLead = dsrResult
    ? (dsrResult as { lead?: { first_name?: string; last_name?: string; email?: string } }).lead
    : null;

  return (
    <div className="space-y-4">
      <SectionCard title="Data Governance" desc="GDPR and data protection settings">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Data Retention (days)</label>
            <input type="number" value={settings.data_retention_days}
              onChange={(e) => set('data_retention_days', e.target.value)} className={inputCls} />
            <p className="text-[10px] text-slate-400 mt-1">Inactive leads purged after this period</p>
          </div>
          <div>
            <label className={labelCls}>Privacy Policy URL</label>
            <input value={settings.privacy_policy_url}
              onChange={(e) => set('privacy_policy_url', e.target.value)} className={inputCls} />
          </div>
        </div>
        <ToggleRow label="Right to Erasure" desc="Allow subjects to request data deletion"
          value={settings.right_to_erasure} onChange={(v) => set('right_to_erasure', v)} />
        <ToggleRow label="Data Portability" desc="Allow export of all personal data on request"
          value={settings.data_portability} onChange={(v) => set('data_portability', v)} />
        <ToggleRow label="Consent Logging" desc="Record when and how consent was obtained"
          value={settings.consent_logging} onChange={(v) => set('consent_logging', v)} />
        <ToggleRow label="DPA Signed" desc="Data Processing Agreement on file"
          value={settings.dpa_signed} onChange={(v) => set('dpa_signed', v)} />
      </SectionCard>

      {/* ── Data Subject Requests ─────────────────────────────────────────────── */}
      <SectionCard title="Data Subject Requests" desc="Right-to-access and right-to-erasure (GDPR Articles 15 & 17)">
        {/* Lead ID search */}
        <div>
          <label className={labelCls}>Lead ID</label>
          <div className="flex items-center gap-2">
            <input
              value={dsrLeadId}
              onChange={(e) => { setDsrLeadId(e.target.value); setDsrResult(null); setDsrError(null); setErasedAt(null); setConfirmErase(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAccess()}
              placeholder="Enter lead UUID…"
              className={cn(inputCls, 'flex-1 font-mono text-[11px]')}
            />
            <button
              onClick={handleAccess}
              disabled={!dsrLeadId.trim() || dsrLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              {dsrLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Search className="w-3.5 h-3.5" />
              }
              Fetch Data
            </button>
          </div>
        </div>

        {/* Error */}
        {dsrError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700">{dsrError}</p>
          </div>
        )}

        {/* Erasure confirmed */}
        {erasedAt && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-green-800">Data erased successfully</p>
              <p className="text-[10px] text-green-700 mt-0.5">
                Completed at {new Date(erasedAt).toLocaleString()} — PII nullified, transcripts redacted, consents revoked.
              </p>
            </div>
          </div>
        )}

        {/* Data summary result */}
        {dsrResult && dsrLead && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {dsrLead.first_name} {dsrLead.last_name}
                </p>
                <p className="text-[10px] text-slate-500">{dsrLead.email}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{dsrLeadId}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {/* Download / export (informational) */}
                <span className="flex items-center gap-1 text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-600 font-medium">
                  {(dsrResult as { calls?: unknown[] }).calls
                    ? `${(dsrResult as { calls: unknown[] }).calls.length} calls`
                    : '0 calls'}
                </span>
                <span className="flex items-center gap-1 text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-600 font-medium">
                  {(dsrResult as { notes?: unknown[] }).notes
                    ? `${(dsrResult as { notes: unknown[] }).notes.length} notes`
                    : '0 notes'}
                </span>
              </div>
            </div>

            {/* Erase section */}
            {!confirmErase ? (
              <button
                onClick={() => setConfirmErase(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Request Erasure (GDPR Art. 17)
              </button>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-red-800">Confirm Irreversible Erasure</p>
                <p className="text-[10px] text-red-700">
                  This will permanently nullify all PII fields, redact transcript text, and revoke all consent records for this lead. This action cannot be undone.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleErase}
                    disabled={erasing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {erasing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {erasing ? 'Erasing…' : 'Confirm Erase'}
                  </button>
                  <button
                    onClick={() => setConfirmErase(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SaveButton onClick={save} saving={saving} saved={saved} />
    </div>
  );
}

function NotificationsSection() {
  const EVENTS = [
    'New lead assigned',
    'Lead stage change',
    'Call completed',
    'Follow-up due',
    'Import completed',
    'User invited',
    'MFA disabled',
    'Billing alert',
  ];
  const CHANNELS = ['In-app', 'Email', 'Slack', 'Webhook'];

  const [matrix, setMatrix] = useState<Record<string, Set<string>>>(() => {
    const m: Record<string, Set<string>> = {};
    EVENTS.forEach((e) => { m[e] = new Set(['In-app']); });
    m['Billing alert'] = new Set(['In-app', 'Email']);
    m['MFA disabled'] = new Set(['In-app', 'Email']);
    return m;
  });

  const toggle = (event: string, channel: string) => {
    setMatrix((prev) => {
      const next = new Set(prev[event]);
      if (next.has(channel)) next.delete(channel); else next.add(channel);
      return { ...prev, [event]: next };
    });
  };

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Notification Matrix" desc="Configure which events trigger which channels">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-2 pr-4">Event</th>
                {CHANNELS.map((c) => (
                  <th key={c} className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-2 px-3">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {EVENTS.map((event) => (
                <tr key={event} className="hover:bg-slate-50">
                  <td className="py-2 pr-4 text-slate-700 font-medium">{event}</td>
                  {CHANNELS.map((channel) => (
                    <td key={channel} className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={matrix[event]?.has(channel) ?? false}
                        onChange={() => toggle(event, channel)}
                        className="accent-cyan-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Webhook Endpoint" desc="POST all events to your endpoint">
        <div>
          <label className={labelCls}>Webhook URL</label>
          <input defaultValue="https://hooks.acmesales.io/salesq" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Secret Token</label>
          <input type="password" defaultValue="••••••••••••••••" className={inputCls} />
        </div>
      </SectionCard>

      <SaveButton onClick={save} saving={saving} saved={saved} />
    </div>
  );
}

function IntegrationsSection() {
  const integrations = [
    { name: 'Salesforce CRM', logo: '☁️', status: 'connected', desc: 'Bi-directional lead sync', color: 'text-blue-600' },
    { name: 'HubSpot',        logo: '🟠', status: 'connected', desc: 'Contact & deal sync',     color: 'text-orange-600' },
    { name: 'Slack',          logo: '💬', status: 'connected', desc: 'Notifications & alerts',  color: 'text-purple-600' },
    { name: 'Zapier',         logo: '⚡', status: 'available', desc: '5,000+ app connections',  color: 'text-amber-600' },
    { name: 'Telnyx',         logo: '📞', status: 'connected', desc: 'Telephony provider',      color: 'text-cyan-600' },
    { name: 'OpenAI',         logo: '🤖', status: 'connected', desc: 'AI transcription & coach',color: 'text-green-600' },
    { name: 'Stripe',         logo: '💳', status: 'available', desc: 'Billing integration',     color: 'text-indigo-600' },
    { name: 'Google Calendar', logo: '📅', status: 'available', desc: 'Schedule sync',          color: 'text-red-600' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {integrations.map((i) => (
          <div key={i.name} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl shrink-0">
              {i.logo}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-900">{i.name}</p>
                <span className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                  i.status === 'connected' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500',
                )}>
                  {i.status === 'connected' ? '● Connected' : 'Available'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{i.desc}</p>
              <button className={cn(
                'mt-2 text-[10px] font-semibold',
                i.status === 'connected' ? 'text-red-500 hover:text-red-600' : 'text-cyan-600 hover:text-cyan-700',
              )}>
                {i.status === 'connected' ? 'Disconnect' : 'Connect →'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiSection() {
  const [settings, setSettings] = useState({
    llm_provider: 'openai',
    llm_model: 'gpt-4o',
    coaching_enabled: true,
    coaching_realtime: true,
    coaching_post_call: true,
    sentiment_analysis: true,
    call_scoring: true,
    script_adherence: false,
    coaching_style: 'balanced',
  });

  const set = (k: keyof typeof settings, v: string | boolean) => setSettings((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <SectionCard title="AI Provider" desc="Configure your language model settings">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>LLM Provider</label>
            <select value={settings.llm_provider} onChange={(e) => set('llm_provider', e.target.value)} className={inputCls}>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="google">Google (Gemini)</option>
              <option value="custom">Custom / Self-hosted</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Model</label>
            <select value={settings.llm_model} onChange={(e) => set('llm_model', e.target.value)} className={inputCls}>
              {settings.llm_provider === 'openai' && (
                <>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </>
              )}
              {settings.llm_provider === 'anthropic' && (
                <>
                  <option value="claude-opus-4-5">Claude Opus 4.5</option>
                  <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
                  <option value="claude-haiku-3-5">Claude Haiku 3.5</option>
                </>
              )}
              {settings.llm_provider === 'google' && (
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              )}
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Coaching Behavior" desc="Configure AI coaching features">
        <ToggleRow label="Enable AI Coaching" desc="Real-time and post-call AI assistance"
          value={settings.coaching_enabled} onChange={(v) => set('coaching_enabled', v)} />
        <ToggleRow label="Real-time Coaching" desc="Live hints and prompts during calls"
          value={settings.coaching_realtime} onChange={(v) => set('coaching_realtime', v)} />
        <ToggleRow label="Post-call Coaching" desc="Detailed feedback after each call"
          value={settings.coaching_post_call} onChange={(v) => set('coaching_post_call', v)} />
        <ToggleRow label="Sentiment Analysis" desc="Detect customer mood and engagement"
          value={settings.sentiment_analysis} onChange={(v) => set('sentiment_analysis', v)} />
        <ToggleRow label="Automated Call Scoring" desc="AI scores calls on quality rubric"
          value={settings.call_scoring} onChange={(v) => set('call_scoring', v)} />
        <ToggleRow label="Script Adherence Tracking" desc="Flag deviations from approved scripts"
          value={settings.script_adherence} onChange={(v) => set('script_adherence', v)} />

        <div>
          <label className={labelCls}>Coaching Style</label>
          <div className="flex gap-2 mt-1">
            {[
              { value: 'supportive', label: 'Supportive', desc: 'Encouraging, gentle feedback' },
              { value: 'balanced',   label: 'Balanced',   desc: 'Mix of positive & corrective' },
              { value: 'direct',     label: 'Direct',     desc: 'Focused on improvement' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('coaching_style', opt.value)}
                className={cn(
                  'flex-1 p-2.5 text-left rounded-xl border-2 transition-colors',
                  settings.coaching_style === opt.value
                    ? 'border-cyan-400 bg-cyan-50'
                    : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <p className="text-[10px] font-bold text-slate-800">{opt.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SaveButton onClick={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: Array<{ id: SettingSection; label: string; icon: React.ElementType; desc: string }> = [
  { id: 'general',       label: 'General',         icon: Settings,   desc: 'Org name, timezone, locale' },
  { id: 'branding',      label: 'Branding',         icon: Palette,    desc: 'Logo, colors, email domain' },
  { id: 'dialer',        label: 'Dialer Defaults',  icon: Phone,      desc: 'Mode, attempts, timing' },
  { id: 'recording',     label: 'Recording',        icon: Mic,        desc: 'Policy, retention, AI' },
  { id: 'mfa',           label: 'MFA Policy',       icon: Shield,     desc: 'Auth requirements, sessions' },
  { id: 'compliance',    label: 'Compliance',       icon: FileText,   desc: 'TCPA, DNC, calling hours' },
  { id: 'gdpr',          label: 'GDPR',             icon: Globe,      desc: 'Data governance, consent' },
  { id: 'notifications', label: 'Notifications',    icon: Bell,       desc: 'Events, channels, webhooks' },
  { id: 'integrations',  label: 'Integrations',     icon: Plug,       desc: 'CRM, telephony, AI' },
  { id: 'ai',            label: 'AI Settings',      icon: Sparkles,   desc: 'LLM, coaching, scoring' },
];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WorkspaceSettingsPage() {
  const [active, setActive] = useState<SettingSection>('general');

  const renderSection = () => {
    switch (active) {
      case 'general':       return <GeneralSection />;
      case 'branding':      return <BrandingSection />;
      case 'dialer':        return <DialerSection />;
      case 'recording':     return <RecordingSection />;
      case 'mfa':           return <MfaPolicySection />;
      case 'compliance':    return <ComplianceSection />;
      case 'gdpr':          return <GdprSection />;
      case 'notifications': return <NotificationsSection />;
      case 'integrations':  return <IntegrationsSection />;
      case 'ai':            return <AiSection />;
    }
  };

  const activeItem = NAV_ITEMS.find((n) => n.id === active)!;

  return (
    <div className="flex gap-4 h-full">

      {/* Left sidebar */}
      <div className="w-56 shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900">Workspace Settings</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Acme Sales Ltd</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors',
                  active === item.id
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'text-slate-600 hover:bg-slate-50',
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active === item.id ? 'text-cyan-600' : 'text-slate-400')} />
                <span className="text-xs font-medium">{item.label}</span>
                {active === item.id && <ChevronRight className="w-3 h-3 text-cyan-400 ml-auto" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="mb-4">
          <h1 className="text-base font-semibold text-slate-900">{activeItem.label}</h1>
          <p className="text-xs text-slate-500">{activeItem.desc}</p>
        </div>
        {renderSection()}
      </div>
    </div>
  );
}
