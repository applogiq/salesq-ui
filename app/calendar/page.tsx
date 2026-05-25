'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Phone, Calendar as CalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { leadsApi, type Lead } from '@/lib/api.leads';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [followUps, setFollowUps] = useState<Lead[]>([]);

  useEffect(() => {
    leadsApi.list({ sort: 'next_followup_at', order: 'asc', page: 1, page_size: 200 })
      .then((d) => setFollowUps(d.items.filter((l) => l.next_followup_at)))
      .catch(() => {});
  }, []);

  const prev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const next = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);

  // Map follow-ups to day numbers in this month
  const eventsByDay: Record<number, Lead[]> = {};
  for (const lead of followUps) {
    if (!lead.next_followup_at) continue;
    const d = new Date(lead.next_followup_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(lead);
    }
  }

  // Build grid cells
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedLeads = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  return (
    <div className="flex h-full gap-3">
      {/* Calendar */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h1 className="text-sm font-bold text-slate-900">{MONTHS[month]} {year}</h1>
          <div className="flex items-center gap-1">
            <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDay(today.getDate()); }}
              className="px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium"
            >
              Today
            </button>
            <button onClick={next} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold text-slate-400 uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 grid grid-cols-7 overflow-auto">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} className="border-b border-r border-slate-50 bg-slate-50/50" />;
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = day === selectedDay;
            const events = eventsByDay[day] ?? [];
            return (
              <div
                key={idx}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={cn(
                  'border-b border-r border-slate-100 p-1.5 cursor-pointer hover:bg-cyan-50/40 transition-colors min-h-[72px]',
                  isSelected && 'bg-cyan-50',
                )}
              >
                <span className={cn(
                  'w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1',
                  isToday ? 'bg-cyan-500 text-white' : 'text-slate-700',
                )}>
                  {day}
                </span>
                <div className="space-y-0.5">
                  {events.slice(0, 2).map((l) => (
                    <div key={l.id} className="text-[9px] bg-cyan-100 text-cyan-700 rounded px-1 truncate font-medium">
                      {l.name}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="text-[9px] text-slate-400 px-1">+{events.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side panel */}
      <div className="w-64 flex flex-col gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex-1 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            {selectedDay
              ? `${MONTHS[month]} ${selectedDay}`
              : 'Select a day'}
          </h2>
          {selectedDay ? (
            selectedLeads.length > 0 ? (
              <div className="space-y-3 overflow-auto flex-1">
                {selectedLeads.map((l) => (
                  <div key={l.id} className="border border-slate-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-800">{l.name}</p>
                    <p className="text-[10px] text-slate-400">{l.company ?? l.phone}</p>
                    {l.next_followup_at && (
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-cyan-600">
                        <Clock className="w-3 h-3" />
                        {new Date(l.next_followup_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    <button className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-[10px] font-semibold">
                      <Phone className="w-3 h-3" /> Call Now
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <CalIcon className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-xs text-slate-400">No follow-ups on this day</p>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <CalIcon className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-xs text-slate-400">Click a date to see follow-ups</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
