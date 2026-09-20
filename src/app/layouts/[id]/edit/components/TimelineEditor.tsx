'use client';

import React, { useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { Play, Pause, RotateCcw, Film, Image as ImageIcon, Volume2, VolumeX, MicOff, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';
import { setPlaylistItemOverride } from '../../../../../lib/api/studio/layout.service';
import { PlaylistItem } from '../../../../../lib/api/studio/types';

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
    mediaList,
    refreshPlaylistsAndMedia,
    hiddenZones,
    toggleZoneVisibility,
    isTimelineExpanded,
    setIsTimelineExpanded
  } = useLayoutEditor();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [timelineHeight, setTimelineHeight] = useState(220);
  const [isDraggingResize, setIsDraggingResize] = useState(false);

  // Drag-to-resize timeline height
  const handleResizeBarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingResize(true);
    document.body.style.userSelect = 'none';
    const startY = e.clientY;
    const startH = timelineHeight;

    const onMouseMove = (ev: MouseEvent) => {
      window.getSelection()?.removeAllRanges();
      const delta = startY - ev.clientY; // drag up = bigger
      setTimelineHeight(Math.min(500, Math.max(120, startH + delta)));
    };
    const onMouseUp = () => {
      setIsDraggingResize(false);
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleToggleItemMute = async (e: React.MouseEvent, item: PlaylistItem, zonePlaylistId: string, currentMuted: boolean) => {
    e.stopPropagation();
    try {
      const override = await setPlaylistItemOverride(zonePlaylistId, item.id, !currentMuted);
      
      // Update local state so UI reflects immediately without global refresh
      setZones(prev => prev.map(z => ({
        ...z,
        blocks: z.blocks.map(b => {
          if (b.id === zonePlaylistId) {
            const existingOverrideIdx = (b.item_overrides || []).findIndex(o => o.playlist_item_id === item.id);
            const newOverrides = [...(b.item_overrides || [])];
            if (existingOverrideIdx >= 0) {
              newOverrides[existingOverrideIdx] = override;
            } else {
              newOverrides.push(override);
            }
            return { ...b, item_overrides: newOverrides };
          }
          return b;
        })
      })));
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status mute video');
    }
  };

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

    document.body.style.userSelect = 'none';
    const rect = container.getBoundingClientRect();
    const pos = Math.max(
      0,
      Math.min(timelineDuration, e.clientX - rect.left + container.scrollLeft)
    );
    setPlayheadPosition(pos);

    const onPointerMove = (ev: PointerEvent) => {
      window.getSelection()?.removeAllRanges();
      const newPos = Math.max(
        0,
        Math.min(timelineDuration, ev.clientX - rect.left + container.scrollLeft)
      );
      setPlayheadPosition(newPos);
    };

    const onPointerUp = () => {
      document.body.style.userSelect = '';
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
    document.body.style.userSelect = 'none';
    const container = scrollContainerRef.current;
    if (!container) return;

    const onPointerMove = (ev: PointerEvent) => {
      window.getSelection()?.removeAllRanges();
      const currentContainerRect = container.getBoundingClientRect();
      const newPos = Math.max(
        0,
        Math.min(timelineDuration, ev.clientX - currentContainerRect.left + container.scrollLeft)
      );
      setPlayheadPosition(newPos);
    };

    const onPointerUp = () => {
      setIsDraggingPlayhead(false);
      document.body.style.userSelect = '';
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
    <div style={{ height: isTimelineExpanded ? `${timelineHeight}px` : '40px', backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', position: 'relative', flexShrink: 0, userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}>
      {/* Resize handle — drag upward to expand timeline */}
      {isTimelineExpanded && (
        <div
          onMouseDown={handleResizeBarMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            cursor: 'row-resize',
            zIndex: 30,
            backgroundColor: isDraggingResize ? 'var(--primary-400)' : 'transparent',
            transition: 'background 0.15s',
          }}
          title="Tarik ke atas untuk memperbesar timeline"
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.3)'; }}
          onMouseLeave={(e) => { if (!isDraggingResize) e.currentTarget.style.backgroundColor = 'transparent'; }}
        />
      )}
      {/* Top Header Bar */}
      <div style={{ height: '40px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px', backgroundColor: 'var(--bg-surface-elevated)' }}>
        
        <button
          onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--text-secondary)'
          }}
        >
          {isTimelineExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
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
              backgroundColor: 'var(--bg-base)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-base)'; }}
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
              backgroundColor: isMuted ? 'rgba(225, 29, 72, 0.1)' : 'rgba(22, 163, 74, 0.1)',
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
              backgroundColor: 'var(--bg-base)',
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
      {isTimelineExpanded && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Track Headers */}
        <div style={{ width: '220px', borderRight: '1px solid var(--border-subtle)', overflowY: 'auto', backgroundColor: 'var(--bg-surface)', flexShrink: 0 }}>
          <div style={{ height: '24px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {active && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }} title="Sedang Aktif" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleZoneVisibility(z.id); }}
                    style={{ 
                      background: 'none', border: 'none', cursor: 'pointer', display: 'flex', 
                      color: hiddenZones.includes(z.id) ? 'var(--text-muted)' : 'var(--text-secondary)',
                      padding: '2px'
                    }}
                    title={hiddenZones.includes(z.id) ? "Tampilkan Layer" : "Sembunyikan Layer"}
                  >
                    {hiddenZones.includes(z.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
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
              backgroundColor: 'var(--bg-surface-elevated)',
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
                  borderLeft: '1px solid var(--border-subtle)'
                }}
              >
                {tick.label}
              </div>
            ))}
          </div>

          {/* Simulated Yellow Seek Buffer Line */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '20px',
              height: '4px',
              width: `${playheadPosition + (5 * pxPerSecond)}px`, // Fake 5s buffer ahead of playhead
              backgroundColor: 'var(--accent-amber)',
              opacity: 0.4,
              borderRadius: '2px',
              zIndex: 15,
              pointerEvents: 'none',
              transition: 'width 0.2s'
            }}
          />

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
                <div key={z.id} style={{ height: '36px', borderBottom: '1px solid var(--border-subtle)', position: 'relative', display: 'flex', alignItems: 'center' }}>
                  {(z.blocks || []).map((block, bIdx) => {
                    const isMediaBlock = !!block.media_item_id;
                    const assignedPl = availablePlaylists.find((p) => p.id === block.playlist_id);
                    
                    let itemsToRender: any[] = [];
                    if (isMediaBlock) {
                      itemsToRender = [{
                        id: block.id,
                        media_item_id: block.media_item_id,
                        duration_seconds: block.duration_seconds,
                        is_muted: false
                      }];
                    } else {
                      itemsToRender = assignedPl?.items || [];
                    }
                    const blockActive = active && isZoneActive(z, playheadPosition); // Simplified

                    return (
                      <div key={block.id} style={{ position: 'absolute', left: `${block.start_time_seconds * pxPerSecond}px`, width: `${block.duration_seconds * pxPerSecond}px`, height: '24px', display: 'flex', alignItems: 'center' }}>
                        <Rnd
                          bounds="parent"
                          dragAxis="x"
                          enableResizing={{ right: true, left: true, top: false, bottom: false, topRight: false, topLeft: false, bottomRight: false, bottomLeft: false }}
                          size={{ width: block.duration_seconds * pxPerSecond, height: 24 }}
                          position={{ x: 0, y: 0 }}
                          onDragStart={() => {
                            if (selectedZoneId !== z.id) setSelectedZoneId(z.id);
                          }}
                          onDrag={(e, d) => {
                            // Update block start_time_seconds
                          }}
                          onResize={(e, direction, ref, delta, position) => {
                            // Update block duration_seconds
                          }}
                          style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: color,
                              borderRadius: '4px',
                              opacity: isSelected ? 1 : blockActive ? 0.95 : 0.5,
                              display: 'flex',
                              alignItems: 'stretch',
                              overflow: 'hidden',
                              boxShadow: blockActive ? `0 0 0 2px ${color}, 0 2px 4px rgba(0,0,0,0.15)` : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                              transition: 'opacity 0.2s, box-shadow 0.2s'
                            }}
                          >
                            {itemsToRender.length > 0 ? itemsToRender.map((it, itemIdx) => {
                              const itDur = it.duration_seconds || 10;
                              const itWidthPx = itDur * pxPerSecond;
                              const m = mediaList.find((media) => media.id === it.media_item_id);
                              const isVid = m?.media_type === 2;
                              const override = block.item_overrides?.find(o => o.playlist_item_id === it.id);
                              const isMuted = override ? override.is_muted : !!it.is_muted;

                              return (
                                <div
                                  key={it.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: `${itWidthPx}px`,
                                    borderRight: itemIdx < itemsToRender.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                    padding: '0 4px',
                                    boxSizing: 'border-box',
                                    backgroundColor: 'transparent',
                                    flexShrink: 0
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
                                  <span style={{ fontSize: '0.625rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginLeft: '4px' }}>
                                    {m?.name || `Item ${itemIdx + 1}`} ({itDur}s)
                                  </span>
                                  {isVid && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleItemMute(e, it as PlaylistItem, block.id, isMuted)}
                                      title={isMuted ? 'Aktifkan suara video ini' : 'Bisukan suara video ini'}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '2px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        borderRadius: '4px',
                                        backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                                        marginLeft: '4px'
                                      }}
                                    >
                                      {isMuted ? <MicOff size={12} color="#fca5a5" /> : <Volume2 size={12} color="#a7f3d0" />}
                                    </button>
                                  )}
                                </div>
                              );
                            }) : (
                              <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 600, padding: '0 8px' }}>
                                🎬 {isMediaBlock ? 'Media' : (assignedPl?.name || 'Playlist')}
                              </span>
                            )}
                          </div>
                        </Rnd>
                        

                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
