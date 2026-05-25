'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Users, Zap, BarChart2, Calendar,
  Plus, MoreHorizontal, Edit2, Check, X,
  Plug, ChevronRight, Globe, Shield, Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { teamsApi, usersApi } from '@/lib/api';
import type { TeamOut, User } from '@/lib/api.types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['bg-cyan-500','bg-blue-500','bg-purple-500','bg-amber-500','bg-emerald-500'];
function avatarColor(s: string) { let h=0; for(const c of s) h=(h*31+c.charCodeAt(0))&0xff; return AVATAR_COLORS[h%AVATAR_COLORS.length]; }
function initials(name: string) { const p=name.trim().split(/\s+/); return p.length===1?p[0].slice(0,2).toUpperCase():(p[0][0]+p[p.length-1][0]).toUpperCase(); }

const INTEGRATIONS = [
  { name: 'Telnyx',      sub: 'Voice telephony',   status: 'Connected', dot: 'bg-green-500' },
  { name: 'OpenAI',      sub: 'Whisper · Transcription', status: 'Connected', dot: 'bg-green-500' },
  { name: 'Twilio',      sub: 'Fallback carrier',  status: 'Connected', dot: 'bg-green-500' },
  { name: 'Salesforce',  sub: 'CRM sync',          status: 'Connected', dot: 'bg-green-500' },
  { name: 'Slack',       sub: 'Notifications',     status: 'Off',       dot: 'bg-slate-300' },
];

// ── New Team Modal ─────────────────────────────────────────────────────────────

