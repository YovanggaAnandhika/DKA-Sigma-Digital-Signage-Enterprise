'use client';

import React from 'react';
import { Rnd } from 'react-rnd';
import { Film, Image as ImageIcon, Volume2, VolumeX } from 'lucide-react';
import { updatePlaylistBlock } from '@/lib/services/studio/layout.service';
import { ZonePlaylist } from '@/lib/services/studio/types';
import { useLayoutState, Zone } from '../../context/LayoutStateContext';
import { useLayoutPlayback } from '../../context/LayoutPlaybackContext';
import { useLayoutUI } from '../../context/LayoutUIContext';

interface TimelineTrackBlockProps {
  zone: Zone;
  block: ZonePlaylist;
  color: string;
}

export default function TimelineTrackBlock({ zone, block, color }: TimelineTrackBlockProps) {
  const { setZones } = useLayoutState();
  const { pxPerSecond } = useLayoutPlayback();
  const { availablePlaylists, mediaList, showToast } = useLayoutUI();

  const isMediaBlock = !block.playlistId && !!block.mediaItemId;
  const media = isMediaBlock ? mediaList.find((m) => m.id === block.mediaItemId) : null;
  const playlist = !isMediaBlock ? availablePlaylists.find((p) => p.id === block.playlistId) : null;

  const title = isMediaBlock ? media?.name || 'Media Single' : playlist?.name || 'Playlist Block';

  const leftPx = (block.startTimeSeconds || 0) * (pxPerSecond || 20);
  const widthPx = (block.durationSeconds || 10) * (pxPerSecond || 20);

  const isBlockMuted = block.isMuted !== undefined
    ? !!block.isMuted
    : !!block.itemOverridesList?.find((o) => o.playlistItemId === block.id)?.isMuted;

  const handleToggleBlockMute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isBlockMuted;
    try {
      await updatePlaylistBlock(block.id, { isMuted: nextMuted });
      setZones((prev) =>
        prev.map((z) => ({
          ...z,
          blocksList: z.blocksList.map((b) => {
            if (b.id === block.id) {
              const existingOverrideIdx = (b.itemOverridesList || []).findIndex((o) => o.playlistItemId === b.id);
              const newOverrides = [...(b.itemOverridesList || [])];
              if (existingOverrideIdx >= 0) {
                newOverrides[existingOverrideIdx] = { ...newOverrides[existingOverrideIdx], isMuted: nextMuted };
              } else {
                newOverrides.push({
                  id: `override-${b.id}`,
                  zonePlaylistId: b.id,
                  playlistItemId: b.id,
                  isMuted: nextMuted,
                });
              }
              return { ...b, isMuted: nextMuted, itemOverridesList: newOverrides };
            }
            return b;
          }),
        }))
      );
      showToast('Audio status updated');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah audio status', 'error');
    }
  };

  return (
    <Rnd
      size={{ width: widthPx, height: 40 }}
      position={{ x: leftPx, y: 4 }}
      bounds="parent"
      dragAxis="x"
      enableResizing={{ right: true }}
      grid={[10, 1]}
      onDragStop={(_, d) => {
        const newStartSec = Math.max(0, Math.round(d.x / (pxPerSecond || 20)));
        setZones((prev) =>
          prev.map((z) => {
            if (z.id === zone.id) {
              return {
                ...z,
                blocksList: z.blocksList.map((b) => (b.id === block.id ? { ...b, startTimeSeconds: newStartSec } : b)),
              };
            }
            return z;
          })
        );
      }}
      onResizeStop={(_, __, ref, ___, position) => {
        const newDurSec = Math.max(1, Math.round(ref.offsetWidth / (pxPerSecond || 20)));
        const newStartSec = Math.max(0, Math.round(position.x / (pxPerSecond || 20)));
        setZones((prev) =>
          prev.map((z) => {
            if (z.id === zone.id) {
              return {
                ...z,
                blocksList: z.blocksList.map((b) =>
                  b.id === block.id ? { ...b, startTimeSeconds: newStartSec, durationSeconds: newDurSec } : b
                ),
              };
            }
            return z;
          })
        );
      }}
      style={{
        backgroundColor: color,
        borderRadius: '6px',
        color: '#ffffff',
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        padding: '4px 8px',
        fontSize: '0.75rem',
        fontWeight: 700,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
          {isMediaBlock ? <Film size={12} /> : <ImageIcon size={12} />}
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
          <button
            onClick={handleToggleBlockMute}
            style={{
              background: 'none',
              border: 'none',
              color: isBlockMuted ? '#f43f5e' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              marginLeft: '2px',
              borderRadius: '4px',
              backgroundColor: 'rgba(0,0,0,0.2)',
            }}
            title={isBlockMuted ? 'Unmute Block' : 'Mute Block'}
          >
            {isBlockMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
          </button>
        </div>
        <span style={{ fontSize: '0.625rem', opacity: 0.9, fontFamily: 'monospace' }}>
          {block.durationSeconds}s
        </span>
      </div>
    </Rnd>
  );
}
