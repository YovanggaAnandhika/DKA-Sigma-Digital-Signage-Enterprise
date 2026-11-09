'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Radio,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { modal } from '@/components/ui/ModalDialog';
import {
  getLiveStreams,
  deleteLiveStream,
  toggleLiveStreamRelay,
} from '@/lib/services';
import { LiveStreamConfig } from './types';

const LiveStreamPreviewModal = dynamic(
  () => import('./components/LiveStreamPreviewModal'),
  { ssr: false }
);

export default function LiveStreamPage() {
  const [streams, setStreams] = useState<LiveStreamConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [previewItem, setPreviewItem] = useState<LiveStreamConfig | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadStreams = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getLiveStreams();
      setStreams(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  const handleDelete = async (id: string, name: string) => {
    const ok = await modal.confirm({
      title: 'Hapus Konfigurasi Live Stream',
      message: `Apakah Anda yakin ingin menghapus sumber siaran langsung "${name}"?`,
      variant: 'danger',
      confirmText: 'Hapus Stream',
    });
    if (!ok) return;
    await deleteLiveStream(id);
    setStreams((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleRelay = async (item: LiveStreamConfig) => {
    setTogglingId(item.id);
    try {
      const updated = await toggleLiveStreamRelay(item.id, !item.isRelayActive);
      setStreams((prev) => prev.map((s) => (s.id === item.id ? updated : s)));
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = streams.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.sourceUrl.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '8px' }}>
        <button onClick={loadStreams} className="btn btn-secondary" title="Segarkan Data">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Segarkan</span>
        </button>
        <Link href="/studio/components/livestream/create" className="btn btn-primary">
          <Plus size={16} />
          <span>Tambah Live Stream</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="card-elevated" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Cari siaran langsung berdasarkan nama..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Siaran</th>
                <th>Tipe Sumber</th>
                <th>Status Siaran</th>
                <th>Status Audio</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Memuat daftar siaran langsung...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Belum ada konfigurasi Live Stream ditemukan.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link
                        href={`/studio/components/livestream/${item.id}/edit`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {item.name}
                      </Link>
                    </td>

                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-surface-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {item.sourceType}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.isRelayActive}
                        disabled={togglingId === item.id}
                        onClick={() => handleToggleRelay(item)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: item.isRelayActive ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-elevated)',
                          color: item.isRelayActive ? 'var(--accent-emerald)' : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: togglingId === item.id ? 'default' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        title={item.isRelayActive ? 'Klik untuk menonaktifkan siaran' : 'Klik untuk mengaktifkan siaran'}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: item.isRelayActive ? 'var(--accent-emerald)' : 'var(--text-muted)',
                          }}
                        />
                        <span>{item.isRelayActive ? 'Siaran Aktif' : 'Nonaktif'}</span>
                      </button>
                    </td>

                    <td>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.75rem',
                          color: item.isMuted ? 'var(--text-muted)' : 'var(--accent-emerald)',
                          fontWeight: 600,
                        }}
                      >
                        {item.isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                        <span>{item.isMuted ? 'Bisukan' : 'Aktif'}</span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px' }}
                          title="Pratinjau Siaran"
                        >
                          <Eye size={14} />
                        </button>
                        <Link
                          href={`/studio/components/livestream/${item.id}/edit`}
                          className="btn btn-secondary"
                          style={{ padding: '5px 8px' }}
                          title="Edit Konfigurasi"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px' }}
                          title="Hapus Stream"
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
          total={filtered.length}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Live Preview Modal (Dynamic Lazy-Loaded) */}
      {previewItem && (
        <LiveStreamPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}
