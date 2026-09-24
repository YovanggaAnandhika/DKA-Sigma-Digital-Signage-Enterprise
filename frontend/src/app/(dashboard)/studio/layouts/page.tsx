'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, Layout } from '@/lib/services';
import { Pagination } from '@/components/ui/Pagination';
import { Palette, Plus, Search, RefreshCw, Edit, Trash2, Eye, LayoutGrid } from 'lucide-react';

export default function LayoutsPage() {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getLayouts({ search, page, limit });
      setLayouts(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load layouts:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus template layout "${name}"?`)) return;
    try {
      await api.deleteLayout(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus layout');
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
            <Palette size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Studio Desain Layout
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Manajemen tata letak canvas multi-layer layar retail terhubung ke backend gRPC.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={loadData} className="btn btn-secondary" title="Segarkan data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/layouts/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Buat Layout Baru</span>
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
            placeholder="Cari template layout berdasarkan nama..."
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
                <th>Nama Template Layout</th>
                <th>Dimensi Canvas</th>
                <th>Orientasi</th>
                <th>Jumlah Layer Layar</th>
                <th>Dibuat Pada</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {layouts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Memuat layout dari backend gRPC...' : 'Belum ada template layout tersimpan.'}
                  </td>
                </tr>
              ) : (
                layouts.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link href={`/layouts/${l.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {l.name}
                      </Link>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>
                      {l.canvasWidth ?? l.canvasWidth} × {l.canvasHeight ?? l.canvasHeight} px
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {typeof l.orientation === 'object' ? (l.orientation as any)?.name : l.orientation}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(37, 99, 235, 0.12)',
                          color: 'var(--primary-400)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                        }}
                      >
                        {(l.layersList || l.layersList)?.length || 0} Lapisan Kotak
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(l.createdAt || l.createdAt) ? new Date(l.createdAt || l.createdAt || '').toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Link href={`/layouts/${l.id}`} className="btn btn-outline" style={{ padding: '5px 8px' }} title="Preview Canvas">
                          <Eye size={14} />
                        </Link>
                        <Link href={`/layouts/${l.id}/edit`} className="btn btn-secondary" style={{ padding: '5px 8px' }} title="Edit Canvas Designer">
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(l.id, l.name)}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px' }}
                          title="Hapus Layout"
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
