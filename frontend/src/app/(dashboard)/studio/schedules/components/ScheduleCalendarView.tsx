'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { api, Device, DisplayGroup } from '@/lib/services';
import type { Schedule } from '@/lib/services/studio/schedule.types';
import { ChevronLeft, ChevronRight, Monitor, Users, RefreshCw, CalendarDays } from 'lucide-react';

const calendarWeekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function scheduleEventOccursOnDate(event: Schedule['eventsList'][number], date: Date) {
  const dateKey = localDateKey(date);
  if (event.startDate && dateKey < event.startDate.slice(0, 10)) return false;
  if (event.endDate && dateKey > event.endDate.slice(0, 10)) return false;
  const weekday = date.getDay() === 0 ? 7 : date.getDay();
  return (event.daysOfWeek || '1,2,3,4,5,6,7')
    .split(',')
    .map((day) => day.trim())
    .includes(String(weekday));
}

export default function ScheduleCalendarView() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [displayGroups, setDisplayGroups] = useState<DisplayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const calendarDates = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) =>
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - mondayOffset + 1)
    );
  }, [calendarMonth]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [scheduleRes, deviceRes, groupRes] = await Promise.all([
        api.getSchedules({ limit: 1000 }),
        api.getDevices({ limit: 1000 }),
        api.getDisplayGroups({ limit: 1000 }),
      ]);
      setSchedules(scheduleRes.data);
      setDevices(deviceRes.data);
      setDisplayGroups(groupRes.data);
    } catch (err) {
      console.error('Failed to load rundown calendar:', err);
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat kalender rundown operasional.');
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleTargets = useMemo(() => {
    const targets = new Map<string, { displays: string[]; groups: string[] }>();
    for (const device of devices) {
      if (!device.scheduleId) continue;
      const current = targets.get(device.scheduleId) || { displays: [], groups: [] };
      current.displays.push(device.name);
      targets.set(device.scheduleId, current);
    }
    for (const group of displayGroups) {
      const scheduleId = group.scheduleId || group.schedule_id;
      if (!scheduleId) continue;
      const current = targets.get(scheduleId) || { displays: [], groups: [] };
      current.groups.push(group.name);
      targets.set(scheduleId, current);
    }
    return targets;
  }, [devices, displayGroups]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {loadError && (
        <div role="alert" className="card-elevated" style={{ padding: 14, color: 'var(--accent-rose)', fontSize: '0.85rem' }}>
          Gagal memuat kalender: {loadError}
        </div>
      )}

      <section className="card-elevated" style={{ padding: 16 }}>
        {/* Month Navigation & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: 7 }}
              aria-label="Bulan sebelumnya"
              onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <h2 style={{ minWidth: 180, textAlign: 'center', margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>
              {calendarMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: 7 }}
              aria-label="Bulan berikutnya"
              onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              onClick={() => {
                const now = new Date();
                setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
            >
              Hari ini
            </button>
            <button
              type="button"
              onClick={loadData}
              className="btn btn-outline"
              style={{ padding: 7, marginLeft: 4 }}
              title="Segarkan kalender"
              aria-label="Segarkan data kalender"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Klik tanggal mana saja untuk membuka rincian penugasan harian lengkap.
          </p>
        </div>

        {/* 42-day Calendar Grid */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 720 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderTop: '1px solid var(--border-subtle)', borderLeft: '1px solid var(--border-subtle)' }}>
              {calendarWeekdays.map((weekday) => (
                <div key={weekday} style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {weekday}
                </div>
              ))}
              {calendarDates.map((date) => {
                const inMonth = date.getMonth() === calendarMonth.getMonth();
                const dateKey = localDateKey(date);
                const dayEvents = schedules
                  .slice()
                  .sort((a, b) => {
                    const timeA = new Date(a.updatedAt || a.createdAt || (a as any).created_at || 0).getTime();
                    const timeB = new Date(b.updatedAt || b.createdAt || (b as any).created_at || 0).getTime();
                    return timeB - timeA;
                  })
                  .flatMap((schedule) =>
                    (schedule.eventsList || [])
                      .filter((event) => scheduleEventOccursOnDate(event, date))
                      .map((event) => ({ schedule, event }))
                  );
                const latestEvent = dayEvents.length > 0 ? dayEvents[0] : null;
                const today = dateKey === localDateKey(new Date());

                return (
                  <Link
                    key={dateKey}
                    href={`/studio/schedules/day/${dateKey}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 128,
                      padding: 7,
                      borderRight: '1px solid var(--border-subtle)',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: today ? 'rgba(59,130,246,.055)' : 'var(--bg-surface)',
                      opacity: inMonth ? 1 : 0.48,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    title={`Klik untuk melihat seluruh jadwal pada ${date.toLocaleDateString('id-ID', { dateStyle: 'full' })}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
                      <span style={{ width: 23, height: 23, borderRadius: 999, display: 'grid', placeItems: 'center', background: today ? 'var(--primary-500)' : 'transparent', color: today ? '#fff' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: today ? 700 : 500 }}>
                        {date.getDate()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {latestEvent && (() => {
                        const { schedule, event } = latestEvent;
                        const targets = scheduleTargets.get(schedule.id);
                        const targetLabels = [
                          ...(targets?.displays || []).map((name) => ({ label: name, icon: Monitor })),
                          ...(targets?.groups || []).map((name) => ({ label: name, icon: Users })),
                        ];
                        return (
                          <div
                            style={{
                              display: 'block',
                              padding: '5px 6px',
                              borderRadius: 6,
                              borderLeft: '3px solid var(--primary-500)',
                              background: 'rgba(59,130,246,.12)',
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                            }}
                          >
                            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {event.layoutName || schedule.name}
                            </span>
                            <span style={{ display: 'block', marginTop: 2, color: 'var(--text-secondary)', fontSize: '0.63rem' }}>
                              {event.startTime.slice(0, 5)}–{event.endTime.slice(0, 5)}
                            </span>
                            {targetLabels.slice(0, 2).map(({ label, icon: TargetIcon }) => (
                              <span
                                key={label}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  maxWidth: '100%',
                                  marginTop: 3,
                                  marginRight: 4,
                                  padding: '2px 4px',
                                  borderRadius: 4,
                                  background: 'var(--bg-surface-elevated)',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.58rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                <TargetIcon size={9} />{label}
                              </span>
                            ))}
                            {targetLabels.length > 2 && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.58rem' }}>
                                +{targetLabels.length - 2} target
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      {dayEvents.length > 1 && (
                        <span
                          style={{
                            alignSelf: 'flex-start',
                            padding: '1px 5px',
                            borderRadius: 999,
                            background: 'rgba(59,130,246,.14)',
                            color: 'var(--primary-400)',
                            fontSize: '0.58rem',
                            fontWeight: 700,
                          }}
                        >
                          +{dayEvents.length - 1} rundown lainnya
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

