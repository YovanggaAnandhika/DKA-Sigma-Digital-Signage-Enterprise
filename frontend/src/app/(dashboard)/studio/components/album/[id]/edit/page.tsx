'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Images, Plus, Trash2, Check, Sparkles, Save, RefreshCw } from 'lucide-react';
import { ALBUM_STORAGE_KEY, DEFAULT_ALBUMS, PhotoAlbum, PhotoItem } from '../../types';

export default function EditPhotoAlbumPage() {
  const params = useParams() as { id: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [transitionEffect, setTransitionEffect] = useState<'ken-burns' | 'fade' | 'slide' | 'zoom'>('ken-burns');
  const [duration, setDuration] = useState(4);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  // New photo input fields
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ALBUM_STORAGE_KEY);
      const items: PhotoAlbum[] = stored ? JSON.parse(stored) : DEFAULT_ALBUMS;
      const found = items.find((a) => a.id === params.id);
      if (found) {
        setName(found.name);
        setDescription(found.description || '');
        setTransitionEffect(found.transitionEffect);
        setDuration(found.slideDurationSeconds);
        setPhotos(found.photos || []);
      } else {
        alert('Album foto tidak ditemukan.');
        router.push('/studio/components/album');
      }
    } catch {
      router.push('/studio/components/album');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newTitle.trim()) return;

    setPhotos([
      ...photos,
      {
        id: `p-${Date.now()}`,
        url: newUrl.trim(),
        title: newTitle.trim(),
        promoBadge: newBadge.trim() || undefined,
        priceTag: newPrice.trim() || undefined,
      },
    ]);

    setNewUrl('');
    setNewTitle('');
    setNewBadge('');
    setNewPrice('');
  };

  const handleRemovePhoto = (id: string) => {
    if (photos.length <= 1) {
      alert('Minimal harus ada 1 foto di dalam album.');
      return;
    }
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const stored = localStorage.getItem(ALBUM_STORAGE_KEY);
      const items: PhotoAlbum[] = stored ? JSON.parse(stored) : DEFAULT_ALBUMS;
      const updated = items.map((a) =>
        a.id === params.id
          ? {
              ...a,
              name: name.trim(),
              description: description.trim() || 'Album foto promosi produk.',
              transitionEffect,
              slideDurationSeconds: Math.max(2, duration),
              photos,
            }
          : a
      );
      localStorage.setItem(ALBUM_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    router.push('/studio/components/album');
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data Album Foto...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/studio/components/album" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Edit Album Foto: {name || params.id}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Perbarui daftar gambar promosi, efek Ken Burns sinematik, dan durasi pergantian gambar.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '24px' }}>
        {/* Left: General Settings */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Informasi Album
          </h2>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Album
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Menu Spesial Ramadhan"
              className="form-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Deskripsi Singkat
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Keterangan alokasi promosi album..."
              className="form-textarea"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Efek Transisi Slideshow
            </label>
            <select
              value={transitionEffect}
              onChange={(e) => setTransitionEffect(e.target.value as any)}
              className="form-select"
            >
              <option value="ken-burns">Ken Burns Sinematik (Pan & Zoom)</option>
              <option value="fade">Cross Fade Halus</option>
              <option value="slide">Slide Horizontal</option>
              <option value="zoom">Zoom In Sederhana</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Durasi Per Slide ({duration} Detik)
            </label>
            <input
              type="range"
              min="2"
              max="15"
              step="1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <Link href="/studio/components/album" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Save size={16} />
              <span>Simpan Album</span>
            </button>
          </div>
        </div>

        {/* Right: Photo Items Manager */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Add New Photo Card */}
          <div className="card-elevated" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} color="var(--primary-400)" /> Tambah Foto ke Album
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  URL Gambar *
                </label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Judul Foto / Produk *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Paket Hemat Burger"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Badge Promo (Opsional)
                </label>
                <input
                  type="text"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  placeholder="Contoh: DISKON 50% atau BEST SELLER"
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Label Harga (Opsional)
                </label>
                <input
                  type="text"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Contoh: Rp 45.000"
                  className="form-input"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddPhoto}
              disabled={!newUrl.trim() || !newTitle.trim()}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Plus size={14} />
              <span>Tambahkan ke Daftar Foto</span>
            </button>
          </div>

          {/* Photos List Table */}
          <div className="card-elevated" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Daftar Foto dalam Album ({photos.length} Gambar)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', width: '20px' }}>
                    #{idx + 1}
                  </span>
                  <div
                    style={{
                      width: '64px',
                      height: '44px',
                      borderRadius: '6px',
                      backgroundImage: `url(${photo.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: '#1e293b',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {photo.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      {photo.promoBadge && (
                        <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#ec4899', color: '#ffffff' }}>
                          {photo.promoBadge}
                        </span>
                      )}
                      {photo.priceTag && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24' }}>
                          {photo.priceTag}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="btn btn-danger"
                    style={{ padding: '6px 8px' }}
                    title="Hapus Foto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
