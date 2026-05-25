'use client';

import { useState } from 'react';
import {
  X, ChevronRight, ChevronLeft, Check, Upload,
  User as UserIcon, Shield, Users, Star, Megaphone, Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usersApi, teamsApi } from '@/lib/api';
import type { User, TeamOut } from '@/lib/api.types';

// ── Permission groups for role editor ─────────────────────────────────────────

const PERM_GROUPS = [
  {
    label: 'Calls',
    perms: [
      { key: 'call:view',    label: 'View calls' },
      { key: 'call:create',  label: 'Make calls' },
      { key: 'call:listen',  label: 'Listen / Monitor' },
      { key: 'call:whisper', label: 'Whisper coach' },
      { key: 'call:barge',   label: 'Barge in' },
    ],
  },
  {
    label: 'Leads',
    perms: [
      { key: 'lead:view',   label: 'View leads' },
      { key: 'lead:create', label: 'Create leads' },
      { key: 'lead:edit',   label: 'Edit leads' },
      { key: 'lead:delete', label: 'Delete leads' },
      { key: 'lead:import', label: 'Import CSV' },
      { key: 'lead:export', label: 'Export CSV' },
      { key: 'lead:dnd',    label: 'Set DND' },
    ],
  },
  {
    label: 'Campaigns',
    perms: [
      { key: 'campaign:view',   label: 'View campaigns' },
      { key: 'campaign:create', label: 'Create campaigns' },
      { key: 'campaign:edit',   label: 'Edit campaigns' },
      { key: 'campaign:delete', label: 'Delete campaigns' },
    ],
  },
  {
    label: 'Users & Teams',
    perms: [
      { key: 'user:view',      label: 'View users' },
      { key: 'user:invite',    label: 'Invite users' },
      { key: 'user:edit_role', label: 'Change roles' },
      { key: 'team:manage',    label: 'Manage teams' },
    ],
  },
  {
    label: 'Analytics',
    perms: [
      { key: 'analytics:view',   label: 'View reports' },
      { key: 'analytics:export', label: 'Export reports' },
      { key: 'audit:view',       label: 'View audit log' },
    ],
  },
  {
    label: 'Telephony',
    perms: [
      { key: 'phone:view',   label: 'View numbers' },
      { key: 'phone:manage', label: 'Manage numbers' },
    ],
  },
];

const ROLE_PRESETS: Record<string, Set<string>> = {
  executive: new Set([
    'call:view', 'call:create', 'campaign:view',
    'lead:view', 'lead:create', 'lead:edit',
    'analytics:view', 'session:revoke_own',
  ]),
  manager: new Set([
    'call:view', 'call:create', 'call:listen', 'call:whisper',
    'campaign:view', 'campaign:create', 'campaign:edit',
    'lead:view', 'lead:create', 'lead:edit', 'lead:delete',
    'lead:import', 'lead:export', 'lead:dnd',
    'user:view', 'analytics:view', 'analytics:export',
    'audit:view', 'phone:view', 'phone:manage', 'session:revoke_own',
  ]),
  admin: new Set(PERM_GROUPS.flatMap(g => g.perms.map(p => p.key))),
};

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Toronto', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore',
  'Asia/Tokyo', 'Australia/Sydney',
];

const SKILLS_OPTIONS = [
  'Cold Calling', 'Objection Handling', 'Product Demo', 'Upselling',
  'CRM Tools', 'Lead Qualification', 'Negotiation', 'Customer Retention',
];
const LANGUAGE_OPTIONS = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Arabic', 'Mandarin', 'Portuguese'];
const INDUSTRY_OPTIONS = ['SaaS', 'FinTech', 'HealthTech', 'E-commerce', 'Real Estate', 'EdTech', 'Retail', 'Manufacturing'];

// ── Wizard steps ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Profile',    icon: UserIcon    },
  { id: 2, label: 'Role',       icon: Shield      },
  { id: 3, label: 'Team',       icon: Users       },
  { id: 4, label: 'Skills',     icon: Star        },
  { id: 5, label: 'Campaigns',  icon: Megaphone   },
  { id: 6, label: 'Telephony',  icon: Phone       },
];

// ── Form state ────────────────────────────────────────────────────────────────

