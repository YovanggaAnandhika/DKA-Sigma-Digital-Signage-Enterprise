'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/services';
import type { Schedule } from '@/lib/services/studio/schedule.types';
import { Pagination } from '@/components/ui/Pagination';
import { CalendarDays, Search, RefreshCw, Trash2, Edit, Clock, Layers, ArrowRight } from 'lucide-react';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSchedules({ search, page, limit });
      setSchedules(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus jadwal "${name}"?`)) return;
    try {
      await api.deleteSchedule(id);
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
              Penjadwalan
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Daftar jadwal tayang aktif. Jadwal baru dipublikasikan langsung dari menu <strong>Layouts</strong> (Aksi Push Jadwal).
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

      {/* Filter & Search Bar */}
      <div className="card-elevated" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
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
      </div>

      {/* Main Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>NAMA JADWAL</th>
                <th>LAYOUT TAYANG</th>
                <th>JAM TAYANG AKTIF</th>
                <th>HARI TAYANG</th>
                <th>PRIORITAS</th>
                <th style={{ textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Memuat data...' : 'Tidak ada jadwal ditemukan. Push layout baru dari menu Layouts untuk mulai menayangkan konten.'}
                  </td>
                </tr>
              ) : (
                schedules.map((s) => {
                  const firstEvent = s.eventsList && s.eventsList.length > 0 ? s.eventsList[0] : null;
                  const totalEvents = s.eventsList ? s.eventsList.length : 0;

                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div>{s.name}</div>
                        {s.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {s.description}
                          </div>
                        )}
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
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {firstEvent ? formatDays(firstEvent.daysOfWeek) : '-'}
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
                          }}
                        >
                          P: {firstEvent?.priority ?? 0}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Link href={`/studio/schedules/${s.id}/edit`} className="btn btn-secondary" style={{ padding: '5px 8px' }} title="Edit Jadwal">
                            <Edit size={14} />
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
    </div>
  );
}
