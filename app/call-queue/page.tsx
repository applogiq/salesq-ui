'use client';

import { useState, useEffect } from 'react';
import { Phone, Clock, Users, PhoneCall, MoreHorizontal, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface QueueEntry {
  id: string;
  contact_name: string;
  phone: string;
  campaign_name: string;
  wait_seconds: number;
  status: 'waiting' | 'assigned' | 'ringing';
  priority: number;
}

// Mock data — real queue data comes via WebSocket in live ops phase
const MOCK_QUEUE: QueueEntry[] = [
  { id: '1', contact_name: 'Alex Johnson', phone: '+1 555 100 2001', campaign_name: 'Q2 Outbound', wait_seconds: 142, status: 'waiting',  priority: 1 },
  { id: '2', contact_name: 'Maria Garcia',  phone: '+1 555 100 2002', campaign_name: 'Q2 Outbound', wait_seconds: 87,  status: 'ringing',  priority: 1 },
  { id: '3', contact_name: 'David Kim',     phone: '+1 555 100 2003', campaign_name: 'Warm Leads',  wait_seconds: 210, status: 'waiting',  priority: 2 },
  { id: '4', contact_name: 'Sara Lee',      phone: '+1 555 100 2004', campaign_name: 'Warm Leads',  wait_seconds: 35,  status: 'assigned', priority: 2 },
  { id: '5', contact_name: 'Tom Wilson',    phone: '+1 555 100 2005', campaign_name: 'Enterprise',  wait_seconds: 305, status: 'waiting',  priority: 3 },
  { id: '6', contact_name: 'Jane Cooper',   phone: '+1 555 100 2006', campaign_name: 'Enterprise',  wait_seconds: 58,  status: 'waiting',  priority: 3 },
  { id: '7', contact_name: 'Rick Martinez', phone: '+1 555 100 2007', campaign_name: 'SMB Blitz',   wait_seconds: 420, status: 'waiting',  priority: 1 },
];

const STATUS_CONFIG = {
  waiting:  { label: 'Waiting',  cls: 'bg-amber-100 text-amber-700' },
  ringing:  { label: 'Ringing',  cls: 'bg-blue-100 text-blue-700' },
  assigned: { label: 'Assigned', cls: 'bg-green-100 text-green-700' },
};

function waitLabel(sec: number): string {
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

const METRICS = [
  { label: 'In Queue',    value: 14, icon: Users,    color: 'text-amber-500' },
  { label: 'Ringing',     value: 3,  icon: Phone,    color: 'text-blue-500'  },
  { label: 'Avg Wait',    value: '2m 18s', icon: Clock, color: 'text-slate-500' },
  { label: 'Available',   value: 8,  icon: PhoneCall, color: 'text-green-500' },
];

export default function CallQueuePage() {
  const [queue] = useState<QueueEntry[]>(MOCK_QUEUE);

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Call Queue</h1>
          <p className="text-xs text-slate-500">Live inbound &amp; outbound queue — updates in real time</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg font-medium">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3">
        {METRICS.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
            <m.icon className={cn('w-8 h-8', m.color)} />
            <div>
              <p className="text-xl font-bold text-slate-900">{m.value}</p>
              <p className="text-xs text-slate-500">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Queue table */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Active Queue</h2>
          <button className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-3 py-2">Contact</th>
                <th className="text-left px-3 py-2">Campaign</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Wait</th>
                <th className="text-left px-3 py-2">Priority</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {queue.map((entry, idx) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-800">{entry.contact_name}</p>
                    <p className="text-slate-400">{entry.phone}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{entry.campaign_name}</td>
                  <td className="px-3 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', STATUS_CONFIG[entry.status].cls)}>
                      {STATUS_CONFIG[entry.status].label}
                    </span>
                  </td>
                  <td className={cn('px-3 py-3 font-semibold', entry.wait_seconds > 180 ? 'text-red-500' : 'text-slate-700')}>
                    {waitLabel(entry.wait_seconds)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((p) => (
                        <span key={p} className={cn('w-2 h-2 rounded-full', p <= (4 - entry.priority) ? 'bg-cyan-500' : 'bg-slate-200')} />
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button className="flex items-center gap-1 px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold">
                      <Phone className="w-3 h-3" /> Answer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
