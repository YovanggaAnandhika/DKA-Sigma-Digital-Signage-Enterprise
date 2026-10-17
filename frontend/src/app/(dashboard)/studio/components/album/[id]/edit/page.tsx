'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Images, Plus, Trash2, Check, Sparkles, Save, RefreshCw, FolderOpen } from 'lucide-react';
import { ALBUM_STORAGE_KEY, DEFAULT_ALBUMS, PhotoAlbum, PhotoItem } from '../../types';
import AlbumMediaPickerModal from '../../components/AlbumMediaPickerModal';
import { modal } from '@/components/ui/ModalDialog';

export default function EditPhotoAlbumPage() {
  const params = useParams() as { id: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [transitionEffect, setTransitionEffect] = useState<'ken-burns' | 'fade' | 'slide' | 'zoom'>('ken-burns');
  const [duration, setDuration] = useState(4);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

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
        modal.alert({
          title: 'Tidak Ditemukan',
          message: 'Album foto tidak ditemukan.',
          variant: 'warning',
        });
        router.push('/studio/components/album');
      }
    } catch {
      router.push('/studio/components/album');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearAllPhotos = async () => {
    const ok = await modal.confirm({
      title: 'Hapus Semua Foto',
      message: 'Apakah Anda yakin ingin menghapus semua foto dari album ini?',
      variant: 'danger',
      confirmText: 'Bersihkan Semua',
    });
    if (ok) {
      setPhotos([]);
    }
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
          {/* Add New Photo Card (Via Media Library Picker) */}
          <div className="card-elevated" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Images size={16} color="var(--primary-400)" /> Tambah Foto dari Pustaka Media
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Pilih gambar aset terpusat yang sudah diunggah untuk ditampilkan pada slideshow album.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(true)}
                className="btn btn-primary"
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FolderOpen size={16} />
                <span>Buka Pustaka Media</span>
              </button>
            </div>
          </div>

          {/* Photos List Table */}
          <div className="card-elevated" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Daftar Foto dalam Album ({photos.length} Gambar)
              </h3>
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllPhotos}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                >
                  <Trash2 size={13} style={{ marginRight: '4px' }} /> Bersihkan Semua
                </button>
              )}
            </div>

            {photos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', border: '1px dashed var(--border-subtle)', borderRadius: '10px', color: 'var(--text-muted)' }}>
                <Images size={36} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                  Belum ada foto dalam album
                </p>
                <p style={{ fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                  Klik tombol &quot;Buka Pustaka Media&quot; di atas untuk memilih foto promosi.
                </p>
              </div>
            ) : (
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
          )}
          </div>
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
