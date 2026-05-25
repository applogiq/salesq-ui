'use client';

import { useState } from 'react';
import { Phone, PhoneOff, Headphones, Clock, Users, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const LIVE_AGENTS = [
  { id: '1', name: 'Sarah Chen',   status: 'on_call',  duration: 183, contact: 'Alex Johnson', score: 88 },
  { id: '2', name: 'Marcus Brown', status: 'on_call',  duration: 94,  contact: 'Maria Garcia',  score: 72 },
  { id: '3', name: 'Priya Nair',   status: 'wrap_up',  duration: 42,  contact: null,             score: 91 },
  { id: '4', name: 'Tom O\'Brien', status: 'available',duration: 0,   contact: null,             score: 85 },
  { id: '5', name: 'Li Wei',       status: 'on_call',  duration: 312, contact: 'Rick Martinez', score: 67 },
];

const STATUS_CONFIG = {
  on_call:   { label: 'On Call',   dot: 'bg-green-500',  cls: 'bg-green-100 text-green-700'  },
  wrap_up:   { label: 'Wrap-up',   dot: 'bg-amber-500',  cls: 'bg-amber-100 text-amber-700'  },
  available: { label: 'Available', dot: 'bg-slate-400',  cls: 'bg-slate-100 text-slate-600'  },
};

const AVATAR_COLORS = ['bg-purple-500','bg-blue-500','bg-cyan-500','bg-amber-500','bg-pink-500'];
function avatarColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
function dur(sec: number) { const m = Math.floor(sec / 60), s = sec % 60; return sec ? `${m}:${String(s).padStart(2,'0')}` : '—'; }

export default function MonitoringPage() {
  const [agents] = useState(LIVE_AGENTS);
  const onCall = agents.filter((a) => a.status === 'on_call').length;

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Live Monitoring</h1>
          <p className="text-xs text-slate-500">Your team · {onCall} calls in progress</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg font-medium">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Calls',   value: onCall,             icon: Phone, color: 'text-green-500' },
          { label: 'Team Online',    value: agents.length,      icon: Users, color: 'text-cyan-500'  },
          { label: 'Avg Call Time',  value: '3:42',             icon: Clock, color: 'text-slate-500' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
            <m.icon className={cn('w-8 h-8', m.color)} />
            <div>
              <p className="text-xl font-bold text-slate-900">{m.value}</p>
              <p className="text-xs text-slate-500">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Team Overview</h2>
        </div>
        <div className="overflow-auto flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agents.map((agent) => {
              const sc = STATUS_CONFIG[agent.status as keyof typeof STATUS_CONFIG];
              return (
                <div key={agent.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-bold', avatarColor(agent.name))}>
                        {initials(agent.name)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{agent.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
                          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', sc.cls)}>{sc.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-500">Score</p>
                      <p className={cn('text-sm font-bold', agent.score >= 85 ? 'text-green-600' : agent.score >= 70 ? 'text-amber-600' : 'text-red-500')}>
                        {agent.score}
                      </p>
                    </div>
                  </div>
                  {agent.status === 'on_call' && (
                    <div className="bg-green-50 rounded-lg px-3 py-2 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-green-600 font-semibold uppercase">In call with</p>
                        <p className="text-xs font-medium text-slate-700">{agent.contact}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-mono font-semibold text-green-600">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        {dur(agent.duration)}
                      </div>
                    </div>
                  )}
                  {agent.status === 'on_call' && (
                    <div className="flex gap-2 mt-2">
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                        <Headphones className="w-3 h-3" /> Listen
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-red-200 rounded-lg hover:bg-red-50 text-red-600">
                        <PhoneOff className="w-3 h-3" /> Barge
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