interface WizardForm {
  // Step 1 - Profile
  full_name: string;
  email: string;
  job_title: string;
  mobile: string;
  timezone: string;
  password: string;
  // Step 2 - Role
  role: 'executive' | 'manager' | 'admin';
  customPerms: Set<string>;
  useCustomPerms: boolean;
  // Step 3 - Team
  team_id: string;
  reports_to: string;
  start_date: string;
  working_hours: string;
  // Step 4 - Skills
  skills: string[];
  languages: string[];
  industries: string[];
  // Step 5 - Campaigns (just note, no API yet)
  campaignNotes: string;
  // Step 6 - Telephony
  record_calls: boolean;
  predictive_dialing: boolean;
  voicemail_drop: boolean;
  auto_transcribe: boolean;
  caller_id: string;
  extension: string;
}

function defaultForm(): WizardForm {
  return {
    full_name: '', email: '', job_title: '', mobile: '',
    timezone: 'UTC', password: 'Salesq@2026!',
    role: 'executive', customPerms: new Set(ROLE_PRESETS.executive), useCustomPerms: false,
    team_id: '', reports_to: '', start_date: '', working_hours: 'Mon–Fri · 9:00–18:00',
    skills: [], languages: [], industries: [],
    campaignNotes: '',
    record_calls: true, predictive_dialing: false,
    voicemail_drop: false, auto_transcribe: true,
    caller_id: '', extension: '',
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  teams: TeamOut[];
  users: User[];   // for reports-to selector
  onClose: () => void;
  onCreated: (user: User) => void;
}

// ── Reusable field helpers ────────────────────────────────────────────────────

const inputCls = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-400 bg-white';
const labelCls = 'block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1';

function TagToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 text-[10px] font-semibold rounded-full border transition-colors',
        active
          ? 'bg-cyan-500 border-cyan-500 text-white'
          : 'border-slate-200 text-slate-500 hover:border-cyan-300 hover:text-cyan-600',
      )}
    >
      {label}
    </button>
  );
}

// ── Step renderers ────────────────────────────────────────────────────────────

function StepProfile({ form, set }: { form: WizardForm; set: (k: keyof WizardForm, v: any) => void }) {
  return (
    <div className="space-y-4">
      {/* Avatar placeholder */}
      <div className="flex items-center gap-4 pb-2 border-b border-slate-100">
        <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center border-2 border-dashed border-cyan-300 cursor-pointer hover:bg-cyan-50 transition-colors">
          <Upload className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-700">Profile Photo</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Upload JPG or PNG · max 2 MB</p>
          <button type="button" className="text-[10px] text-cyan-500 hover:underline mt-1">Choose file</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Full Name *</label>
          <input
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            className={inputCls} placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className={labelCls}>Email *</label>
          <input
            type="email" value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className={inputCls} placeholder="jane@company.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Job Title</label>
          <input
            value={form.job_title}
            onChange={(e) => set('job_title', e.target.value)}
            className={inputCls} placeholder="Sales Executive"
          />
        </div>
        <div>
          <label className={labelCls}>Mobile</label>
          <input
            value={form.mobile}
            onChange={(e) => set('mobile', e.target.value)}
            className={inputCls} placeholder="+1 555 000 0000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Timezone</label>
          <select value={form.timezone} onChange={(e) => set('timezone', e.target.value)} className={inputCls}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Temporary Password</label>
          <input
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      <p className="text-[10px] text-slate-400">User will be prompted to change password on first login.</p>
    </div>
  );
}

