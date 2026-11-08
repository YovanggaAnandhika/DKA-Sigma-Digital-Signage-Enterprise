'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Globe, Type, Clock, Users, Images, Radio, Plus, Sparkles, Check, ListMusic, Search } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';
import { addMediaBlock, addPlaylistBlock, addWidgetBlock, createLayer } from '@/lib/services/studio/layout.service';
import { DEFAULT_WEBVIEWS, WEBVIEW_STORAGE_KEY, WebViewConfig } from '@/app/(dashboard)/studio/components/webview/types';
import { DEFAULT_TICKERS, TICKER_STORAGE_KEY, TickerConfig } from '@/app/(dashboard)/studio/components/ticker/types';
import { DEFAULT_CLOCKS, CLOCK_STORAGE_KEY, ClockWeatherConfig } from '@/app/(dashboard)/studio/components/clock/types';
import { DEFAULT_QUEUES, QUEUE_STORAGE_KEY, QueueDisplayConfig } from '@/app/(dashboard)/studio/components/ticket/types';
import { PhotoAlbum } from '@/app/(dashboard)/studio/components/album/types';
import { DEFAULT_LIVESTREAMS, LiveStreamConfig } from '@/app/(dashboard)/studio/components/livestream/types';
import { ensureUuid } from '@/lib/services/studio/widgetHelper';

import { invokeApi } from '@/lib/core/invokeApi';
import { getAlbums, getLiveStreams } from '@/lib/services';

