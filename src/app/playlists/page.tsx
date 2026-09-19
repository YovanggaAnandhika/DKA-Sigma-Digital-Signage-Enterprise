'use client';

import { useState } from 'react';

interface PlaylistItem {
  id: string;
  media_name: string;
  media_type: 'video' | 'image';
  duration_seconds: number;
  transition: string;
  thumbnail_color: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  is_shuffle: boolean;
  items: PlaylistItem[];
}

export default function PlaylistsPage() {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('pl-1');
  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: 'pl-1',
      name: 'Playlist Video Promo Bulanan',
      description: 'Rotasi video promosi diskon weekend dan produk unggulan',
      is_shuffle: false,
      items: [
        { id: 'item-1', media_name: 'Summer_Sale_Promo_Teaser.mp4', media_type: 'video', duration_seconds: 15, transition: 'fade', thumbnail_color: '#4f46e5' },
        { id: 'item-2', media_name: 'Fresh_Produce_Discount_Banner.jpg', media_type: 'image', duration_seconds: 8, transition: 'fade', thumbnail_color: '#06b6d4' },
        { id: 'item-3', media_name: 'Brand_Ambassador_Commercial.mp4', media_type: 'video', duration_seconds: 20, transition: 'slide_left', thumbnail_color: '#10b981' },
      ],
    },
    {
      id: 'pl-2',
      name: 'Slide Banner Produk Baru',
      description: 'Kumpulan banner gambar produk baru',
      is_shuffle: true,
      items: [
        { id: 'item-4', media_name: 'Product_A_Beverage.png', media_type: 'image', duration_seconds: 6, transition: 'fade', thumbnail_color: '#f59e0b' },
        { id: 'item-5', media_name: 'Product_B_Snacks.png', media_type: 'image', duration_seconds: 6, transition: 'fade', thumbnail_color: '#ec4899' },
      ],
    },
  ]);

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];
  const totalDuration = activePlaylist.items.reduce((acc, i) => acc + i.duration_seconds, 0);

  const handleAddItem = () => {
    const newItem: PlaylistItem = {
      id: `item-${Date.now()}`,
      media_name: 'New_Promo_Asset.jpg',
      media_type: 'image',
      duration_seconds: 8,
      transition: 'fade',
      thumbnail_color: '#8b5cf6',
    };

    setPlaylists(
      playlists.map((p) =>
        p.id === activePlaylist.id ? { ...p, items: [...p.items, newItem] } : p
      )
    );
  };

  const handleUpdateDuration = (itemId: string, duration: number) => {
    setPlaylists(
      playlists.map((p) =>
        p.id === activePlaylist.id
          ? {
              ...p,
              items: p.items.map((i) =>
                i.id === itemId ? { ...i, duration_seconds: duration } : i
              ),
            }
          : p
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setPlaylists(
      playlists.map((p) =>
        p.id === activePlaylist.id
          ? {
              ...p,
              items: p.items.filter((i) => i.id !== itemId),
            }
          : p
      )
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Playlist Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Susun urutan banyak video & gambar ke dalam 1 playlist dengan durasi detik masing-masing slide
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => alert('Playlist tersimpan!')}>
          <span>+ Buat Playlist Baru</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Playlist Directory */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '14px' }}>
            Daftar Playlist
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylistId(pl.id)}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: selectedPlaylistId === pl.id ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                  border: selectedPlaylistId === pl.id ? '1px solid var(--border-focus)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{pl.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {pl.items.length} item • Total {pl.items.reduce((a, b) => a + b.duration_seconds, 0)}s
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Playlist Sequence Editor */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{activePlaylist.name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                {activePlaylist.description} • {activePlaylist.items.length} Slide Media (Total Durasi Rotasi: {totalDuration} detik)
              </p>
            </div>
            <button className="btn btn-secondary" onClick={handleAddItem}>
              + Tambah Media ke Playlist
            </button>
          </div>

          {/* List of Sequence Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activePlaylist.items.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#a5b4fc',
                }}>
                  {index + 1}
                </div>

                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: item.thumbnail_color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                }}>
                  {item.media_type === 'video' ? '🎬' : '🖼️'}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{item.media_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                    Tipe: {item.media_type} • Transisi: {item.transition}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Durasi Tayang:</label>
                  <input
                    type="number"
                    value={item.duration_seconds}
                    onChange={(e) => handleUpdateDuration(item.id, Number(e.target.value))}
                    style={{
                      width: '70px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                      fontWeight: 700,
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>detik</span>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-rose)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '8px',
                  }}
                  title="Hapus dari playlist"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
