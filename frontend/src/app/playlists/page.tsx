'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, Playlist } from '../../lib/api';
import { Pagination } from '../../components/ui/Pagination';
import { ListMusic, Plus, Search, RefreshCw, Edit, Trash2, Eye, Shuffle } from 'lucide-react';

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getPlaylists({ search, page, limit });
      setPlaylists(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load playlists:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus playlist "${name}"?`)) return;
    try {
      await api.deletePlaylist(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus playlist');
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
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: 'var(--accent-amber)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <ListMusic size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Daftar Putar (Playlists)
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Atur urutan dan durasi penayangan video & gambar promosi di setiap zona layar.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={loadData} className="btn btn-secondary" title="Segarkan data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/playlists/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Buat Playlist Baru</span>
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
            placeholder="Cari daftar putar berdasarkan nama atau deskripsi..."
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
                <th>Nama Playlist</th>
                <th>Deskripsi</th>
                <th>Jumlah Konten</th>
                <th>Mode Putar</th>
                <th>Dibuat Pada</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {playlists.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Memuat playlist dari backend gRPC...' : 'Belum ada playlist tersimpan.'}
                  </td>
                </tr>
              ) : (
                playlists.map((pl) => (
                  <tr key={pl.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link href={`/playlists/${pl.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {pl.name}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {pl.description || '-'}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(245, 158, 11, 0.12)',
                          color: 'var(--accent-amber)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        {pl.items?.length || 0} Item Media
                      </span>
                    </td>
                    <td>
                      {pl.is_shuffle ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                          <Shuffle size={12} /> Acak (Shuffle)
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Berurutan (Sequential)</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {pl.created_at ? new Date(pl.created_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Link href={`/playlists/${pl.id}`} className="btn btn-outline" style={{ padding: '5px 8px' }} title="Detail Item">
                          <Eye size={14} />
                        </Link>
                        <Link href={`/playlists/${pl.id}/edit`} className="btn btn-secondary" style={{ padding: '5px 8px' }} title="Edit Playlist">
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(pl.id, pl.name)}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px' }}
                          title="Hapus Playlist"
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
