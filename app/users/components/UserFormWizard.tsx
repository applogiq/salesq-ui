'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check, ChevronRight, Upload, X, AlertTriangle,
  User as UserIcon, Shield, Users, Phone, BarChart2, Lock,
  Clock, CheckCircle2, UserX, UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usersApi, teamsApi } from '@/lib/api';
import type { User, TeamOut } from '@/lib/api.types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TIMEZONES = [
  { label: 'America/New_York (UTC−05:00)',    value: 'America/New_York'    },
  { label: 'America/Chicago (UTC−06:00)',     value: 'America/Chicago'     },
  { label: 'America/Denver (UTC−07:00)',      value: 'America/Denver'      },
  { label: 'America/Los_Angeles (UTC−08:00)', value: 'America/Los_Angeles' },
  { label: 'America/Toronto (UTC−05:00)',     value: 'America/Toronto'     },
  { label: 'Europe/London (UTC+00:00)',       value: 'Europe/London'       },
  { label: 'Europe/Paris (UTC+01:00)',        value: 'Europe/Paris'        },
  { label: 'Europe/Berlin (UTC+01:00)',       value: 'Europe/Berlin'       },
  { label: 'Asia/Dubai (UTC+04:00)',          value: 'Asia/Dubai'          },
  { label: 'Asia/Kolkata (UTC+05:30)',        value: 'Asia/Kolkata'        },
  { label: 'Asia/Singapore (UTC+08:00)',      value: 'Asia/Singapore'      },
  { label: 'Asia/Tokyo (UTC+09:00)',          value: 'Asia/Tokyo'          },
  { label: 'UTC',                             value: 'UTC'                 },
];

const WORKING_HOURS = [
  'Mon–Fri · 9:00–17:00',
  'Mon–Fri · 9:00–18:00',
  'Mon–Fri · 8:00–16:00',
  'Mon–Sat · 9:00–18:00',
  'Sun–Thu · 9:00–18:00',
  'Flexible',
];

const SKILL_SUGGESTIONS = [
  'Cold Outbound', 'Enterprise Sales', 'Discovery', 'Objection Handling',
  'Product Demo', 'Upselling', 'CRM Tools', 'Lead Qualification', 'Negotiation',
  'Customer Retention', 'SaaS', 'HealthTech', 'FinTech', 'Real Estate', 'EdTech',
];
const LANGUAGE_SUGGESTIONS = [
  'English (Native)', 'English (Fluent)', 'Spanish (Fluent)', 'Spanish (Basic)',
  'French (Fluent)', 'German (Fluent)', 'Hindi (Native)', 'Arabic (Fluent)',
  'Mandarin (Fluent)', 'Portuguese (Fluent)',
];

const PERM_SECTIONS = [
  {
    label: 'Calling',
    perms: [
      { key: 'call:create',    label: 'Place outbound calls',    minRole: 'executive' },
      { key: 'call:view',      label: 'Receive inbound calls',   minRole: 'executive' },
      { key: 'call:predict',   label: 'Use predictive dialer',   minRole: 'executive' },
      { key: 'call:click',     label: 'Click-to-call from CRM',  minRole: 'executive' },
    ],
  },
  {
    label: 'Leads & CRM',
    perms: [
      { key: 'lead:view',      label: 'View all leads',          minRole: 'executive' },
      { key: 'lead:view_own',  label: 'View own leads only',     minRole: 'executive' },
      { key: 'lead:edit',      label: 'Edit lead details',       minRole: 'executive' },
      { key: 'lead:export',    label: 'Export lead data',        minRole: 'manager'   },
    ],
  },
  {
    label: 'Monitoring',
    perms: [
      { key: 'call:listen',    label: 'Listen to other agents',  minRole: 'manager'   },
      { key: 'call:whisper',   label: 'Whisper coaching',        minRole: 'manager'   },
      { key: 'call:barge',     label: 'Barge into calls',        minRole: 'manager'   },
    ],
  },
  {
    label: 'Admin',
    perms: [
      { key: 'user:invite',    label: 'Invite users',            minRole: 'manager'   },
      { key: 'billing:manage', label: 'Manage billing',          minRole: 'admin'     },
    ],
  },
];

