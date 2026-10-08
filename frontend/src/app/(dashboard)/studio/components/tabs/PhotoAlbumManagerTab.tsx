'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Images, Plus, Search, Eye, Trash2, X, Sparkles, Play, Pause, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

export interface PhotoItem {
  id: string;
  url: string;
  title: string;
  promoBadge?: string;
  priceTag?: string;
}

export interface PhotoAlbum {
  id: string;
  name: string;
  description: string;
  transitionEffect: 'ken-burns' | 'fade' | 'slide' | 'zoom';
  slideDurationSeconds: number;
  photos: PhotoItem[];
  createdAt?: string;
}

export const ALBUM_STORAGE_KEY = 'dka_signage_photo_albums';

export const DEFAULT_ALBUMS: PhotoAlbum[] = [
  {
    id: 'album-1',
    name: 'Promo Kuliner Nusantara',
    description: 'Slideshow menu andalan restoran untuk layar kasir dan display etalase.',
    transitionEffect: 'ken-burns',
    slideDurationSeconds: 4,
    createdAt: '2026-10-08',
    photos: [
      {
        id: 'p-1',
        url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop&q=80',
        title: 'Salad Buah Segar Tropis',
        promoBadge: 'SEGAR TIAP HARI',
        priceTag: 'Rp 28.000',
      },
      {
        id: 'p-2',
        url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&auto=format&fit=crop&q=80',
        title: 'Pizza Keju Mozzarella Spesial',
        promoBadge: 'DISKON 20%',
        priceTag: 'Rp 65.000',
      },
      {
        id: 'p-3',
        url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
        title: 'Nasi Goreng Wagyu Premium',
        promoBadge: 'CHEF RECOMMEND',
        priceTag: 'Rp 45.000',
      },
    ],
  },
  {
    id: 'album-2',
    name: 'Katalog Koleksi Pakaian Liburan',
    description: 'Promosi fashion dan perlengkapan liburan akhir pekan.',
    transitionEffect: 'fade',
    slideDurationSeconds: 5,
    createdAt: '2026-10-08',
    photos: [
      {
        id: 'p-4',
        url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop&q=80',
        title: 'Fashion Outer Trend Terkini',
        promoBadge: 'BELI 1 GRATIS 1',
        priceTag: 'Mulai Rp 120.000',
      },
      {
        id: 'p-5',
        url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
        title: 'Koleksi Kasual Elegan',
        promoBadge: 'NEW ARRIVAL',
        priceTag: 'Rp 189.000',
      },
    ],
  },
];

export default function PhotoAlbumManagerTab() {
  const [albums, setAlbums] = useState<PhotoAlbum[]>(DEFAULT_ALBUMS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [previewAlbum, setPreviewAlbum] = useState<PhotoAlbum | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ALBUM_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAlbums(parsed);
        }
      }
    } catch {}
  }, []);

  const saveAlbums = (updated: PhotoAlbum[]) => {
    setAlbums(updated);
    try {
      localStorage.setItem(ALBUM_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Hapus album "${name}"?`)) return;
    const updated = albums.filter((a) => a.id !== id);
    saveAlbums(updated);
  };

  // Slideshow timer in modal
  useEffect(() => {
    if (!isPlaying || !previewAlbum || previewAlbum.photos.length <= 1) return;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % previewAlbum.photos.length);
    }, (previewAlbum.slideDurationSeconds || 4) * 1000);
    return () => clearInterval(timer);
  }, [isPlaying, previewAlbum?.slideDurationSeconds, previewAlbum?.photos.length]);

  const filtered = albums.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);
  const currentPhoto = previewAlbum ? previewAlbum.photos[slideIdx] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Action & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Daftar Album Foto Promosi
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Kelola slideshow foto promosi produk, katalog menu, dan album promosi dengan efek transisi Ken Burns.
          </p>
        </div>

        <Link href="/studio/components/album/create" className="btn btn-primary">
          <Plus size={16} />
          <span>Tambah Album Foto Baru</span>
        </Link>
      </div>

      {/* Search Input */}
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
            placeholder="Cari album foto berdasarkan nama atau deskripsi..."
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
                <th>Nama Album</th>
                <th>Deskripsi & Tema</th>
                <th>Jumlah Foto</th>
                <th>Efek Transisi</th>
                <th>Durasi Slide</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Belum ada album foto tersimpan. Klik "Tambah Album Foto Baru" untuk membuat.
                  </td>
                </tr>
              ) : (
                paginated.map((album) => (
                  <tr key={album.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Images size={18} style={{ color: 'var(--primary-400)', flexShrink: 0 }} />
                        <span>{album.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', maxWidth: '300px' }}>
                      {album.description || '-'}
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
                        {album.photos.length} Foto
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: album.transitionEffect === 'ken-burns' ? 'var(--primary-400)' : 'var(--text-secondary)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {album.transitionEffect === 'ken-burns' ? '✨ Ken Burns' : album.transitionEffect}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {album.slideDurationSeconds} Detik / Foto
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setPreviewAlbum(album);
                            setSlideIdx(0);
                            setIsPlaying(true);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px' }}
                          title="Putar Slideshow"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(album.id, album.name)}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px' }}
                          title="Hapus Album"
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
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Slideshow Modal Preview */}
      {previewAlbum && currentPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setPreviewAlbum(null)}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '860px',
              backgroundColor: '#000',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '14px 20px',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Images size={18} style={{ color: '#60a5fa' }} />
                <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>
                  {previewAlbum.name} ({slideIdx + 1}/{previewAlbum.photos.length})
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setSlideIdx((prev) => (prev - 1 + previewAlbum.photos.length) % previewAlbum.photos.length)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px' }}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px' }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={() => setSlideIdx((prev) => (prev + 1) % previewAlbum.photos.length)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px' }}
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => setPreviewAlbum(null)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', marginLeft: '8px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Slideshow 16:9 Screen */}
            <div style={{ position: 'relative', width: '100%', height: '480px', overflow: 'hidden' }}>
              <img
                key={currentPhoto.id}
                src={currentPhoto.url}
                alt={currentPhoto.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  animation: previewAlbum.transitionEffect === 'ken-burns' ? 'kenBurnsModal 6s ease-in-out infinite alternate' : 'none',
                  transition: 'opacity 0.4s ease',
                }}
              />

              {/* Promotional Badge */}
              {currentPhoto.promoBadge && (
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    padding: '6px 14px',
                    backgroundColor: 'rgba(239, 68, 68, 0.95)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={12} />
                  <span>{currentPhoto.promoBadge}</span>
                </div>
              )}

              {/* Bottom Ribbon */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '24px 24px 16px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  color: '#fff',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{currentPhoto.title}</h3>
                </div>
                {currentPhoto.priceTag && (
                  <div
                    style={{
                      padding: '6px 14px',
                      backgroundColor: 'rgba(16, 185, 129, 0.95)',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '1.125rem',
                      fontWeight: 900,
                    }}
                  >
                    {currentPhoto.priceTag}
                  </div>
                )}
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes kenBurnsModal {
              0% {
                transform: scale(1) translate(0, 0);
              }
              100% {
                transform: scale(1.08) translate(-1%, -1%);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
