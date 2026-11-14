'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { api, Device, DisplayGroup } from '@/lib/services';
import type { Schedule } from '@/lib/services/studio/schedule.types';
import { SingleSelect } from '@/components/ui/SingleSelect';
import { ChevronLeft, ChevronRight, Monitor, Users, RefreshCw, Clock, RotateCcw } from 'lucide-react';

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
  const [deviceFilter, setDeviceFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
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
    const targets = new Map<string, { displays: string[]; groups: string[]; deviceIds: Set<string>; groupIds: Set<string> }>();
    for (const device of devices) {
      if (!device.scheduleId) continue;
      const current = targets.get(device.scheduleId) || { displays: [], groups: [], deviceIds: new Set(), groupIds: new Set() };
      current.displays.push(device.name);
      current.deviceIds.add(device.id);
      if (device.displayGroupId) current.groupIds.add(device.displayGroupId);
      targets.set(device.scheduleId, current);
    }
    for (const group of displayGroups) {
      const scheduleId = group.scheduleId || group.schedule_id;
      if (!scheduleId) continue;
      const current = targets.get(scheduleId) || { displays: [], groups: [], deviceIds: new Set(), groupIds: new Set() };
      current.groups.push(group.name);
      current.groupIds.add(group.id);
      targets.set(scheduleId, current);
    }
    return targets;
  }, [devices, displayGroups]);

  const filteredSchedules = useMemo(() => {
    if (!deviceFilter && !groupFilter) return schedules;
    const selectedDevice = devices.find((d) => d.id === deviceFilter);
    return schedules.filter((s) => {
      const t = scheduleTargets.get(s.id);
      if (!t) return false;
      if (deviceFilter) {
        const matchDevice = t.deviceIds.has(deviceFilter) || (selectedDevice?.displayGroupId ? t.groupIds.has(selectedDevice.displayGroupId) : false);
        if (!matchDevice) return false;
      }
      if (groupFilter && !t.groupIds.has(groupFilter)) return false;
      return true;
    });
  }, [schedules, scheduleTargets, devices, deviceFilter, groupFilter]);

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

      <section className="card-elevated" style={{ padding: 20, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Month Navigation, Quick Filters & Legend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: 4,
                borderRadius: 12,
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: 32, height: 32, padding: 0, borderRadius: 8, border: 'none' }}
                aria-label="Bulan sebelumnya"
                onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <h2 style={{ minWidth: 164, textAlign: 'center', margin: 0, color: 'var(--text-primary)', fontSize: '0.96rem', fontWeight: 750, letterSpacing: '-0.01em' }}>
                {calendarMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: 32, height: 32, padding: 0, borderRadius: 8, border: 'none' }}
                aria-label="Bulan berikutnya"
                onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              style={{ height: 40, padding: '0 14px', fontSize: '0.78rem', fontWeight: 650, borderRadius: 12 }}
              onClick={() => {
                const now = new Date();
                setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={loadData}
              className="btn btn-outline"
              style={{ width: 40, height: 40, padding: 0, borderRadius: 12 }}
              title="Segarkan kalender"
              aria-label="Segarkan data kalender"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ width: 200 }}>
              <SingleSelect
                value={deviceFilter}
                onChange={setDeviceFilter}
                placeholder="Semua Layar"
                options={[
                  { value: '', label: 'Semua Layar' },
                  ...devices.map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
            </div>
            <div style={{ width: 200 }}>
              <SingleSelect
                value={groupFilter}
                onChange={setGroupFilter}
                placeholder="Semua Grup Layar"
                options={[
                  { value: '', label: 'Semua Grup Layar' },
                  ...displayGroups.map((g) => ({ value: g.id, label: g.name })),
                ]}
              />
            </div>
            {(deviceFilter || groupFilter) && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ height: 40, padding: '0 10px', fontSize: '0.75rem' }}
                onClick={() => {
                  setDeviceFilter('');
                  setGroupFilter('');
                }}
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Legend & Helper Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            padding: '8px 12px',
            borderRadius: 12,
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.73rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-emerald)', fontWeight: 650 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-emerald)', boxShadow: '0 0 6px var(--accent-emerald)' }} />
              Sedang Berfungsi (Current)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary-400)', fontWeight: 650 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary-500)' }} />
              Terjadwal
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: 'rgba(59, 130, 246, 0.25)', border: '1px solid var(--primary-500)' }} />
              Hari Ini
            </span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>
            Klik tanggal mana saja untuk membuka rincian seluruh jadwal pada hari tersebut.
          </span>
        </div>

        {/* 42-day Calendar Grid */}
        <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ minWidth: 760 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
              {calendarWeekdays.map((weekday, idx) => {
                const isWeekend = idx >= 5;
                return (
                  <div
                    key={weekday}
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      color: isWeekend ? 'var(--accent-amber)' : 'var(--text-muted)',
                      fontSize: '0.73rem',
                      fontWeight: 750,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      borderRight: idx < 6 ? '1px solid var(--border-subtle)' : 'none',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    {weekday}
                  </div>
                );
              })}

              {calendarDates.map((date, cellIdx) => {
                const inMonth = date.getMonth() === calendarMonth.getMonth();
                const dateKey = localDateKey(date);
                const today = dateKey === localDateKey(new Date());

                const dayEvents = filteredSchedules
                  .flatMap((schedule) =>
                    (schedule.eventsList || [])
                      .filter((event) => scheduleEventOccursOnDate(event, date))
                      .map((event) => ({ schedule, event }))
                  )
                  .sort((a, b) => {
                    if (Boolean(a.event.isCurrentActive) !== Boolean(b.event.isCurrentActive)) {
                      return a.event.isCurrentActive ? -1 : 1;
                    }
                    const prioDiff = (b.event.priority ?? 0) - (a.event.priority ?? 0);
                    if (prioDiff !== 0) return prioDiff;
                    const timeA = new Date(a.event.createdAt || a.schedule.updatedAt || 0).getTime();
                    const timeB = new Date(b.event.createdAt || b.schedule.updatedAt || 0).getTime();
                    return timeB - timeA;
                  });

                const latestEvent = dayEvents.length > 0 ? dayEvents[0] : null;
                const colIdx = cellIdx % 7;
                const rowIdx = Math.floor(cellIdx / 7);

                return (
                  <Link
                    key={dateKey}
                    href={`/studio/schedules/day/${dateKey}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 136,
                      padding: 9,
                      borderRight: colIdx < 6 ? '1px solid var(--border-subtle)' : 'none',
                      borderBottom: rowIdx < 5 ? '1px solid var(--border-subtle)' : 'none',
                      background: today
                        ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.03) 100%)'
                        : 'var(--bg-surface)',
                      opacity: inMonth ? 1 : 0.42,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    title={`Klik untuk melihat seluruh jadwal pada ${date.toLocaleDateString('id-ID', { dateStyle: 'full' })}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span
                        style={{
                          minWidth: 26,
                          height: 26,
                          padding: today ? '0 7px' : 0,
                          borderRadius: 999,
                          display: 'inline-grid',
                          placeItems: 'center',
                          background: today ? 'var(--primary-500)' : 'transparent',
                          color: today ? '#fff' : 'var(--text-secondary)',
                          fontSize: '0.76rem',
                          fontWeight: today ? 800 : 600,
                          boxShadow: today ? '0 2px 8px rgba(59, 130, 246, 0.35)' : 'none',
                        }}
                      >
                        {date.getDate()}
                      </span>
                      {dayEvents.length > 1 && (
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 999,
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--primary-400)',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                          }}
                        >
                          +{dayEvents.length - 1} lainnya
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {latestEvent && (() => {
                        const { schedule, event } = latestEvent;
                        const targets = scheduleTargets.get(schedule.id);
                        const targetLabels = [
                          ...(targets?.displays || []).map((name) => ({ label: name, icon: Monitor })),
                          ...(targets?.groups || []).map((name) => ({ label: name, icon: Users })),
                        ];
                        const isLive = Boolean(event.isCurrentActive) && today;
                        const accent = isLive ? 'var(--accent-emerald)' : 'var(--primary-500)';

                        return (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                              padding: '7px 9px',
                              borderRadius: 10,
                              borderLeft: `3px solid ${accent}`,
                              background: isLive
                                ? 'rgba(16, 185, 129, 0.08)'
                                : 'rgba(59, 130, 246, 0.07)',
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {event.layoutName || schedule.name}
                              </span>
                              {isLive && (
                                <span
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    backgroundColor: 'var(--accent-emerald)',
                                    boxShadow: '0 0 6px var(--accent-emerald)',
                                  }}
                                  title="Sedang Berfungsi"
                                />
                              )}
                            </div>

                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: '0.64rem', fontFamily: 'monospace' }}>
                              <Clock size={10} />
                              {event.startTime.slice(0, 5)}–{event.endTime.slice(0, 5)}
                            </span>

                            {targetLabels.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {targetLabels.slice(0, 2).map(({ label, icon: TargetIcon }) => (
                                  <span
                                    key={label}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      maxWidth: '100%',
                                      color: 'var(--text-muted)',
                                      fontSize: '0.6rem',
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    <TargetIcon size={10} />{label}
                                  </span>
                                ))}
                                {targetLabels.length > 2 && (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.58rem', alignSelf: 'center' }}>
                                    +{targetLabels.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
