'use client';

import React from 'react';
import { Layers, Film, Image as ImageIcon, List, Clock } from 'lucide-react';
import { Layout, Playlist, MediaItem } from '@/lib/services';

interface LayoutZoneListProps {
  layout: Layout;
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string) => void;
  resolveZoneMedia: (zone: any) => { media: MediaItem; playlistName: string | null } | null;
  zColors: string[];
  playlists: Playlist[];
  mediaList: MediaItem[];
}

export default function LayoutZoneList({
  layout,
  selectedZoneId,
  setSelectedZoneId,
  resolveZoneMedia,
  zColors,
  playlists,
  mediaList
}: LayoutZoneListProps) {
  const selectedZone = layout.zonesList?.find((z) => z.id === selectedZoneId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
      {/* Zone list */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={15} color="var(--primary-400)" />
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Daftar Zona ({layout.zonesList?.length || 0})
          </h3>
        </div>

        <div style={{ padding: '8px' }}>
          {(!layout.zonesList || layout.zonesList.length === 0) ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Belum ada zona di layout ini.
            </div>
          ) : (
            layout.zonesList.map((z, idx) => {
              const color = zColors[idx % zColors.length];
              const resolved = resolveZoneMedia(z);
              const isVideo = resolved?.media.mediaType === 2;
              const isSelected = z.id === selectedZoneId;
              const blockCount = z.blocksList?.length || 0;

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
                    {resolved?.media.publicUrl ? (
                      isVideo ? (
                        <video src={resolved.media.publicUrl} muted loop playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={resolved.media.publicUrl} alt={resolved.media.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      <span>Layer #{z.zIndex}</span>
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
        const color = zColors[(layout.zonesList?.findIndex(z => z.id === selectedZone.id) || 0) % zColors.length];
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
                  Blok Media ({selectedZone.blocksList?.length || 0})
                </div>
                {(!selectedZone.blocksList || selectedZone.blocksList.length === 0) ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '10px', backgroundColor: 'var(--bg-base)', borderRadius: '6px', textAlign: 'center' }}>
                    Belum ada blok media
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedZone.blocksList.map((block) => {
                      const pl = block.playlist as Playlist || playlists.find(p => p.id === block.playlistId);
                      const directMedia = block.mediaItem as MediaItem || mediaList.find(m => m.id === block.mediaItemId);
                      const label = pl ? pl.name : directMedia ? directMedia.name : 'Unknown';
                      const isPlDef = !block.playlistId && !block.mediaItemId;

                      return (
                        <div key={block.id} style={{ padding: '8px 10px', backgroundColor: 'var(--bg-base)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {isPlDef ? 'Rotasi Default' : label}
                            </div>
                            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Clock size={9} />
                              {block.startTimeSeconds}s – {block.startTimeSeconds + block.durationSeconds}s
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
  );
}
