'use client';

import React from 'react';
import { Rnd } from 'react-rnd';
import { MousePointer2 } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';

export default function CanvasWorkspace() {
  const {
    layout,
    zones,
    setZones,
    selectedZoneId,
    setSelectedZoneId,
    scale,
    previewHeight,
    isPlaying,
    playheadPosition,
    isZoneActive,
    availablePlaylists,
    mediaList,
    pxPerSecond
  } = useLayoutEditor();

  if (!layout) return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 0)', backgroundSize: '20px 20px' }}>
      
      <div style={{ position: 'absolute', top: 16, left: 24, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.8)', padding: '6px 12px', borderRadius: '6px', backdropFilter: 'blur(4px)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <MousePointer2 size={16} /> Workspace
        </span>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', backgroundColor: '#10b981', color: '#fff', boxShadow: '0 1px 3px rgba(16,185,129,0.3)' }}>
          {layout.canvas_width} × {layout.canvas_height} px
        </span>
      </div>

      <div
        style={{
          width: '540px',
          height: `${previewHeight}px`,
          backgroundColor: '#0a0a0f',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          border: '1px solid #333'
        }}
      >
        {zones.map((z, idx) => {
          const zColors = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];
          const color = zColors[idx % zColors.length];
          const isSelected = z.id === selectedZoneId;
          const active = isZoneActive(z, playheadPosition);

          // Find assigned playlist and resolve active media item
          const assignedPl = availablePlaylists.find((p) => p.id === z.assigned_playlist_id);
          const items = assignedPl?.items || [];
          let activeMedia: any = null;

          if (items.length > 0) {
            let currentItem = items[0];
            if (items.length > 1) {
              const currentSec = Math.max(0, playheadPosition / (pxPerSecond || 20));
              const totalDur = items.reduce((sum, it) => sum + (it.duration_seconds || 10), 0);
              if (totalDur > 0) {
                const loopSec = currentSec % totalDur;
                let acc = 0;
                for (const it of items) {
                  const d = it.duration_seconds || 10;
                  if (loopSec >= acc && loopSec < acc + d) {
                    currentItem = it;
                    break;
                  }
                  acc += d;
                }
              }
            }
            activeMedia = mediaList.find((m) => m.id === currentItem.media_item_id);
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
                opacity: isSelected ? 1 : active ? 1 : 0.35,
                zIndex: isSelected ? 999 : z.z_index || 1,
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
                {activeMedia?.public_url && (
                  activeMedia.media_type === 2 ? (
                    <video
                      src={activeMedia.public_url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <img
                      src={activeMedia.public_url}
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

                {/* Non-intrusive metadata rendering */}
                {activeMedia?.public_url ? (
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
                      {z.assigned_playlist_id && (
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
                          🎬 {z.playlist_name || assignedPl?.name || 'Playlist'}
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
                  /* Fallback centered label for empty zones without media */
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
  );
}
