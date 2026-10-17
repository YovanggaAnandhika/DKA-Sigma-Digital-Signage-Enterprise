'use client';

import React, { useState, useEffect } from 'react';
import { X, Globe, Type, Clock, Users, Images, Plus, Sparkles, Check, ListMusic } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';
import { addMediaBlock, addPlaylistBlock, addWidgetBlock, createLayer } from '@/lib/services/studio/layout.service';
import { DEFAULT_WEBVIEWS, WEBVIEW_STORAGE_KEY, WebViewConfig } from '@/app/(dashboard)/studio/components/webview/types';
import { DEFAULT_TICKERS, TICKER_STORAGE_KEY, TickerConfig } from '@/app/(dashboard)/studio/components/ticker/types';
import { DEFAULT_CLOCKS, CLOCK_STORAGE_KEY, ClockWeatherConfig } from '@/app/(dashboard)/studio/components/clock/types';
import { DEFAULT_QUEUES, QUEUE_STORAGE_KEY, QueueDisplayConfig } from '@/app/(dashboard)/studio/components/ticket/types';
import { DEFAULT_ALBUMS, ALBUM_STORAGE_KEY, PhotoAlbum } from '@/app/(dashboard)/studio/components/album/types';
import { ensureUuid } from '@/lib/services/studio/widgetHelper';

