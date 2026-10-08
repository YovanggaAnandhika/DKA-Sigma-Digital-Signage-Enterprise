'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Images, Plus, Trash2, Check, Sparkles } from 'lucide-react';
import { ALBUM_STORAGE_KEY, DEFAULT_ALBUMS, PhotoAlbum, PhotoItem } from '../../tabs/PhotoAlbumManagerTab';

export default function CreatePhotoAlbumPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [transitionEffect, setTransitionEffect] = useState<'ken-burns' | 'fade' | 'slide' | 'zoom'>('ken-burns');
  const [duration, setDuration] = useState(4);

  // Photos List in Album
  const [photos, setPhotos] = useState<PhotoItem[]>([
    {
      id: 'p-initial',
      url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop&q=80',
      title: 'Item Menu Spesial',
      promoBadge: 'PROMO UTAMA',
      priceTag: 'Rp 35.000',
    },
  ]);

  // New photo input fields
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newPrice, setNewPrice] = useState('');

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

    const newAlbum: PhotoAlbum = {
      id: `album-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Album foto promosi produk.',
      transitionEffect,
      slideDurationSeconds: Math.max(2, duration),
      photos,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      const stored = localStorage.getItem(ALBUM_STORAGE_KEY);
      const existing: PhotoAlbum[] = stored ? JSON.parse(stored) : DEFAULT_ALBUMS;
      const updated = [newAlbum, ...existing];
      localStorage.setItem(ALBUM_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    router.push('/studio/components?tab=album');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/studio/components?tab=album" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Buat Album Foto Baru
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Atur kumpulan foto produk promosi, durasi per slide, dan efek transisi sinematik Ken Burns.
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
              placeholder="Contoh: Menu Makanan Spesial Weekend"
              className="form-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Deskripsi / Catatan
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Koleksi foto makanan untuk layar kasir"
              className="form-input"
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Efek Transisi
              </label>
              <select
                value={transitionEffect}
                onChange={(e) => setTransitionEffect(e.target.value as any)}
                className="form-input"
              >
                <option value="ken-burns">Ken Burns (Rekomendasi)</option>
                <option value="fade">Halus (Fade)</option>
                <option value="slide">Geser (Slide)</option>
                <option value="zoom">Zoom Pulse</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Durasi Slide
              </label>
              <input
                type="number"
                min={2}
                max={60}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="form-input"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <Link href="/studio/components?tab=album" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Check size={16} />
              <span>Simpan Album</span>
            </button>
          </div>
        </div>

        {/* Right: Manage Photos */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Foto di Dalam Album ({photos.length})
            </h2>
          </div>

          {/* Add photo inline form */}
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              + Tambah Foto ke Album
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Judul / Nama Produk"
                className="form-input"
              />
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="URL Gambar (https://...)"
                className="form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
              <input
                type="text"
                value={newBadge}
                onChange={(e) => setNewBadge(e.target.value)}
                placeholder="Badge Promo (Contoh: DISKON 20%)"
                className="form-input"
              />
              <input
                type="text"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Label Harga (Contoh: Rp 45.000)"
                className="form-input"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                className="btn btn-secondary"
                style={{ alignSelf: 'flex-end', padding: '10px 16px' }}
              >
                <Plus size={14} />
                <span>Tambahkan</span>
              </button>
            </div>
          </div>

          {/* Photos Table/List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {photos.map((p, idx) => (
              <div
                key={p.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={p.url} alt={p.title} style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      #{idx + 1} {p.title}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                      {p.promoBadge && (
                        <span style={{ fontSize: '0.6875rem', color: '#f87171', fontWeight: 700 }}>
                          [{p.promoBadge}]
                        </span>
                      )}
                      {p.priceTag && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                          {p.priceTag}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemovePhoto(p.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                  title="Hapus Foto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
