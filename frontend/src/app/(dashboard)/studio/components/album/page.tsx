'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Images, Plus, Search, Eye, Edit, Trash2, X, Sparkles, Play, Pause, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { PhotoAlbum, ALBUM_STORAGE_KEY, DEFAULT_ALBUMS } from './types';

export default function AlbumPage() {
  const [albums, setAlbums] = useState<PhotoAlbum[]>(DEFAULT_ALBUMS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [previewAlbum, setPreviewAlbum] = useState<PhotoAlbum | null>(null);

  // Slideshow preview state
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ALBUM_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAlbums(parsed);
        }
      } else {
        localStorage.setItem(ALBUM_STORAGE_KEY, JSON.stringify(DEFAULT_ALBUMS));
      }
    } catch {}
  }, []);

  // Slideshow timer
  useEffect(() => {
    if (!previewAlbum || !isPlaying || previewAlbum.photos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % previewAlbum.photos.length);
    }, (previewAlbum.slideDurationSeconds || 4) * 1000);
    return () => clearInterval(interval);
  }, [previewAlbum, isPlaying]);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Hapus album foto "${name}"?`)) return;
    const updated = albums.filter((a) => a.id !== id);
    setAlbums(updated);
    try {
      localStorage.setItem(ALBUM_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const filtered = albums.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Komponen Album Foto Promosi
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Slideshow foto katalog produk dengan transisi sinematik Ken Burns, badge diskon harga, dan label promo ritel.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/studio/components/album/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Buat Album Baru</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search */}
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
            placeholder="Cari album berdasarkan nama atau keterangan..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Table Data */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Album</th>
                <th>Keterangan</th>
                <th>Jumlah Foto</th>
                <th>Durasi Per Slide</th>
                <th>Efek Transisi</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Belum ada album foto tersimpan. Klik tombol Buat Album Baru untuk menambahkan.
                  </td>
                </tr>
              ) : (
                paginated.map((album) => (
                  <tr key={album.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link href={`/studio/components/album/${album.id}/edit`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {album.name}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {album.description || '-'}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(236, 72, 153, 0.12)',
                          color: '#ec4899',
                          border: '1px solid rgba(236, 72, 153, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Images size={11} />
                        {album.photos.length} Foto
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {album.slideDurationSeconds} Detik
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          backgroundColor: album.transitionEffect === 'ken-burns' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: album.transitionEffect === 'ken-burns' ? '#a78bfa' : 'var(--primary-400)',
                        }}
                      >
                        {album.transitionEffect === 'ken-burns' ? 'Ken Burns Sinematik' : album.transitionEffect.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setPreviewAlbum(album);
                            setCurrentSlideIdx(0);
                            setIsPlaying(true);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px' }}
                          title="Pratinjau Slideshow"
                        >
                          <Eye size={14} />
                        </button>
                        <Link
                          href={`/studio/components/album/${album.id}/edit`}
                          className="btn btn-secondary"
                          style={{ padding: '5px 8px' }}
                          title="Edit Album"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(album.id, album.name)}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px' }}
                          title="Hapus"
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
          total={filtered.length}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>

      {/* Modal Slideshow Preview */}
      {previewAlbum && previewAlbum.photos.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '960px',
              height: '80vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#0a0a0a',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Header bar */}
            <div style={{ padding: '16px 20px', backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={18} color="#ec4899" />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                  {previewAlbum.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  Slide {currentSlideIdx + 1} dari {previewAlbum.photos.length} ({previewAlbum.transitionEffect})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="btn btn-outline"
                  style={{ padding: '6px 10px', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={() => setPreviewAlbum(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff' }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Slide Image Stage with Ken Burns Pan & Zoom */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewAlbum.photos.map((photo, idx) => {
                const isActive = idx === currentSlideIdx;
                return (
                  <div
                    key={photo.id}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: isActive ? 1 : 0,
                      transition: 'opacity 1s ease-in-out',
                      pointerEvents: isActive ? 'auto' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${photo.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transform: isActive && previewAlbum.transitionEffect === 'ken-burns' ? 'scale(1.15) translate(1%, -1%)' : 'scale(1)',
                        transition: previewAlbum.transitionEffect === 'ken-burns' ? `transform ${previewAlbum.slideDurationSeconds}s linear` : 'none',
                      }}
                    />

                    {/* Overlay Title & Retail Price Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '24px',
                        left: '24px',
                        right: '24px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        padding: '20px 24px',
                        borderRadius: '16px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
                      }}
                    >
                      <div>
                        {photo.promoBadge && (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              letterSpacing: '0.05em',
                              backgroundColor: '#ec4899',
                              color: '#ffffff',
                              marginBottom: '6px',
                            }}
                          >
                            {photo.promoBadge}
                          </span>
                        )}
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                          {photo.title}
                        </h3>
                      </div>

                      {photo.priceTag && (
                        <div
                          style={{
                            padding: '8px 16px',
                            borderRadius: '12px',
                            backgroundColor: '#fbbf24',
                            color: '#000000',
                            fontWeight: 900,
                            fontSize: '1.125rem',
                            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
                          }}
                        >
                          {photo.priceTag}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Prev / Next Buttons */}
              <button
                onClick={() => setCurrentSlideIdx((prev) => (prev - 1 + previewAlbum.photos.length) % previewAlbum.photos.length)}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  zIndex: 20,
                }}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={() => setCurrentSlideIdx((prev) => (prev + 1) % previewAlbum.photos.length)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  zIndex: 20,
                }}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
