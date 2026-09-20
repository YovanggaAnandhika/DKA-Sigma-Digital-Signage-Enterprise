'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, MediaItem } from '../../lib/api';
import { Pagination } from '../../components/ui/Pagination';
import { FolderOpen, Plus, Search, RefreshCw, Edit, Trash2, Eye, Film, Image as ImageIcon, Globe } from 'lucide-react';

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getMedia({ search, page, limit });
      setMediaItems(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus media asset "${name}"?`)) return;
    try {
      await api.deleteMedia(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus media');
    }
  };

  const getMediaTypeBadge = (type: number) => {
    if (type === 2) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.75rem' }}>
          <Film size={13} /> Video (MP4)
        </span>
      );
    }
    if (type === 3) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)', fontWeight: 600, fontSize: '0.75rem' }}>
          <Globe size={13} /> Web Halaman
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '0.75rem' }}>
        <ImageIcon size={13} /> Gambar (Static)
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '16px',
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
            }}
          >
            <FolderOpen size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Pustaka Media (Asset Library)
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              File video dan gambar promosi tervalidasi SHA-256 untuk distribusi cache player.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={loadData} className="btn btn-secondary" title="Segarkan data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/media/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Unggah Media Baru</span>
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
            placeholder="Cari aset berdasarkan nama file atau tipe..."
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
                <th style={{ width: '56px' }}>Pratinjau</th>
                <th>Nama Aset Media</th>
                <th>Tipe Konten</th>
                <th>Ukuran File</th>
                <th>Dimensi (W × H)</th>
                <th>Durasi</th>
                <th>Checksum SHA-256</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {mediaItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Memuat aset media dari backend gRPC...' : 'Belum ada aset media tersimpan.'}
                  </td>
                </tr>
              ) : (
                mediaItems.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/media/${m.id}`}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            backgroundColor: '#0f172a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-subtle)',
                            flexShrink: 0,
                          }}
                        >
                          {m.media_type === 2 ? (
                            <Film size={18} color="var(--accent-cyan)" />
                          ) : m.media_type === 3 ? (
                            <Globe size={18} color="var(--accent-amber)" />
                          ) : m.public_url ? (
                            <img
                              src={m.public_url}
                              alt={m.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <ImageIcon size={18} color="var(--accent-emerald)" />
                          )}
                        </div>
                      </Link>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link href={`/media/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div>{m.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, fontFamily: 'monospace' }}>
                          {m.original_filename}
                        </div>
                      </Link>
                    </td>
                    <td>{getMediaTypeBadge(m.media_type)}</td>
                    <td style={{ fontSize: '0.75rem' }}>
                      {(m.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>
                      {m.width} × {m.height} px
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>
                      {m.duration_seconds > 0 ? `${m.duration_seconds}s` : 'Statis'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {m.sha256_hash ? m.sha256_hash.substring(0, 16) + '...' : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Link href={`/media/${m.id}`} className="btn btn-outline" style={{ padding: '5px 8px' }} title="Detail Aset">
                          <Eye size={14} />
                        </Link>
                        <Link href={`/media/${m.id}/edit`} className="btn btn-secondary" style={{ padding: '5px 8px' }} title="Edit Metadata">
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(m.id, m.name)}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px' }}
                          title="Hapus Media"
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
