'use client';

import React from 'react';
import { Rnd } from 'react-rnd';
import { Volume2, VolumeX } from 'lucide-react';
import { useLayoutEditor } from '../../context/LayoutEditorContext';
import SynchronizedVideo from './SynchronizedVideo';
import { Layer } from '../../context/LayoutStateContext';

const Marquee = 'marquee' as any;

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
    visualFiltersList,
  } = useLayoutEditor();

  const zColors = ['#1d4ed8', '#047857', '#b45309', '#be185d', '#6d28d9', '#0f766e', '#4338ca'];
  const color = zColors[idx % zColors.length];
  const isSelected = z.id === selectedLayerId;
  const active = isLayerActive(z, playheadPosition);
  const [isHovered, setIsHovered] = React.useState(false);

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

  // Visual Filter Application
  const activeFilter = activeBlock?.visualFilterId
    ? visualFiltersList.find((f) => f.id === activeBlock.visualFilterId)
    : null;

  let filterCssString = '';
  if (activeFilter) {
    const parts = [];
    if (activeFilter.brightness !== undefined) parts.push(`brightness(${activeFilter.brightness}%)`);
    if (activeFilter.contrast !== undefined) parts.push(`contrast(${activeFilter.contrast}%)`);
    if (activeFilter.saturation !== undefined) parts.push(`saturate(${activeFilter.saturation}%)`);
    if (activeFilter.grayscale !== undefined) parts.push(`grayscale(${activeFilter.grayscale}%)`);
    if (activeFilter.blurPx !== undefined) parts.push(`blur(${activeFilter.blurPx}px)`);
    filterCssString = parts.join(' ');
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        zIndex: Number(z.zIndex) || 1,
        userSelect: 'none',
      }}
      resizeHandleStyles={{
        bottomRight: { display: isSelected ? 'block' : 'none', width: 10, height: 10, backgroundColor: '#fff', border: `2px solid ${color}`, right: -5, bottom: -5, borderRadius: '50%', zIndex: 12 },
        bottomLeft: { display: isSelected ? 'block' : 'none', width: 10, height: 10, backgroundColor: '#fff', border: `2px solid ${color}`, left: -5, bottom: -5, borderRadius: '50%', zIndex: 12 },
        topRight: { display: isSelected ? 'block' : 'none', width: 10, height: 10, backgroundColor: '#fff', border: `2px solid ${color}`, right: -5, top: -5, borderRadius: '50%', zIndex: 12 },
        topLeft: { display: isSelected ? 'block' : 'none', width: 10, height: 10, backgroundColor: '#fff', border: `2px solid ${color}`, left: -5, top: -5, borderRadius: '50%', zIndex: 12 },
        top: { display: isSelected ? 'flex' : 'none', height: 10, top: -5, cursor: 'ns-resize', zIndex: 11, alignItems: 'center', justifyContent: 'center' },
        bottom: { display: isSelected ? 'flex' : 'none', height: 10, bottom: -5, cursor: 'ns-resize', zIndex: 11, alignItems: 'center', justifyContent: 'center' },
        left: { display: isSelected ? 'flex' : 'none', width: 10, left: -5, cursor: 'ew-resize', zIndex: 11, alignItems: 'center', justifyContent: 'center' },
        right: { display: isSelected ? 'flex' : 'none', width: 10, right: -5, cursor: 'ew-resize', zIndex: 11, alignItems: 'center', justifyContent: 'center' },
      }}
      resizeHandleComponent={isSelected ? {
        top: <div style={{ width: 22, height: 4, backgroundColor: '#ffffff', border: `1px solid ${color}`, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />,
        bottom: <div style={{ width: 22, height: 4, backgroundColor: '#ffffff', border: `1px solid ${color}`, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />,
        left: <div style={{ width: 4, height: 22, backgroundColor: '#ffffff', border: `1px solid ${color}`, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />,
        right: <div style={{ width: 4, height: 22, backgroundColor: '#ffffff', border: `1px solid ${color}`, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />,
      } : undefined}
      enableResizing={isSelected ? {
        top: true, right: true, bottom: true, left: true,
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
      } : false}
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
        {/* Visual Media or Widget Rendering */}
        <div style={{ opacity: active ? 1 : 0, transition: 'opacity 0.2s', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
          {/* 1. WIDGET RENDERING */}
          {activeBlock?.widgetType ? (
            activeBlock.widgetType === 'webview' ? (
              <iframe
                src={activeBlock.widgetData?.url || 'about:blank'}
                title={activeBlock.widgetData?.name || z.name}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  filter: filterCssString,
                  pointerEvents: isPlaying ? 'auto' : 'none',
                }}
              />
            ) : activeBlock.widgetType === 'ticker' ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor:
                    activeBlock.widgetData?.theme === 'blue'
                      ? '#1e3a8a'
                      : activeBlock.widgetData?.theme === 'red'
                      ? '#991b1b'
                      : activeBlock.widgetData?.theme === 'emerald'
                      ? '#065f46'
                      : activeBlock.widgetData?.theme === 'amber'
                      ? '#92400e'
                      : '#111827',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                  padding: '0 12px',
                  gap: '12px',
                }}
              >
                {activeBlock.widgetData?.badge && (
                  <span
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {activeBlock.widgetData.badge}
                  </span>
                )}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                  <Marquee
                    scrollamount={
                      activeBlock.widgetData?.speed === 'fast'
                        ? 12
                        : activeBlock.widgetData?.speed === 'slow'
                        ? 4
                        : 7
                    }
                    style={{
                      fontSize: `${activeBlock.widgetData?.fontSize || 16}px`,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {(activeBlock.widgetData?.messages || ['DKASigma Teks Berjalan']).join('  ✦  ')}
                  </Marquee>
                </div>
              </div>
            ) : activeBlock.widgetType === 'clock' ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                }}
              >
                <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: activeBlock.widgetData?.showSeconds ? '2-digit' : undefined })}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '4px' }}>
                  {activeBlock.widgetData?.city || 'Makassar'} &bull; Cerah 31°C
                </div>
              </div>
            ) : activeBlock.widgetType === 'queue' ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  {activeBlock.widgetData?.name || 'Nomor Antrian'}
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#facc15', letterSpacing: '0.05em' }}>
                  {activeBlock.widgetData?.currentNumber || 'A-001'}
                </div>
                <div style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px', marginTop: '4px' }}>
                  {activeBlock.widgetData?.currentCounter || 'LOKET 01'}
                </div>
                {activeBlock.widgetData?.marqueeText && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '3px 8px',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      overflow: 'hidden',
                      fontSize: '0.6875rem',
                      color: '#94a3b8',
                    }}
                  >
                    <Marquee scrollamount={5}>
                      {activeBlock.widgetData.marqueeText}
                    </Marquee>
                  </div>
                )}
              </div>
            ) : activeBlock.widgetType === 'album' && (activeBlock.widgetData?.photos?.length || 0) > 0 ? (
              <img
                src={activeBlock.widgetData.photos[0].url}
                alt="Album photo"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: filterCssString,
                }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Komponen {activeBlock.widgetType}
              </div>
            )
          ) : (
            /* 2. REGULAR MEDIA RENDERING */
            activeMedia?.publicUrl && (
              activeMedia.mediaType === 2 ? (
                <div style={{ filter: filterCssString, width: '100%', height: '100%' }}>
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
                </div>
              ) : activeMedia.mediaType === 3 ? (
                <iframe
                  src={activeMedia.publicUrl || activeMedia.originalFilename}
                  title={activeMedia.name || z.name}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    filter: filterCssString,
                    pointerEvents: isPlaying ? 'auto' : 'none',
                  }}
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
                    filter: filterCssString,
                  }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )
            )
          )}
        </div>

        {/* Non-intrusive metadata rendering */}
        {(activeMedia?.publicUrl || activeBlock?.widgetType) ? (
          <>
            {/* Minimal corner tag: only visible when hovered or selected */}
            <div
              style={{
                position: 'absolute',
                top: '6px',
                left: '6px',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(4px)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                maxWidth: '85%',
                opacity: (isHovered || isSelected) ? 1 : 0,
                transform: (isHovered || isSelected) ? 'translateY(0)' : 'translateY(-2px)',
                transition: 'opacity 0.15s ease, transform 0.15s ease',
                pointerEvents: (isHovered || isSelected) ? 'auto' : 'none',
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
                  {z.blocksList[0].widgetType
                    ? `🧩 ${z.blocksList[0].widgetData?.name || z.blocksList[0].widgetType}`
                    : z.blocksList[0].mediaItemId
                    ? '🎬 Media'
                    : `🎵 ${availablePlaylists.find(p => p.id === z.blocksList[0].playlistId)?.name || 'Playlist'}`}
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
                opacity: (isHovered || isSelected) ? 1 : 0.45,
                transition: 'opacity 0.15s ease',
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
