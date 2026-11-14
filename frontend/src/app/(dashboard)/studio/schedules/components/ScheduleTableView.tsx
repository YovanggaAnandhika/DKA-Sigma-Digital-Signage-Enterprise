'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { api, Device, DisplayGroup } from '@/lib/services';
import type { Schedule, ScheduleEvent } from '@/lib/services/studio/schedule.types';
import { Pagination } from '@/components/ui/Pagination';
import { TableDataValue } from '@/components/ui/TableDataValue';
import { SingleSelect } from '@/components/ui/SingleSelect';
import {
  CalendarDays,
  Search,
  RefreshCw,
  Trash2,
  Trash,
  Eye,
  Clock,
  Monitor,
  Users,
  RotateCcw,
} from 'lucide-react';

function resolveScheduleStatus(
  event: ScheduleEvent | undefined,
  hasTargets: boolean
): {
  label: string;
  bg: string;
  color: string;
  border: string;
  isLive: boolean;
} {
  if (!event) {
    return {
      label: 'Kosong',
      bg: 'var(--bg-surface-elevated)',
      color: 'var(--text-muted)',
      border: 'var(--border-subtle)',
      isLive: false,
    };
  }

  if (event.isCurrentActive) {
    return {
      label: 'Sedang Berfungsi',
      bg: 'rgba(16, 185, 129, 0.14)',
      color: 'var(--accent-emerald)',
      border: 'rgba(16, 185, 129, 0.35)',
      isLive: true,
    };
  }

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (event.endDate && todayKey > event.endDate.slice(0, 10)) {
    return {
      label: 'Berakhir',
      bg: 'var(--bg-surface-elevated)',
      color: 'var(--text-muted)',
      border: 'var(--border-subtle)',
      isLive: false,
    };
  }

  if (!hasTargets) {
    return {
      label: 'Tanpa Target',
      bg: 'rgba(245, 158, 11, 0.12)',
      color: 'var(--accent-amber)',
      border: 'rgba(245, 158, 11, 0.3)',
      isLive: false,
    };
  }

  return {
    label: 'Terjadwal',
    bg: 'rgba(59, 130, 246, 0.12)',
    color: 'var(--primary-400)',
    border: 'rgba(59, 130, 246, 0.28)',
    isLive: false,
  };
}

