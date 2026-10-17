'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Images, Plus, Trash2, Check, Sparkles, FolderOpen } from 'lucide-react';
import { ALBUM_STORAGE_KEY, DEFAULT_ALBUMS, PhotoAlbum, PhotoItem } from '../types';
import AlbumMediaPickerModal from '../components/AlbumMediaPickerModal';

export default function CreatePhotoAlbumPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [transitionEffect, setTransitionEffect] = useState<'ken-burns' | 'fade' | 'slide' | 'zoom'>('ken-burns');
  const [duration, setDuration] = useState(4);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Photos List in Album (starts empty)
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAlbum: PhotoAlbum = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `e0000000-0000-0000-0000-${Date.now().toString().padStart(12, '0')}`,
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

    router.push('/studio/components/album');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/studio/components/album" className="btn btn-outline" style={{ padding: '8px' }}>
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

          {/* Add photo via Media Library Picker */}
          <div style={{ padding: '16px 20px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Images size={16} color="var(--primary-400)" /> Tambah Foto dari Pustaka Media
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Pilih gambar produk atau poster promosi dari pustaka aset digital signage.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsMediaPickerOpen(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FolderOpen size={16} />
              <span>Buka Pustaka Media</span>
            </button>
          </div>

          {/* Photos Table/List */}
          {photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', border: '1px dashed var(--border-subtle)', borderRadius: '10px', color: 'var(--text-muted)' }}>
              <Images size={36} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                Belum ada foto dalam album
              </p>
              <p style={{ fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                Klik tombol &quot;Buka Pustaka Media&quot; di atas untuk memilih foto promosi produk.
              </p>
            </div>
          ) : (
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
        )}
        </div>
      </form>

      {/* Media Picker Modal */}
      <AlbumMediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelectPhoto={(photo) => {
          setPhotos((prev) => [
            ...prev,
            {
              id: `p-${Date.now()}`,
              mediaItemId: photo.mediaItemId,
              url: photo.url,
              title: photo.title,
              promoBadge: photo.promoBadge,
              priceTag: photo.priceTag,
            },
          ]);
        }}
      />
    </div>
  );
}