const ROLE_PRESETS: Record<string, Set<string>> = {
  executive: new Set(['call:create','call:view','call:click','lead:view','lead:view_own','lead:edit']),
  manager:   new Set(['call:create','call:view','call:predict','call:click','lead:view','lead:view_own','lead:edit','lead:export','call:listen','call:whisper','user:invite']),
  admin:     new Set(PERM_SECTIONS.flatMap(s => s.perms.map(p => p.key))),
};

const MIN_ROLE_LABEL: Record<string, string> = { manager: 'Manager+', admin: 'Admin' };

const STEPS = [
  { id: 1, key: 'profile',   label: 'Profile',            icon: UserIcon,  desc: 'Basic identity that appears across the workspace.' },
  { id: 2, key: 'role',      label: 'Role & Permissions', icon: Shield,    desc: 'Pick a role — permissions can be customized below.' },
  { id: 3, key: 'team',      label: 'Team & Assignment',  icon: Users,     desc: "Where this user works and what they're responsible for." },
  { id: 4, key: 'telephony', label: 'Telephony',          icon: Phone,     desc: 'Caller ID, queues, and recording defaults.' },
  { id: 5, key: 'targets',   label: 'Targets & Quotas',   icon: BarChart2, desc: 'Daily call targets, conversion goals and KPIs.' },
  { id: 6, key: 'security',  label: 'Security & Login',   icon: Lock,      desc: 'Password, MFA requirement and session settings.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Form state
// ─────────────────────────────────────────────────────────────────────────────

interface FormState {
  first_name: string; last_name: string; work_email: string;
  job_title: string;  mobile: string;    timezone: string;
  role: 'executive' | 'manager' | 'admin';
  custom_perms: Set<string>; use_custom: boolean;
  team_id: string; reports_to: string; start_date: string;
  working_hours: string; skills: string[]; skill_input: string;
  caller_id: string; extension: string;
  record_calls: boolean; predictive_dialer: boolean;
  voicemail_drop: boolean; auto_transcribe: boolean;
  daily_call_target: string; weekly_connect_target: string;
  monthly_meeting_target: string; revenue_target: string; conversion_target: string;
  temp_password: string; require_password_change: boolean;
  require_mfa: boolean; session_timeout: string;
}

function initForm(user?: User): FormState {
  const nameParts = user?.full_name?.trim().split(/\s+/) ?? [];
  return {
    first_name: nameParts[0] ?? '',
    last_name:  nameParts.slice(1).join(' ') ?? '',
    work_email: user?.email ?? '',
    job_title: '', mobile: '',
    timezone: 'America/New_York',
    role: (user?.role ?? 'executive') as 'executive' | 'manager' | 'admin',
    custom_perms: new Set(ROLE_PRESETS[user?.role ?? 'executive']),
    use_custom: false,
    team_id: user?.team_id ?? '',
    reports_to: '', start_date: '',
    working_hours: 'Mon–Fri · 9:00–18:00',
    skills: [], skill_input: '',
    caller_id: '', extension: '',
    record_calls: true, predictive_dialer: false,
    voicemail_drop: false, auto_transcribe: true,
    daily_call_target: '80', weekly_connect_target: '25',
    monthly_meeting_target: '8', revenue_target: '', conversion_target: '15',
    temp_password: 'Salesq@2026!',
    require_password_change: true, require_mfa: false, session_timeout: '480',
  };
}

function isStepComplete(step: number, f: FormState, mode: 'create' | 'edit'): boolean {
  switch (step) {
    case 1: return !!f.first_name && !!f.last_name && (mode === 'edit' || !!f.work_email);
    case 2: return true;
    case 3: return mode === 'edit' ? true : !!f.team_id;
    case 4: return true;
    case 5: return !!f.daily_call_target;
    case 6: return mode === 'edit' ? true : !!f.temp_password;
    default: return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────────────────────────────────────

const inputCls = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-400 bg-white placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed';
const labelCls = 'block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

function Toggle({ label, desc, badge, value, onChange }: {
  label: string; desc?: string; badge?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-800">{label}</p>
          {badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wide">{badge}</span>}
        </div>
        {desc && <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>}
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={cn('w-10 h-5 rounded-full transition-colors shrink-0 relative mt-0.5', value ? 'bg-cyan-500' : 'bg-slate-200')}>
        <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform', value ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

function SkillChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-full">
      {label}
      <button type="button" onClick={onRemove} className="hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step panels
// ─────────────────────────────────────────────────────────────────────────────

function StepProfile({ f, set, mode }: { f: FormState; set: (k: keyof FormState, v: any) => void; mode: 'create' | 'edit' }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-5 pb-5 border-b border-slate-100">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-cyan-400 hover:bg-cyan-50 transition-colors shrink-0">
          <Upload className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] text-slate-400">Photo</span>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">Upload photo</p>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">JPG or PNG · max 2 MB<br />Recommended 200 × 200 px</p>
          <button type="button" className="mt-2 text-[10px] font-semibold text-cyan-600 hover:text-cyan-700">Choose file</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" required>
          <input value={f.first_name} onChange={e => set('first_name', e.target.value)} className={inputCls} placeholder="e.g. Maya" />
        </Field>
        <Field label="Last name" required>
          <input value={f.last_name} onChange={e => set('last_name', e.target.value)} className={inputCls} placeholder="e.g. Patel" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Work email" required={mode === 'create'}>
          <input
            type="email" value={f.work_email}
            onChange={e => mode === 'create' && set('work_email', e.target.value)}
            className={inputCls} placeholder="name@company.com"
            disabled={mode === 'edit'}
          />
          {mode === 'edit' && <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed after account creation.</p>}
        </Field>
        <Field label="Job title">
          <input value={f.job_title} onChange={e => set('job_title', e.target.value)} className={inputCls} placeholder="e.g. Sales Executive" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Mobile phone">
          <input value={f.mobile} onChange={e => set('mobile', e.target.value)} className={inputCls} placeholder="+1 555 000 0000" />
        </Field>
        <Field label="Time zone">
          <select value={f.timezone} onChange={e => set('timezone', e.target.value)} className={inputCls}>
            {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );
}

function StepRole({ f, set, userCounts }: { f: FormState; set: (k: keyof FormState, v: any) => void; userCounts: Record<string, number> }) {
  const ROLES: Array<{ value: 'executive' | 'manager' | 'admin'; label: string; desc: string; accent: string }> = [
    { value: 'executive', label: 'Executive', desc: 'Browser softphone, AI assist, manages own leads.', accent: 'border-cyan-400 bg-cyan-50' },
    { value: 'manager',   label: 'Manager',   desc: 'Plus team monitoring, coaching, and campaigns.',  accent: 'border-amber-400 bg-amber-50' },
    { value: 'admin',     label: 'Admin',     desc: 'Full org access — billing, telephony, users.',    accent: 'border-purple-400 bg-purple-50' },
  ];

  const currentPerms = f.use_custom ? f.custom_perms : ROLE_PRESETS[f.role];

  const selectRole = (role: 'executive' | 'manager' | 'admin') => {
    set('role', role);
    set('custom_perms', new Set(ROLE_PRESETS[role]));
    set('use_custom', false);
  };

  const togglePerm = (key: string) => {
    const next = new Set(f.custom_perms);
    if (next.has(key)) next.delete(key); else next.add(key);
    set('custom_perms', next);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className={labelCls}>Select role</p>
        <div className="space-y-2">
          {ROLES.map(r => (
            <button key={r.value} type="button" onClick={() => selectRole(r.value)}
              className={cn('w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 text-left transition-colors',
                f.role === r.value && !f.use_custom ? r.accent : 'border-slate-200 hover:border-slate-300 bg-white')}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900">{r.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-slate-700">{userCounts[r.value] ?? 0}</p>
                <p className="text-[10px] text-slate-400">in workspace</p>
              </div>
              {f.role === r.value && !f.use_custom && <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className={cn('flex items-center justify-between px-4 py-3 cursor-pointer',
          f.use_custom ? 'bg-indigo-50 border-b border-indigo-100' : 'bg-slate-50 hover:bg-slate-100')}
          onClick={() => set('use_custom', !f.use_custom)}>
          <div>
            <p className="text-xs font-bold text-slate-800">Custom permissions</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Override role defaults with granular access</p>
          </div>
          {f.use_custom ? <CheckCircle2 className="w-4 h-4 text-indigo-600" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
        </div>
        <div className="divide-y divide-slate-100">
          {PERM_SECTIONS.map(section => (
            <div key={section.label} className="px-4 py-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">{section.label}</p>
              <div className="space-y-1.5">
                {section.perms.map(p => {
                  const checked = currentPerms.has(p.key);
                  const minLabel = MIN_ROLE_LABEL[p.minRole];
                  return (
                    <label key={p.key} className={cn('flex items-center gap-2.5 cursor-pointer group', !f.use_custom && 'cursor-default')}>
                      <div className={cn('w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors',
                        checked ? 'bg-cyan-500' : 'bg-slate-100 border border-slate-200',
                        f.use_custom && !checked && 'group-hover:border-cyan-300')}
                        onClick={() => f.use_custom && togglePerm(p.key)}>
                        {checked && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={cn('text-xs flex-1', checked ? 'text-slate-700' : 'text-slate-400')}>{p.label}</span>
                      {minLabel && <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{minLabel}</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepTeam({ f, set, teams, users }: { f: FormState; set: (k: keyof FormState, v: any) => void; teams: TeamOut[]; users: User[] }) {
  const [skillInput, setSkillInput] = useState('');
  const managers = users.filter(u => u.role === 'manager' || u.role === 'admin');
  const addSkill = (skill: string) => {
    if (!skill.trim() || f.skills.includes(skill.trim())) return;
    set('skills', [...f.skills, skill.trim()]);
    setSkillInput('');
  };
  const suggestions = [...SKILL_SUGGESTIONS, ...LANGUAGE_SUGGESTIONS]
    .filter(s => !f.skills.includes(s) && (skillInput ? s.toLowerCase().includes(skillInput.toLowerCase()) : true));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Team" required>
          <select value={f.team_id} onChange={e => set('team_id', e.target.value)} className={inputCls}>
            <option value="">— Select team —</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Reports to">
          <select value={f.reports_to} onChange={e => set('reports_to', e.target.value)} className={inputCls}>
            <option value="">— Direct report —</option>
            {managers.map(u => (
              <option key={u.id} value={u.id}>{u.full_name || u.email} · {u.role === 'admin' ? 'Admin' : 'Manager'}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date">
          <input type="date" value={f.start_date} onChange={e => set('start_date', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Working hours">
          <select value={f.working_hours} onChange={e => set('working_hours', e.target.value)} className={inputCls}>
            {WORKING_HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </Field>
      </div>
      <div>
        <p className={labelCls}>Skills &amp; languages</p>
        {f.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {f.skills.map(s => <SkillChip key={s} label={s} onRemove={() => set('skills', f.skills.filter(x => x !== s))} />)}
          </div>
        )}
        <div className="flex gap-2">
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
            className={cn(inputCls, 'flex-1')} placeholder="Type a skill or language…" />
          <button type="button" onClick={() => addSkill(skillInput)} disabled={!skillInput.trim()}
            className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold disabled:opacity-40">Add</button>
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {suggestions.slice(0, 10).map(s => (
              <button key={s} type="button" onClick={() => addSkill(s)}
                className="px-2.5 py-1 text-[10px] font-medium border border-slate-200 text-slate-600 rounded-full hover:border-cyan-400 hover:text-cyan-600 transition-colors">
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-800">Active campaigns</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Assign from the Campaigns module after the user is created</p>
        </div>
        {[
          { name: 'Summer Outbound 2026', priority: 'High',   color: 'bg-red-100 text-red-700'    },
          { name: 'Q2 Renewals',          priority: 'Medium', color: 'bg-amber-100 text-amber-700' },
          { name: 'Free Trial Conversion',priority: 'Low',    color: 'bg-slate-100 text-slate-600' },
        ].map(c => (
          <div key={c.name} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 last:border-0">
            <p className="text-xs text-slate-700 font-medium">{c.name}</p>
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', c.color)}>{c.priority}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepTelephony({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Caller ID">
          <input value={f.caller_id} onChange={e => set('caller_id', e.target.value)} className={inputCls} placeholder="+1 (888) 555-2026" />
          <p className="text-[10px] text-slate-400 mt-1">Leave blank to use team/campaign default</p>
        </Field>
        <Field label="Extension">
          <input value={f.extension} onChange={e => set('extension', e.target.value)} className={inputCls} placeholder="auto-assign" />
          <p className="text-[10px] text-slate-400 mt-1">Internal extension for transfers</p>
        </Field>
      </div>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-800">Call settings</p>
        </div>
        <div className="px-4 divide-y divide-slate-100">
          <Toggle label="Record all calls by default" desc="Required by retention policy" value={f.record_calls} onChange={v => set('record_calls', v)} />
          <Toggle label="Allow predictive dialer mode" value={f.predictive_dialer} onChange={v => set('predictive_dialer', v)} />
          <Toggle label="Voicemail drop enabled" value={f.voicemail_drop} onChange={v => set('voicemail_drop', v)} />
          <Toggle label="Auto-transcribe with Whisper" desc="Adds to AI analysis budget" value={f.auto_transcribe} onChange={v => set('auto_transcribe', v)} />
        </div>
      </div>
    </div>
  );
}

function StepTargets({ f, set }: { f: FormState; set: (k: keyof FormState, v: any) => void }) {
  const metrics = [
    { key: 'daily_call_target',      label: 'Daily call target',       unit: 'calls/day',     placeholder: '80'    },
    { key: 'weekly_connect_target',  label: 'Weekly connect target',   unit: 'connects/week', placeholder: '25'    },
    { key: 'monthly_meeting_target', label: 'Monthly meetings booked', unit: 'meetings/month',placeholder: '8'     },
    { key: 'conversion_target',      label: 'Conversion rate target',  unit: '%',             placeholder: '15'    },
    { key: 'revenue_target',         label: 'Monthly revenue target',  unit: 'USD',           placeholder: '50000' },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
        <p className="text-xs font-semibold text-cyan-800">Targets feed leaderboards and AI coaching</p>
        <p className="text-[10px] text-cyan-700 mt-0.5">These become the baseline for performance tracking and coaching recommendations.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map(m => (
          <Field key={m.key} label={m.label}>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <input type="number" value={(f as any)[m.key]} onChange={e => set(m.key as keyof FormState, e.target.value)}
                className="flex-1 text-xs px-3 py-2.5 focus:outline-none" placeholder={m.placeholder} min={0} />
              <span className="px-3 py-2.5 text-[10px] text-slate-400 bg-slate-50 border-l border-slate-200 whitespace-nowrap">{m.unit}</span>
            </div>
          </Field>
        ))}
      </div>
      <div className="border border-slate-200 rounded-xl p-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Target Summary</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Daily calls',   value: f.daily_call_target || '—' },
            { label: 'Connects/week', value: f.weekly_connect_target || '—' },
            { label: 'Conv. rate',    value: f.conversion_target ? `${f.conversion_target}%` : '—' },
          ].map(s => (
            <div key={s.label} className="p-3 bg-slate-50 rounded-xl">
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepSecurity({ f, set, mode, user, onUserStatusChange }: {
  f: FormState;
  set: (k: keyof FormState, v: any) => void;
  mode: 'create' | 'edit';
  user?: User;
  onUserStatusChange?: (active: boolean) => void;
}) {
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const handleSuspend = async () => {
    if (!user) return;
    if (!confirmSuspend) { setConfirmSuspend(true); return; }
    setStatusBusy(true); setStatusError(null);
    try {
      await usersApi.patch(user.id, { is_active: false });
      onUserStatusChange?.(false);
      setConfirmSuspend(false);
    } catch (e: any) { setStatusError(e?.detail ?? 'Failed to suspend.'); }
    finally { setStatusBusy(false); }
  };

  const handleReactivate = async () => {
    if (!user) return;
    setStatusBusy(true); setStatusError(null);
    try {
      await usersApi.patch(user.id, { is_active: true });
      onUserStatusChange?.(true);
    } catch (e: any) { setStatusError(e?.detail ?? 'Failed to reactivate.'); }
    finally { setStatusBusy(false); }
  };

  if (mode === 'edit' && user) {
    return (
      <div className="space-y-5">
        {/* Status overview */}
        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
          {[
            { label: 'Account Status', value: user.is_active ? 'Active' : 'Suspended', ok: user.is_active },
            { label: 'MFA Status',     value: user.mfa_enabled ? 'Enabled' : 'Not set up', ok: user.mfa_enabled },
            { label: 'Member Since',   value: user.created_at ? new Date(user.created_at).toLocaleDateString() : '—', ok: true },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-slate-500">{row.label}</span>
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                row.ok ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Reset password */}
        <div className="border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-700 mb-1">Reset Password</p>
          <p className="text-[10px] text-slate-400 mb-3">Send a password reset email to <strong>{user.email}</strong>.</p>
          <button className="px-4 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold">
            Send Reset Email
          </button>
        </div>

        {/* Danger zone */}
        <div className="border border-red-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <p className="text-xs font-bold text-red-600">Danger Zone</p>
          </div>
          {statusError && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{statusError}</p>}
          {user.is_active ? (
            <div>
              <p className="text-[10px] text-slate-500 mb-2">Suspending will immediately revoke all active sessions and block login.</p>
              <button onClick={handleSuspend} disabled={statusBusy}
                className={cn('flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg font-semibold border transition-colors disabled:opacity-50',
                  confirmSuspend ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' : 'border-red-200 text-red-600 hover:bg-red-50')}>
                <UserX className="w-3.5 h-3.5" />
                {statusBusy ? 'Suspending…' : confirmSuspend ? 'Confirm Suspend' : 'Suspend Account'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-[10px] text-slate-500 mb-2">Reactivating will restore login access for this user.</p>
              <button onClick={handleReactivate} disabled={statusBusy}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg font-semibold border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50">
                <UserCheck className="w-3.5 h-3.5" />
                {statusBusy ? 'Reactivating…' : 'Reactivate Account'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Create mode — original security step
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Temporary password">
          <input value={f.temp_password} onChange={e => set('temp_password', e.target.value)} className={inputCls} type="password" />
        </Field>
        <Field label="Session timeout (minutes)">
          <select value={f.session_timeout} onChange={e => set('session_timeout', e.target.value)} className={inputCls}>
            <option value="60">1 hour</option>
            <option value="240">4 hours</option>
            <option value="480">8 hours (default)</option>
            <option value="1440">24 hours</option>
            <option value="0">Never</option>
          </select>
        </Field>
      </div>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-800">Login requirements</p>
        </div>
        <div className="px-4 divide-y divide-slate-100">
          <Toggle label="Require password change on first login" desc="User must set a new password before accessing the workspace" value={f.require_password_change} onChange={v => set('require_password_change', v)} />
          <Toggle label="Require MFA setup" desc="User must configure two-factor authentication before first use" value={f.require_mfa} onChange={v => set('require_mfa', v)} />
        </div>
      </div>
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-800">Invite link expires in 7 days</p>
          <p className="text-[10px] text-amber-700 mt-0.5">The user will receive an email to set up their account. If they don't activate within 7 days, you'll need to resend the invite.</p>
        </div>
      </div>
      <div className="border border-slate-200 rounded-xl p-4 space-y-2">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Review before sending</p>
        {[
          { label: 'Name',      value: `${f.first_name} ${f.last_name}`.trim() || '—' },
          { label: 'Email',     value: f.work_email || '—' },
          { label: 'Role',      value: f.role ? f.role.charAt(0).toUpperCase() + f.role.slice(1) : '—' },
          { label: 'Job title', value: f.job_title || '—' },
          { label: 'Timezone',  value: f.timezone },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{row.label}</span>
            <span className="font-semibold text-slate-800">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface UserFormWizardProps {
  mode: 'create' | 'edit';
  initialUser?: User;
  teams: TeamOut[];
  users: User[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main wizard component
// ─────────────────────────────────────────────────────────────────────────────

export default function UserFormWizard({ mode, initialUser, teams, users }: UserFormWizardProps) {
  const router = useRouter();
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState<FormState>(() => initForm(initialUser));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [liveUser, setLiveUser] = useState<User | undefined>(initialUser);

  const set = useCallback((k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v })), []);

  const completedSteps = STEPS.filter(s => isStepComplete(s.id, form, mode)).length;
  const userCounts: Record<string, number> = {
    executive: users.filter(u => u.role === 'executive').length,
    manager:   users.filter(u => u.role === 'manager').length,
    admin:     users.filter(u => u.role === 'admin').length,
  };

  const handleSubmit = async () => {
    if (mode === 'create') {
      if (!form.work_email || !form.first_name || !form.last_name) {
        setStep(1);
        setError('Please fill in all required profile fields.');
        return;
      }
      setSaving(true); setError(null);
      try {
        await usersApi.invite({
          email: form.work_email.trim(),
          full_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
          role: form.role,
          team_id: form.team_id || undefined,
          password: form.temp_password,
        });
        router.push('/users');
      } catch (e: any) {
        setError(e?.detail ?? 'Failed to create user. Please try again.');
        setSaving(false);
      }
    } else {
      if (!form.first_name.trim()) {
        setStep(1);
        setError('Full name is required.');
        return;
      }
      setSaving(true); setError(null);
      try {
        await usersApi.patch(initialUser!.id, {
          full_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
          role: form.role,
          team_id: form.team_id || undefined,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (e: any) {
        setError(e?.detail ?? 'Failed to save changes. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  const currentStep = STEPS[step - 1];
  const pageTitle   = mode === 'create' ? 'Invite new user' : `Edit — ${liveUser?.full_name || liveUser?.email || 'User'}`;
  const breadcrumb  = mode === 'create' ? 'Invite new user' : 'Edit User';

  return (
    <div className="flex flex-col h-full">

      {/* Page header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="cursor-pointer hover:text-slate-700 transition-colors" onClick={() => router.push('/users')}>
            Users &amp; Roles
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-700 font-semibold">{breadcrumb}</span>
        </div>
        {mode === 'create' && (
          <p className="text-[10px] text-slate-400">
            <Clock className="w-3 h-3 inline mr-1" />
            Invite expires in 7 days
          </p>
        )}
        {mode === 'edit' && liveUser && (
          <div className="flex items-center gap-2">
            <span className={cn('px-2 py-0.5 rounded-full font-semibold text-[10px]',
              liveUser.role === 'admin'   ? 'bg-purple-50 text-purple-700' :
              liveUser.role === 'manager' ? 'bg-amber-50 text-amber-700'   :
                                            'bg-cyan-50 text-cyan-700')}>
              {liveUser.role.charAt(0).toUpperCase() + liveUser.role.slice(1)}
            </span>
            <span className={cn('px-2 py-0.5 rounded-full font-semibold text-[10px]',
              liveUser.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500')}>
              {liveUser.is_active ? 'Active' : 'Suspended'}
            </span>
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* Left step navigator */}
        <div className="w-52 shrink-0 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-4 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">{mode === 'create' ? 'Add User' : 'Edit User'}</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">{completedSteps} of {STEPS.length} sections complete</p>
            <div className="h-1 bg-slate-100 rounded-full mt-2">
              <div className="h-1 bg-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps / STEPS.length) * 100}%` }} />
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {STEPS.map(s => {
              const done   = isStepComplete(s.id, form, mode);
              const active = step === s.id;
              const Icon   = s.icon;
              return (
                <button key={s.id} onClick={() => setStep(s.id)}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 text-left transition-colors', active ? 'bg-cyan-50' : 'hover:bg-slate-50')}>
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors',
                    done && !active ? 'bg-green-500 text-white' : active ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-400')}>
                    {done && !active ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-xs font-semibold leading-tight',
                      active ? 'text-cyan-700' : done ? 'text-slate-700' : 'text-slate-400')}>
                      {s.label}
                    </p>
                    {done && !active && <p className="text-[10px] text-green-600 font-medium mt-0.5">Complete</p>}
                    {active && <p className="text-[10px] text-cyan-500 mt-0.5">In progress</p>}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 shrink-0">
            <p className="text-[10px] font-semibold text-slate-400">Step {step} of {STEPS.length}</p>
            <h3 className="text-sm font-bold text-slate-900">{currentStep.label}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{currentStep.desc}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {step === 1 && <StepProfile f={form} set={set} mode={mode} />}
            {step === 2 && <StepRole f={form} set={set} userCounts={userCounts} />}
            {step === 3 && <StepTeam f={form} set={set} teams={teams} users={users} />}
            {step === 4 && <StepTelephony f={form} set={set} />}
            {step === 5 && <StepTargets f={form} set={set} />}
            {step === 6 && (
              <StepSecurity
                f={form} set={set} mode={mode} user={liveUser}
                onUserStatusChange={(active) => setLiveUser(u => u ? { ...u, is_active: active } : u)}
              />
            )}
          </div>

          {error && (
            <div className="mx-6 mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{error}
            </div>
          )}

          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
            <button type="button"
              onClick={() => step > 1 ? setStep(step - 1) : router.push('/users')}
              className="px-4 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
              {step === 1 ? 'Cancel' : '← Back'}
            </button>
            {step < STEPS.length && (
              <button type="button" onClick={() => setStep(step + 1)}
                className="px-5 py-2 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold">
                Next →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="shrink-0 mt-4 bg-white rounded-2xl border border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <div className="flex gap-1">
            {STEPS.map(s => (
              <div key={s.id} className={cn('w-1.5 h-1.5 rounded-full transition-colors',
                isStepComplete(s.id, form, mode) ? 'bg-green-400' : step === s.id ? 'bg-cyan-400' : 'bg-slate-200')} />
            ))}
          </div>
          <span className="font-semibold">{completedSteps} of {STEPS.length} sections complete</span>
          {mode === 'create' && <><span className="text-slate-300">·</span><span>Invite expires in 7 days</span></>}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.push('/users')}
            className="px-4 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
            Cancel
          </button>
          {mode === 'create' && (
            <button type="button" onClick={() => {}}
              className="px-4 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold">
              Save as draft
            </button>
          )}
          <button type="button" onClick={handleSubmit}
            disabled={saving || (mode === 'create' && (!form.work_email || !form.first_name))}
            className={cn('flex items-center gap-1.5 px-5 py-1.5 text-xs rounded-lg font-semibold transition-colors disabled:opacity-50',
              saved ? 'bg-green-500 text-white' : 'bg-cyan-500 hover:bg-cyan-600 text-white')}>
            {saving ? (
              <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{mode === 'create' ? 'Sending…' : 'Saving…'}</>
            ) : saved ? (
              <><Check className="w-3.5 h-3.5" /> Saved!</>
            ) : (
              mode === 'create' ? 'Send invite' : 'Save changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
