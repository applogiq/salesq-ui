'use client';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  Search, Calendar, Phone, ChevronDown, Bell, HelpCircle,
  LogOut, Shield,
  CheckCircle2, Clock, MinusCircle, User as UserIcon,
} from 'lucide-react';
import { useAuth, useRole } from '@/context/AuthContext';
import { teamsApi, usersApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Status ─────────────────────────────────────────────────────────────────────

type PresenceStatus = 'available' | 'busy' | 'offline';

const STATUS_CONFIG: Record<PresenceStatus, { label: string; color: string; icon: React.ElementType; dot: string }> = {
  available: { label: 'Available',      color: 'text-green-600', icon: CheckCircle2, dot: 'bg-green-500' },
  busy:      { label: 'Busy',           color: 'text-amber-600', icon: Clock,        dot: 'bg-amber-500' },
  offline:   { label: 'Appear Offline', color: 'text-slate-500', icon: MinusCircle,  dot: 'bg-slate-400' },
};

// ── Default workspaces ─────────────────────────────────────────────────────────

const DEFAULT_WORKSPACES = [
  { id: 'acme-sales', name: 'Acme Sales',        role: 'Admin', current: true  },
  { id: 'acme-demo',  name: 'Acme Demo Sandbox', role: 'Admin', current: false },
];

// ── Title config ───────────────────────────────────────────────────────────────

const TITLE_BY_ROLE: Record<string, string> = {
  admin:       'Organization Overview',
  'team-lead': 'Team Command',
  executive:   'My Workspace',
};

// Module-level subtitle cache — survives route navigations, cleared on page refresh.
// Keyed by role so switching accounts gets fresh data.
const _subtitleCache: Record<string, { value: string; ts: number }> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedSubtitle(role: string): string | null {
  const entry = _subtitleCache[role];
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.value;
  return null;
}
function setCachedSubtitle(role: string, value: string) {
  _subtitleCache[role] = { value, ts: Date.now() };
}

// ── Avatar helper ──────────────────────────────────────────────────────────────

function avatarInitials(name: string | null, email: string | undefined): string {
  const src = name?.trim() || email || '?';
  const parts = src.split(/\s+|@/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ── Profile Menu ───────────────────────────────────────────────────────────────

interface ProfileMenuProps {
  onClose: () => void;
  onLogout: () => void;
  status: PresenceStatus;
  onStatusChange: (s: PresenceStatus) => void;
}

function ProfileMenu({ onClose, onLogout, status, onStatusChange }: ProfileMenuProps) {
  const { user } = useAuth();
  const router = useRouter();
  const statusConf = STATUS_CONFIG[status];
  const [workspaces, setWorkspaces] = useState(DEFAULT_WORKSPACES);

  function switchWorkspace(id: string) {
    setWorkspaces(ws => ws.map(w => ({ ...w, current: w.id === id })));
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">

      {/* User identity */}
      <div className="px-4 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-cyan-600 flex items-center justify-center text-white text-sm font-bold">
              {avatarInitials(user?.full_name ?? null, user?.email)}
            </div>
            <span className={cn('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', statusConf.dot)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.full_name || user?.email}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            <span className={cn('text-[10px] font-semibold', statusConf.color)}>{statusConf.label}</span>
          </div>
        </div>
      </div>

      {/* Status picker */}
      <div className="px-3 py-2 border-b border-slate-100">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1 mb-1.5">Presence</p>
        {(Object.entries(STATUS_CONFIG) as [PresenceStatus, typeof STATUS_CONFIG[PresenceStatus]][]).map(([key, conf]) => {
          const Icon = conf.icon;
          return (
            <button
              key={key}
              onClick={() => onStatusChange(key)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-colors',
                status === key ? 'bg-slate-100' : 'hover:bg-slate-50',
              )}
            >
              <Icon className={cn('w-3.5 h-3.5 shrink-0', conf.color)} />
              <span className={cn('font-medium', status === key ? 'text-slate-900' : 'text-slate-600')}>{conf.label}</span>
              {status === key && <CheckCircle2 className="w-3 h-3 text-cyan-500 ml-auto" />}
            </button>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="px-3 py-2 border-b border-slate-100">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1 mb-1.5">Account</p>
        <button
          onClick={() => { router.push(`/users/${user?.id}/edit`); onClose(); }}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
          My Profile
        </button>
        <a href="/settings/sessions"
          onClick={onClose}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          Sessions &amp; Security
        </a>
        <a href="/settings/mfa"
          onClick={onClose}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          MFA Setup
        </a>
      </div>

      {/* Workspace switcher */}
      <div className="px-3 py-2 border-b border-slate-100">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1 mb-1.5">Workspaces</p>
        {workspaces.map((ws) => (
          <button
            key={ws.id}
            onClick={() => switchWorkspace(ws.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-colors',
              ws.current ? 'bg-cyan-50' : 'hover:bg-slate-50',
            )}
          >
            <div className={cn(
              'w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0',
              ws.current ? 'bg-cyan-500' : 'bg-slate-400',
            )}>
              {ws.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className={cn('font-medium truncate', ws.current ? 'text-cyan-700' : 'text-slate-700')}>{ws.name}</p>
              <p className="text-[10px] text-slate-400">{ws.role}</p>
            </div>
            {ws.current && <CheckCircle2 className="w-3 h-3 text-cyan-500 shrink-0" />}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div className="text-[10px] text-slate-400">
          <span className="font-medium">SalesQ</span> v2.1.0 ·{' '}
          <span className="text-green-600 font-medium">● All systems normal</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-[10px] text-red-500 hover:text-red-600 font-semibold"
        >
          <LogOut className="w-3 h-3" /> Sign out
        </button>
      </div>
    </div>
  );
}

// ── Main TopBar ───────────────────────────────────────────────────────────────

export default function TopBar() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [status, setStatus] = useState<PresenceStatus>('available');
  // Initialise from cache so first paint shows real data (no "—" flash)
  const [subtitle, setSubtitle] = useState<string>(() => getCachedSubtitle(role) ?? '—');
  const menuRef = useRef<HTMLDivElement>(null);

  const title = TITLE_BY_ROLE[role] ?? 'My Workspace';

  // Build dynamic subtitle — reads from module cache on first paint (no flash)
  useEffect(() => {
    let cancelled = false;

    // Return early if we already have fresh cached data
    if (getCachedSubtitle(role)) return;

    async function load() {
      try {
        let computed = '';

        if (role === 'admin') {
          const [teams, users] = await Promise.all([teamsApi.list(), usersApi.list()]);
          const domain = user?.email?.split('@')[1]?.split('.')[0];
          const orgName = domain
            ? domain.charAt(0).toUpperCase() + domain.slice(1)
            : 'Your Org';
          computed = `${orgName} · ${teams.length} team${teams.length !== 1 ? 's' : ''} · ${users.length} user${users.length !== 1 ? 's' : ''}`;
        } else if (role === 'team-lead') {
          const params = user?.team_id ? { team_id: user.team_id } : undefined;
          const members = await usersApi.list(params);
          computed = `${members.length} member${members.length !== 1 ? 's' : ''} · 3 active campaigns`;
        } else {
          const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric',
          });
          computed = `${today} · Shift: 9:00am – 6:00pm`;
        }

        if (!cancelled && computed) {
          setCachedSubtitle(role, computed);
          setSubtitle(computed);
        }
      } catch {
        // silently keep current value
      }
    }

    load();
    return () => { cancelled = true; };
  }, [role, user?.team_id, user?.email]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handleLogout() {
    setProfileOpen(false);
    await logout();
    router.push('/login');
  }

  const statusDot = STATUS_CONFIG[status].dot;

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-slate-900 truncate">{title}</h1>
        <p className="text-xs text-slate-400 truncate">{subtitle}</p>
      </div>

      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          placeholder="Search leads, contacts, calls..."
          className="w-full pl-9 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-slate-100 px-1 rounded">⌘K</span>
      </div>

      {role === 'executive' && (
        <>
          {/* Status indicator */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <span className={cn('w-2.5 h-2.5 rounded-full', statusDot)} />
            {STATUS_CONFIG[status].label}
          </div>

          {/* Schedule break */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Calendar className="w-3.5 h-3.5" />
            Schedule break
          </button>

          {/* Start dialing */}
          <a
            href="/dialpad"
            className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Start dialing
          </a>
        </>
      )}

      {(role === 'team-lead' || role === 'admin') && (
        <>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <HelpCircle className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 relative transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </>
      )}

      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center text-white text-[10px] font-bold">
              {avatarInitials(user?.full_name ?? null, user?.email)}
            </div>
            <span className={cn('absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white', statusDot)} />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.full_name ?? user?.email ?? 'User'}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role ?? ''}</p>
          </div>
          <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform', profileOpen && 'rotate-180')} />
        </button>

        {profileOpen && (
          <ProfileMenu
            onClose={() => setProfileOpen(false)}
            onLogout={handleLogout}
            status={status}
            onStatusChange={setStatus}
          />
        )}
      </div>
    </header>
  );
}
