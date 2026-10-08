'use client';

import React, { useState, useEffect } from 'react';
import { Images, Plus, Trash2, Edit3, Play, Pause, ChevronLeft, ChevronRight, Sparkles, Tag, Eye, Clock } from 'lucide-react';

interface PhotoItem {
  id: string;
  url: string;
  title: string;
  promoBadge?: string;
  priceTag?: string;
}

interface PhotoAlbum {
  id: string;
  name: string;
  description: string;
  transitionEffect: 'ken-burns' | 'fade' | 'slide' | 'zoom';
  slideDurationSeconds: number;
  photos: PhotoItem[];
}

const STORAGE_KEY = 'dka_signage_photo_albums';

const DEFAULT_ALBUMS: PhotoAlbum[] = [
  {
    id: 'album-1',
    name: 'Promo Kuliner Nusantara',
    description: 'Slideshow menu andalan restoran untuk layar kasir dan display etalase.',
    transitionEffect: 'ken-burns',
    slideDurationSeconds: 4,
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
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('album-1');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAlbums(parsed);
          setSelectedAlbumId(parsed[0].id);
        }
      }
    } catch {}
  }, []);

  const saveAlbums = (updated: PhotoAlbum[]) => {
    setAlbums(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const activeAlbum = albums.find((a) => a.id === selectedAlbumId) || albums[0];

  // Auto advance slides
  useEffect(() => {
    if (!isPlaying || !activeAlbum || activeAlbum.photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % activeAlbum.photos.length);
    }, (activeAlbum.slideDurationSeconds || 4) * 1000);

    return () => clearInterval(interval);
  }, [isPlaying, activeAlbum?.slideDurationSeconds, activeAlbum?.photos.length]);

  const currentPhoto = activeAlbum?.photos[currentSlideIndex] || activeAlbum?.photos[0];

  const handleCreateAlbum = () => {
    const name = prompt('Masukkan nama album promosi baru:', 'Album Promosi Baru');
    if (!name) return;

    const newAlbum: PhotoAlbum = {
      id: `album-${Date.now()}`,
      name,
      description: 'Album foto baru untuk promosi layar.',
      transitionEffect: 'ken-burns',
      slideDurationSeconds: 4,
      photos: [
        {
          id: `p-${Date.now()}`,
          url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80',
          title: 'Hidangan Andalan',
          promoBadge: 'PROMO SPESIAL',
          priceTag: 'Rp 35.000',
        },
      ],
    };

    const updated = [...albums, newAlbum];
    saveAlbums(updated);
    setSelectedAlbumId(newAlbum.id);
    setCurrentSlideIndex(0);
  };

  const handleAddPhoto = () => {
    const title = prompt('Nama/Judul Foto Promosi:', 'Menu Spesial');
    if (!title) return;
    const url = prompt('URL Gambar (JPG/PNG/WebP):', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=80');
    if (!url) return;
    const promoBadge = prompt('Badge Promosi (opsional):', 'PROMO DISKON 15%') || undefined;
    const priceTag = prompt('Label Harga (opsional):', 'Rp 29.000') || undefined;

    const newPhoto: PhotoItem = {
      id: `p-${Date.now()}`,
      url,
      title,
      promoBadge,
      priceTag,
    };

    const updated = albums.map((a) => {
      if (a.id === activeAlbum.id) {
        return { ...a, photos: [...a.photos, newPhoto] };
      }
      return a;
    });

    saveAlbums(updated);
  };

  const handleDeletePhoto = (photoId: string) => {
    if (activeAlbum.photos.length <= 1) {
      alert('Minimal harus ada 1 foto di dalam album.');
      return;
    }
    const updated = albums.map((a) => {
      if (a.id === activeAlbum.id) {
        return { ...a, photos: a.photos.filter((p) => p.id !== photoId) };
      }
      return a;
    });
    saveAlbums(updated);
    setCurrentSlideIndex(0);
  };

  const handleDeleteAlbum = (albumId: string) => {
    if (albums.length <= 1) {
      alert('Minimal harus ada 1 album.');
      return;
    }
    if (!confirm('Hapus album promosi ini?')) return;
    const updated = albums.filter((a) => a.id !== albumId);
    saveAlbums(updated);
    setSelectedAlbumId(updated[0].id);
    setCurrentSlideIndex(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Komponen Galeri & Album Foto Promosi
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Kelola slideshow album foto dengan transisi visual halus (Ken Burns / Pan & Zoom) dan label harga promosi.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={handleCreateAlbum} className="btn btn-primary">
            <Plus size={16} />
            <span>Buat Album Baru</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 360px) 1fr', gap: '24px' }}>
        {/* Left: Album List & Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Albums Accordion / Selector */}
          <div className="card-elevated" style={{ padding: '16px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Daftar Album Foto
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              {albums.map((alb) => (
                <div
                  key={alb.id}
                  onClick={() => {
                    setSelectedAlbumId(alb.id);
                    setCurrentSlideIndex(0);
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: alb.id === selectedAlbumId ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${alb.id === selectedAlbumId ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Images size={18} style={{ color: alb.id === selectedAlbumId ? 'var(--primary-400)' : 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{alb.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {alb.photos.length} Foto • {alb.slideDurationSeconds}s per slide
                      </div>
                    </div>
                  </div>
                  {albums.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAlbum(alb.id);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      title="Hapus Album"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Album Settings */}
          {activeAlbum && (
            <div className="card-elevated" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Pengaturan Transisi Album
              </h3>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Efek Transisi Slideshow
                </label>
                <select
                  value={activeAlbum.transitionEffect}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    saveAlbums(albums.map((a) => (a.id === activeAlbum.id ? { ...a, transitionEffect: val } : a)));
                  }}
                  className="form-input"
                >
                  <option value="ken-burns">Ken Burns (Pan & Zoom Lambat - Rekomendasi)</option>
                  <option value="fade">Halus (Cross-Fade)</option>
                  <option value="slide">Geser Horizontal (Slide)</option>
                  <option value="zoom">Zoom Pulse</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Durasi Per Foto (Detik)
                </label>
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={activeAlbum.slideDurationSeconds}
                  onChange={(e) => {
                    const dur = Math.max(2, Number(e.target.value));
                    saveAlbums(albums.map((a) => (a.id === activeAlbum.id ? { ...a, slideDurationSeconds: dur } : a)));
                  }}
                  className="form-input"
                />
              </div>

              {/* Photo thumbnails list */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Foto di Album Ini ({activeAlbum.photos.length})
                  </span>
                  <button onClick={handleAddPhoto} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.6875rem' }}>
                    <Plus size={12} />
                    <span>Tambah Foto</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeAlbum.photos.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => setCurrentSlideIndex(idx)}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: idx === currentSlideIndex ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-surface-elevated)',
                        border: `1px solid ${idx === currentSlideIndex ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={p.url} alt={p.title} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</div>
                          {p.priceTag && <div style={{ fontSize: '0.65rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>{p.priceTag}</div>}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(p.id);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        title="Hapus Foto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Simulated 16:9 Screen Display */}
        <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Simulasi Penayangan Album: {activeAlbum?.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                (Foto {currentSlideIndex + 1} dari {activeAlbum?.photos.length})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + activeAlbum.photos.length) % activeAlbum.photos.length)}
                className="btn btn-secondary"
                style={{ padding: '6px 10px' }}
                title="Foto Sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="btn btn-secondary"
                style={{ padding: '6px 10px' }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span style={{ fontSize: '0.75rem' }}>{isPlaying ? 'Jeda' : 'Putar'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % activeAlbum.photos.length)}
                className="btn btn-secondary"
                style={{ padding: '6px 10px' }}
                title="Foto Berikutnya"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* 16:9 Display Frame with Animation */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '460px',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#0a0a0a',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              border: '2px solid var(--border-subtle)',
            }}
          >
            {currentPhoto && (
              <>
                <img
                  key={currentPhoto.id}
                  src={currentPhoto.url}
                  alt={currentPhoto.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    animation: activeAlbum?.transitionEffect === 'ken-burns' ? 'kenBurns 6s ease-in-out infinite alternate' : 'none',
                    transition: 'all 0.5s ease-in-out',
                  }}
                />

                {/* Promotional Overlay Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    zIndex: 10,
                  }}
                >
                  {currentPhoto.promoBadge && (
                    <div
                      style={{
                        padding: '6px 14px',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.05em',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                        textTransform: 'uppercase',
                        alignSelf: 'flex-start',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Sparkles size={14} />
                      <span>{currentPhoto.promoBadge}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Title & Price Gradient Ribbon */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '30px 24px 20px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    zIndex: 10,
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                      {currentPhoto.title}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                      Koleksi Pilihan {activeAlbum?.name}
                    </p>
                  </div>

                  {currentPhoto.priceTag && (
                    <div
                      style={{
                        padding: '8px 18px',
                        backgroundColor: 'rgba(16, 185, 129, 0.95)',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                      }}
                    >
                      {currentPhoto.priceTag}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <style jsx>{`
            @keyframes kenBurns {
              0% {
                transform: scale(1) translate(0, 0);
              }
              100% {
                transform: scale(1.08) translate(-1%, -1%);
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
