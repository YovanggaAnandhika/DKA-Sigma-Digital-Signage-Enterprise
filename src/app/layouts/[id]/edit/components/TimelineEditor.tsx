'use client';

import React, { useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { Play, Pause, RotateCcw, Film, Image as ImageIcon, Volume2, VolumeX } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';

export default function TimelineEditor() {
  const {
    zones,
    setZones,
    selectedZoneId,
    setSelectedZoneId,
    isPlaying,
    togglePlay,
    stopPlay,
    isMuted,
    toggleMute,
    playheadPosition,
    setPlayheadPosition,
    timelineDuration,
    pxPerSecond,
    isZoneActive,
    availablePlaylists,
    mediaList
  } = useLayoutEditor();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  const formatTime = (px: number) => {
    const totalSec = Math.max(0, px / pxPerSecond);
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const tenths = Math.floor((totalSec % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
  };

  const handleRulerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const pos = Math.max(
      0,
      Math.min(timelineDuration, e.clientX - rect.left + container.scrollLeft)
    );
    setPlayheadPosition(pos);

    const onPointerMove = (ev: PointerEvent) => {
      const newPos = Math.max(
        0,
        Math.min(timelineDuration, ev.clientX - rect.left + container.scrollLeft)
      );
      setPlayheadPosition(newPos);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handlePlayheadPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingPlayhead(true);
    const container = scrollContainerRef.current;
    if (!container) return;

    const onPointerMove = (ev: PointerEvent) => {
      const currentContainerRect = container.getBoundingClientRect();
      const newPos = Math.max(
        0,
        Math.min(timelineDuration, ev.clientX - currentContainerRect.left + container.scrollLeft)
      );
      setPlayheadPosition(newPos);
    };

    const onPointerUp = () => {
      setIsDraggingPlayhead(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Generate ruler tick marks every 5 seconds (100px)
  const rulerTicks = [];
  for (let sec = 0; sec <= Math.ceil(timelineDuration / pxPerSecond); sec += 5) {
    const px = sec * pxPerSecond;
    rulerTicks.push({
      sec,
      px,
      label: `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
    });
  }

  return (
    <div style={{ height: '220px', backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar */}
      <div style={{ height: '40px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px', backgroundColor: '#fafafa' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline</span>
        
        {/* Playback Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
          {/* Stop / Reset Button */}
          <button
            type="button"
            onClick={stopPlay}
            title="Reset ke Awal (00:00)"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: '#fff',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
          >
            <RotateCcw size={13} />
          </button>

          {/* Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            title={isPlaying ? 'Jeda Playback (Pause)' : 'Mulai Playback (Play)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '28px',
              padding: '0 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isPlaying ? 'var(--accent-rose)' : 'var(--primary-600)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              boxShadow: isPlaying ? '0 2px 4px rgba(225, 29, 72, 0.3)' : '0 2px 4px rgba(14, 165, 233, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            {isPlaying ? (
              <>
                <Pause size={13} fill="#fff" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={13} fill="#fff" />
                <span>Play</span>
              </>
            )}
          </button>

          {/* Audio / Mute Toggle Button */}
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Aktifkan Suara (Unmute)' : 'Bisukan Suara (Mute)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              height: '28px',
              padding: '0 10px',
              borderRadius: '6px',
              border: isMuted ? '1px solid #fecaca' : '1px solid #bbf7d0',
              backgroundColor: isMuted ? '#fff1f2' : '#f0fdf4',
              color: isMuted ? '#e11d48' : '#16a34a',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(0.96)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'none';
            }}
          >
            {isMuted ? (
              <>
                <VolumeX size={14} />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 size={14} />
                <span>Audio On</span>
              </>
            )}
          </button>

          {/* Timecode display */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              backgroundColor: '#f1f5f9',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              marginLeft: '8px'
            }}
          >
            <span style={{ color: isPlaying ? 'var(--accent-rose)' : 'var(--text-primary)' }}>{formatTime(playheadPosition)}</span>
            <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>/</span>
            <span>{formatTime(timelineDuration)}</span>
          </div>
        </div>
      </div>
      
      {/* Timeline Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Track Headers */}
        <div style={{ width: '220px', borderRight: '1px solid var(--border-subtle)', overflowY: 'auto', backgroundColor: '#f8fafc', flexShrink: 0 }}>
          <div style={{ height: '24px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
            <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Layers / Tracks</span>
          </div>
          {zones.map(z => {
            const active = isZoneActive(z, playheadPosition);
            const isSelected = z.id === selectedZoneId;
            return (
              <div
                key={z.id}
                onClick={() => setSelectedZoneId(z.id)}
                style={{
                  height: '36px',
                  borderBottom: '1px solid var(--border-subtle)',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: isSelected ? 'var(--primary-600)' : active ? 'var(--text-primary)' : 'var(--text-muted)',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  transition: 'background-color 0.15s'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.name}</span>
                  {z.assigned_playlist_id && (
                    <span style={{ fontSize: '0.625rem', color: 'var(--accent-amber)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🎬 {z.playlist_name || availablePlaylists.find(p => p.id === z.assigned_playlist_id)?.name || 'Playlist'}
                    </span>
                  )}
                </div>
                {active && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }} title="Sedang Aktif" />
                )}
              </div>
            );
          })}
        </div>

        {/* Right Scrollable Timeline Tracks and Ruler */}
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'auto',
            backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 99px, var(--border-subtle) 100px)',
            backgroundSize: '100px 100%'
          }}
        >
          {/* Ruler Bar */}
          <div
            onPointerDown={handleRulerPointerDown}
            style={{
              height: '24px',
              minWidth: `${timelineDuration + 200}px`,
              borderBottom: '1px solid var(--border-subtle)',
              position: 'sticky',
              top: 0,
              backgroundColor: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(4px)',
              zIndex: 10,
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            {rulerTicks.map(tick => (
              <div
                key={tick.sec}
                style={{
                  position: 'absolute',
                  left: `${tick.px}px`,
                  top: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '4px',
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  borderLeft: '1px solid rgba(0,0,0,0.1)'
                }}
              >
                {tick.label}
              </div>
            ))}
          </div>

          {/* Draggable Playhead Cursor & Line */}
          <div
            style={{
              position: 'absolute',
              left: `${playheadPosition}px`,
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: 'var(--accent-rose)',
              zIndex: 25,
              pointerEvents: 'none'
            }}
          >
            {/* Playhead Grab Needle Handle */}
            <div
              onPointerDown={handlePlayheadPointerDown}
              style={{
                position: 'absolute',
                top: 0,
                left: '-10px',
                width: '22px',
                height: '24px',
                cursor: isDraggingPlayhead ? 'grabbing' : 'ew-resize',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                userSelect: 'none'
              }}
              title={`Posisi: ${formatTime(playheadPosition)} (Tarik untuk geser)`}
            >
              <div
                style={{
                  width: '18px',
                  height: '14px',
                  backgroundColor: 'var(--accent-rose)',
                  borderRadius: '3px 3px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(225, 29, 72, 0.4)'
                }}
              >
                <div style={{ width: '4px', height: '6px', borderLeft: '1px solid #fff', borderRight: '1px solid #fff' }} />
              </div>
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '9px solid transparent',
                  borderRight: '9px solid transparent',
                  borderTop: '8px solid var(--accent-rose)'
                }}
              />
            </div>
          </div>

          {/* Tracks Area */}
          <div style={{ position: 'relative', minWidth: `${timelineDuration + 200}px` }}>
            {zones.map((z, i) => {
              const zColors = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];
              const color = zColors[i % zColors.length];
              const isSelected = z.id === selectedZoneId;
              const active = isZoneActive(z, playheadPosition);
              
              return (
                <div key={z.id} style={{ height: '36px', borderBottom: '1px solid rgba(0,0,0,0.05)', position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Rnd
                    bounds="parent"
                    dragAxis="x"
                    enableResizing={{ right: true, left: true, top: false, bottom: false, topRight: false, topLeft: false, bottomRight: false, bottomLeft: false }}
                    size={{ width: z.timeline_width || 300, height: 24 }}
                    position={{ x: z.timeline_start || 0, y: 0 }}
                    onDragStart={() => {
                      if (selectedZoneId !== z.id) setSelectedZoneId(z.id);
                    }}
                    onDrag={(e, d) => {
                      setZones(prev => prev.map(zone => 
                        zone.id === z.id ? { ...zone, timeline_start: d.x } : zone
                      ));
                    }}
                    onResizeStart={() => {
                      if (selectedZoneId !== z.id) setSelectedZoneId(z.id);
                    }}
                    onResize={(e, direction, ref, delta, position) => {
                      setZones(prev => prev.map(zone => 
                        zone.id === z.id ? { 
                          ...zone, 
                          timeline_width: ref.offsetWidth,
                          timeline_start: position.x
                        } : zone
                      ));
                    }}
                    style={{
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {(() => {
                      const assignedPl = availablePlaylists.find((p) => p.id === z.assigned_playlist_id);
                      const items = assignedPl?.items || [];

                      if (items.length > 0) {
                        return (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: color,
                              borderRadius: '4px',
                              opacity: isSelected ? 1 : active ? 0.95 : 0.5,
                              display: 'flex',
                              alignItems: 'stretch',
                              overflow: 'hidden',
                              boxShadow: active ? `0 0 0 2px ${color}, 0 2px 4px rgba(0,0,0,0.15)` : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                              transition: 'opacity 0.2s, box-shadow 0.2s'
                            }}
                          >
                            {items.map((it, itemIdx) => {
                              const itDur = it.duration_seconds || 10;
                              const itWidthPx = itDur * pxPerSecond;
                              const m = mediaList.find((media) => media.id === it.media_item_id);
                              const isVid = m?.media_type === 2;

                              return (
                                <div
                                  key={it.id || itemIdx}
                                  style={{
                                    width: `${itWidthPx}px`,
                                    minWidth: '40px',
                                    flexShrink: 0,
                                    borderRight: itemIdx < items.length - 1 ? '1px dashed rgba(255,255,255,0.4)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '0 6px',
                                    backgroundColor: itemIdx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.12)',
                                    overflow: 'hidden',
                                  }}
                                  title={`${m?.name || `Item ${itemIdx + 1}`} (${itDur}s)`}
                                >
                                  {m?.public_url && !isVid ? (
                                    <img
                                      src={m.public_url}
                                      alt=""
                                      style={{ width: '16px', height: '16px', borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }}
                                    />
                                  ) : isVid ? (
                                    <Film size={12} color="#fff" style={{ flexShrink: 0 }} />
                                  ) : (
                                    <ImageIcon size={12} color="#fff" style={{ flexShrink: 0 }} />
                                  )}
                                  <span style={{ fontSize: '0.625rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {m?.name || `Item ${itemIdx + 1}`} ({itDur}s)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      return (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: color,
                            borderRadius: '4px',
                            opacity: isSelected ? 1 : active ? 0.9 : 0.45,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 8px',
                            boxShadow: active ? `0 0 0 2px ${color}, 0 2px 4px rgba(0,0,0,0.15)` : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                            transition: 'opacity 0.2s, box-shadow 0.2s'
                          }}
                        >
                          <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {z.name} {z.assigned_playlist_id ? `• 🎬 ${z.playlist_name || availablePlaylists.find((p) => p.id === z.assigned_playlist_id)?.name || 'Playlist'}` : ''}
                          </span>
                        </div>
                      );
                    })()}
                  </Rnd>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
