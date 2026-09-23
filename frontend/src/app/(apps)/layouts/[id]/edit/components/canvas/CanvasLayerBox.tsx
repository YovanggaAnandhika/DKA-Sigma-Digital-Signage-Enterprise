'use client';

import React from 'react';
import { Rnd } from 'react-rnd';
import { Volume2, VolumeX } from 'lucide-react';
import { useLayoutEditor } from '../../context/LayoutEditorContext';
import SynchronizedVideo from './SynchronizedVideo';
import { Layer } from '../../context/LayoutStateContext';

interface CanvasLayerBoxProps {
  layer: Layer;
  idx: number;
}

export default function CanvasLayerBox({ layer: z, idx }: CanvasLayerBoxProps) {
  const {
    setLayers,
    selectedLayerId,
    setSelectedLayerId,
    scale,
    isPlaying,
    playheadPosition,
    isMuted,
    isLayerActive,
    availablePlaylists,
    mediaList,
    pxPerSecond,
    hiddenZones,
    reportBuffer,
    setSelectedBlockId,
    setInspectorTarget,
  } = useLayoutEditor();

  const zColors = ['#1d4ed8', '#047857', '#b45309', '#be185d', '#6d28d9', '#0f766e', '#4338ca'];
  const color = zColors[idx % zColors.length];
  const isSelected = z.id === selectedLayerId;
  const active = isLayerActive(z, playheadPosition);

  // Find active block
  const currentSec = playheadPosition / (pxPerSecond || 20);
  const activeBlock = (z.blocksList || []).find(b => 
    currentSec >= b.startTimeSeconds && currentSec < b.startTimeSeconds + b.durationSeconds
  );

  let activeMedia: any = null;
  let itemOffsetSec = 0;
  let currentItem: any = null;
  let absoluteStartSec = 0;

  if (activeBlock) {
    if (activeBlock.mediaItemId) {
      activeMedia = mediaList.find((m) => m.id === activeBlock.mediaItemId);
      const blockLocalSec = currentSec - activeBlock.startTimeSeconds;
      absoluteStartSec = activeBlock.startTimeSeconds;
      const d = activeMedia?.durationSeconds || 10;
      itemOffsetSec = d > 0 ? blockLocalSec % d : blockLocalSec;
    } else {
      const assignedPl = availablePlaylists.find((p) => p.id === activeBlock.playlistId);
      const items = assignedPl?.itemsList || [];

      if (items.length > 0) {
        currentItem = items[0];
        const blockLocalSec = currentSec - activeBlock.startTimeSeconds;
        const totalDur = items.reduce((sum, it) => sum + (it.durationSeconds || 10), 0);

        if (items.length > 1 && totalDur > 0) {
          const loopSec = blockLocalSec % totalDur;
          let acc = 0;
          for (const it of items) {
            const d = it.durationSeconds || 10;
            if (loopSec >= acc && loopSec < acc + d) {
              currentItem = it;
              itemOffsetSec = loopSec - acc;
              absoluteStartSec = activeBlock.startTimeSeconds + Math.floor(blockLocalSec / totalDur) * totalDur + acc;
              break;
            }
            acc += d;
          }
        } else if (items.length === 1) {
          const d = currentItem.durationSeconds || 10;
          itemOffsetSec = d > 0 ? blockLocalSec % d : blockLocalSec;
          absoluteStartSec = activeBlock.startTimeSeconds + Math.floor(blockLocalSec / d) * d;
        }
        activeMedia = mediaList.find((m) => m.id === currentItem.mediaItemId);
      }
    }
  }
  
  // Resolve mute state: check activeBlock.isMuted and overrides
  let isCurrentItemMuted = false;
  if (activeBlock) {
    const isBlockMuted = activeBlock.isMuted !== undefined
      ? !!activeBlock.isMuted
      : !!(activeBlock.itemOverridesList || []).find((o: any) => o.playlistItemId === activeBlock.id)?.isMuted;

    const itemOverride = (activeBlock.itemOverridesList || []).find(
      (o: any) => o.playlistItemId === currentItem?.id
    );
    const isItemMuted = itemOverride ? !!itemOverride.isMuted : !!(currentItem?.isMuted);

    isCurrentItemMuted = isBlockMuted || isItemMuted;
  }
  const isEffectiveMuted = isMuted || isCurrentItemMuted;
  
  let currentVolumeLevel = 100;
  if (activeBlock) {
    const itemOverride = (activeBlock.itemOverridesList || []).find(
      (o: any) => o.playlistItemId === currentItem?.id
    );
    if (itemOverride && itemOverride.volumeLevel !== undefined) {
       currentVolumeLevel = itemOverride.volumeLevel;
    } else if (currentItem?.volumeLevel !== undefined) {
       currentVolumeLevel = currentItem.volumeLevel;
    } else if (activeBlock.volumeLevel !== undefined) {
       currentVolumeLevel = activeBlock.volumeLevel;
    }
  }

  return (
    <Rnd
      bounds="parent"
      size={{ width: (Number(z.width) || 200) * scale, height: (Number(z.height) || 200) * scale }}
      position={{ x: (Number(z.x) || 0) * scale, y: (Number(z.y) || 0) * scale }}
      onDragStart={() => {
        if (selectedLayerId !== z.id) setSelectedLayerId(z.id);
        setSelectedBlockId(null);
        setInspectorTarget('layer');
      }}
      onDrag={(e, d) => {
        const nextX = Math.round(d.x / scale);
        const nextY = Math.round(d.y / scale);
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === z.id ? { ...layer, x: nextX, y: nextY } : layer
          )
        );
      }}
      onDragStop={(e, d) => {
        const nextX = Math.round(d.x / scale);
        const nextY = Math.round(d.y / scale);
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === z.id ? { ...layer, x: nextX, y: nextY } : layer
          )
        );
      }}
      onResizeStart={() => {
        if (selectedLayerId !== z.id) setSelectedLayerId(z.id);
        setSelectedBlockId(null);
        setInspectorTarget('layer');
      }}
      onMouseDown={() => {
        setSelectedLayerId(z.id);
        setSelectedBlockId(null);
        setInspectorTarget('layer');
      }}
      onResize={(e, direction, ref, delta, position) => {
        const nextW = Math.round(ref.offsetWidth / scale);
        const nextH = Math.round(ref.offsetHeight / scale);
        const nextX = Math.round(position.x / scale);
        const nextY = Math.round(position.y / scale);
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === z.id
              ? { ...layer, width: nextW, height: nextH, x: nextX, y: nextY }
              : layer
          )
        );
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const nextW = Math.round(ref.offsetWidth / scale);
        const nextH = Math.round(ref.offsetHeight / scale);
        const nextX = Math.round(position.x / scale);
        const nextY = Math.round(position.y / scale);
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === z.id
              ? { ...layer, width: nextW, height: nextH, x: nextX, y: nextY }
              : layer
          )
        );
      }}
      style={{
        border: `2px ${active ? 'solid' : 'dashed'} ${active ? (isSelected ? '#38bdf8' : color) : 'rgba(255,255,255,0.2)'}`,
        boxShadow: isSelected ? '0 0 0 1px rgba(56, 189, 248, 0.5), 0 4px 12px rgba(0,0,0,0.4)' : 'none',
        opacity: hiddenZones.includes(z.id) ? 0 : (isSelected ? 1 : active ? 1 : 0.35),
        pointerEvents: hiddenZones.includes(z.id) ? 'none' : 'auto',
        zIndex: isSelected ? 999 : z.zIndex || 1,
        userSelect: 'none',
      }}
      resizeHandleStyles={{
        bottomRight: { display: isSelected ? 'block' : 'none', width: 10, height: 10, backgroundColor: '#fff', border: `2px solid ${color}`, right: -5, bottom: -5, borderRadius: '50%' },
        bottomLeft: { display: isSelected ? 'block' : 'none', width: 10, height: 10, backgroundColor: '#fff', border: `2px solid ${color}`, left: -5, bottom: -5, borderRadius: '50%' },
        topRight: { display: isSelected ? 'block' : 'none', width: 10, height: 10, backgroundColor: '#fff', border: `2px solid ${color}`, right: -5, top: -5, borderRadius: '50%' },
        topLeft: { display: isSelected ? 'block' : 'none', width: 10, height: 10, backgroundColor: '#fff', border: `2px solid ${color}`, left: -5, top: -5, borderRadius: '50%' },
      }}
      enableResizing={{
        top: false, right: false, bottom: false, left: false,
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
      }}
      disableDragging={false}
    >
      {/* Inner container to clip media correctly while keeping handles visible outside */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Visual Media Rendering */}
        <div style={{ opacity: active ? 1 : 0, transition: 'opacity 0.2s', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
          {activeMedia?.publicUrl && (
            activeMedia.mediaType === 2 ? (
              <SynchronizedVideo
                src={activeMedia.publicUrl}
                isPlaying={isPlaying}
                active={active}
                isMuted={isEffectiveMuted}
                volumeLevel={currentVolumeLevel}
                targetTimeSec={itemOffsetSec}
                onBufferUpdate={reportBuffer}
                timelineStartSec={absoluteStartSec}
              />
            ) : (
              <img
                src={activeMedia.publicUrl}
                alt={activeMedia.name || z.name}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )
          )}
        </div>

        {/* Non-intrusive metadata rendering */}
        {activeMedia?.publicUrl ? (
          <>
            {/* Unobtrusive minimal corner tag */}
            <div
              style={{
                position: 'absolute',
                top: '6px',
                left: '6px',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(4px)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                maxWidth: '85%',
              }}
            >
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {z.name}
              </span>
              {(z.blocksList && z.blocksList.length > 0) && (
                <span
                  style={{
                    fontSize: '0.5625rem',
                    color: '#fef08a',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    borderLeft: '1px solid rgba(255,255,255,0.2)',
                    paddingLeft: '4px',
                  }}
                >
                  🎬 {z.blocksList[0].mediaItemId ? 'Media' : (availablePlaylists.find(p => p.id === z.blocksList[0].playlistId)?.name || 'Playlist')}
                </span>
              )}
              {activeMedia?.mediaType === 2 && (
                <span
                  style={{
                    fontSize: '0.5625rem',
                    color: isEffectiveMuted ? '#f87171' : '#4ade80',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    borderLeft: '1px solid rgba(255,255,255,0.2)',
                    paddingLeft: '4px',
                  }}
                  title={isEffectiveMuted ? 'Suara dibisukan (Muted)' : 'Suara aktif (Unmuted)'}
                >
                  {isEffectiveMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                </span>
              )}
            </div>

            {/* Bottom right dimension tag (only when selected) */}
            {isSelected && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  right: '6px',
                  zIndex: 2,
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(4px)',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  fontSize: '0.5625rem',
                  fontWeight: 600,
                  color: '#93c5fd',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                }}
              >
                {Math.round(z.width)}×{Math.round(z.height)}
              </div>
            )}
          </>
        ) : (
          /* Fallback centered label for empty layersList without media */
          <>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: active ? `${color}${isSelected ? '55' : '22'}` : 'rgba(15, 23, 42, 0.4)',
              }}
            />
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: active ? '#ffffff' : '#94a3b8',
                  textAlign: 'center',
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {z.name}
              </div>
              <div
                style={{
                  fontSize: '0.625rem',
                  color: isSelected ? '#93c5fd' : '#94a3b8',
                  marginTop: '2px',
                  fontWeight: 600,
                }}
              >
                {Math.round(z.width)}×{Math.round(z.height)}
              </div>
              {!active && !isSelected && (
                <span
                  style={{
                    fontSize: '0.5625rem',
                    color: '#94a3b8',
                    marginTop: '2px',
                    fontStyle: 'italic',
                  }}
                >
                  (Mati di timeline)
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </Rnd>
  );
}
