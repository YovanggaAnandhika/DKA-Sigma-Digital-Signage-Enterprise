'use client';

import React from 'react';
import { MousePointer2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';
import CanvasZoneBox from './canvas/CanvasZoneBox';

export default function CanvasWorkspace() {
  const {
    layout,
    zones,
    setSelectedZoneId,
    previewHeight,
    canvasDisplayWidth,
    zoomLevel,
    zoomIn,
    zoomOut,
    zoomFit,
    setSelectedBlockId,
    setInspectorTarget,
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
            setSelectedBlockId(null);
            setInspectorTarget('layout');
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
          {zones.map((z, idx) => (
            <CanvasZoneBox key={z.id} zone={z} idx={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