export default function ComponentPickerModal() {
  const {
    componentPickerZoneId,
    setComponentPickerZoneId,
    layers,
    setLayers,
    availablePlaylists,
    showToast,
  } = useLayoutEditor();

  const [activeTab, setActiveTab] = useState<'playlist' | 'webview' | 'ticker' | 'clock' | 'queue' | 'album' | 'livestream'>('playlist');
  const [searchQuery, setSearchQuery] = useState('');
  const [webviews, setWebviews] = useState<WebViewConfig[]>(DEFAULT_WEBVIEWS);
  const [tickers, setTickers] = useState<TickerConfig[]>(DEFAULT_TICKERS);
  const [clocks, setClocks] = useState<ClockWeatherConfig[]>(DEFAULT_CLOCKS);
  const [queues, setQueues] = useState<QueueDisplayConfig[]>(DEFAULT_QUEUES);
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [albumsError, setAlbumsError] = useState('');
  const [liveStreams, setLiveStreams] = useState<LiveStreamConfig[]>(DEFAULT_LIVESTREAMS);

  const query = searchQuery.toLowerCase().trim();

  const filteredPlaylists = useMemo(() => {
    return availablePlaylists.filter((item) =>
      !query || item.name.toLowerCase().includes(query) || (item.description || '').toLowerCase().includes(query)
    );
  }, [availablePlaylists, query]);

  const filteredWebviews = useMemo(() => {
    return webviews.filter((item) =>
      !query || item.name.toLowerCase().includes(query) || item.url.toLowerCase().includes(query)
    );
  }, [webviews, query]);

  const filteredTickers = useMemo(() => {
    return tickers.filter((item) =>
      !query || item.name.toLowerCase().includes(query) || item.messages.join(' ').toLowerCase().includes(query)
    );
  }, [tickers, query]);

  const filteredClocks = useMemo(() => {
    return clocks.filter((item) =>
      !query || item.name.toLowerCase().includes(query) || item.city.toLowerCase().includes(query)
    );
  }, [clocks, query]);

  const filteredQueues = useMemo(() => {
    return queues.filter((item) =>
      !query || item.name.toLowerCase().includes(query) || (item.currentCounter || '').toLowerCase().includes(query)
    );
  }, [queues, query]);

  const filteredAlbums = useMemo(() => {
    return albums.filter((item) =>
      !query || item.name.toLowerCase().includes(query)
    );
  }, [albums, query]);

  const filteredLiveStreams = useMemo(() => {
    return liveStreams.filter((item) =>
      !query || item.name.toLowerCase().includes(query) || item.sourceUrl.toLowerCase().includes(query)
    );
  }, [liveStreams, query]);

  useEffect(() => {
    let isMounted = true;
    async function loadBackendComponents() {
      try {
        const [qRes, tRes, cRes, wRes, albumList, streamList] = await Promise.all([
          invokeApi<any>('/api/grpc/studio/queue/ListQueueDisplays', {}).catch(() => null),
          invokeApi<any>('/api/grpc/studio/ticker/ListTickers', {}).catch(() => null),
          invokeApi<any>('/api/grpc/studio/clock/ListClocks', {}).catch(() => null),
          invokeApi<any>('/api/grpc/studio/webview/ListWebviews', {}).catch(() => null),
          getAlbums().catch((error: unknown) => {
            if (isMounted) {
              setAlbumsError(error instanceof Error ? error.message : 'Gagal memuat album.');
            }
            return [];
          }),
          getLiveStreams().catch(() => DEFAULT_LIVESTREAMS),
        ]);

        if (!isMounted) return;

        if (qRes?.itemsList?.length) {
          setQueues(qRes.itemsList.map((item: any) => ({ ...item, id: ensureUuid(item.id) })));
        }
        if (tRes?.itemsList?.length) {
          setTickers(tRes.itemsList.map((item: any) => ({
            ...item,
            id: ensureUuid(item.id),
            messages: item.messagesList || item.messages || [],
          })));
        }
        if (cRes?.itemsList?.length) {
          setClocks(cRes.itemsList.map((item: any) => ({ ...item, id: ensureUuid(item.id) })));
        }
        if (wRes?.itemsList?.length) {
          setWebviews(wRes.itemsList.map((item: any) => ({ ...item, id: ensureUuid(item.id) })));
        }
        setAlbums(albumList);
        if (streamList?.length) setLiveStreams(streamList);
      } catch (e) {
        console.warn('Gagal memuat komponen dari backend', e);
      }
    }

    loadBackendComponents();
    return () => { isMounted = false; };
  }, []);

  if (!componentPickerZoneId) return null;

  const targetZone = layers.find((z) => z.id === componentPickerZoneId);
  if (!targetZone) return null;

  const handleClose = () => {
    setComponentPickerZoneId(null);
  };

  const handleSelectComponent = async (
    widgetType: 'webview' | 'ticker' | 'clock' | 'queue' | 'album' | 'livestream',
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
    { key: 'livestream', label: 'Siaran Langsung', icon: Radio, count: liveStreams.length },
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
          width: '94vw',
          maxWidth: '1240px',
          height: '82vh',
          minHeight: '600px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
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
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Pilih Komponen Layar
              <span style={{ color: 'var(--primary-400)', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                {targetZone.name}
              </span>
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Tambahkan widget interaktif, feed dinamis, atau daftar putar ke dalam layer terpilih.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '50%', color: 'var(--text-secondary)' }}
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={`Cari ${tabs.find((t) => t.key === activeTab)?.label.toLowerCase() || 'komponen'} berdasarkan nama atau isi...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.82rem', width: '100%' }}
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Component Tabs with Smooth Horizontal Scroll */}
        <div
          className="dashboard-tabs"
          role="group"
          aria-label="Jenis komponen"
          style={{
            margin: '12px 24px',
            background: 'var(--bg-base)',
            overflowX: 'auto',
            flexWrap: 'nowrap',
            display: 'flex',
            gap: 6,
            scrollbarWidth: 'none',
            padding: '4px',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setSearchQuery('');
                }}
                className="dashboard-tab"
                aria-pressed={isActive}
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                <Icon size={18} strokeWidth={2.2} />
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', backgroundColor: 'var(--bg-primary)' }}>
          {activeTab === 'playlist' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {filteredPlaylists.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ListMusic size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{searchQuery ? 'Tidak ada daftar putar yang cocok dengan pencarian.' : 'Belum ada daftar putar yang dibuat.'}</p>
                </div>
              ) : (
                filteredPlaylists.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectPlaylist(item.id)}
                    className="card-elevated hover-card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-400)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <ListMusic size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.description || 'Daftar putar media'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                      <span>{item.itemsList?.length || 0} media &bull; {item.totalDurationSeconds || 0}s</span>
                      <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>Pilih +</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'webview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {filteredWebviews.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Globe size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{searchQuery ? 'Tidak ada web view yang cocok.' : 'Belum ada web view.'}</p>
                </div>
              ) : (
                filteredWebviews.map((item: WebViewConfig) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectComponent('webview', item)}
                    className="card-elevated hover-card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-400)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Globe size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.url}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                      <span>Auto-refresh: {item.refreshIntervalSeconds}s</span>
                      <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>Pilih +</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'ticker' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {filteredTickers.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Type size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{searchQuery ? 'Tidak ada teks berjalan yang cocok.' : 'Belum ada teks berjalan.'}</p>
                </div>
              ) : (
                filteredTickers.map((item: TickerConfig) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectComponent('ticker', item)}
                    className="card-elevated hover-card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-400)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Type size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Badge: {item.badge || 'INFO'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 32 }}>
                      {item.messages.join(' • ')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontSize: '0.72rem', color: 'var(--primary-400)', fontWeight: 700, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                      <span>Pilih +</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'clock' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {filteredClocks.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Clock size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{searchQuery ? 'Tidak ada jam/cuaca yang cocok.' : 'Belum ada konfigurasi jam & cuaca.'}</p>
                </div>
              ) : (
                filteredClocks.map((item: ClockWeatherConfig) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectComponent('clock', item)}
                    className="card-elevated hover-card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-400)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Clock size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Kota: {item.city} &bull; Tema: {item.theme}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                      <span>Format: {item.is24Hour ? '24 Jam' : '12 Jam'}</span>
                      <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>Pilih +</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'queue' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {filteredQueues.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{searchQuery ? 'Tidak ada layar antrian yang cocok.' : 'Belum ada layar antrian.'}</p>
                </div>
              ) : (
                filteredQueues.map((item: QueueDisplayConfig) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectComponent('queue', item)}
                    className="card-elevated hover-card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-400)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Users size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Nomor Terakhir: {item.currentNumber} ({item.currentCounter})</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                      <span>Audio Chime: {item.audioChimeEnabled ? 'Aktif' : 'Mati'}</span>
                      <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>Pilih +</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'album' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {albumsError && <p role="alert" style={{ gridColumn: '1 / -1', color: 'var(--accent-rose)' }}>{albumsError}</p>}
              {!albumsError && filteredAlbums.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Images size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{searchQuery ? 'Tidak ada album foto yang cocok.' : 'Belum ada album foto.'}</p>
                </div>
              )}
              {filteredAlbums.map((item: PhotoAlbum) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectComponent('album', item)}
                  className="card-elevated hover-card"
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-400)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Images size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.photos?.length || 0} Foto &bull; Efek: {item.transitionEffect}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                    <span>Durasi: {item.slideDurationSeconds}s</span>
                    <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>Pilih +</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'livestream' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {filteredLiveStreams.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Radio size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{searchQuery ? 'Tidak ada siaran langsung yang cocok.' : 'Belum ada konfigurasi siaran langsung.'}</p>
                </div>
              ) : (
                filteredLiveStreams.map((item: LiveStreamConfig) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectComponent('livestream', item)}
                    className="card-elevated hover-card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(244, 63, 94, 0.12)', color: 'var(--accent-rose)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Radio size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.sourceType} &bull; {item.streamMode === 'SERVER_HOSTED_HLS' ? 'Server HLS Relay' : 'Direct Embed'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                      <span>{item.lowLatencyMode ? 'Low-Latency' : 'Standard'}</span>
                      <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>Pilih +</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