function StepRole({ form, set }: { form: WizardForm; set: (k: keyof WizardForm, v: any) => void }) {
  const roleOptions: Array<{ value: 'executive' | 'manager' | 'admin'; label: string; desc: string; color: string }> = [
    { value: 'executive', label: 'Executive', desc: 'Sales rep · view & edit own leads, make calls', color: 'border-cyan-400 bg-cyan-50' },
    { value: 'manager',   label: 'Manager',   desc: 'Team lead · import/export, monitor calls, manage teams', color: 'border-amber-400 bg-amber-50' },
    { value: 'admin',     label: 'Admin',     desc: 'Full access · all permissions + user management', color: 'border-purple-400 bg-purple-50' },
  ];

  const togglePerm = (key: string) => {
    const next = new Set(form.customPerms);
    if (next.has(key)) next.delete(key); else next.add(key);
    set('customPerms', next);
  };

  const selectRole = (role: 'executive' | 'manager' | 'admin') => {
    set('role', role);
    set('customPerms', new Set(ROLE_PRESETS[role]));
    set('useCustomPerms', false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {roleOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => selectRole(opt.value)}
            className={cn(
              'w-full text-left p-3 rounded-xl border-2 transition-colors',
              form.role === opt.value && !form.useCustomPerms
                ? opt.color
                : 'border-slate-200 hover:border-slate-300',
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800">{opt.label}</p>
              {form.role === opt.value && !form.useCustomPerms && (
                <Check className="w-4 h-4 text-cyan-600" />
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
          </button>
        ))}

        {/* Custom */}
        <button
          type="button"
          onClick={() => set('useCustomPerms', true)}
          className={cn(
            'w-full text-left p-3 rounded-xl border-2 transition-colors',
            form.useCustomPerms ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300',
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-800">Custom</p>
            {form.useCustomPerms && <Check className="w-4 h-4 text-indigo-600" />}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Granular permission selection below</p>
        </button>
      </div>

      {/* Permission checkboxes (shown for custom or always visible as reference) */}
      <div className="border border-slate-200 rounded-xl p-3 space-y-3 max-h-48 overflow-auto">
        {PERM_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">{group.label}</p>
            <div className="grid grid-cols-2 gap-1">
              {group.perms.map((p) => {
                const checked = form.useCustomPerms
                  ? form.customPerms.has(p.key)
                  : ROLE_PRESETS[form.role]?.has(p.key) ?? false;
                return (
                  <label
                    key={p.key}
                    className={cn(
                      'flex items-center gap-1.5 text-[10px] cursor-pointer',
                      !form.useCustomPerms && 'opacity-60 cursor-default',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => form.useCustomPerms && togglePerm(p.key)}
                      disabled={!form.useCustomPerms}
                      className="accent-cyan-500 w-3 h-3"
                    />
                    <span className={checked ? 'text-slate-700' : 'text-slate-400'}>{p.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepTeam({ form, set, teams, users }: {
  form: WizardForm; set: (k: keyof WizardForm, v: any) => void;
  teams: TeamOut[]; users: User[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Team</label>
          <select value={form.team_id} onChange={(e) => set('team_id', e.target.value)} className={inputCls}>
            <option value="">— No team —</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Reports To</label>
          <select value={form.reports_to} onChange={(e) => set('reports_to', e.target.value)} className={inputCls}>
            <option value="">— Direct report —</option>
            {users.filter((u) => u.role === 'manager' || u.role === 'admin').map((u) => (
              <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Start Date</label>
          <input
            type="date" value={form.start_date}
            onChange={(e) => set('start_date', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Working Hours</label>
          <select value={form.working_hours} onChange={(e) => set('working_hours', e.target.value)} className={inputCls}>
            {[
              'Mon–Fri · 9:00–17:00',
              'Mon–Fri · 9:00–18:00',
              'Mon–Fri · 8:00–16:00',
              'Mon–Sat · 9:00–18:00',
              'Sun–Thu · 9:00–18:00',
              'Flexible',
            ].map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Assignment Preview</p>
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Team</span>
            <span className="font-medium">{teams.find((t) => t.id === form.team_id)?.name ?? 'Unassigned'}</span>
          </div>
          <div className="flex justify-between">
            <span>Working hours</span>
            <span className="font-medium">{form.working_hours}</span>
          </div>
          {form.start_date && (
            <div className="flex justify-between">
              <span>Start date</span>
              <span className="font-medium">{new Date(form.start_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepSkills({ form, set }: { form: WizardForm; set: (k: keyof WizardForm, v: any) => void }) {
  const toggle = (list: 'skills' | 'languages' | 'industries', val: string) => {
    const cur = form[list] as string[];
    set(list, cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]);
  };

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Skills</label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {SKILLS_OPTIONS.map((s) => (
            <TagToggle key={s} label={s} active={form.skills.includes(s)} onClick={() => toggle('skills', s)} />
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Languages</label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {LANGUAGE_OPTIONS.map((l) => (
            <TagToggle key={l} label={l} active={form.languages.includes(l)} onClick={() => toggle('languages', l)} />
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Industry Experience</label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {INDUSTRY_OPTIONS.map((i) => (
            <TagToggle key={i} label={i} active={form.industries.includes(i)} onClick={() => toggle('industries', i)} />
          ))}
        </div>
      </div>

      {(form.skills.length > 0 || form.languages.length > 0 || form.industries.length > 0) && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500">
          Profile will display: {[...form.skills, ...form.languages, ...form.industries].join(', ')}
        </div>
      )}
    </div>
  );
}

function StepCampaigns({ form, set }: { form: WizardForm; set: (k: keyof WizardForm, v: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs font-semibold text-amber-800">Campaign Assignment</p>
        <p className="text-[10px] text-amber-700 mt-1">
          Campaign assignments are managed from the Campaigns module. You can assign this user to campaigns
          after they're created. Any notes you add here will be saved to the user's profile.
        </p>
      </div>

      <div>
        <label className={labelCls}>Assignment Notes (optional)</label>
        <textarea
          value={form.campaignNotes}
          onChange={(e) => set('campaignNotes', e.target.value)}
          className={cn(inputCls, 'h-28 resize-none')}
          placeholder="e.g. Assign to North America outbound campaigns, priority on enterprise leads…"
        />
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Next Steps</p>
        <ul className="space-y-1 text-[10px] text-slate-500 list-disc list-inside">
          <li>User will be created with selected role</li>
          <li>Go to Campaigns → assign this user</li>
          <li>Set call quotas and dialing targets</li>
        </ul>
      </div>
    </div>
  );
}

function StepTelephony({ form, set }: { form: WizardForm; set: (k: keyof WizardForm, v: any) => void }) {
  const Toggle = ({ field, label, desc }: { field: keyof WizardForm; label: string; desc: string }) => (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-xs font-semibold text-slate-800">{label}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => set(field, !(form[field] as boolean))}
        className={cn(
          'w-10 h-5 rounded-full transition-colors shrink-0 relative',
          form[field] ? 'bg-cyan-500' : 'bg-slate-200',
        )}
      >
        <span className={cn(
          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
          form[field] ? 'translate-x-5' : 'translate-x-0.5',
        )} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Caller ID Override</label>
          <input
            value={form.caller_id}
            onChange={(e) => set('caller_id', e.target.value)}
            className={inputCls} placeholder="+1 555 000 0000"
          />
          <p className="text-[10px] text-slate-400 mt-0.5">Leave blank to use team/campaign default</p>
        </div>
        <div>
          <label className={labelCls}>Extension</label>
          <input
            value={form.extension}
            onChange={(e) => set('extension', e.target.value)}
            className={inputCls} placeholder="101"
          />
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl px-4 divide-y divide-slate-100">
        <Toggle field="record_calls"       label="Record Calls"        desc="All outbound calls will be recorded" />
        <Toggle field="predictive_dialing" label="Predictive Dialing"  desc="Auto-dial next lead when available" />
        <Toggle field="voicemail_drop"     label="Voicemail Drop"      desc="Drop pre-recorded voicemail on no-answer" />
        <Toggle field="auto_transcribe"    label="Auto Transcribe"     desc="AI transcription for every call" />
      </div>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export default function AddUserWizard({ teams, users, onClose, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof WizardForm, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const canNext = () => {
    if (step === 1) return form.email.trim() !== '' && form.full_name.trim() !== '';
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    setError(null);
    try {
      const user = await usersApi.invite({
        email: form.email.trim(),
        full_name: form.full_name.trim() || undefined,
        role: form.role,
        team_id: form.team_id || undefined,
        password: form.password,
      });
      onCreated(user);
      onClose();
    } catch (e: any) {
      setError(e?.detail ?? 'Failed to create user.');
      setSaving(false);
    }
  };

  const currentStep = STEPS[step - 1];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl border border-slate-200 w-[600px] max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Invite New User</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Step {step} of {STEPS.length} · {currentStep.label}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center px-6 py-3 gap-1 border-b border-slate-100">
          {STEPS.map((s, idx) => {
            const done = step > s.id;
            const active = step === s.id;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => done && setStep(s.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors',
                    active ? 'bg-cyan-500 text-white' :
                    done   ? 'bg-green-50 text-green-700 cursor-pointer hover:bg-green-100' :
                             'text-slate-400',
                  )}
                >
                  {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  {s.label}
                </button>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-300 mx-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-auto px-6 py-5">
          {step === 1 && <StepProfile form={form} set={set} />}
          {step === 2 && <StepRole form={form} set={set} />}
          {step === 3 && <StepTeam form={form} set={set} teams={teams} users={users} />}
          {step === 4 && <StepSkills form={form} set={set} />}
          {step === 5 && <StepCampaigns form={form} set={set} />}
          {step === 6 && <StepTelephony form={form} set={set} />}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-2">
            {/* Step dots */}
            <div className="flex gap-1 mr-2">
              {STEPS.map((s) => (
                <span key={s.id} className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  step === s.id ? 'bg-cyan-500' : step > s.id ? 'bg-green-400' : 'bg-slate-200',
                )} />
              ))}
            </div>

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="flex items-center gap-1.5 px-5 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send invite'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
