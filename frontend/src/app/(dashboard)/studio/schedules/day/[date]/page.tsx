'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock, Monitor, Users, Eye, RefreshCw, Layers, Search, ArrowRight, Trash2, Trash, LayoutTemplate } from 'lucide-react';
import { TableDataValue } from '@/components/ui/TableDataValue';
import { api, Device, DisplayGroup } from '@/lib/services';
import type { Schedule } from '@/lib/services/studio/schedule.types';

function scheduleEventOccursOnDate(event: Schedule['eventsList'][number], dateKey: string, date: Date) {
  if (event.startDate && dateKey < event.startDate.slice(0, 10)) return false;
  if (event.endDate && dateKey > event.endDate.slice(0, 10)) return false;
  const weekday = date.getDay() === 0 ? 7 : date.getDay();
  return (event.daysOfWeek || '1,2,3,4,5,6,7')
    .split(',')
    .map((day) => day.trim())
    .includes(String(weekday));
}

function formatDays(daysStr?: string) {
  if (!daysStr) return '-';
  if (daysStr === '1,2,3,4,5,6,7') return 'Setiap Hari';
  const dayMap: Record<string, string> = {
    '1': 'Sen',
    '2': 'Sel',
    '3': 'Rab',
    '4': 'Kam',
    '5': 'Jum',
    '6': 'Sab',
    '7': 'Min',
  };
  return daysStr
    .split(',')
    .map((d) => dayMap[d.trim()] || d)
    .join(', ');
}

