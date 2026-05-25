'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Shield, Plus, RefreshCw, UserCheck, UserX,
  X, Check, Lock,
  AlertTriangle, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usersApi, teamsApi } from '@/lib/api';
import type { User, TeamOut } from '@/lib/api.types';

// ── Helpers ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-purple-500','bg-blue-500','bg-cyan-500','bg-amber-500',
  'bg-pink-500','bg-emerald-500','bg-indigo-500','bg-rose-500',
  'bg-teal-500','bg-orange-400',
];
function avatarColor(seed: string) {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string | null, email: string): string {
  const src = name?.trim() || email;
  const p = src.split(/\s+|@/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[1][0]).toUpperCase();
}
function relativeTime(iso?: string): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ROLE_BADGE: Record<string, string> = {
  admin:     'bg-purple-50 text-purple-700',
  manager:   'bg-amber-50 text-amber-700',
  executive: 'bg-cyan-50 text-cyan-700',
};
const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', manager: 'Manager', executive: 'Executive',
};

// ── Permission definitions ─────────────────────────────────────────────────────

const PERM_GROUPS = [
  {
    label: 'Calls',
    perms: [
      { key: 'call:view',    label: 'View calls' },
      { key: 'call:create',  label: 'Make calls' },
      { key: 'call:listen',  label: 'Monitor / Listen' },
      { key: 'call:whisper', label: 'Whisper coach' },
      { key: 'call:barge',   label: 'Barge in' },
    ],
  },
  {
    label: 'Leads CRM',
    perms: [
      { key: 'lead:view',   label: 'View leads' },
      { key: 'lead:create', label: 'Create leads' },
      { key: 'lead:edit',   label: 'Edit leads' },
      { key: 'lead:delete', label: 'Delete leads' },
      { key: 'lead:import', label: 'Import CSV' },
      { key: 'lead:export', label: 'Export CSV' },
      { key: 'lead:dnd',    label: 'Set DND flag' },
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
    label: 'Analytics & Audit',
    perms: [
      { key: 'analytics:view',   label: 'View reports' },
      { key: 'analytics:export', label: 'Export reports' },
      { key: 'audit:view',       label: 'Audit log' },
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

const ROLE_PERMS: Record<string, Set<string>> = {
  executive: new Set([
    'call:view', 'call:create', 'campaign:view',
    'lead:view', 'lead:create', 'lead:edit', 'analytics:view',
  ]),
  manager: new Set([
    'call:view', 'call:create', 'call:listen', 'call:whisper',
    'campaign:view', 'campaign:create', 'campaign:edit',
    'lead:view', 'lead:create', 'lead:edit', 'lead:delete',
    'lead:import', 'lead:export', 'lead:dnd',
    'user:view', 'analytics:view', 'analytics:export',
    'audit:view', 'phone:view', 'phone:manage',
  ]),
  admin: new Set(PERM_GROUPS.flatMap((g) => g.perms.map((p) => p.key))),
};

// ── Permissions Panel ─────────────────────────────────────────────────────────

function PermissionsPanel({ role }: { role: string }) {
  const perms = ROLE_PERMS[role] ?? new Set<string>();
  const total = PERM_GROUPS.flatMap((g) => g.perms).length;
  const granted = Array.from(perms).length;

  return (
    <div className="w-72 shrink-0 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-slate-500" />
            <p className="text-sm font-bold text-slate-900">Role Permissions</p>
          </div>
          <span className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
            ROLE_BADGE[role] ?? 'bg-slate-100 text-slate-600',
          )}>
            {ROLE_LABEL[role] ?? role}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">{granted} of {total} permissions enabled</p>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 rounded-full mt-2">
          <div
            className="h-1.5 bg-cyan-500 rounded-full transition-all"
            style={{ width: `${(granted / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="overflow-auto flex-1 p-3 space-y-3">
        {PERM_GROUPS.map((group) => {
          const groupGranted = group.perms.filter((p) => perms.has(p.key)).length;
          return (
            <div key={group.label}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{group.label}</p>
                <span className="text-[10px] text-slate-400">{groupGranted}/{group.perms.length}</span>
              </div>
              <div className="space-y-1">
                {group.perms.map((p) => {
                  const has = perms.has(p.key);
                  return (
                    <div key={p.key} className="flex items-center gap-2">
                      <div className={cn(
                        'w-4 h-4 rounded flex items-center justify-center shrink-0',
                        has ? 'bg-cyan-500' : 'bg-slate-100',
                      )}>
                        {has && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={cn(
                        'text-[10px]',
                        has ? 'text-slate-700' : 'text-slate-400 line-through',
                      )}>
                        {p.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-400">
          Permissions are role-based. To customize, use the Admin API or contact Anthropic support.
        </p>
      </div>
    </div>
  );
}

// ── Edit User Panel ────────────────────────────────────────────────────────────

interface EditPanelProps {
  user: User;
  teams: TeamOut[];
  onUpdated: (u: User) => void;
  onDeactivated: (id: string) => void;
  onClose: () => void;
}

function EditPanel({ user, teams, onUpdated, onDeactivated, onClose }: EditPanelProps) {
  const [role, setRole] = useState(user.role);
  const [teamId, setTeamId] = useState(user.team_id ?? '');
  const [fullName, setFullName] = useState(user.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'perms' | 'security'>('info');

  const perms = ROLE_PERMS[role] ?? new Set<string>();
  const inputCls = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-400 bg-white';
  const labelCls = 'block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1';

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const updated = await usersApi.patch(user.id, {
        role: role as any,
        team_id: teamId || undefined,
        full_name: fullName || undefined,
      });
      onUpdated(updated);
      onClose();
    } catch (e: any) {
      setError(e?.detail ?? 'Failed to update.');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) { setConfirmDeactivate(true); return; }
    setDeactivating(true); setError(null);
    try {
      await usersApi.patch(user.id, { is_active: false });
      onDeactivated(user.id);
      onClose();
    } catch (e: any) {
      setError(e?.detail ?? 'Failed to deactivate.');
    } finally { setDeactivating(false); }
  };

  const handleReactivate = async () => {
    setSaving(true);
    try {
      const updated = await usersApi.patch(user.id, { is_active: true });
      onUpdated(updated);
      onClose();
    } catch (e: any) {
      setError(e?.detail ?? 'Failed to reactivate.');
    } finally { setSaving(false); }
  };

  return (
    <div className="w-72 bg-white rounded-xl border border-slate-200 flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <p className="text-sm font-bold text-slate-900">Edit User</p>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Avatar */}
      <div className="px-4 pt-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0', avatarColor(user.email))}>
            {initials(user.full_name, user.email)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{user.full_name || user.email}</p>
            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn('w-1.5 h-1.5 rounded-full', user.is_active ? 'bg-green-500' : 'bg-slate-300')} />
              <span className="text-[10px] text-slate-500">{user.is_active ? 'Active' : 'Inactive'}</span>
              {user.mfa_enabled && (
                <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-semibold">MFA</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {(['info', 'perms', 'security'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                'flex-1 py-1.5 text-[10px] font-semibold rounded-lg capitalize transition-colors',
                activeTab === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100',
              )}
            >
              {t === 'perms' ? 'Permissions' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {activeTab === 'info' && (
          <>
            <div>
              <label className={labelCls}>Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder="Full name" />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as any)} className={inputCls}>
                <option value="executive">Executive</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Team</label>
              <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className={inputCls}>
                <option value="">— No team —</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}
            <button onClick={handleSave} disabled={saving}
              className="w-full py-2 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        )}

        {activeTab === 'perms' && (
          <div className="space-y-3">
            {PERM_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">{group.label}</p>
                <div className="space-y-1">
                  {group.perms.map((p) => {
                    const has = perms.has(p.key);
                    return (
                      <div key={p.key} className="flex items-center gap-2">
                        <div className={cn('w-3.5 h-3.5 rounded flex items-center justify-center shrink-0',
                          has ? 'bg-cyan-500' : 'bg-slate-100')}>
                          {has && <Check className="w-2 h-2 text-white" />}
                        </div>
                        <span className={cn('text-[10px]', has ? 'text-slate-700' : 'text-slate-400')}>{p.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="text-[10px] text-slate-400 pt-1">Permissions are derived from role. Shown for current role: <strong>{role}</strong></p>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">MFA Status</span>
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                  user.mfa_enabled ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
                  {user.mfa_enabled ? 'Enabled' : 'Not set up'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Account Status</span>
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                  user.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600')}>
                  {user.is_active ? 'Active' : 'Suspended'}
                </span>
              </div>
              {user.created_at && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Member since</span>
                  <span className="text-[10px] text-slate-500">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Danger zone */}
            <div>
              <button
                onClick={() => setShowDanger(!showDanger)}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-red-500 hover:text-red-600"
              >
                <AlertTriangle className="w-3 h-3" />
                Danger Zone
                <ChevronDown className={cn('w-3 h-3 transition-transform', showDanger && 'rotate-180')} />
              </button>

              {showDanger && (
                <div className="mt-2 p-3 border border-red-200 rounded-xl space-y-2">
                  {user.is_active ? (
                    <button
                      onClick={handleDeactivate}
                      disabled={deactivating}
                      className={cn(
                        'w-full py-1.5 text-xs rounded-lg font-semibold border transition-colors disabled:opacity-50',
                        confirmDeactivate
                          ? 'border-red-400 bg-red-500 text-white hover:bg-red-600'
                          : 'border-red-200 text-red-600 hover:bg-red-50',
                      )}
                    >
                      <UserX className="w-3.5 h-3.5 inline mr-1" />
                      {deactivating ? 'Suspending…' : confirmDeactivate ? 'Confirm suspend' : 'Suspend Account'}
                    </button>
                  ) : (
                    <button
                      onClick={handleReactivate}
                      disabled={saving}
                      className="w-full py-1.5 text-xs border border-green-200 text-green-700 hover:bg-green-50 rounded-lg font-semibold disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                      {saving ? 'Reactivating…' : 'Reactivate Account'}
                    </button>
                  )}

                  <button className="w-full py-1.5 text-xs border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-semibold">
                    <Lock className="w-3.5 h-3.5 inline mr-1" />
                    Reset Password
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Security Overview Panel ────────────────────────────────────────────────────

function SecurityPanel({ users, teams, roleFilter }: {
  users: User[];
  teams: TeamOut[];
  roleFilter: string | null;
}) {
  const total  = users.length;
  const active = users.filter((u) => u.is_active).length;
  const mfaOn  = users.filter((u) => u.mfa_enabled).length;
  const mfaPct = total > 0 ? Math.round((mfaOn / total) * 100) : 0;
  const admins = users.filter((u) => u.role === 'admin').length;
  const managers = users.filter((u) => u.role === 'manager').length;

  // Show permissions for role tab, or security overview for "All"
  if (roleFilter && roleFilter !== 'inactive') {
    return <PermissionsPanel role={roleFilter} />;
  }

  return (
    <div className="w-72 shrink-0 space-y-3">
      {/* Security overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Shield className="w-4 h-4 text-slate-500" />
          <p className="text-sm font-bold text-slate-900">Security Overview</p>
        </div>
        <div className="space-y-2.5">
          {[
            { label: 'Total users',     value: `${total}`,              ok: true },
            { label: 'Active accounts', value: `${active} active`,      ok: true },
            { label: 'Suspended',       value: `${total - active}`,     ok: total - active === 0 },
            { label: 'MFA coverage',    value: `${mfaPct}% (${mfaOn}/${total})`, ok: mfaPct >= 80 },
            { label: 'Admins',          value: `${admins} admin${admins !== 1 ? 's' : ''}`, ok: admins <= 3 },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{s.label}</span>
              <span className={cn('text-xs font-semibold', s.ok ? 'text-slate-700' : 'text-amber-600')}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* MFA progress */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>MFA adoption</span>
            <span>{mfaPct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full">
            <div
              className={cn('h-1.5 rounded-full transition-all', mfaPct >= 80 ? 'bg-green-500' : 'bg-amber-400')}
              style={{ width: `${mfaPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Teams breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-bold text-slate-900 mb-3">Teams</p>
        {teams.length === 0 ? (
          <p className="text-xs text-slate-400">No teams configured</p>
        ) : (
          <div className="space-y-2">
            {teams.map((t) => {
              const count = users.filter((u) => u.team_id === t.id).length;
              const lead = users.find((u) => u.id === t.manager_id);
              return (
                <div key={t.id} className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-700 font-medium">{t.name}</p>
                    {lead && <p className="text-[10px] text-slate-400">{lead.full_name || lead.email}</p>}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{count} member{count !== 1 ? 's' : ''}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-bold text-slate-900 mb-3">Role Distribution</p>
        {(['admin', 'manager', 'executive'] as const).map((role) => {
          const count = users.filter((u) => u.role === role).length;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={role} className="mb-2 last:mb-0">
              <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                <span className="capitalize font-medium">{role}</span>
                <span>{count}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full">
                <div
                  className={cn('h-1.5 rounded-full', {
                    'bg-purple-500': role === 'admin',
                    'bg-amber-500': role === 'manager',
                    'bg-cyan-500': role === 'executive',
                  })}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 text-center px-2">
        Click any row to edit role, team, or account status.
      </p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const ROLE_TABS = [
  { label: 'All',       role: null          },
  { label: 'Managers',  role: 'manager'     },
  { label: 'Executives',role: 'executive'   },
  { label: 'Inactive',  role: 'inactive'    },
];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<TeamOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, t] = await Promise.all([usersApi.list(), teamsApi.list()]);
      setUsers(u);
      setTeams(t);
    } catch {
      setUsers([]); setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const tabRole = ROLE_TABS[activeTab].role;

  const filtered = users.filter((u) => {
    if (tabRole === 'inactive') return !u.is_active;
    if (tabRole) return u.role === tabRole && u.is_active;
    return u.is_active || !search;
  }).filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name ?? '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total    = users.length;
  const active   = users.filter((u) => u.is_active).length;
  const mfaOn    = users.filter((u) => u.mfa_enabled).length;
  const inactive = total - active;

  const tabCounts: Record<string, number> = {
    'All':        total,
    'Managers':   users.filter((u) => u.role === 'manager' && u.is_active).length,
    'Executives': users.filter((u) => u.role === 'executive' && u.is_active).length,
    'Inactive':   inactive,
  };

  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? '—';

  const statCards = [
    { label: 'Total Users',     value: total,    sub: 'all accounts',        color: 'text-slate-900' },
    { label: 'Active',          value: active,   sub: 'accounts active',     color: 'text-green-600' },
    { label: 'MFA Enabled',     value: mfaOn,    sub: `${total > 0 ? Math.round(mfaOn/total*100) : 0}% coverage`,     color: 'text-cyan-600'  },
    { label: 'Suspended',       value: inactive, sub: 'accounts inactive',   color: inactive > 0 ? 'text-amber-600' : 'text-slate-400' },
  ];

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Users &amp; Roles</h1>
          <p className="text-xs text-slate-500">
            {total} users · {active} active · {Math.round(mfaOn / Math.max(total, 1) * 100)}% MFA
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setActiveTab(0); }}
            placeholder="Search by name, email, role…"
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-64 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>
        <button
          onClick={load}
          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button
          onClick={() => router.push('/users/add')}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold"
        >
          <Plus className="w-3.5 h-3.5" /> Invite User
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {statCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{c.label}</p>
            <p className={cn('text-2xl font-bold mt-1', c.color)}>{c.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Main split */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* Left: table */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col min-w-0 overflow-hidden">

          {/* Role tab bar */}
          <div className="flex items-center gap-1 px-4 py-2.5 border-b border-slate-100">
            {ROLE_TABS.map((t, i) => (
              <button
                key={t.label}
                onClick={() => { setActiveTab(i); setSearch(''); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                  activeTab === i ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100',
                )}
              >
                {t.label}
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                  activeTab === i ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
                )}>
                  {tabCounts[t.label] ?? 0}
                </span>
              </button>
            ))}

            {/* Right: click hint */}
            <span className="ml-auto text-[10px] text-slate-400">
              Click any row to edit →
            </span>
          </div>

          {/* Table */}
          <div className="overflow-auto flex-1">
            {loading ? (
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-xs text-slate-400">No users found</div>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-2.5">User</th>
                    <th className="text-left px-3 py-2.5">Role</th>
                    <th className="text-left px-3 py-2.5">Team</th>
                    <th className="text-left px-3 py-2.5">Status</th>
                    <th className="text-left px-3 py-2.5">MFA</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                      onClick={() => router.push(`/users/${u.id}/edit`)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0',
                            avatarColor(u.email),
                          )}>
                            {initials(u.full_name, u.email)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{u.full_name || '—'}</p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold', ROLE_BADGE[u.role] ?? 'bg-slate-100 text-slate-600')}>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-slate-600 text-xs">{teamName(u.team_id)}</td>

                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1.5">
                          <span className={cn('w-1.5 h-1.5 rounded-full', u.is_active ? 'bg-green-500' : 'bg-slate-300')} />
                          <span className="text-slate-600">{u.is_active ? 'Active' : 'Suspended'}</span>
                        </span>
                      </td>

                      <td className="px-3 py-2.5">
                        <span className={cn(
                          'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                          u.mfa_enabled ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500',
                        )}>
                          {u.mfa_enabled ? '🔐 ON' : 'OFF'}
                        </span>
                      </td>

                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => router.push(`/users/${u.id}/edit`)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400">
            {filtered.length} of {total} users
          </div>
        </div>

        {/* Right panel */}
        <SecurityPanel users={users} teams={teams} roleFilter={tabRole} />
      </div>

    </div>
  );
}
