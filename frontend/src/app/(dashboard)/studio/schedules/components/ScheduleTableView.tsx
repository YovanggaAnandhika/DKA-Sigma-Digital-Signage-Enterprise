'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/services';
import type { Schedule } from '@/lib/services/studio/schedule.types';
import { Pagination } from '@/components/ui/Pagination';
import { TableDataValue } from '@/components/ui/TableDataValue';
import {
  CalendarDays,
  Search,
  RefreshCw,
  Trash2,
  Trash,
  Eye,
  Clock,
  Layers,
} from 'lucide-react';

export default function ScheduleTableView() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await api.getSchedules({ search, page, limit });
      setSchedules(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load schedules table:', err);
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat daftar tabel jadwal.');
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {loadError && (
        <div role="alert" className="card-elevated" style={{ padding: 14, color: 'var(--accent-rose)', fontSize: '0.85rem' }}>
          Gagal memuat jadwal: {loadError}
        </div>
      )}

      {/* Toolbar: Search & Action Buttons */}
      <div className="card-elevated" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari berdasarkan nama jadwal..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="form-input"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedIds.length > 0 && (
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
              title={`Hapus ${selectedIds.length} jadwal terpilih`}
            >
              <Trash2 size={14} />
              <span>Hapus Terpilih ({selectedIds.length})</span>
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

      {/* Schedules Table */}
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
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <span>Memuat data jadwal tayang...</span>
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Tidak ada jadwal ditemukan. Push layout baru dari menu Tata Letak untuk mulai menayangkan konten.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => {
                  const firstEvent = s.eventsList?.[0];
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
                          <TableDataValue icon={Layers} tone="primary">
                            {firstEvent.layoutName || firstEvent.layoutId}
                          </TableDataValue>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {firstEvent ? (
                          <TableDataValue icon={Clock} tone="cyan">
                            {firstEvent.startTime} - {firstEvent.endTime}
                          </TableDataValue>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {firstEvent ? (
                          <TableDataValue icon={CalendarDays} tone="violet">
                            {formatDays(firstEvent.daysOfWeek)}
                          </TableDataValue>
                        ) : (
                          '-'
                        )}
                      </td>
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
                            fontWeight: 700,
                          }}
                        >
                          P: {firstEvent?.priority ?? 0}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {createdDate ? (
                          <TableDataValue icon={Clock} tone="amber">
                            {new Date(createdDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </TableDataValue>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Link
                            href={`/studio/schedules/${s.id}`}
                            className="btn btn-outline"
                            style={{ padding: '5px 8px' }}
                            title="Lihat Detail Jadwal"
                            aria-label={`Lihat detail jadwal ${s.name}`}
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
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

        {total > limit && (
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

