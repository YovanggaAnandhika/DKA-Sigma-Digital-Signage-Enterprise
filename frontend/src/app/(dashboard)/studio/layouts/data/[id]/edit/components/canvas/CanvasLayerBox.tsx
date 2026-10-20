'use client';

import React from 'react';
import { Rnd } from 'react-rnd';
import { useLayoutEditor } from '../../context/LayoutEditorContext';
import { Layer } from '../../context/LayoutStateContext';
import { calculateSnap } from '../../utils/snapHelper';
import { playCanvasQueueAudio } from './canvasAudio';
import ZoneWidgetRenderer from './renderers/ZoneWidgetRenderer';
import ZoneMediaRenderer from './renderers/ZoneMediaRenderer';
import ZoneLayerMetadata from './ZoneLayerMetadata';
import { invokeApi } from '@/lib/core/invokeApi';

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

  const [isCallingQueue, setIsCallingQueue] = React.useState(false);
  const callGuardRef = React.useRef<any>(null);
  const endCall = () => {
    clearTimeout(callGuardRef.current);
    setIsCallingQueue(false);
  };

  React.useEffect(() => {
    if (!isCallingQueue) return;
    callGuardRef.current = setTimeout(() => setIsCallingQueue(false), 20000);
    return () => clearTimeout(callGuardRef.current);
  }, [isCallingQueue]);

  const handleCanvasNextCall = (block: any) => {
    const qData = block?.widgetData || {};
    const currentTicket = qData.latestCalledNumber || qData.currentNumber || 'A-001';
    const numPart = parseInt(currentTicket.replace(/[^0-9]/g, ''), 10) || 0;
    const nextSeq = numPart + 1;
    const prefixMatch = currentTicket.match(/^([A-Za-z]+)/);
    const prefix = (prefixMatch ? prefixMatch[1] : (qData.prefix || 'A')).toUpperCase();
    const newFormatted = `${prefix}-${String(nextSeq).padStart(3, '0')}`;
    const counterName = (qData.countersList && qData.countersList.length > 0 ? qData.countersList[0].counterName : qData.currentCounter) || 'LOKET 01';
    const qId = qData.id || block.queueId || '76a3e570-9807-40a5-ad74-e7bb28e382dc';
    const audios = qData.audiosList || qData.audios || [];

    setIsCallingQueue(true);

    // 1. Update layers state on canvas so ticket increments immediately on canvas
    setLayers((prevLayers) => {
      return prevLayers.map((lay) => {
        if (lay.id !== z.id) return lay;
        return {
          ...lay,
          blocksList: (lay.blocksList || []).map((blk) => {
            if (blk.id !== block.id) return blk;
            const updatedData = {
              ...blk.widgetData,
              latestCalledNumber: newFormatted,
              currentNumber: newFormatted,
            };
            return {
              ...blk,
              widgetData: updatedData,
              widgetDataJson: JSON.stringify(updatedData),
            };
          }),
        };
      });
    });

    // 2. Sync to localStorage
    try {
      const stored = localStorage.getItem('dka_signage_queue_displays');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const updated = list.map((item: any) => {
            if (item.id === qId) {
              return { ...item, currentNumber: newFormatted };
            }
            return item;
          });
          localStorage.setItem('dka_signage_queue_displays', JSON.stringify(updated));
        }
      }
    } catch (_) {}

    // 3. Play audio chime + Indonesian TTS
    playCanvasQueueAudio(audios, newFormatted, counterName, false, endCall);

    // 4. Broadcast via SSE to Android Player & all connected screens
    try {
      invokeApi('/api/stream/device', {
        deviceId: 'all',
        type: 'CALL_QUEUE',
        queueId: qId,
        queueName: qData.name || 'Layar Antrian',
        ticketNumber: newFormatted,
        counterName,
        source: 'layout_canvas_editor',
        callType: 'next',
      }).catch(() => {});
    } catch (_) {}
  };

  const handleCanvasRepeatCall = (block: any) => {
    const qData = block?.widgetData || {};
    const currentTicket = qData.latestCalledNumber || qData.currentNumber || 'A-001';
    const counterName = (qData.countersList && qData.countersList.length > 0 ? qData.countersList[0].counterName : qData.currentCounter) || 'LOKET 01';
    const qId = qData.id || block.queueId || '76a3e570-9807-40a5-ad74-e7bb28e382dc';
    const audios = qData.audiosList || qData.audios || [];

    setIsCallingQueue(true);

    // 1. Play audio chime + Indonesian TTS with isRecall = true ("Panggilan ulang, nomor antrian...")
    playCanvasQueueAudio(audios, currentTicket, counterName, true, endCall);

    // 2. Broadcast via SSE to Android Player & all connected screens
    try {
      invokeApi('/api/stream/device', {
        deviceId: 'all',
        type: 'CALL_QUEUE',
        queueId: qId,
        queueName: qData.name || 'Layar Antrian',
        ticketNumber: currentTicket,
        counterName,
        source: 'layout_canvas_editor',
        callType: 'recall',
      }).catch(() => {});
    } catch (_) {}
  };

  // Find active block
  const currentSec = playheadPosition / (pxPerSecond || 20);
  const activeBlock = (z.blocksList || []).find((b) =>
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
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true,
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
          {activeBlock?.widgetType ? (
            <ZoneWidgetRenderer
              activeBlock={activeBlock}
              layer={z}
              scale={scale}
              isPlaying={isPlaying}
              isSelected={isSelected}
              filterCssString={filterCssString}
              isCallingQueue={isCallingQueue}
              onNextCall={handleCanvasNextCall}
              onRepeatCall={handleCanvasRepeatCall}
            />
          ) : (
            <ZoneMediaRenderer
              activeMedia={activeMedia}
              layer={z}
              isPlaying={isPlaying}
              active={active}
              isEffectiveMuted={isEffectiveMuted}
              currentVolumeLevel={currentVolumeLevel}
              itemOffsetSec={itemOffsetSec}
              absoluteStartSec={absoluteStartSec}
              reportBuffer={reportBuffer}
              filterCssString={filterCssString}
            />
          )}
        </div>

        {/* Non-intrusive metadata rendering */}
        <ZoneLayerMetadata
          layer={z}
          active={active}
          isSelected={isSelected}
          isHovered={isHovered}
          color={color}
          availablePlaylists={availablePlaylists}
          activeMedia={activeMedia}
          activeBlock={activeBlock}
          isEffectiveMuted={isEffectiveMuted}
        />
      </div>
    </Rnd>
  );
}