export default function ScheduleTableView() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [displayGroups, setDisplayGroups] = useState<DisplayGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadTargets = useCallback(async () => {
    try {
      const [deviceRes, groupRes] = await Promise.all([
        api.getDevices({ limit: 1000 }),
        api.getDisplayGroups({ limit: 1000 }),
      ]);
      setDevices(deviceRes.data);
      setDisplayGroups(groupRes.data);
    } catch (err) {
      console.error('Failed to load display/group targets:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await api.getSchedules({
        search: search.trim() || undefined,
        page,
        limit,
        deviceId: deviceFilter || undefined,
        displayGroupId: groupFilter || undefined,
        flattenEvents: true,
      });
      setSchedules(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load schedules table:', err);
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat daftar tabel jadwal.');
    } finally {
      setLoading(false);
    }
  }, [search, page, limit, deviceFilter, groupFilter]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

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

  const rowKeyFor = (s: Schedule) => {
    const evId = s.eventsList?.[0]?.id;
    return evId ? `${s.id}::${evId}` : s.id;
  };

  const handleToggleSelectAll = () => {
    if (schedules.length === 0) return;
    if (selectedRowKeys.length === schedules.length) {
      setSelectedRowKeys([]);
    } else {
      setSelectedRowKeys(schedules.map(rowKeyFor));
    }
  };

  const handleToggleSelect = (key: string) => {
    setSelectedRowKeys((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
    );
  };

  const deleteScheduleOrEvent = async (scheduleId: string, eventId?: string) => {
    if (!eventId) {
      await api.deleteSchedule(scheduleId);
      return;
    }
    const full = await api.getSchedule(scheduleId).catch(() => null);
    if (full && (full.eventsList?.length || 0) > 1) {
      await api.removeScheduleEvent(eventId, scheduleId);
    } else {
      await api.deleteSchedule(scheduleId);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) return;
    if (!confirm(`Hapus ${selectedRowKeys.length} jadwal terpilih?`)) return;

    try {
      setDeleting(true);
      for (const key of selectedRowKeys) {
        const [scheduleId, eventId] = key.split('::');
        await deleteScheduleOrEvent(scheduleId, eventId);
      }
      setSelectedRowKeys([]);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus beberapa jadwal');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (total === 0 && schedules.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus SEMUA jadwal tayang?\nTindakan ini tidak dapat dibatalkan!`)) return;

    try {
      setDeleting(true);
      const allRes = await api.getSchedules({ limit: 1000 });
      const idsToDelete = [...new Set(allRes.data.map((s) => s.id))];
      await Promise.all(idsToDelete.map((id) => api.deleteSchedule(id)));
      setSelectedRowKeys([]);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus semua jadwal');
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = async (scheduleId: string, eventId: string | undefined, name: string) => {
    if (!confirm(`Hapus jadwal "${name}"?`)) return;
    try {
      await deleteScheduleOrEvent(scheduleId, eventId);
      const key = eventId ? `${scheduleId}::${eventId}` : scheduleId;
      setSelectedRowKeys((prev) => prev.filter((i) => i !== key));
      await loadData();
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

  const hasActiveFilters = Boolean(search.trim() || deviceFilter || groupFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {loadError && (
        <div role="alert" className="card-elevated" style={{ padding: 14, color: 'var(--accent-rose)', fontSize: '0.85rem' }}>
          Gagal memuat jadwal: {loadError}
        </div>
      )}

      {/* Toolbar: Search, Filter Layar & Grup Layar, & Action Buttons */}
      <div className="card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, flexWrap: 'wrap', minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Cari nama jadwal atau layout..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="form-input"
                style={{ paddingLeft: '36px', height: '40px' }}
              />
            </div>

            <div style={{ flex: '1 1 200px', minWidth: '180px', maxWidth: '260px' }}>
              <SingleSelect
                value={deviceFilter}
                onChange={(val) => {
                  setDeviceFilter(val);
                  setPage(1);
                }}
                placeholder="Filter Layar (Semua)"
                options={[
                  { value: '', label: 'Semua Layar' },
                  ...devices.map((d) => ({
                    value: d.id,
                    label: d.name,
                    hint: d.isOnline ? 'Online' : 'Offline',
                  })),
                ]}
              />
            </div>

            <div style={{ flex: '1 1 200px', minWidth: '180px', maxWidth: '260px' }}>
              <SingleSelect
                value={groupFilter}
                onChange={(val) => {
                  setGroupFilter(val);
                  setPage(1);
                }}
                placeholder="Filter Grup Layar (Semua)"
                options={[
                  { value: '', label: 'Semua Grup Layar' },
                  ...displayGroups.map((g) => ({
                    value: g.id,
                    label: g.name,
                  })),
                ]}
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setDeviceFilter('');
                  setGroupFilter('');
                  setPage(1);
                }}
                className="btn btn-outline"
                style={{ height: '40px', padding: '0 12px', fontSize: '0.78rem' }}
                title="Reset semua filter"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedRowKeys.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  color: 'var(--accent-rose)',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
                title={`Hapus ${selectedRowKeys.length} jadwal terpilih`}
              >
                <Trash2 size={14} />
                <span>Hapus Terpilih ({selectedRowKeys.length})</span>
              </button>
            )}

            {schedules.length > 0 && (
              <button
                onClick={handleDeleteAll}
                disabled={deleting}
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  color: 'var(--accent-rose)',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
                title="Hapus SEMUA jadwal tayang (Clear All)"
              >
                <Trash size={14} />
                <span>Clear All</span>
              </button>
            )}

            <button
              onClick={loadData}
              className="btn btn-outline"
              style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Segarkan data tabel"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span style={{ fontSize: '0.8125rem' }}>Segarkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '42px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={schedules.length > 0 && selectedRowKeys.length === schedules.length}
                    onChange={handleToggleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
                    title="Pilih Semua di Halaman Ini"
                  />
                </th>
                <th>RUNDOWN & LAYOUT</th>
                <th>TARGET TAYANG</th>
                <th>STATUS TAYANG</th>
                <th>WAKTU & HARI TAYANG</th>
                <th>TANGGAL DIBUAT</th>
                <th style={{ textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <span>Memuat data jadwal tayang...</span>
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {hasActiveFilters
                      ? 'Tidak ada jadwal yang cocok dengan filter pencarian/layar/grup.'
                      : 'Tidak ada jadwal ditemukan. Push layout baru dari menu Tata Letak untuk mulai menayangkan konten.'}
                  </td>
                </tr>
              ) : (
                schedules.map((s) => {
                  const ev = s.eventsList?.[0];
                  const rowKey = rowKeyFor(s);
                  const createdDate = ev?.createdAt || s.createdAt || (s as any).created_at;
                  const isSelected = selectedRowKeys.includes(rowKey);
                  const priority = ev?.priority ?? 0;
                  const layoutTitle = ev?.layoutName || ev?.layoutId ? `Layout: ${ev.layoutName || ev.layoutId}` : undefined;
                  const targets = scheduleTargets.get(s.id);
                  const displayLabels = targets?.displays || [];
                  const groupLabels = targets?.groups || [];
                  const hasTargets = displayLabels.length > 0 || groupLabels.length > 0;
                  const status = resolveScheduleStatus(ev, hasTargets);
                  const detailHref = ev?.id
                    ? `/studio/schedules/${s.id}?eventId=${ev.id}`
                    : `/studio/schedules/${s.id}`;
                  const periodLabel = ev?.startDate
                    ? `${ev.startDate.slice(0, 10)}${ev.endDate ? ` s/d ${ev.endDate.slice(0, 10)}` : ' – Selamanya'}`
                    : 'Selamanya';

                  return (
                    <tr key={rowKey} style={{ backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : undefined }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(rowKey)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
                        />
                      </td>
                      <td>
                        <div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <Link href={detailHref} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 650, fontSize: '0.85rem' }}>
                              {s.name}
                            </Link>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                fontFamily: 'monospace',
                                fontWeight: 600,
                              }}
                              title={`Prioritas: ${priority}`}
                            >
                              P{priority}
                            </span>
                          </div>
                          {(layoutTitle || s.description) && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {layoutTitle || s.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', maxWidth: '240px' }}>
                          {displayLabels.slice(0, 2).map((name) => (
                            <span
                              key={`disp-${name}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                color: 'var(--text-primary)',
                                fontSize: '0.78rem',
                                fontWeight: 500,
                              }}
                            >
                              <Monitor size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              {name}
                            </span>
                          ))}
                          {groupLabels.slice(0, 2).map((name) => (
                            <span
                              key={`grp-${name}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                color: 'var(--text-primary)',
                                fontSize: '0.78rem',
                                fontWeight: 500,
                              }}
                            >
                              <Users size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              {name}
                            </span>
                          ))}
                          {displayLabels.length + groupLabels.length > 4 && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              +{displayLabels.length + groupLabels.length - 4} lainnya
                            </span>
                          )}
                          {!hasTargets && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Belum terikat</span>
                          )}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: status.color,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: status.color,
                              boxShadow: status.isLive ? `0 0 6px ${status.color}` : 'none',
                            }}
                          />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        {ev ? (
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'monospace' }}>
                              {ev.startTime.slice(0, 5)} – {ev.endTime.slice(0, 5)}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {formatDays(ev.daysOfWeek)} · {periodLabel}
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {createdDate ? (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                            {new Date(createdDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Link
                            href={detailHref}
                            className="btn btn-outline"
                            style={{ padding: '5px 8px' }}
                            title="Lihat Detail Jadwal"
                            aria-label={`Lihat detail jadwal ${s.name}`}
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(s.id, ev?.id, s.name)}
                            className="btn btn-danger"
                            style={{ padding: '5px 8px' }}
                            title="Hapus Jadwal"
                            aria-label={`Hapus jadwal ${s.name}`}
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

        {total > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
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
        )}
      </div>
    </div>
  );
}
