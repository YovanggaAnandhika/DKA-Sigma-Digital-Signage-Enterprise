'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, Role } from '@/lib/services';
import { Pagination } from '@/components/ui/Pagination';
import { ShieldCheck, Plus, Search, RefreshCw, Edit, Trash2, Eye, Key } from 'lucide-react';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getRoles({ search, page, limit });
      setRoles(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus role "${name}"?`)) return;
    try {
      await api.deleteRole(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus role');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Hak Akses & Role (RBAC)
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Manajemen peran dan izin sistem berbasis database PostgreSQL via gRPC.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={loadData} className="btn btn-secondary" title="Segarkan data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/iam/roles/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Tambah Role Baru</span>
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
            placeholder="Cari role berdasarkan nama atau slug..."
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
                <th>Nama Role</th>
                <th>Slug Sistem</th>
                <th>Deskripsi</th>
                <th>Jumlah Izin (Permissions)</th>
                <th>Dibuat Pada</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Memuat role dari backend gRPC...' : 'Belum ada role tersimpan.'}
                  </td>
                </tr>
              ) : (
                roles.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link href={`/iam/roles/${r.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {r.name}
                      </Link>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {r.slug}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {r.description || '-'}
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
                        {r.permissionsList?.length || 0} Permissions
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Link href={`/iam/roles/${r.id}`} className="btn btn-outline" style={{ padding: '5px 8px' }} title="Detail Role">
                          <Eye size={14} />
                        </Link>
                        <Link href={`/iam/roles/${r.id}/edit`} className="btn btn-secondary" style={{ padding: '5px 8px' }} title="Edit Role">
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(r.id, r.name)}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px' }}
                          title="Hapus Role"
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
