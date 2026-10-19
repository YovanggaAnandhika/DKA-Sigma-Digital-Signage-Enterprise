'use client';

import React from 'react';
import { Rnd } from 'react-rnd';
import { Volume2, VolumeX, Lock, RotateCcw, Bell } from 'lucide-react';
import { useLayoutEditor } from '../../context/LayoutEditorContext';
import SynchronizedVideo from './SynchronizedVideo';
import { Layer } from '../../context/LayoutStateContext';
import { calculateSnap } from '../../utils/snapHelper';
import { injectQueueVariables, createDefaultQueueLayoutItems, speakQueueAnnouncement, stopQueueAnnouncement } from '@/app/(dashboard)/studio/components/ticket/types';

const Marquee = 'marquee' as any;

let activeCanvasAudio: HTMLAudioElement | null = null;
let activeCanvasAudioTimer: any = null;

function playCanvasQueueAudio(
  audios: any[],
  ticketNumber: string,
  counterName: string,
  isRecall: boolean = false,
  onFinished?: () => void
) {
  if (activeCanvasAudio) {
    try {
      activeCanvasAudio.pause();
      activeCanvasAudio.currentTime = 0;
    } catch (_) {}
    activeCanvasAudio = null;
  }
  if (activeCanvasAudioTimer) {
    clearTimeout(activeCanvasAudioTimer);
    activeCanvasAudioTimer = null;
  }
  stopQueueAnnouncement();

  const triggerTTS = () => {
    speakQueueAnnouncement(ticketNumber, counterName, isRecall, onFinished);
  };

  const playSynthChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.8);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(587.33, ctx.currentTime + 0.4);
      gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 1.4);
    } catch (_) {}
  };

  const activeConf = (audios || []).find((a: any) => a.isActive !== false && (a.fileUrl || a.mediaItemId));
  const audioUrl = activeConf?.fileUrl || (activeConf?.mediaItemId ? `/api/assets/${activeConf.mediaItemId}` : null);

  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      activeCanvasAudio = audio;
      const vol = (activeConf?.volumePercent ?? 100) / 100;
      audio.volume = Math.max(0, Math.min(1, vol));

      audio.onended = () => {
        if (activeCanvasAudio === audio) activeCanvasAudio = null;
        triggerTTS();
      };
      audio.onerror = () => {
        if (activeCanvasAudio === audio) activeCanvasAudio = null;
        playSynthChime();
        activeCanvasAudioTimer = setTimeout(triggerTTS, 1100);
      };

      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {
          playSynthChime();
          activeCanvasAudioTimer = setTimeout(triggerTTS, 1100);
        });
      }
      return;
    } catch (_) {}
  }

  playSynthChime();
  activeCanvasAudioTimer = setTimeout(triggerTTS, 1100);
}

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
  // Invert lasts until chime + TTS finish (like Android stopCallEffect); 20s guard in case onEnd never fires
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
      fetch('/api/stream/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'all',
          type: 'CALL_QUEUE',
          queueId: qId,
          queueName: qData.name || 'Layar Antrian',
          ticketNumber: newFormatted,
          counterName,
          source: 'layout_canvas_editor',
          callType: 'next',
        }),
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
      fetch('/api/stream/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'all',
          type: 'CALL_QUEUE',
          queueId: qId,
          queueName: qData.name || 'Layar Antrian',
          ticketNumber: currentTicket,
          counterName,
          source: 'layout_canvas_editor',
          callType: 'recall',
        }),
      }).catch(() => {});
    } catch (_) {}
  };

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
                  borderRadius: activeBlock.widgetData?.borderRadius ? `${Math.round(activeBlock.widgetData.borderRadius * scale)}px` : undefined,
                  border: activeBlock.widgetData?.borderColor ? `${Math.max(1, Math.round(scale))}px solid ${activeBlock.widgetData.borderColor}` : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                  padding: `0 ${Math.max(3, Math.round(12 * scale))}px`,
                  gap: `${Math.max(3, Math.round(12 * scale))}px`,
                }}
              >
                {activeBlock.widgetData?.badge && (
                  <span
                    style={{
                      backgroundColor: activeBlock.widgetData?.badgeBackgroundColor || 'rgba(255,255,255,0.2)',
                      color: activeBlock.widgetData?.badgeTextColor || '#ffffff',
                      padding: `${Math.max(1, Math.round(2 * scale))}px ${Math.max(3, Math.round(8 * scale))}px`,
                      borderRadius: `${Math.max(2, Math.round(4 * scale))}px`,
                      fontWeight: 800,
                      fontSize: `${Math.max(7, Math.round(12 * scale))}px`,
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
                        ? Math.max(3, Math.round(12 * scale))
                        : activeBlock.widgetData?.speed === 'slow'
                        ? Math.max(1, Math.round(4 * scale))
                        : Math.max(2, Math.round(7 * scale))
                    }
                    style={{
                      fontSize: `${Math.max(8, Math.round((activeBlock.widgetData?.fontSize || 16) * scale))}px`,
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
                  borderRadius: activeBlock.widgetData?.borderRadius ? `${Math.round(activeBlock.widgetData.borderRadius * scale)}px` : undefined,
                  border: activeBlock.widgetData?.borderColor ? `${Math.max(1, Math.round(scale))}px solid ${activeBlock.widgetData.borderColor}` : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: `${Math.max(3, Math.round(12 * scale))}px`,
                }}
              >
                <div style={{
                  fontSize: `${Math.max(10, Math.round((activeBlock.widgetData?.timeFontSize ? activeBlock.widgetData.timeFontSize * 0.7 : 36.4) * scale))}px`,
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  fontFamily: 'inherit',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                }}>
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: activeBlock.widgetData?.showSeconds ? '2-digit' : undefined })}
                </div>
                <div style={{
                  fontSize: `${Math.max(7, Math.round((activeBlock.widgetData?.dateFontSize || 14) * scale))}px`,
                  color: activeBlock.widgetData?.subtitleColor || 'var(--text-muted)',
                  marginTop: `${Math.max(1, Math.round(4 * scale))}px`
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
                  // Same as Android color-matrix inversion during a call (140ms in, 180ms out)
                  filter: isCallingQueue ? 'invert(1)' : 'none',
                  transition: isCallingQueue ? 'filter 140ms ease-out' : 'filter 180ms ease-in-out',
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

                {/* Quick Calling Overlay Controls (Panggil Ulang ditengah2, sama Next) */}
                {isSelected && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 35,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.94)',
                      backdropFilter: 'blur(12px)',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      border: isCallingQueue ? '1px solid #10b981' : '1px solid rgba(56, 189, 248, 0.5)',
                      boxShadow: isCallingQueue
                        ? '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 25px rgba(16, 185, 129, 0.45)'
                        : '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 20px rgba(56, 189, 248, 0.25)',
                      transition: 'all 0.2s ease',
                      pointerEvents: 'auto',
                      filter: isCallingQueue ? 'invert(1)' : 'none', // cancels parent invert so controls keep their colors
                      userSelect: 'none',
                    }}
                  >
                    <button
                      type="button"
                      disabled={isCallingQueue}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCanvasRepeatCall(activeBlock);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        color: '#f8fafc',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: isCallingQueue ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                      title="Panggil Ulang Nomor Antrian Ini"
                    >
                      <RotateCcw size={14} color="#38bdf8" />
                      <span>{isCallingQueue ? 'Memanggil...' : 'Panggil Ulang'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isCallingQueue}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCanvasNextCall(activeBlock);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.6)',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        cursor: isCallingQueue ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)',
                        transition: 'all 0.15s ease',
                      }}
                      title="Panggil Nomor Antrian Selanjutnya (+1)"
                    >
                      <Bell size={14} color="#ffffff" />
                      <span>Next (+1)</span>
                    </button>
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