export default function ComponentPickerModal() {
  const {
    componentPickerZoneId,
    setComponentPickerZoneId,
    layers,
    setLayers,
    availablePlaylists,
    showToast,
  } = useLayoutEditor();

  const [activeTab, setActiveTab] = useState<'playlist' | 'webview' | 'ticker' | 'clock' | 'queue' | 'album'>('playlist');
  const [webviews, setWebviews] = useState<WebViewConfig[]>(DEFAULT_WEBVIEWS);
  const [tickers, setTickers] = useState<TickerConfig[]>(DEFAULT_TICKERS);
  const [clocks, setClocks] = useState<ClockWeatherConfig[]>(DEFAULT_CLOCKS);
  const [queues, setQueues] = useState<QueueDisplayConfig[]>(DEFAULT_QUEUES);
  const [albums, setAlbums] = useState<PhotoAlbum[]>(DEFAULT_ALBUMS);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedWv = localStorage.getItem(WEBVIEW_STORAGE_KEY);
      if (storedWv) {
        const parsed = JSON.parse(storedWv);
        setWebviews(parsed.map((item: any) => ({ ...item, id: ensureUuid(item.id) })));
      }
      const storedTk = localStorage.getItem(TICKER_STORAGE_KEY);
      if (storedTk) {
        const parsed = JSON.parse(storedTk);
        setTickers(parsed.map((item: any) => ({ ...item, id: ensureUuid(item.id) })));
      }
      const storedCk = localStorage.getItem(CLOCK_STORAGE_KEY);
      if (storedCk) {
        const parsed = JSON.parse(storedCk);
        setClocks(parsed.map((item: any) => ({ ...item, id: ensureUuid(item.id) })));
      }
      const storedQu = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (storedQu) {
        const parsed = JSON.parse(storedQu);
        setQueues(parsed.map((item: any) => ({ ...item, id: ensureUuid(item.id) })));
      }
      const storedAl = localStorage.getItem(ALBUM_STORAGE_KEY);
      if (storedAl) {
        const parsed = JSON.parse(storedAl);
        setAlbums(parsed.map((item: any) => ({ ...item, id: ensureUuid(item.id) })));
      }
    } catch (e) {
      console.warn('Gagal memuat local storage komponen', e);
    }
  }, []);

  if (!componentPickerZoneId) return null;

  const targetZone = layers.find((z) => z.id === componentPickerZoneId);
  if (!targetZone) return null;

  const handleClose = () => {
    setComponentPickerZoneId(null);
  };

  const handleSelectComponent = async (
    widgetType: 'webview' | 'ticker' | 'clock' | 'queue' | 'album',
    item: any
  ) => {
    const currentBlocks = targetZone.blocksList || [];
    let start_time_seconds = 0;
    for (const b of currentBlocks) {
      start_time_seconds += b.durationSeconds || 10;
    }

    const duration_seconds =
      widgetType === 'album'
        ? (item.photos?.length || 1) * (item.slideDurationSeconds || 5)
        : 30; // 30 detik default untuk widget

    try {
      let realZoneId = targetZone.id;
      if (realZoneId.startsWith('z-')) {
        const newZ = await createLayer({
          layoutId: targetZone.layoutId,
          name: targetZone.name,
          x: targetZone.x,
          y: targetZone.y,
          width: targetZone.width,
          height: targetZone.height,
          zIndex: targetZone.zIndex,
          backgroundColor: targetZone.backgroundColor,
        });
        realZoneId = newZ.id;
      }

      // Pastikan item.id adalah UUID standar
      const targetWidgetId = ensureUuid(item.id);
      const res = await addWidgetBlock(realZoneId, widgetType, targetWidgetId, start_time_seconds, duration_seconds).catch((err) => {
        console.warn('Simpan async widget block gagal, diteruskan di tombol Simpan Layout:', err);
        return null;
      });

      const createdBlock = res?.block || res || {};

      const newBlock: any = {
        ...createdBlock,
        id: createdBlock.id || `wb-${Date.now()}`,
        layerId: realZoneId,
        playlistId: '',
        mediaItemId: '',
        widgetType,
        widgetId: targetWidgetId,
        widgetData: { ...item, id: targetWidgetId },
        startTimeSeconds: start_time_seconds,
        durationSeconds: duration_seconds,
        transitionType: 'none',
        orderIndex: currentBlocks.length,
        itemOverridesList: [],
        isMuted: true,
        createdAt: new Date().toISOString(),
      };

      setLayers((prev) =>
        prev.map((z) => {
          if (z.id === targetZone.id || z.id === realZoneId) {
            return {
              ...z,
              id: realZoneId,
              blocksList: [...(z.blocksList || []), newBlock],
            };
          }
          return z;
        })
      );

      showToast(`Komponen ${item.name} berhasil ditambahkan ke Layer`);
      handleClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan widget ke layer', 'error');
    }
  };

  const handleSelectPlaylist = async (plId: string) => {
    const pl = availablePlaylists.find((p) => p.id === plId);
    if (!pl) return;

    const currentBlocks = targetZone.blocksList || [];
    let start_time_seconds = 0;
    for (const b of currentBlocks) {
      start_time_seconds += b.durationSeconds || 10;
    }
    const duration_seconds = pl.totalDurationSeconds || 10;

    try {
      let realZoneId = targetZone.id;
      if (realZoneId.startsWith('z-')) {
        const newZ = await createLayer({
          layoutId: targetZone.layoutId,
          name: targetZone.name,
          x: targetZone.x,
          y: targetZone.y,
          width: targetZone.width,
          height: targetZone.height,
          zIndex: targetZone.zIndex,
          backgroundColor: targetZone.backgroundColor,
        });
        realZoneId = newZ.id;
      }

      const res = await addPlaylistBlock(realZoneId, plId, start_time_seconds, duration_seconds);
      const createdBlock = res.block || res;

      const newBlock: any = {
        ...createdBlock,
        id: createdBlock.id,
        layerId: realZoneId,
        playlistId: plId,
        mediaItemId: '',
        playlist: pl,
        startTimeSeconds: start_time_seconds,
        durationSeconds: duration_seconds,
        transitionType: 'none',
        orderIndex: currentBlocks.length,
        itemOverridesList: [],
        isMuted: false,
        createdAt: new Date().toISOString(),
      };

      setLayers((prev) =>
        prev.map((z) => {
          if (z.id === targetZone.id || z.id === realZoneId) {
            return {
              ...z,
              id: realZoneId,
              blocksList: [...(z.blocksList || []), newBlock],
            };
          }
          return z;
        })
      );

      showToast(`Daftar Putar ${pl.name} berhasil ditambahkan ke Layer`);
      handleClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan daftar putar', 'error');
    }
  };

  const tabs = [
    { key: 'playlist', label: 'Daftar Putar', icon: ListMusic, count: availablePlaylists.length },
    { key: 'webview', label: 'Web View', icon: Globe, count: webviews.length },
    { key: 'ticker', label: 'Teks Berjalan', icon: Type, count: tickers.length },
    { key: 'clock', label: 'Jam & Cuaca', icon: Clock, count: clocks.length },
    { key: 'queue', label: 'Nomor Antrian', icon: Users, count: queues.length },
    { key: 'album', label: 'Album Foto', icon: Images, count: albums.length },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
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
          maxWidth: '900px',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Pilih Komponen Layar
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Tambahkan widget interaktif atau dinamis ke dalam <strong>{targetZone.name}</strong>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '50%', color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Component Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-base)',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--primary-500)' : '1px solid transparent',
                  backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                  color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    backgroundColor: isActive ? 'var(--primary-600)' : 'var(--bg-surface-elevated)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {activeTab === 'playlist' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {availablePlaylists.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ListMusic size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.8125rem' }}>Belum ada daftar putar yang dibuat.</p>
                </div>
              ) : (
                availablePlaylists.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectPlaylist(item.id)}
                    className="card-elevated hover-card"
                    style={{
                      padding: '14px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ListMusic size={18} className="text-primary" />
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.description || 'Daftar putar media'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                      <span>{item.itemsList?.length || 0} media &bull; {item.totalDurationSeconds || 0}s</span>
                      <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Pilih +</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'webview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {webviews.map((item: WebViewConfig) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectComponent('webview', item)}
                  className="card-elevated hover-card"
                  style={{
                    padding: '14px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={18} className="text-primary" />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{item.url}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                    <span>Auto-refresh: {item.refreshIntervalSeconds}s</span>
                    <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Pilih +</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ticker' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {tickers.map((item: TickerConfig) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectComponent('ticker', item)}
                  className="card-elevated hover-card"
                  style={{
                    padding: '14px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Type size={18} className="text-primary" />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.messages.join(' • ')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                    <span>Badge: {item.badge || 'INFO'}</span>
                    <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Pilih +</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'clock' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {clocks.map((item: ClockWeatherConfig) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectComponent('clock', item)}
                  className="card-elevated hover-card"
                  style={{
                    padding: '14px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} className="text-primary" />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kota: {item.city} &bull; Tema: {item.theme}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                    <span>Format: {item.is24Hour ? '24 Jam' : '12 Jam'}</span>
                    <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Pilih +</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'queue' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {queues.map((item: QueueDisplayConfig) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectComponent('queue', item)}
                  className="card-elevated hover-card"
                  style={{
                    padding: '14px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} className="text-primary" />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nomor Terakhir: {item.currentNumber} ({item.currentCounter})</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                    <span>Audio Chime: {item.audioChimeEnabled ? 'Aktif' : 'Mati'}</span>
                    <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Pilih +</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'album' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {albums.map((item: PhotoAlbum) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectComponent('album', item)}
                  className="card-elevated hover-card"
                  style={{
                    padding: '14px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Images size={18} className="text-primary" />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.photos?.length || 0} Foto &bull; Efek: {item.transitionEffect}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                    <span>Durasi per foto: {item.slideDurationSeconds}s</span>
                    <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Pilih +</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
