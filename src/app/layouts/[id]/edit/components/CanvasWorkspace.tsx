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
    availablePlaylists
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
                backgroundColor: active
                  ? `${color}${isSelected ? '55' : '22'}`
                  : 'rgba(15, 23, 42, 0.4)',
                border: `2px ${active ? (isSelected ? 'solid' : 'solid') : 'dashed'} ${active ? color : 'rgba(255,255,255,0.2)'}`,
                opacity: isSelected ? 1 : active ? 1 : 0.35,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                boxSizing: 'border-box',
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
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: active ? '#ffffff' : '#94a3b8', textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                {z.name}
              </div>
              {z.assigned_playlist_id && (
                <div style={{ fontSize: '0.5625rem', fontWeight: 600, color: '#fef08a', backgroundColor: 'rgba(0,0,0,0.65)', padding: '2px 6px', borderRadius: '4px', marginTop: '3px', border: '1px solid rgba(254, 240, 138, 0.3)', display: 'flex', alignItems: 'center', gap: '3px', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  🎬 {z.playlist_name || availablePlaylists.find(p => p.id === z.assigned_playlist_id)?.name || 'Playlist'}
                </div>
              )}
              {isSelected && (
                <div style={{ fontSize: '0.625rem', color: '#f8fafc', marginTop: '2px', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                  {Math.round(z.width)}×{Math.round(z.height)}
                </div>
              )}
              {!active && !isSelected && (
                <span style={{ fontSize: '0.5625rem', color: '#94a3b8', marginTop: '2px', fontStyle: 'italic', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  (Mati di timeline)
                </span>
              )}
            </Rnd>
          );
        })}
      </div>
    </div>
  );
}
