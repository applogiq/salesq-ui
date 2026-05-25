'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Phone, PhoneCall, Users,
  MessageSquare, Sparkles, BarChart2, Trophy, Settings,
  Radio, Briefcase, Megaphone, ClipboardCheck,
  Layers, FileBarChart, Calendar, Building2, UserCog,
  PhoneCall as TelIcon, CreditCard, ChevronLeft, ChevronRight,
  FolderKanban, Eye, ClipboardList,
} from 'lucide-react';
import { useRole } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}
interface NavSection {
  title: string;
  items: NavItem[];
}

const EXECUTIVE_NAV: NavSection[] = [
  {
    title: 'WORKSPACE',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Dialpad', href: '/dialpad', icon: Phone },
      { label: 'Call Queue', href: '/call-queue', icon: PhoneCall, badge: 14 },
    ],
  },
  {
    title: 'PIPELINE',
    items: [
      { label: 'My Leads', href: '/leads', icon: Users, badge: 247 },
      { label: 'Follow-ups', href: '/follow-ups', icon: FolderKanban, badge: 8 },
      { label: 'Messages', href: '/messages', icon: MessageSquare, badge: 3 },
    ],
  },
  {
    title: 'PERFORMANCE',
    items: [
      { label: 'AI Coaching', href: '/coaching', icon: Sparkles },
      { label: 'My Scorecard', href: '/scorecard', icon: BarChart2 },
      { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    ],
  },
];

const TEAM_LEAD_NAV: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Live Monitoring', href: '/monitoring', icon: Radio, badge: 8 },
    ],
  },
  {
    title: 'TEAM',
    items: [
      { label: 'My Team', href: '/team', icon: Users },
      { label: 'Coaching', href: '/coaching', icon: Sparkles },
      { label: 'Leads & Pipeline', href: '/leads', icon: Briefcase },
      { label: 'Campaigns', href: '/campaigns', icon: Megaphone },
    ],
  },
  {
    title: 'QUALITY',
    items: [
      { label: 'QA Review', href: '/qa', icon: ClipboardCheck, badge: 5 },
      { label: 'Omnichannel', href: '/omnichannel', icon: Layers },
      { label: 'Reports', href: '/reports', icon: FileBarChart },
    ],
  },
  {
    title: 'WORKSPACE',
    items: [
      { label: 'Calendar', href: '/calendar', icon: Calendar },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

const ADMIN_NAV: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Live Ops', href: '/live-ops', icon: Eye, badge: 12 },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Call Management', href: '/call-management', icon: PhoneCall, badge: 24 },
      { label: 'Campaigns',      href: '/campaigns',       icon: Megaphone },
      { label: 'Leads & CRM',   href: '/leads',            icon: Users },
      { label: 'Dialer Modes',  href: '/dialer',           icon: Phone },
      { label: 'Omnichannel',   href: '/omnichannel',      icon: Layers },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { label: 'AI Coaching',     href: '/coaching', icon: Sparkles },
      { label: 'QA & Compliance', href: '/qa',       icon: ClipboardCheck },
      { label: 'Reports',         href: '/reports',  icon: FileBarChart },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { label: 'Organization', href: '/organization', icon: Building2 },
      { label: 'Users & Roles', href: '/users',       icon: UserCog },
      { label: 'Telephony',     href: '/telephony',   icon: TelIcon },
      { label: 'Audit Log',     href: '/audit',       icon: ClipboardList },
      { label: 'Billing',       href: '/billing',     icon: CreditCard },
      { label: 'Settings',      href: '/settings',    icon: Settings },
    ],
  },
];


export default function Sidebar() {
  const { role } = useRole();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(role === 'admin');

  const navSections =
    role === 'executive' ? EXECUTIVE_NAV :
    role === 'team-lead' ? TEAM_LEAD_NAV :
    ADMIN_NAV;

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen shrink-0 transition-all duration-300',
        collapsed ? 'w-16' : 'w-56',
      )}
      style={{ background: '#0D1526' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 shrink-0">
        <div className="w-8 h-8 bg-cyan-500 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">SQ</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-semibold text-sm leading-tight">SalesQ</p>
            <p className="text-slate-500 text-[10px] whitespace-nowrap">AI Sales Platform</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center z-10 border border-slate-600 transition-colors"
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-slate-300" />
          : <ChevronLeft className="w-3 h-3 text-slate-300" />
        }
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-4 mt-1">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider px-2 mb-1">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors group',
                      active
                        ? 'bg-cyan-500/15 text-cyan-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
                    )}
                  >
                    <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300')} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 font-medium truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className={cn(
                            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                            active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400',
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

    </aside>
  );
}
