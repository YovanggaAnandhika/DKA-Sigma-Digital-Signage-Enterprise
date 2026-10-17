'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Check, Image as ImageIcon, Plus, FolderOpen, Tag, DollarSign, Type } from 'lucide-react';
import { api, MediaItem } from '@/lib/services';

interface AlbumMediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photo: {
    mediaItemId: string;
    url: string;
    title: string;
    promoBadge?: string;
    priceTag?: string;
  }) => void;
}

export default function AlbumMediaPickerModal({ isOpen, onClose, onSelectPhoto }: AlbumMediaPickerModalProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Selected media & item properties
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [title, setTitle] = useState('');
  const [promoBadge, setPromoBadge] = useState('');
  const [priceTag, setPriceTag] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const res = await api.getMedia({ limit: 100 });
        // Filter image items (1 = Image enum in protobuf)
        const imagesOnly = (res.data || []).filter(
          (m: MediaItem) => m.mediaType === 1 || String(m.mediaType) === 'IMAGE' || m.mimeType?.startsWith('image/')
        );
        setMediaList(imagesOnly);
      } catch (err) {
        console.error('Failed to load media for album picker:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectMedia = (m: MediaItem) => {
    setSelectedMedia(m);
    if (!title) {
      setTitle(m.name || m.originalFilename.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleConfirm = () => {
    if (!selectedMedia) return;
    onSelectPhoto({
      mediaItemId: selectedMedia.id,
      url: selectedMedia.publicUrl,
      title: title.trim() || selectedMedia.name,
      promoBadge: promoBadge.trim() || undefined,
      priceTag: priceTag.trim() || undefined,
    });
    // Reset form
    setSelectedMedia(null);
    setTitle('');
    setPromoBadge('');
    setPriceTag('');
    onClose();
  };

  const filtered = mediaList.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.originalFilename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '95vw',
          maxWidth: '1000px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                padding: '8px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--primary-400)',
              }}
            >
              <ImageIcon size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Pilih Foto dari Pustaka Media
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Pilih aset gambar dari pustaka terpusat untuk ditambahkan ke album slideshow.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body: Grid Layout 2 Kolom */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Kolom Kiri: Galeri Media */}
          <div
            style={{
              padding: '20px',
              borderRight: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflow: 'hidden',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari foto di pustaka media..."
                className="form-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            {/* Media Grid */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '12px',
                alignContent: 'start',
                paddingRight: '4px',
              }}
            >
              {loading ? (
                <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Memuat pustaka media...
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FolderOpen size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <div>Tidak ada gambar yang cocok.</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    Unggah gambar baru di menu Pustaka Media terlebih dahulu.
                  </div>
                </div>
              ) : (
                filtered.map((item) => {
                  const isSelected = selectedMedia?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectMedia(item)}
                      style={{
                        position: 'relative',
                        aspectRatio: '4 / 3',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isSelected
                          ? '2px solid var(--primary-500)'
                          : '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        boxShadow: isSelected ? '0 0 0 3px rgba(59, 130, 246, 0.3)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <img
                        src={item.publicUrl}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            backgroundColor: 'var(--primary-600)',
                            color: '#fff',
                            borderRadius: '50%',
                            padding: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '4px 6px',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                          fontSize: '0.6875rem',
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.name}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Kolom Kanan: Properti Foto dalam Album */}
          <div
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-surface-elevated)',
              overflowY: 'auto',
            }}
          >
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
                Atribut Tampilan Foto
              </h3>

              {selectedMedia ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Preview Selected Media */}
                  <div
                    style={{
                      aspectRatio: '16 / 9',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-primary)',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={selectedMedia.publicUrl}
                      alt={selectedMedia.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {promoBadge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#ec4899',
                          color: '#fff',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {promoBadge}
                      </span>
                    )}
                    {priceTag && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          color: '#facc15',
                        }}
                      >
                        {priceTag}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <Type size={13} /> Judul / Nama Produk *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: Nasi Goreng Spesial"
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <Tag size={13} /> Badge Promosi (Opsional)
                    </label>
                    <input
                      type="text"
                      value={promoBadge}
                      onChange={(e) => setPromoBadge(e.target.value)}
                      placeholder="Contoh: BEST SELLER atau DISKON 20%"
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <DollarSign size={13} /> Label Harga (Opsional)
                    </label>
                    <input
                      type="text"
                      value={priceTag}
                      onChange={(e) => setPriceTag(e.target.value)}
                      placeholder="Contoh: Rp 35.000 atau Rp 45K"
                      className="form-input"
                    />
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '30px 20px',
                    textAlign: 'center',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: '12px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <ImageIcon size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Pilih salah satu gambar di sebelah kiri</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    Data gambar akan diambil langsung dari Pustaka Media.
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={onClose} type="button" className="btn btn-secondary" style={{ flex: 1 }}>
                Batal
              </button>
              <button
                onClick={handleConfirm}
                type="button"
                disabled={!selectedMedia || !title.trim()}
                className="btn btn-primary"
                style={{ flex: 1.5 }}
              >
                <Plus size={16} />
                <span>Tambahkan ke Album</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
