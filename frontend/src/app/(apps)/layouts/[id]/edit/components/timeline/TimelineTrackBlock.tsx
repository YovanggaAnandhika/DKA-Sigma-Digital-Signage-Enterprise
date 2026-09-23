'use client';

import React from 'react';
import { Rnd } from 'react-rnd';
import { Film, Image as ImageIcon, Volume2, VolumeX, Sparkles, Blend } from 'lucide-react';
import { updatePlaylistBlock } from '@/lib/services/studio/layout.service';
import { LayerPlaylist } from '@/lib/services/studio/types';
import { useLayoutState, Layer } from '../../context/LayoutStateContext';
import { useLayoutPlayback } from '../../context/LayoutPlaybackContext';
import { useLayoutUI } from '../../context/LayoutUIContext';

interface TimelineTrackBlockProps {
  layer: Layer;
  block: LayerPlaylist;
  color: string;
}

export default function TimelineTrackBlock({ layer, block, color }: TimelineTrackBlockProps) {
  const { setLayers, setSelectedLayerId } = useLayoutState();
  const { pxPerSecond } = useLayoutPlayback();
  const { availablePlaylists, mediaList, transitionsList, visualFiltersList, showToast, selectedBlockId, setSelectedBlockId, setInspectorTarget, setIsInspectorCollapsed } = useLayoutUI();

  const isSelected = selectedBlockId === block.id;

  const isMediaBlock = !block.playlistId && !!block.mediaItemId;
  const media = isMediaBlock ? mediaList.find((m) => m.id === block.mediaItemId) : null;
  const playlist = !isMediaBlock ? availablePlaylists.find((p) => p.id === block.playlistId) : null;

  const title = isMediaBlock ? media?.name || 'Media Single' : playlist?.name || 'Playlist Block';

  const leftPx = (block.startTimeSeconds || 0) * (pxPerSecond || 20);
  const widthPx = (block.durationSeconds || 10) * (pxPerSecond || 20);

  const hasTransition = !!block.transitionId && transitionsList.some(t => t.id === block.transitionId);
  const hasFilter = !!block.visualFilterId && visualFiltersList.some(f => f.id === block.visualFilterId);

  const isBlockMuted = block.isMuted !== undefined
    ? !!block.isMuted
    : !!block.itemOverridesList?.find((o) => o.playlistItemId === block.id)?.isMuted;

  const handleToggleBlockMute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isBlockMuted;
    try {
      if (!block.id.startsWith('temp-')) {
        await updatePlaylistBlock(block.id, { isMuted: nextMuted });
      }
      setLayers((prev) =>
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
                  layerPlaylistId: b.id,
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
      size={{ width: widthPx, height: 26 }}
      position={{ x: leftPx, y: 3 }}
      bounds="parent"
      dragAxis="x"
      enableResizing={{ right: true }}
      grid={[10, 1]}
      onDragStop={(_, d) => {
        const newStartSec = Math.max(0, Math.round(d.x / (pxPerSecond || 20)));
        setLayers((prev) =>
          prev.map((z) => {
            if (z.id === layer.id) {
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
        setLayers((prev) =>
          prev.map((z) => {
            if (z.id === layer.id) {
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
        borderRadius: '5px',
        color: '#ffffff',
        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        padding: '2px 7px',
        fontSize: '0.6875rem',
        fontWeight: 600,
        border: `1px solid rgba(255, 255, 255, 0.25)`,
        boxShadow: isSelected ? '0 0 0 2px #fff, 0 0 0 4px var(--primary-500)' : '0 2px 5px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        zIndex: isSelected ? 25 : 10,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedLayerId(layer.id);
        setSelectedBlockId(block.id);
        setInspectorTarget('block');
        setIsInspectorCollapsed(false);
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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {hasTransition && <Blend size={10} color="#60a5fa" title="Transisi Aktif" />}
          {hasFilter && <Sparkles size={10} color="#f472b6" title="Filter Aktif" />}
          <span style={{ fontSize: '0.625rem', opacity: 0.9, fontFamily: 'monospace' }}>
            {block.durationSeconds}s
          </span>
        </div>
      </div>
    </Rnd>
  );
}
