'use client';

import React from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Layout, Playlist, MediaItem } from '@/lib/services';

interface LayoutLivePreviewProps {
  layout: Layout;
  isPlaying: boolean;
  togglePlayPause: () => void;
  globalMuted: boolean;
  toggleMute: () => void;
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string) => void;
  resolveZoneMedia: (zone: any) => { media: MediaItem; playlistName: string | null } | null;
  videoRefs: React.MutableRefObject<Map<string, HTMLVideoElement>>;
  zColors: string[];
  playlists: Playlist[];
}

export default function LayoutLivePreview({
  layout,
  isPlaying,
  togglePlayPause,
  globalMuted,
  toggleMute,
  selectedZoneId,
  setSelectedZoneId,
  resolveZoneMedia,
  videoRefs,
  zColors,
  playlists
}: LayoutLivePreviewProps) {
  return (
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

      {/* Canvas container */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div
          style={{
            width: '100%',
            aspectRatio: `${layout.canvasWidth} / ${layout.canvasHeight}`,
            backgroundColor: '#000000',
            border: '2px solid var(--border-subtle)',
            borderRadius: '8px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          {layout.zonesList?.map((z, idx) => {
            const color = zColors[idx % zColors.length];
            const resolved = resolveZoneMedia(z);
            const isVideo = resolved?.media.mediaType === 2;
            const isSelected = z.id === selectedZoneId;
            const assignedPlName = (() => {
              for (const block of (z.blocksList || [])) {
                if (block.playlistId) {
                  const pl = block.playlist as Playlist || playlists.find(p => p.id === block.playlistId);
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
                  left: `${((Number(z.x) || 0) / layout.canvasWidth) * 100}%`,
                  top: `${((Number(z.y) || 0) / layout.canvasHeight) * 100}%`,
                  width: `${((Number(z.width) || 200) / layout.canvasWidth) * 100}%`,
                  height: `${((Number(z.height) || 200) / layout.canvasHeight) * 100}%`,
                  backgroundColor: resolved ? 'transparent' : `${color}22`,
                  border: `2px solid ${isSelected ? '#fff' : color}`,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  zIndex: z.zIndex || 1,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                {resolved?.media.publicUrl && (
                  isVideo ? (
                    <video
                      ref={(el) => {
                        if (el) videoRefs.current.set(z.id, el);
                        else videoRefs.current.delete(z.id);
                      }}
                      src={resolved.media.publicUrl}
                      autoPlay={isPlaying}
                      muted={globalMuted}
                      loop
                      playsInline
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                    />
                  ) : (
                    <img
                      src={resolved.media.publicUrl}
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
  );
}
