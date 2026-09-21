'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Schedule } from '@/lib/api/services/studio/schedule.types';
import { Pagination } from '@/components/ui/Pagination';
import { CalendarDays, Plus, Search, RefreshCw, Trash2, Edit } from 'lucide-react';

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
              Atur waktu tayang dan prioritas layout yang ditampilkan.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={loadData} className="btn btn-secondary" title="Segarkan data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/schedules/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Tambah Jadwal</span>
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
                <th>Nama Jadwal</th>
                <th>Deskripsi</th>
                <th>Jumlah Event</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Memuat data...' : 'Tidak ada jadwal ditemukan.'}
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {s.name}
                    </td>
                    <td>{s.description || '-'}</td>
                    <td>{s.events ? s.events.length : 0} Event(s)</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Link href={`/schedules/${s.id}/edit`} className="btn btn-secondary" style={{ padding: '5px 8px' }} title="Edit">
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
                ))
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