export default function DailyRundownPage() {
  const params = useParams() as { date: string };
  const dateKey = params.date || '';

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [displayGroups, setDisplayGroups] = useState<DisplayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  const targetDate = useMemo(() => {
    if (!dateKey) return new Date();
    const [year, month, day] = dateKey.split('-').map(Number);
    if (!year || !month || !day) return new Date();
    return new Date(year, month - 1, day);
  }, [dateKey]);

  const formattedDateTitle = useMemo(() => {
    if (!dateKey) return '-';
    return targetDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [targetDate, dateKey]);

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
      console.error('Failed to load daily rundown:', err);
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat jadwal harian.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Filter tasks that occur on targetDate
  const dayTasks = useMemo(() => {
    const list: Array<{
      schedule: Schedule;
      event: Schedule['eventsList'][number];
    }> = [];

    // Sort schedules newest first
    const sortedSchedules = schedules.slice().sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || (a as any).created_at || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || (b as any).created_at || 0).getTime();
      return timeB - timeA;
    });

    for (const schedule of sortedSchedules) {
      for (const event of schedule.eventsList || []) {
        if (scheduleEventOccursOnDate(event, dateKey, targetDate)) {
          list.push({ schedule, event });
        }
      }
    }

    if (!search.trim()) return list;
    const query = search.toLowerCase();
    return list.filter(({ schedule, event }) =>
      (schedule.name || '').toLowerCase().includes(query) ||
      (event.layoutName || '').toLowerCase().includes(query)
    );
  }, [schedules, dateKey, targetDate, search]);

  const uniqueScheduleIdsOnDay = useMemo(() => {
    return [...new Set(dayTasks.map((t) => t.schedule.id))];
  }, [dayTasks]);

  const handleToggleSelectAll = () => {
    if (uniqueScheduleIdsOnDay.length === 0) return;
    if (selectedIds.length === uniqueScheduleIdsOnDay.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(uniqueScheduleIdsOnDay);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus jadwal "${name}"?`)) return;
    try {
      await api.deleteSchedule(id);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus jadwal');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Hapus ${selectedIds.length} jadwal terpilih?`)) return;

    try {
      setDeleting(true);
      await Promise.all(selectedIds.map((id) => api.deleteSchedule(id)));
      setSelectedIds([]);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus jadwal terpilih');
    } finally {
      setDeleting(false);
    }
  };

  const handleClearAllDay = async () => {
    if (uniqueScheduleIdsOnDay.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus SEMUA (${uniqueScheduleIdsOnDay.length}) jadwal yang aktif pada tanggal ini?\nTindakan ini tidak dapat dibatalkan!`)) return;

    try {
      setDeleting(true);
      await Promise.all(uniqueScheduleIdsOnDay.map((id) => api.deleteSchedule(id)));
      setSelectedIds([]);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal membersihkan jadwal harian');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href="/studio/schedules"
            className="btn btn-outline"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
            aria-label="Kembali ke Rundown Operasional"
            title="Kembali ke Rundown Operasional"
          >
            <ArrowLeft size={18} />
          </Link>
          <div
            style={{
              padding: '10px',
              borderRadius: '14px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <CalendarDays size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
              Rundown Harian — {formattedDateTitle}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>
              Daftar seluruh tugas penayangan layout dan target display yang aktif pada tanggal ini.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {uniqueScheduleIdsOnDay.length > 0 && (
            <button
              onClick={handleClearAllDay}
              disabled={deleting}
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                color: 'var(--accent-rose)',
                borderColor: 'rgba(239, 68, 68, 0.35)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                fontSize: '0.8125rem',
                fontWeight: 700,
              }}
              title="Hapus semua jadwal yang aktif pada tanggal ini (Clear All)"
            >
              <Trash size={15} />
              <span>Clear All Hari Ini</span>
            </button>
          )}
          <button onClick={loadData} className="btn btn-outline" style={{ padding: '8px 12px' }} title="Segarkan data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/studio/layouts/data"
            className="btn btn-primary"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Layers size={16} />
            <span>Pilih Layout untuk Ditayangkan</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="card-elevated" style={{ padding: 14, color: 'var(--accent-rose)', fontSize: '0.85rem' }}>
          Gagal memuat rundown harian: {loadError}
        </div>
      )}

      {/* Search & Bulk Action Bar */}
      <div className="card-elevated" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama jadwal atau layout..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Total Tugas: <span style={{ color: 'var(--primary-400)' }}>{dayTasks.length}</span>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="btn btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                color: 'var(--accent-rose)',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
              title={`Hapus ${selectedIds.length} jadwal terpilih`}
            >
              <Trash2 size={14} />
              <span>Hapus Terpilih ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Table of Daily Tasks */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '42px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={uniqueScheduleIdsOnDay.length > 0 && selectedIds.length === uniqueScheduleIdsOnDay.length}
                    onChange={handleToggleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
                    title="Pilih Semua Jadwal Hari Ini"
                  />
                </th>
                <th>NAMA RUNDOWN / JADWAL</th>
                <th>TEMPLATE LAYOUT</th>
                <th>JAM TAYANG AKTIF</th>
                <th>TARGET DISPLAY & KELOMPOK</th>
                <th>PERIODE BERLAKU</th>
                <th>HARI AKTIF</th>
                <th style={{ textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {dayTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <CalendarDays size={32} style={{ opacity: 0.35 }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {loading ? 'Memuat data rundown harian...' : 'Tidak ada jadwal penayangan yang aktif pada tanggal ini.'}
                      </span>
                      {!loading && (
                        <Link href="/studio/layouts/data" className="btn btn-outline" style={{ marginTop: '6px', fontSize: '0.8rem' }}>
                          Jadwalkan Layout Sekarang
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                dayTasks.map(({ schedule, event }, index) => {
                  const targets = scheduleTargets.get(schedule.id);
                  const displayLabels = targets?.displays || [];
                  const groupLabels = targets?.groups || [];
                  const isSelected = selectedIds.includes(schedule.id);

                  return (
                    <tr key={`${schedule.id}-${event.id || index}`} style={{ backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : undefined }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(schedule.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
                        />
                      </td>
                      <td>
                        <TableDataValue icon={CalendarDays} detail={schedule.description || 'Rundown aktif'}>
                          <Link
                            href={`/studio/schedules/${schedule.id}`}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            {schedule.name}
                          </Link>
                        </TableDataValue>
                      </td>
                      <td>
                        <TableDataValue icon={LayoutTemplate} tone="primary">
                          {event.layoutName || 'Layout Template'}
                        </TableDataValue>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <TableDataValue icon={Clock} tone="cyan">
                          {event.startTime || '00:00'} – {event.endTime || '23:59'}
                        </TableDataValue>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '320px' }}>
                          {displayLabels.map((name) => (
                            <span
                              key={`disp-${name}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-surface-elevated)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.72rem',
                              }}
                            >
                              <Monitor size={10} />
                              {name}
                            </span>
                          ))}
                          {groupLabels.map((name) => (
                            <span
                              key={`grp-${name}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-surface-elevated)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.72rem',
                              }}
                            >
                              <Users size={10} />
                              {name}
                            </span>
                          ))}
                          {displayLabels.length === 0 && groupLabels.length === 0 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Semua Perangkat / Default</span>
                          )}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <TableDataValue icon={CalendarDays} tone="amber">
                          {event.startDate ? event.startDate.slice(0, 10) : 'Permanen'}
                          {event.endDate ? ` – ${event.endDate.slice(0, 10)}` : ''}
                        </TableDataValue>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-400)', fontSize: '0.75rem', fontWeight: 600 }}>
                          {formatDays(event.daysOfWeek)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Link
                            href={`/studio/schedules/${schedule.id}`}
                            className="btn btn-outline"
                            style={{ padding: '5px 8px' }}
                            title="Lihat Detail Jadwal"
                            aria-label={`Lihat detail jadwal ${schedule.name}`}
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(schedule.id, schedule.name)}
                            className="btn btn-danger"
                            style={{ padding: '5px 8px' }}
                            title="Hapus Jadwal Ini"
                            aria-label={`Hapus jadwal ${schedule.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
