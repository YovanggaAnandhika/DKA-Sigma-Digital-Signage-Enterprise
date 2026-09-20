'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Layout, Playlist, MediaItem } from '../../../lib/api';
import { ArrowLeft, Edit, RefreshCw, Film, Image as ImageIcon, Play, Pause, Layers, Clock, List, Volume2, VolumeX } from 'lucide-react';

export default function ViewLayoutPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [globalMuted, setGlobalMuted] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true);
        const [layoutData, playlistsRes, mediaRes] = await Promise.all([
          api.getLayout(params.id),
          api.getPlaylists({ limit: 100 }).catch(() => ({ data: [] })),
          api.getMedia({ limit: 100 }).catch(() => ({ data: [] })),
        ]);
        setLayout(layoutData);
        setPlaylists((playlistsRes as any).data || []);
        setMediaList((mediaRes as any).data || []);
        if (layoutData.zones?.length > 0) {
          setSelectedZoneId(layoutData.zones[0].id);
        }
      } catch (err: any) {
        alert(err.message || 'Gagal memuat layout');
        router.push('/layouts');
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, [params.id, router]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      videoRefs.current.forEach((video) => {
        if (next) video.play().catch(() => {});
        else video.pause();
      });
      return next;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setGlobalMuted((prev) => {
      const next = !prev;
      videoRefs.current.forEach((video) => {
        video.muted = next;
        video.volume = next ? 0 : 1;
      });
      return next;
    });
  }, []);

  // Helper: resolve first media item for a zone
  const resolveZoneMedia = (zone: Layout['zones'][number]) => {
    const blocks = zone.blocks || [];
    for (const block of blocks) {
      // Direct media block — use nested object OR fallback to mediaList lookup
      if (block.media_item_id) {
        const m = (block.media_item as MediaItem) || mediaList.find((m) => m.id === block.media_item_id);
        if (m) return { media: m, playlistName: null };
      }
      // Playlist block
      if (block.playlist_id) {
        const pl = (block.playlist as Playlist) ||
          playlists.find((p) => p.id === block.playlist_id);
        if (pl?.items?.length) {
          const firstItem = pl.items[0];
          const m = (pl.items[0] as any).media_item || mediaList.find((m) => m.id === firstItem.media_item_id);
          if (m) return { media: m as MediaItem, playlistName: pl.name };
        }
      }
    }
    return null;
  };

  if (loading || !layout) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data layout dari gRPC backend...</span>
      </div>
    );
  }

  const scale = 540 / layout.canvas_width;
  const previewHeight = layout.canvas_height * scale;
  const zColors = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
  const selectedZone = layout.zones?.find((z) => z.id === selectedZoneId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/layouts" className="btn btn-outline" style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {layout.name}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Resolusi: {layout.canvas_width} × {layout.canvas_height} px ({layout.orientation}) &bull; {layout.zones?.length || 0} Zona Kotak
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href={`/layouts/${layout.id}/edit`} className="btn btn-primary">
            <Edit size={14} />
            <span>Buka Canvas Designer</span>
          </Link>
        </div>
      </div>

      {/* Main Content: two-column full height layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'stretch', minHeight: 'calc(100vh - 220px)' }}>
        {/* LEFT: Canvas Preview */}
        <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Visual Canvas Preview
            </h3>
            {/* Play / Pause button */}
            <button
              onClick={togglePlayPause}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 700,
                backgroundColor: isPlaying ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                color: isPlaying ? '#ef4444' : '#22c55e',
                transition: 'all 0.2s',
              }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 700,
                backgroundColor: globalMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                color: globalMuted ? '#ef4444' : '#22c55e',
                transition: 'all 0.2s',
              }}
            >
              {globalMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {globalMuted ? 'Muted' : 'Audio On'}
            </button>
          </div>

          {/* Canvas container: fills remaining height, aspect-ratio driven */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <div
              style={{
                width: '100%',
                aspectRatio: `${layout.canvas_width} / ${layout.canvas_height}`,
                backgroundColor: '#000000',
                border: '2px solid var(--border-subtle)',
                borderRadius: '8px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              }}
            >
              {layout.zones?.map((z, idx) => {
                const color = zColors[idx % zColors.length];
                const resolved = resolveZoneMedia(z);
                const isVideo = resolved?.media.media_type === 2;
                const isSelected = z.id === selectedZoneId;
                const hasBlocks = z.blocks && z.blocks.length > 0;
                const assignedPlName = (() => {
                  for (const block of (z.blocks || [])) {
                    if (block.playlist_id) {
                      const pl = block.playlist as Playlist || playlists.find(p => p.id === block.playlist_id);
                      if (pl) return pl.name;
                    }
                  }
                  return null;
                })();

                return (
                  <div
                    key={z.id}
                    onClick={() => setSelectedZoneId(z.id)}
                    style={{
                      position: 'absolute',
                      left: `${((Number(z.x) || 0) / layout.canvas_width) * 100}%`,
                      top: `${((Number(z.y) || 0) / layout.canvas_height) * 100}%`,
                      width: `${((Number(z.width) || 200) / layout.canvas_width) * 100}%`,
                      height: `${((Number(z.height) || 200) / layout.canvas_height) * 100}%`,
                      backgroundColor: resolved ? 'transparent' : `${color}22`,
                      border: `2px solid ${isSelected ? '#fff' : color}`,
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      zIndex: z.z_index || 1,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {resolved?.media.public_url && (
                      isVideo ? (
                        <video
                          ref={(el) => {
                            if (el) videoRefs.current.set(z.id, el);
                            else videoRefs.current.delete(z.id);
                          }}
                          src={resolved.media.public_url}
                          autoPlay={isPlaying}
                          muted={globalMuted}
                          loop
                          playsInline
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                        />
                      ) : (
                        <img
                          src={resolved.media.public_url}
                          alt={resolved.media.name}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      )
                    )}

                    {/* Top-left badge */}
                    <div style={{ position: 'absolute', top: '5px', left: '5px', zIndex: 2, display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)', padding: '2px 5px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', maxWidth: '90%' }}>
                      <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {z.name}
                      </span>
                      {assignedPlName && (
                        <span style={{ fontSize: '0.5rem', color: '#fef08a', fontWeight: 600, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '4px', whiteSpace: 'nowrap' }}>
                          🎬 {assignedPlName}
                        </span>
                      )}
                    </div>

                    {/* Bottom-right dim tag */}
                    <div style={{ position: 'absolute', bottom: '5px', right: '5px', zIndex: 2, backgroundColor: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)', padding: '2px 5px', borderRadius: '4px', fontSize: '0.5rem', fontWeight: 600, color: '#93c5fd', border: '1px solid rgba(56,189,248,0.3)' }}>
                      {Number(z.width)} × {Number(z.height)} px
                    </div>

                    {/* Empty zone fallback */}
                    {!resolved && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                        <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#fff', textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                          {z.name}
                        </div>
                        <div style={{ fontSize: '0.5rem', color, marginTop: '2px', fontWeight: 600 }}>
                          {Number(z.width)} × {Number(z.height)} px
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Zones Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
          {/* Zone list */}
          <div className="card-elevated" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={15} color="var(--primary-400)" />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Daftar Zona ({layout.zones?.length || 0})
              </h3>
            </div>

            <div style={{ padding: '8px' }}>
              {(!layout.zones || layout.zones.length === 0) ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  Belum ada zona di layout ini.
                </div>
              ) : (
                layout.zones.map((z, idx) => {
                  const color = zColors[idx % zColors.length];
                  const resolved = resolveZoneMedia(z);
                  const isVideo = resolved?.media.media_type === 2;
                  const isSelected = z.id === selectedZoneId;
                  const hasBlocks = z.blocks && z.blocks.length > 0;
                  const blockCount = z.blocks?.length || 0;

                  return (
                    <div
                      key={z.id}
                      onClick={() => setSelectedZoneId(z.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: `1px solid ${isSelected ? color : 'transparent'}`,
                        backgroundColor: isSelected ? `${color}14` : 'transparent',
                        transition: 'all 0.15s',
                        marginBottom: '4px',
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{ width: '52px', height: '36px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#0f172a', border: `1px solid ${color}44`, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {resolved?.media.public_url ? (
                          isVideo ? (
                            <video src={resolved.media.public_url} muted loop playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <img src={resolved.media.public_url} alt={resolved.media.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )
                        ) : (
                          <Layers size={16} color={color} />
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {z.name}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px' }}>
                          <span>Layer #{z.z_index}</span>
                          <span style={{ color }}>{blockCount} blok</span>
                        </div>
                      </div>

                      {/* Type icon */}
                      <div style={{ flexShrink: 0 }}>
                        {isVideo ? <Film size={14} color="var(--accent-amber)" /> : resolved ? <ImageIcon size={14} color="var(--primary-400)" /> : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Zone Detail */}
          {selectedZone && (() => {
            const color = zColors[(layout.zones?.findIndex(z => z.id === selectedZone.id) || 0) % zColors.length];
            return (
              <div className="card-elevated" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px', borderTop: `3px solid ${color}` }}>
                  <List size={15} color={color} />
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedZone.name}
                  </h3>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Position & Size */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                    <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-base)', borderRadius: '6px' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Posisi (X, Y)</div>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        ({Number(selectedZone.x)}, {Number(selectedZone.y)}) px
                      </div>
                    </div>
                    <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-base)', borderRadius: '6px' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Ukuran (W × H)</div>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        {Number(selectedZone.width)} × {Number(selectedZone.height)} px
                      </div>
                    </div>
                  </div>

                  {/* Blocks / Playlists */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Blok Media ({selectedZone.blocks?.length || 0})
                    </div>
                    {(!selectedZone.blocks || selectedZone.blocks.length === 0) ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '10px', backgroundColor: 'var(--bg-base)', borderRadius: '6px', textAlign: 'center' }}>
                        Belum ada blok media
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {selectedZone.blocks.map((block, bi) => {
                          const pl = block.playlist as Playlist || playlists.find(p => p.id === block.playlist_id);
                          const directMedia = block.media_item as MediaItem || mediaList.find(m => m.id === block.media_item_id);
                          const label = pl ? pl.name : directMedia ? directMedia.name : 'Unknown';
                          const isPlDef = !block.playlist_id && !block.media_item_id;

                          return (
                            <div key={block.id} style={{ padding: '8px 10px', backgroundColor: 'var(--bg-base)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {isPlDef ? 'Rotasi Default' : label}
                                </div>
                                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                  <Clock size={9} />
                                  {block.start_time_seconds}s – {block.start_time_seconds + block.duration_seconds}s
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
