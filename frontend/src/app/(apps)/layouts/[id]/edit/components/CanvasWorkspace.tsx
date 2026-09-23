'use client';

import React, { useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { MousePointer2, Volume2, VolumeX, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';

interface SynchronizedVideoProps {
  src: string;
  isPlaying: boolean;
  active: boolean;
  isMuted: boolean;
  targetTimeSec: number;
  onBufferUpdate?: (ranges: { start: number; end: number }[]) => void;
  timelineStartSec?: number;
}

function SynchronizedVideo({
  src,
  isPlaying,
  active,
  isMuted,
  targetTimeSec,
  onBufferUpdate,
  timelineStartSec = 0,
}: SynchronizedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : 1;
    }
  }, [isMuted]);

  const prevTargetTime = useRef(targetTimeSec);

  // Sync playback state and position
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const safeTarget =
      video.duration && !isNaN(video.duration) && video.duration > 0
        ? targetTimeSec % video.duration
        : targetTimeSec;

    // Detect if user is scrubbing/clicking the timeline (jump > 0.2s)
    const isUserSeek = Math.abs(targetTimeSec - prevTargetTime.current) > 0.2;
    prevTargetTime.current = targetTimeSec;

    if (isPlaying && active) {
      // Force seek if user manually scrubbed, otherwise allow 1.5s natural drift tolerance
      if (isUserSeek || Math.abs(video.currentTime - safeTarget) > 1.5) {
        video.currentTime = safeTarget;
      }
      if (video.paused) {
        video.muted = isMuted;
        video.volume = isMuted ? 0 : 1;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Autoplay sound blocked by browser policy:', err);
          });
        }
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
      // ONLY seek if the zone is actually active.
      // If it's outside the timeline block, it shouldn't scrub forward.
      if (active && Math.abs(video.currentTime - safeTarget) > 0.05) {
        video.currentTime = safeTarget;
      }
    }
  }, [isPlaying, active, targetTimeSec, isMuted]);

  // When metadata loads or src updates, position properly
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const safeTarget =
      video.duration && !isNaN(video.duration) && video.duration > 0
        ? targetTimeSec % video.duration
        : targetTimeSec;
    video.currentTime = safeTarget;
    video.muted = isMuted;
    video.volume = isMuted ? 0 : 1;
    if (isPlaying && active && video.paused) {
      video.play().catch(() => {});
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onBufferUpdate) return;
    const updateBuffer = () => {
      const ranges = [];
      for (let i = 0; i < video.buffered.length; i++) {
        ranges.push({
          start: video.buffered.start(i) + timelineStartSec,
          end: video.buffered.end(i) + timelineStartSec,
        });
      }
      onBufferUpdate(ranges);
    };
    video.addEventListener('progress', updateBuffer);
    return () => video.removeEventListener('progress', updateBuffer);
  }, [timelineStartSec, onBufferUpdate]);

  return (
    <video
      ref={videoRef}
      src={src}
      playsInline
      loop
      muted={isMuted}
      onLoadedMetadata={handleLoadedMetadata}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  );
}

