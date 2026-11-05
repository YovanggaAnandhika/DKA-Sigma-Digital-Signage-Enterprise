'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/services';
import type { Schedule } from '@/lib/services/studio/schedule.types';
import { Pagination } from '@/components/ui/Pagination';
import { CalendarDays, Search, RefreshCw, Trash2, Trash, Eye, Clock, Layers, ArrowRight, ShieldAlert, ChevronLeft, ChevronRight, Monitor, Users } from 'lucide-react';
import EmergencyBroadcastModal from '@/components/ui/EmergencyBroadcastModal';
import { TableDataValue } from '@/components/ui/TableDataValue';
import type { Device, DisplayGroup } from '@/lib/services';

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

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [displayGroups, setDisplayGroups] = useState<DisplayGroup[]>([]);
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
        api.getSchedules({ search, page, limit }),
        api.getDevices({ limit: 1000 }),
        api.getDisplayGroups({ limit: 1000 }),
      ]);
      setSchedules(scheduleRes.data);
      setTotal(scheduleRes.total);
      setDevices(deviceRes.data);
      setDisplayGroups(groupRes.data);
    } catch (err) {
      console.error('Failed to load rundown calendar:', err);
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat rundown operasional.');
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

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

  const handleToggleSelectAll = () => {
    if (schedules.length === 0) return;
    if (selectedIds.length === schedules.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(schedules.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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
      alert(err.message || 'Gagal menghapus beberapa jadwal');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (total === 0 && schedules.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus SEMUA (${total || schedules.length}) jadwal tayang?\nTindakan ini tidak dapat dibatalkan!`)) return;

    try {
      setDeleting(true);
      const allRes = await api.getSchedules({ limit: 1000 });
      const idsToDelete = allRes.data.map((s) => s.id);
      await Promise.all(idsToDelete.map((id) => api.deleteSchedule(id)));
      setSelectedIds([]);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus semua jadwal');
    } finally {
      setDeleting(false);
    }
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

  const formatDays = (daysStr?: string) => {
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '16px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <CalendarDays size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Rundown Operasional
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Kalender jadwal tayang player dan kelompok display.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setEmergencyOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--accent-rose)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 700,
              transition: 'all 0.2s ease',
            }}
            title="Siarkan Peringatan Darurat Langsung ke Display Player"
          >
            <ShieldAlert size={15} />
            <span>Siaran Darurat</span>
          </button>

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
          Gagal memuat kalender rundown: {loadError}
        </div>
      )}

      <section className="card-elevated" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="btn btn-outline" style={{ padding: 7 }} aria-label="Bulan sebelumnya" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
              <ChevronLeft size={16} />
            </button>
            <h2 style={{ minWidth: 180, textAlign: 'center', margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>
              {calendarMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </h2>
            <button type="button" className="btn btn-outline" style={{ padding: 7 }} aria-label="Bulan berikutnya" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
              <ChevronRight size={16} />
            </button>
            <button type="button" className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => {
              const now = new Date();
              setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
            }}>Hari ini</button>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Jadwal berulang ditampilkan sebagai blok di setiap tanggal yang cocok.
          </p>
        </div>

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
                const dayEvents = schedules.flatMap((schedule) =>
                  (schedule.eventsList || [])
                    .filter((event) => scheduleEventOccursOnDate(event, date))
                    .map((event) => ({ schedule, event }))
                );
                const today = localDateKey(date) === localDateKey(new Date());
                return (
                  <div key={localDateKey(date)} style={{ minHeight: 128, padding: 7, borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: today ? 'rgba(59,130,246,.055)' : 'var(--bg-surface)', opacity: inMonth ? 1 : 0.48 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
                      <span style={{ width: 23, height: 23, borderRadius: 999, display: 'grid', placeItems: 'center', background: today ? 'var(--primary-500)' : 'transparent', color: today ? '#fff' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: today ? 700 : 500 }}>
                        {date.getDate()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {dayEvents.slice(0, 3).map(({ schedule, event }) => {
                        const targets = scheduleTargets.get(schedule.id);
                        const targetLabels = [
                          ...(targets?.displays || []).map((name) => ({ label: name, icon: Monitor })),
                          ...(targets?.groups || []).map((name) => ({ label: name, icon: Users })),
                        ];
                        return (
                          <Link key={`${schedule.id}-${event.id}`} href={`/studio/schedules/${schedule.id}`} title={`${schedule.name} · ${event.layoutName} · ${event.startTime}–${event.endTime}`} style={{ display: 'block', padding: '5px 6px', borderRadius: 6, borderLeft: '3px solid var(--primary-500)', background: 'rgba(59,130,246,.12)', color: 'var(--text-primary)', textDecoration: 'none', overflow: 'hidden' }}>
                            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.layoutName || schedule.name}</span>
                            <span style={{ display: 'block', marginTop: 2, color: 'var(--text-secondary)', fontSize: '0.63rem' }}>{event.startTime.slice(0, 5)}–{event.endTime.slice(0, 5)}</span>
                            {targetLabels.slice(0, 2).map(({ label, icon: TargetIcon }) => (
                              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, maxWidth: '100%', marginTop: 3, marginRight: 4, padding: '2px 4px', borderRadius: 4, background: 'var(--bg-surface-elevated)', color: 'var(--text-muted)', fontSize: '0.58rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <TargetIcon size={9} />{label}
                              </span>
                            ))}
                            {targetLabels.length > 2 && <span style={{ color: 'var(--text-muted)', fontSize: '0.58rem' }}>+{targetLabels.length - 2} target</span>}
                          </Link>
                        );
                      })}
                      {dayEvents.length > 3 && <span style={{ paddingLeft: 4, color: 'var(--text-muted)', fontSize: '0.65rem' }}>+{dayEvents.length - 3} rundown</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <div className="card-elevated" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari berdasarkan nama jadwal..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Action Buttons: Icon Only for Select Delete & Hapus Semua */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0 || deleting}
            className="btn btn-outline"
            style={{
              padding: '9px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              color: selectedIds.length > 0 ? 'var(--accent-rose)' : 'var(--text-muted)',
              borderColor: selectedIds.length > 0 ? 'rgba(239, 68, 68, 0.4)' : undefined,
              backgroundColor: selectedIds.length > 0 ? 'rgba(239, 68, 68, 0.12)' : undefined,
              cursor: selectedIds.length === 0 || deleting ? 'not-allowed' : 'pointer',
              opacity: selectedIds.length === 0 ? 0.45 : 1,
              transition: 'all 0.2s ease',
            }}
            title={selectedIds.length > 0 ? `Hapus ${selectedIds.length} jadwal terpilih (Select Delete)` : 'Pilih jadwal untuk dihapus (Select Delete)'}
          >
            <Trash2 size={16} />
            {selectedIds.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: 'var(--accent-rose)',
                  color: '#fff',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  padding: '1px 5px',
                  lineHeight: 1.2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                {selectedIds.length}
              </span>
            )}
          </button>

          <button
            onClick={handleDeleteAll}
            disabled={schedules.length === 0 || deleting}
            className="btn btn-outline"
            style={{
              padding: '9px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: schedules.length > 0 ? 'var(--accent-rose)' : 'var(--text-muted)',
              borderColor: schedules.length > 0 ? 'rgba(239, 68, 68, 0.4)' : undefined,
              cursor: schedules.length === 0 || deleting ? 'not-allowed' : 'pointer',
              opacity: schedules.length === 0 ? 0.45 : 1,
              transition: 'all 0.2s ease',
            }}
            title="Hapus Semua Jadwal"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '42px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={schedules.length > 0 && selectedIds.length === schedules.length}
                    onChange={handleToggleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
                    title="Pilih Semua di Halaman Ini"
                  />
                </th>
                <th>NAMA JADWAL</th>
                <th>LAYOUT TAYANG</th>
                <th>JAM TAYANG AKTIF</th>
                <th>HARI TAYANG</th>
                <th>PRIORITAS</th>
                <th>TANGGAL DIBUAT</th>
                <th style={{ textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Memuat data...' : 'Tidak ada jadwal ditemukan. Push layout baru dari menu Layouts untuk mulai menayangkan konten.'}
                  </td>
                </tr>
              ) : (
                schedules.map((s) => {
                  const firstEvent = s.eventsList && s.eventsList.length > 0 ? s.eventsList[0] : null;
                  const totalEvents = s.eventsList ? s.eventsList.length : 0;
                  const createdDate = s.createdAt || (s as any).created_at;
                  const isSelected = selectedIds.includes(s.id);

                  return (
                    <tr key={s.id} style={{ backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : undefined }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(s.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
                        />
                      </td>
                      <td>
                        <TableDataValue icon={CalendarDays} detail={s.description || undefined}>
                        <Link href={`/studio/schedules/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {s.name}
                        </Link>
                        </TableDataValue>
                      </td>
                      <td>
                        {firstEvent ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Layers size={14} style={{ color: 'var(--primary-400)' }} />
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                              {firstEvent.layoutName || 'Layout'}
                            </span>
                            {totalEvents > 1 && (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>
                                +{totalEvents - 1} lainnya
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>-</span>
                        )}
                      </td>
                      <td>
                        {firstEvent ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
                            <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontFamily: 'monospace' }}>
                              {firstEvent.startTime} — {firstEvent.endTime}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>{firstEvent ? <TableDataValue icon={CalendarDays} tone="cyan">{formatDays(firstEvent.daysOfWeek)}</TableDataValue> : '-'}</td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--primary-400)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            fontFamily: 'monospace',
                          }}
                        >
                          P: {firstEvent?.priority ?? 0}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{createdDate ? <TableDataValue icon={Clock} tone="amber">{new Date(createdDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</TableDataValue> : '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Link href={`/studio/schedules/${s.id}`} className="btn btn-outline" style={{ padding: '5px 8px' }} title="Lihat Detail Jadwal">
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            className="btn btn-danger"
                            style={{ padding: '5px 8px' }}
                            title="Hapus Jadwal"
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

        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      <EmergencyBroadcastModal
        isOpen={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
      />
    </div>
  );
}
