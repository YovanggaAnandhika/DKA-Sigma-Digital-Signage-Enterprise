'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { DisplayGroup } from '@/lib/api/services/hardware/display-group.types';
import { Pagination } from '@/components/ui/Pagination';
import { MonitorPlay, Plus, Search, RefreshCw, Trash2, Edit } from 'lucide-react';

export default function DisplayGroupsPage() {
  const [groups, setGroups] = useState<DisplayGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getDisplayGroups({ search, page, limit });
      setGroups(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load display groups:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus grup layar "${name}"?`)) return;
    try {
      await api.deleteDisplayGroup(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus grup layar');
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
            <MonitorPlay size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Grup Layar (Display Groups)
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Kelompokkan layar untuk mempermudah distribusi konten ke banyak cabang/area.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={loadData} className="btn btn-secondary" title="Segarkan data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/groups/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Tambah Grup</span>
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
            placeholder="Cari berdasarkan nama grup..."
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
                <th>Nama Grup</th>
                <th>Deskripsi</th>
                <th>Layout Default</th>
                <th>Jadwal Aktif</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Memuat data...' : 'Tidak ada grup ditemukan.'}
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {g.name}
                    </td>
                    <td>{g.description || '-'}</td>
                    <td>{g.default_layout_name || '-'}</td>
                    <td>{g.schedule_name || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Link href={`/groups/${g.id}/edit`} className="btn btn-secondary" style={{ padding: '5px 8px' }} title="Edit">
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(g.id, g.name)}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px' }}
                          title="Hapus Grup"
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
