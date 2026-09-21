'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, MediaItem } from '@/lib/api';
import { Pagination } from '@/components/ui/Pagination';
import { FolderOpen, Plus, Search, RefreshCw, Edit, Trash2, Eye, Film, Image as ImageIcon, Globe } from 'lucide-react';

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

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

      {/* Main Content Area: Grid Gallery + Sidebar */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* Gallery Grid */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {mediaItems.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
                {loading ? 'Memuat aset media dari backend gRPC...' : 'Belum ada aset media tersimpan.'}
              </div>
            ) : (
              mediaItems.map((m) => {
                const isSelected = selectedMedia?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMedia(m)}
                    className="card-elevated"
                    style={{
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      border: isSelected ? '2px solid var(--primary-500)' : '2px solid transparent',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                      boxShadow: isSelected ? '0 10px 15px -3px rgba(14, 165, 233, 0.2)' : undefined,
                    }}
                  >
                    {/* Thumbnail Area */}
                    <div style={{ height: '140px', backgroundColor: '#0f172a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {m.public_url && m.media_type === 2 ? (
                        <video src={m.public_url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : m.media_type === 2 ? (
                        <Film size={32} color="var(--accent-cyan)" />
                      ) : m.media_type === 3 ? (
                        <Globe size={32} color="var(--accent-amber)" />
                      ) : m.public_url ? (
                        <img
                          src={m.public_url}
                          alt={m.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <ImageIcon size={32} color="var(--accent-emerald)" />
                      )}
                      
                      {/* Badge Tipe */}
                      <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', fontSize: '0.6875rem', fontWeight: 600 }}>
                        {m.media_type === 2 ? <Film size={12} color="#22d3ee" /> : m.media_type === 3 ? <Globe size={12} color="#fbbf24" /> : <ImageIcon size={12} color="#34d399" />}
                        {m.media_type === 2 ? 'Video' : m.media_type === 3 ? 'Web' : 'Gambar'}
                      </div>
                      
                      {/* Badge Durasi (Video Only) */}
                      {m.media_type === 2 && m.duration_seconds > 0 && (
                        <div style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', color: '#fff', fontSize: '0.6875rem', fontFamily: 'monospace' }}>
                          {m.duration_seconds}s
                        </div>
                      )}
                    </div>
                    
                    {/* Info Area */}
                    <div style={{ padding: '12px' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{(m.file_size_bytes / (1024 * 1024)).toFixed(1)} MB</span>
                        <span>{m.width}×{m.height}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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

        {/* Right Sidebar (Details Panel) */}
        {selectedMedia && (
          <div className="card-elevated" style={{ width: '320px', flexShrink: 0, position: 'sticky', top: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Detail File</h3>
              <button onClick={() => setSelectedMedia(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Tutup Panel">✕</button>
            </div>
            
            <div style={{ height: '180px', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedMedia.public_url && selectedMedia.media_type === 2 ? (
                <video src={selectedMedia.public_url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : selectedMedia.media_type === 2 ? (
                <Film size={48} color="var(--accent-cyan)" />
              ) : selectedMedia.media_type === 3 ? (
                <Globe size={48} color="var(--accent-amber)" />
              ) : selectedMedia.public_url ? (
                <img src={selectedMedia.public_url} alt={selectedMedia.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <ImageIcon size={48} color="var(--accent-emerald)" />
              )}
            </div>
            
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', wordBreak: 'break-word' }}>{selectedMedia.name}</h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedMedia.original_filename}</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tipe Konten</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getMediaTypeBadge(selectedMedia.media_type)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ukuran File</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(selectedMedia.file_size_bytes / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Dimensi</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{selectedMedia.width} × {selectedMedia.height} px</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Durasi</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedMedia.duration_seconds > 0 ? `${selectedMedia.duration_seconds} detik` : 'Statis'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Checksum SHA-256</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.6875rem' }}>
                    {selectedMedia.sha256_hash || '-'}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <Link href={`/media/${selectedMedia.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <Eye size={16} /> Pratinjau Penuh
                </Link>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/media/${selectedMedia.id}/edit`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    <Edit size={16} /> Edit
                  </Link>
                  <button onClick={() => { handleDelete(selectedMedia.id, selectedMedia.name); setSelectedMedia(null); }} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
                    <Trash2 size={16} /> Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