export default function CanvasWorkspace() {
  const {
    layout,
    zones,
    setZones,
    selectedZoneId,
    setSelectedZoneId,
    scale,
    previewHeight,
    canvasDisplayWidth,
    zoomLevel,
    zoomIn,
    zoomOut,
    zoomFit,
    isPlaying,
    playheadPosition,
    isMuted,
    isZoneActive,
    availablePlaylists,
    mediaList,
    pxPerSecond,
    hiddenZones,
    reportBuffer
  } = useLayoutEditor();

  if (!layout) return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-surface-elevated)', backgroundImage: 'radial-gradient(var(--border-subtle) 1px, transparent 0)', backgroundSize: '20px 20px' }}>
      
      {/* Toolbar row: workspace label + resolution + zoom controls */}
      <div style={{ position: 'absolute', top: 12, left: 16, right: 16, display: 'flex', alignItems: 'center', gap: '8px', zIndex: 20, pointerEvents: 'none' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-surface-elevated)', padding: '5px 10px', borderRadius: '6px', backdropFilter: 'blur(4px)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', pointerEvents: 'auto' }}>
          <MousePointer2 size={14} /> Workspace
        </span>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', backgroundColor: '#10b981', color: '#fff', boxShadow: '0 1px 3px rgba(16,185,129,0.3)', pointerEvents: 'auto' }}>
          {layout.canvasWidth} × {layout.canvasHeight} px
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', padding: '4px 6px', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', backdropFilter: 'blur(4px)', pointerEvents: 'auto' }}>
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoomLevel <= 0.25}
            title="Perkecil Canvas (Zoom Out)"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: 'none', borderRadius: '5px', backgroundColor: zoomLevel <= 0.25 ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)', cursor: zoomLevel <= 0.25 ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { if (zoomLevel > 0.25) e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = zoomLevel <= 0.25 ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)'; }}
          >
            <ZoomOut size={13} />
          </button>

          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: '38px', textAlign: 'center', fontFamily: 'monospace' }}>
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            type="button"
            onClick={zoomIn}
            disabled={zoomLevel >= 4.0}
            title="Perbesar Canvas (Zoom In)"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: 'none', borderRadius: '5px', backgroundColor: zoomLevel >= 4.0 ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)', cursor: zoomLevel >= 4.0 ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { if (zoomLevel < 4.0) e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = zoomLevel >= 4.0 ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)'; }}
          >
            <ZoomIn size={13} />
          </button>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-subtle)', margin: '0 2px' }} />

          <button
            type="button"
            onClick={zoomFit}
            title="Fit ke Ukuran Default (100%)"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: 'none', borderRadius: '5px', backgroundColor: 'var(--bg-surface-elevated)', cursor: 'pointer', color: 'var(--primary-600)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'; }}
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

      {/* Scrollable canvas area */}
      <div 
        style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '52px', paddingBottom: '16px', paddingLeft: '16px', paddingRight: '16px' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedZoneId(null);
          }
        }}
      >
        <div
          style={{
            width: `${canvasDisplayWidth}px`,
            height: `${previewHeight}px`,
            backgroundColor: 'var(--bg-primary)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedZoneId(null);
            }
          }}
        >
        {zones.map((z, idx) => {
          const zColors = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];
          const color = zColors[idx % zColors.length];
          const isSelected = z.id === selectedZoneId;
          const active = isZoneActive(z, playheadPosition);

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
          // Resolve mute state: check item_overrides first (per-block toggle in timeline)
          let isCurrentItemMuted = false;
          if (activeBlock) {
            const overrideItemId = activeBlock.mediaItemId ? activeBlock.id : currentItem?.id;
            const override = (activeBlock.itemOverridesList || []).find(
              (o: any) => o.playlistItemId === overrideItemId
            );
            isCurrentItemMuted = override ? !!override.isMuted : !!(currentItem?.isMuted);
          }


          return (
            <Rnd
              key={z.id}
              bounds="parent"
              size={{ width: (Number(z.width) || 200) * scale, height: (Number(z.height) || 200) * scale }}
              position={{ x: (Number(z.x) || 0) * scale, y: (Number(z.y) || 0) * scale }}
              onDragStart={() => {
                if (selectedZoneId !== z.id) setSelectedZoneId(z.id);
              }}

              onDrag={(e, d) => {
                const nextX = Math.round(d.x / scale);
                const nextY = Math.round(d.y / scale);
                setZones((prev) =>
                  prev.map((zone) =>
                    zone.id === z.id
                      ? { ...zone, x: nextX, y: nextY }
                      : zone
                  )
                );
              }}
              onDragStop={(e, d) => {
                const nextX = Math.round(d.x / scale);
                const nextY = Math.round(d.y / scale);
                setZones((prev) =>
                  prev.map((zone) =>
                    zone.id === z.id
                      ? { ...zone, x: nextX, y: nextY }
                      : zone
                  )
                );
              }}
              onResizeStart={() => {
                if (selectedZoneId !== z.id) setSelectedZoneId(z.id);
              }}
              onResize={(e, direction, ref, delta, position) => {
                const nextW = Math.round(ref.offsetWidth / scale);
                const nextH = Math.round(ref.offsetHeight / scale);
                const nextX = Math.round(position.x / scale);
                const nextY = Math.round(position.y / scale);
                setZones((prev) =>
                  prev.map((zone) =>
                    zone.id === z.id
                      ? {
                          ...zone,
                          width: nextW,
                          height: nextH,
                          x: nextX,
                          y: nextY,
                        }
                      : zone
                  )
                );
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                const nextW = Math.round(ref.offsetWidth / scale);
                const nextH = Math.round(ref.offsetHeight / scale);
                const nextX = Math.round(position.x / scale);
                const nextY = Math.round(position.y / scale);
                setZones((prev) =>
                  prev.map((zone) =>
                    zone.id === z.id
                      ? {
                          ...zone,
                          width: nextW,
                          height: nextH,
                          x: nextX,
                          y: nextY,
                        }
                      : zone
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
                        isMuted={isMuted || isCurrentItemMuted}
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
                            color: isMuted ? '#f87171' : '#4ade80',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            borderLeft: '1px solid rgba(255,255,255,0.2)',
                            paddingLeft: '4px',
                          }}
                          title={isMuted ? 'Suara dibisukan (Muted)' : 'Suara aktif (Unmuted)'}
                        >
                          {isMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
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
                  /* Fallback centered label for empty zonesList without media */
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
        })}
        </div>
      </div>
    </div>
  );
}
