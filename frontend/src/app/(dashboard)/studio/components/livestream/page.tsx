'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Radio,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  RefreshCw,
  Tv,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { modal } from '@/components/ui/ModalDialog';
import {
  getLiveStreams,
  deleteLiveStream,
  toggleLiveStreamRelay,
} from '@/lib/services';
import { LiveStreamConfig, toYoutubeEmbedUrl } from './types';

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
      {/* Action & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Manajemen Siaran Langsung & Relay CCTV
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Kelola feed kamera RTSP CCTV, HLS (.m3u8), RTMP OBS, YouTube Live, serta server relay.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={loadStreams} className="btn btn-secondary" title="Segarkan Data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
          <Link href="/studio/components/livestream/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Tambah Live Stream</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card-elevated" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            placeholder="Cari siaran langsung berdasarkan nama, keterangan, atau URL..."
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
                <th>Keterangan</th>
                <th>Mode Streaming</th>
                <th>Tipe Sumber</th>
                <th>Status Audio</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Memuat daftar siaran langsung...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
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

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {item.description || '-'}
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span
                          className={`badge ${
                            item.streamMode === 'SERVER_HOSTED_HLS' ? 'badge-success' : 'badge-neutral'
                          }`}
                        >
                          {item.streamMode === 'SERVER_HOSTED_HLS' ? 'Server HLS Relay' : 'Direct External'}
                        </span>
                        {item.streamMode === 'SERVER_HOSTED_HLS' && (
                          <button
                            type="button"
                            disabled={togglingId === item.id}
                            onClick={() => handleToggleRelay(item)}
                            className="btn btn-outline"
                            style={{
                              padding: '2px 8px',
                              fontSize: '0.6875rem',
                              height: 'auto',
                              borderColor: item.isRelayActive ? 'var(--accent-emerald)' : 'var(--border-subtle)',
                              color: item.isRelayActive ? 'var(--accent-emerald)' : 'var(--text-muted)',
                            }}
                          >
                            {item.isRelayActive ? 'Relay Aktif' : 'Relay Nonaktif'}
                          </button>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          color: 'var(--primary-400)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                        }}
                      >
                        {item.sourceType}
                      </span>
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: item.isMuted ? 'var(--text-muted)' : 'var(--accent-emerald)',
                          fontWeight: 500,
                        }}
                      >
                        {item.isMuted ? 'Bisukan' : 'Aktif'}
                      </span>
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

      {/* Live Preview Modal */}
      {previewItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-glass)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px',
          }}
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '820px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Radio size={20} style={{ color: 'var(--accent-rose)' }} />
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {previewItem.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {previewItem.streamMode === 'SERVER_HOSTED_HLS' && previewItem.serverHlsEndpoint
                      ? `${previewItem.serverHlsEndpoint} (Ingest: ${previewItem.sourceUrl})`
                      : previewItem.sourceUrl}
                  </span>
                </div>
              </div>
              <button onClick={() => setPreviewItem(null)} className="btn btn-outline" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {previewItem.sourceType === 'YOUTUBE_EMBED' ? (
                <iframe
                  src={toYoutubeEmbedUrl(previewItem.sourceUrl, previewItem.isMuted)}
                  title={previewItem.name}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : previewItem.sourceType === 'HLS' ? (
                <video
                  src={previewItem.sourceUrl}
                  poster={previewItem.posterImageUrl || undefined}
                  controls
                  autoPlay
                  muted={previewItem.isMuted}
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '32px',
                    textAlign: 'center',
                  }}
                >
                  <Tv size={42} style={{ color: 'var(--primary-500)' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Stream {previewItem.sourceType} Siap Ditayangkan di Player Android (ExoPlayer RTSP/RTMP)
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '520px' }}>
                    Protokol <code>{previewItem.sourceType}</code> ({previewItem.sourceUrl}) dirender secara native oleh
                    Media3 ExoPlayer di perangkat TV Android atau melalui endpoint HLS Relay{' '}
                    <code>{previewItem.serverHlsEndpoint || `/streams/${previewItem.id}/live.m3u8`}</code>.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
