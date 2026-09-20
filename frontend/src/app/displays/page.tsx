'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, Device } from '../../lib/api';
import { Pagination } from '../../components/ui/Pagination';
import { Tv, Plus, Search, RefreshCw, Edit, Trash2, Eye } from 'lucide-react';

export default function DisplaysPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getDevices({ search, page, limit });
      setDevices(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus display player "${name}"?`)) return;
    try {
      await api.deleteDevice(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus perangkat');
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
            <Tv size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Layar Retail (Player Fleet)
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Pusat registrasi dan pairing perangkat Android display player secara terpusat via gRPC.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={loadData} className="btn btn-secondary" title="Segarkan data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/displays/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Tambah Layar Baru</span>
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
            placeholder="Cari berdasarkan nama perangkat atau kode pairing..."
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
                <th>Nama Perangkat</th>
                <th>Kode Pairing</th>
                <th>Status</th>
                <th>Resolusi & Orientasi</th>
                <th>Alamat IP</th>
                <th>Memori / Penyimpanan</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Memuat daftar layar dari backend gRPC...' : 'Tidak ada perangkat ditemukan.'}
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link href={`/displays/${d.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {d.name}
                      </Link>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {d.pairing_code}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: d.is_online ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                          color: d.is_online ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                          border: d.is_online ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                        }}
                      >
                        {d.is_online ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </td>
                    <td>
                      {d.resolution} ({d.orientation})
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{d.ip_address || '127.0.0.1'}</td>
                    <td style={{ fontSize: '0.75rem' }}>
                      {d.memory_used_percent > 0 ? `${d.memory_used_percent}% RAM` : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Link href={`/displays/${d.id}`} className="btn btn-outline" style={{ padding: '5px 8px' }} title="Lihat Detail">
                          <Eye size={14} />
                        </Link>
                        <Link href={`/displays/${d.id}/edit`} className="btn btn-secondary" style={{ padding: '5px 8px' }} title="Edit">
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(d.id, d.name)}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px' }}
                          title="Hapus Perangkat"
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