function NewTeamModal({ onClose, onCreated }: { onClose(): void; onCreated(t: TeamOut): void }) {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const t = await teamsApi.create({ name: name.trim(), region: region.trim() || undefined });
      onCreated(t);
      onClose();
    } finally { setLoading(false); }
  };

  const inp = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-400';
  const lbl = 'block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl border border-slate-200 w-96 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-slate-900">New Team</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className={lbl}>Team Name *</label><input required value={name} onChange={e=>setName(e.target.value)} className={inp} placeholder="North America Sales" /></div>
          <div><label className={lbl}>Region</label><input value={region} onChange={e=>setRegion(e.target.value)} className={inp} placeholder="NA, EMEA, APAC…" /></div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold disabled:opacity-50">
              {loading ? 'Creating…' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function OrganizationPage() {
  const [teams, setTeams]   = useState<TeamOut[]>([]);
  const [users, setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamOpen, setNewTeamOpen] = useState(false);

  // Org profile state (local only — would save to backend in production)
  const [orgProfile, setOrgProfile] = useState({
    legalName: 'Acme Sales Holdings, Inc.',
    workspaceUrl: 'acme.salesq.app',
    taxId: 'EIN 87-2046382',
    industry: 'Technology / SaaS',
    timezone: 'America/New_York (UTC−5)',
    language: 'English (US)',
    fiscalYear: 'January',
    billingContact: 'finance@acmesales.com',
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState(orgProfile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([teamsApi.list(), usersApi.list()])
      .then(([t, u]) => { setTeams(t); setUsers(u); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const memberCount = (teamId: string) => users.filter(u => u.team_id === teamId).length;
  const activeUsers = users.filter(u => u.is_active).length;
  const activeCampaigns = 6; // placeholder

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // simulate API call
    setOrgProfile(profileDraft);
    setEditingProfile(false);
    setSaving(false);
  };

  const inp = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-400 bg-white';
  const lbl = 'block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1';

  // Lead name for a team (manager assigned)
  const teamLead = (teamId: string) => {
    const manager = users.find(u => u.team_id === teamId && u.role === 'manager');
    return manager?.full_name ?? '—';
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Organization</h1>
          <p className="text-xs text-slate-500">Acme Sales · {teams.length} teams · {users.length} members</p>
        </div>
        <button className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600">
          Export
        </button>
        <button
          onClick={() => setNewTeamOpen(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold"
        >
          <Plus className="w-3.5 h-3.5" /> New Team
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-5 gap-3 shrink-0">
        {[
          { label: 'Total Members',    value: users.length,    icon: Users,     color: 'text-blue-500'   },
          { label: 'Teams',            value: teams.length,    icon: Building2, color: 'text-cyan-500'   },
          { label: 'Active Campaigns', value: activeCampaigns, icon: Zap,       color: 'text-purple-500' },
          { label: 'Plan Utilization', value: `${Math.round((activeUsers/Math.max(users.length,1))*100)}%`, icon: BarChart2, color: 'text-amber-500' },
          { label: 'Days Until Renew', value: '38',            icon: Calendar,  color: 'text-emerald-500'},
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{m.label}</p>
              <m.icon className={cn('w-4 h-4', m.color)} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{loading ? '—' : m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Two-column body ── */}
      <div className="grid grid-cols-3 gap-4 min-h-0">

        {/* LEFT column (2/3) */}
        <div className="col-span-2 flex flex-col gap-4">

          {/* Organization Profile */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-slate-900">Organization Profile</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Legal and workspace identity</p>
              </div>
              {!editingProfile ? (
                <button
                  onClick={() => { setProfileDraft(orgProfile); setEditingProfile(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditingProfile(false)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Cancel</button>
                  <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-1 px-4 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'legalName',      label: 'Legal Name',        placeholder: 'Acme Sales Holdings, Inc.' },
                { key: 'workspaceUrl',   label: 'Workspace URL',     placeholder: 'acme.salesq.app' },
                { key: 'taxId',          label: 'Tax ID / VAT',      placeholder: 'EIN 87-2046382' },
                { key: 'industry',       label: 'Industry',          placeholder: 'Technology / SaaS' },
                { key: 'timezone',       label: 'Time Zone',         placeholder: 'America/New_York' },
                { key: 'language',       label: 'Default Language',  placeholder: 'English (US)' },
                { key: 'fiscalYear',     label: 'Fiscal Year Start', placeholder: 'January' },
                { key: 'billingContact', label: 'Billing Contact',   placeholder: 'finance@company.com' },
              ].map(f => (
                <div key={f.key}>
                  <label className={lbl}>{f.label}</label>
                  {editingProfile ? (
                    <input
                      value={profileDraft[f.key as keyof typeof profileDraft]}
                      onChange={e => setProfileDraft(d => ({ ...d, [f.key]: e.target.value }))}
                      className={inp}
                      placeholder={f.placeholder}
                    />
                  ) : (
                    <p className="text-xs font-medium text-slate-800 mt-1">
                      {orgProfile[f.key as keyof typeof orgProfile] || <span className="text-slate-400">—</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Teams table */}
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-900">Teams</p>
              <button
                onClick={() => setNewTeamOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
              >
                <Plus className="w-3 h-3" /> New team
              </button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    <th className="text-left px-5 py-2.5">Team</th>
                    <th className="text-left px-4 py-2.5">Lead</th>
                    <th className="text-left px-4 py-2.5">Region</th>
                    <th className="text-right px-4 py-2.5">Members</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-5 py-3"><div className="h-6 bg-slate-100 rounded animate-pulse" /></td></tr>
                    ))
                  ) : teams.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-400 text-xs">No teams yet — create one above</td></tr>
                  ) : teams.map(team => (
                    <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold', avatarColor(team.name))}>
                            {initials(team.name)}
                          </div>
                          <span className="font-semibold text-slate-800">{team.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{teamLead(team.id)}</td>
                      <td className="px-4 py-3 text-slate-500">{team.region ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">{memberCount(team.id)}</td>
                      <td className="px-4 py-3">
                        <button className="p-1 rounded hover:bg-slate-100">
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT column (1/3) */}
        <div className="flex flex-col gap-4">

          {/* Branding */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-900">Branding</p>
              <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
            <div className="space-y-4">
              {/* Logo */}
              <div>
                <p className={lbl}>Workspace Logo</p>
                <div className="mt-1 w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 border-dashed">
                  <Building2 className="w-6 h-6 text-slate-300" />
                </div>
              </div>
              {/* Brand color */}
              <div>
                <p className={lbl}>Brand Color</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500 border border-slate-200" />
                  <span className="text-xs font-mono text-slate-600">#06B6D4</span>
                </div>
              </div>
              {/* Email domain */}
              <div>
                <p className={lbl}>Email Domain</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-700">@acmesales.com</span>
                  <span className="ml-auto text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-semibold">Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Integrations */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-900">Connected Integrations</p>
              <Plug className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              {INTEGRATIONS.map(intg => (
                <div key={intg.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-slate-500">{intg.name.slice(0,2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{intg.name}</p>
                    <p className="text-[10px] text-slate-400">{intg.sub}</p>
                  </div>
                  <span className={cn('flex items-center gap-1 text-[10px] font-semibold',
                    intg.status === 'Connected' ? 'text-green-600' : 'text-slate-400'
                  )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', intg.dot)} />
                    {intg.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SSO & Domains */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-slate-500" />
              <p className="text-sm font-bold text-slate-900">SSO &amp; Domains</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">SAML SSO</span>
                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className={lbl}>Verified Domains</p>
                <div className="mt-1.5 space-y-1.5">
                  {['acmesales.com', 'acme-sales.io'].map((d, i) => (
                    <div key={d} className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-700 flex-1">{d}</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold',
                        i===0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'
                      )}>
                        {i===0 ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="mt-2.5 text-xs text-cyan-600 hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add domain
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {newTeamOpen && (
        <NewTeamModal onClose={() => setNewTeamOpen(false)} onCreated={t => setTeams(prev => [...prev, t])} />
      )}
    </div>
  );
}
