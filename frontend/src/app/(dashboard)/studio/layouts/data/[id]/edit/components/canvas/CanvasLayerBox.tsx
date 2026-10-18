'use client';

import React from 'react';
import { Rnd } from 'react-rnd';
import { Volume2, VolumeX, Lock } from 'lucide-react';
import { useLayoutEditor } from '../../context/LayoutEditorContext';
import SynchronizedVideo from './SynchronizedVideo';
import { Layer } from '../../context/LayoutStateContext';
import { calculateSnap } from '../../utils/snapHelper';
import { injectQueueVariables, createDefaultQueueLayoutItems } from '@/app/(dashboard)/studio/components/ticket/types';

const Marquee = 'marquee' as any;

interface CanvasLayerBoxProps {
  layer: Layer;
  idx: number;
  onContextMenu?: (e: React.MouseEvent, layerId: string) => void;
}

export default function CanvasLayerBox({ layer: z, idx, onContextMenu }: CanvasLayerBoxProps) {
  const {
    layout,
    layers,
    setLayers,
    selectedLayerId,
    setSelectedLayerId,
    scale,
    setSnapGuides,
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
        const rawX = Math.round(d.x / scale);
        const rawY = Math.round(d.y / scale);
        const w = Number(z.width) || 200;
        const h = Number(z.height) || 200;

        const otherLayers = layers.map((l) => ({
          id: l.id,
          x: Number(l.x) || 0,
          y: Number(l.y) || 0,
          width: Number(l.width) || 200,
          height: Number(l.height) || 200,
        }));

        const snapped = calculateSnap({
          currentId: z.id,
          x: rawX,
          y: rawY,
          width: w,
          height: h,
          canvasWidth: layout?.canvasWidth || 1920,
          canvasHeight: layout?.canvasHeight || 1080,
          otherLayers,
          threshold: Math.max(6, Math.round(8 / (scale || 1))),
        });

        setSnapGuides({ x: snapped.guideX, y: snapped.guideY });

        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === z.id ? { ...layer, x: snapped.x, y: snapped.y } : layer
          )
        );
      }}
      onDragStop={(e, d) => {
        setSnapGuides({ x: null, y: null });
        const rawX = Math.round(d.x / scale);
        const rawY = Math.round(d.y / scale);
        const w = Number(z.width) || 200;
        const h = Number(z.height) || 200;

        const otherLayers = layers.map((l) => ({
          id: l.id,
          x: Number(l.x) || 0,
          y: Number(l.y) || 0,
          width: Number(l.width) || 200,
          height: Number(l.height) || 200,
        }));

        const snapped = calculateSnap({
          currentId: z.id,
          x: rawX,
          y: rawY,
          width: w,
          height: h,
          canvasWidth: layout?.canvasWidth || 1920,
          canvasHeight: layout?.canvasHeight || 1080,
          otherLayers,
          threshold: Math.max(6, Math.round(8 / (scale || 1))),
        });

        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === z.id ? { ...layer, x: snapped.x, y: snapped.y } : layer
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
        const rawX = Math.round(position.x / scale);
        const rawY = Math.round(position.y / scale);

        const otherLayers = layers.map((l) => ({
          id: l.id,
          x: Number(l.x) || 0,
          y: Number(l.y) || 0,
          width: Number(l.width) || 200,
          height: Number(l.height) || 200,
        }));

        const snapped = calculateSnap({
          currentId: z.id,
          x: rawX,
          y: rawY,
          width: nextW,
          height: nextH,
          canvasWidth: layout?.canvasWidth || 1920,
          canvasHeight: layout?.canvasHeight || 1080,
          otherLayers,
          threshold: Math.max(6, Math.round(8 / (scale || 1))),
        });

        setSnapGuides({ x: snapped.guideX, y: snapped.guideY });

        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === z.id
              ? { ...layer, width: nextW, height: nextH, x: snapped.x, y: snapped.y }
              : layer
          )
        );
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        setSnapGuides({ x: null, y: null });
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
      onContextMenu={(e: any) => {
        if (onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, z.id);
        }
      }}
      style={{
        border: `2px ${z.isLocked ? 'dotted' : active ? 'solid' : 'dashed'} ${z.isLocked ? '#f59e0b' : active ? (isSelected ? '#38bdf8' : color) : 'rgba(255,255,255,0.2)'}`,
        boxShadow: isSelected ? '0 0 0 1px rgba(56, 189, 248, 0.5), 0 4px 12px rgba(0,0,0,0.4)' : 'none',
        opacity: hiddenZones.includes(z.id) ? 0 : (isSelected ? 1 : active ? 1 : 0.35),
        pointerEvents: hiddenZones.includes(z.id) ? 'none' : 'auto',
        zIndex: Number(z.zIndex) || 1,
        userSelect: 'none',
      }}
      resizeHandleStyles={{
        bottomRight: { display: isSelected && !z.isLocked ? 'block' : 'none', width: 10, height: 10, backgroundColor: '#fff', border: `2px solid ${color}`, right: -5, bottom: -5, borderRadius: '50%', zIndex: 12 },
        bottomLeft: { display: isSelected && !z.isLocked ? 'block' : 'none', width: 10, height: 10, backgroundColor: '#fff', border: `2px solid ${color}`, left: -5, bottom: -5, borderRadius: '50%', zIndex: 12 },
        topRight: { display: isSelected && !z.isLocked ? 'block' : 'none', width: 10, height: 10, backgroundColor: '#fff', border: `2px solid ${color}`, right: -5, top: -5, borderRadius: '50%', zIndex: 12 },
        topLeft: { display: isSelected && !z.isLocked ? 'block' : 'none', width: 10, height: 10, backgroundColor: '#fff', border: `2px solid ${color}`, left: -5, top: -5, borderRadius: '50%', zIndex: 12 },
        top: { display: isSelected && !z.isLocked ? 'flex' : 'none', height: 10, top: -5, cursor: 'ns-resize', zIndex: 11, alignItems: 'center', justifyContent: 'center' },
        bottom: { display: isSelected && !z.isLocked ? 'flex' : 'none', height: 10, bottom: -5, cursor: 'ns-resize', zIndex: 11, alignItems: 'center', justifyContent: 'center' },
        left: { display: isSelected && !z.isLocked ? 'flex' : 'none', width: 10, left: -5, cursor: 'ew-resize', zIndex: 11, alignItems: 'center', justifyContent: 'center' },
        right: { display: isSelected && !z.isLocked ? 'flex' : 'none', width: 10, right: -5, cursor: 'ew-resize', zIndex: 11, alignItems: 'center', justifyContent: 'center' },
      }}
      resizeHandleComponent={isSelected && !z.isLocked ? {
        top: <div style={{ width: 22, height: 4, backgroundColor: '#ffffff', border: `1px solid ${color}`, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />,
        bottom: <div style={{ width: 22, height: 4, backgroundColor: '#ffffff', border: `1px solid ${color}`, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />,
        left: <div style={{ width: 4, height: 22, backgroundColor: '#ffffff', border: `1px solid ${color}`, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />,
        right: <div style={{ width: 4, height: 22, backgroundColor: '#ffffff', border: `1px solid ${color}`, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />,
      } : undefined}
      enableResizing={isSelected && !z.isLocked ? {
        top: true, right: true, bottom: true, left: true,
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
      } : false}
      disableDragging={!!z.isLocked}
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
                    activeBlock.widgetData?.backgroundColor ||
                    (activeBlock.widgetData?.theme === 'blue'
                      ? '#1e3a8a'
                      : activeBlock.widgetData?.theme === 'red'
                      ? '#991b1b'
                      : activeBlock.widgetData?.theme === 'emerald'
                      ? '#065f46'
                      : activeBlock.widgetData?.theme === 'amber'
                      ? '#92400e'
                      : '#111827'),
                  color: activeBlock.widgetData?.textColor || '#ffffff',
                  borderRadius: activeBlock.widgetData?.borderRadius ? `${activeBlock.widgetData.borderRadius}px` : undefined,
                  border: activeBlock.widgetData?.borderColor ? `1px solid ${activeBlock.widgetData.borderColor}` : undefined,
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
                      backgroundColor: activeBlock.widgetData?.badgeBackgroundColor || 'rgba(255,255,255,0.2)',
                      color: activeBlock.widgetData?.badgeTextColor || '#ffffff',
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
                    {(activeBlock.widgetData?.messagesList || activeBlock.widgetData?.messages || ['DKASigma Teks Berjalan']).join('  ✦  ')}
                  </Marquee>
                </div>
              </div>
            ) : activeBlock.widgetType === 'clock' ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: activeBlock.widgetData?.backgroundColor || 'var(--bg-surface-elevated)',
                  color: activeBlock.widgetData?.textColor || 'var(--text-primary)',
                  borderRadius: activeBlock.widgetData?.borderRadius ? `${activeBlock.widgetData.borderRadius}px` : undefined,
                  border: activeBlock.widgetData?.borderColor ? `1px solid ${activeBlock.widgetData.borderColor}` : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                }}
              >
                <div style={{
                  fontSize: activeBlock.widgetData?.timeFontSize ? `calc(${activeBlock.widgetData.timeFontSize}px * 0.7)` : '1.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  fontFamily: 'inherit',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                }}>
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: activeBlock.widgetData?.showSeconds ? '2-digit' : undefined })}
                </div>
                <div style={{
                  fontSize: activeBlock.widgetData?.dateFontSize ? `${activeBlock.widgetData.dateFontSize}px` : '0.75rem',
                  color: activeBlock.widgetData?.subtitleColor || 'var(--text-muted)',
                  marginTop: '4px'
                }}>
                  {activeBlock.widgetData?.city || 'Makassar'} &bull; Cerah 31°C
                </div>
              </div>
            ) : activeBlock.widgetType === 'queue' ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: activeBlock.widgetData?.backgroundColor || 'var(--bg-surface)',
                  backgroundImage: activeBlock.widgetData?.backgroundImageUrl ? `url(${activeBlock.widgetData.backgroundImageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  overflow: 'hidden',
                  containerType: 'size',
                }}
              >
                {(() => {
                  const qData = activeBlock.widgetData || {};
                  const canvasW = qData.canvasWidth || 1920;
                  const canvasH = qData.canvasHeight || 1080;
                  const rawItems = (qData.itemsList && qData.itemsList.length > 0)
                    ? qData.itemsList
                    : (qData.items && qData.items.length > 0)
                    ? qData.items
                    : createDefaultQueueLayoutItems(qData.themePreset || 'clean-light');

                  return rawItems
                    .filter((it: any) => it.isVisible !== false)
                    .sort((a: any, b: any) => (a.zIndex || 1) - (b.zIndex || 1))
                    .map((item: any) => {
                      const interpolated = injectQueueVariables(item.templateContent || '', {
                        queueNumber: qData.latestCalledNumber || qData.currentNumber || 'A-001',
                        queueCounter: (qData.countersList && qData.countersList.length > 0 ? qData.countersList[0].counterName : qData.currentCounter) || 'LOKET 01',
                        queuePrefix: qData.prefix || 'A',
                        queueName: qData.name || 'Layar Antrian',
                      });

                      const leftPct = (item.x / canvasW) * 100;
                      const topPct = (item.y / canvasH) * 100;
                      const widthPct = (item.width / canvasW) * 100;
                      const heightPct = (item.height / canvasH) * 100;
                      const fontSizeCqw = `calc(${item.fontSize || 24} / ${canvasW} * 100cqw)`;
                      const borderRadiusCqw = item.config?.borderRadius
                        ? `calc(${item.config.borderRadius} / ${canvasW} * 100cqw)`
                        : undefined;

                      const hasBg = item.backgroundColor && item.backgroundColor !== 'transparent';

                      if (item.itemType === 'marquee') {
                        return (
                          <div
                            key={item.id}
                            style={{
                              position: 'absolute',
                              left: `${leftPct}%`,
                              top: `${topPct}%`,
                              width: `${widthPct}%`,
                              height: `${heightPct}%`,
                              backgroundColor: hasBg ? item.backgroundColor : 'transparent',
                              borderRadius: borderRadiusCqw,
                              border: hasBg && item.config?.borderWidth
                                ? `${item.config.borderWidth}px solid ${item.config.borderColor || 'rgba(0,0,0,0.1)'}`
                                : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 calc(12 / 1920 * 100cqw)',
                              overflow: 'hidden',
                              zIndex: item.zIndex || 1,
                            }}
                          >
                            <Marquee
                              behavior="scroll"
                              direction={item.config?.direction || 'left'}
                              scrollamount={item.config?.speed === 'fast' ? 12 : item.config?.speed === 'slow' ? 4 : 8}
                              style={{
                                width: '100%',
                                color: item.textColor || '#ffffff',
                                fontSize: fontSizeCqw,
                                fontWeight: item.fontWeight || 'bold',
                              }}
                            >
                              {interpolated}
                            </Marquee>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={item.id}
                          style={{
                            position: 'absolute',
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            width: `${widthPct}%`,
                            height: `${heightPct}%`,
                            backgroundColor: hasBg ? item.backgroundColor : 'transparent',
                            color: item.textColor || '#ffffff',
                            borderRadius: borderRadiusCqw,
                            border: hasBg && item.config?.borderWidth
                              ? `${item.config.borderWidth}px solid ${item.config.borderColor || 'rgba(0,0,0,0.1)'}`
                              : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent:
                              item.textAlign === 'center'
                                ? 'center'
                                : item.textAlign === 'right'
                                ? 'flex-end'
                                : 'flex-start',
                            padding: hasBg ? '0 calc(12 / 1920 * 100cqw)' : 0,
                            overflow: 'hidden',
                            zIndex: item.zIndex || 1,
                            userSelect: 'none',
                          }}
                        >
                          <span
                            style={{
                              fontSize: fontSizeCqw,
                              fontWeight: item.fontWeight || 'bold',
                              textAlign: item.textAlign || 'center',
                              width: '100%',
                              lineHeight: 1.1,
                              letterSpacing: item.itemType === 'ticket_number' ? '0.02em' : 'normal',
                            }}
                          >
                            {interpolated}
                          </span>
                        </div>
                      );
                    });
                })()}
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
                backgroundColor: 'var(--bg-surface-elevated)',
                backdropFilter: 'blur(4px)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
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
                  color: 'var(--text-primary)',
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
                    color: 'var(--accent-amber)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    borderLeft: '1px solid var(--border-subtle)',
                    paddingLeft: '4px',
                  }}
                >
                  {z.blocksList[0].widgetType
                    ? (z.blocksList[0].widgetData?.name || z.blocksList[0].widgetType)
                    : z.blocksList[0].mediaItemId
                    ? 'Media'
                    : (availablePlaylists.find(p => p.id === z.blocksList[0].playlistId)?.name || 'Playlist')}
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
                    borderLeft: '1px solid var(--border-subtle)',
                    paddingLeft: '4px',
                  }}
                  title={isEffectiveMuted ? 'Audio dibisukan' : 'Audio aktif'}
                >
                  {isEffectiveMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                </span>
              )}
              {z.isLocked && (
                <span
                  style={{
                    fontSize: '0.5625rem',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    borderLeft: '1px solid var(--border-subtle)',
                    paddingLeft: '4px',
                  }}
                  title="Layer terkunci"
                >
                  <Lock size={10} />
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
                  backgroundColor: 'var(--bg-surface-elevated)',
                  backdropFilter: 'blur(4px)',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  fontSize: '0.5625rem',
                  fontWeight: 600,
                  color: 'var(--primary-500)',
                  border: '1px solid var(--border-subtle)',
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
                backgroundColor: active ? `${color}${isSelected ? '55' : '22'}` : 'var(--bg-surface-elevated)',
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
