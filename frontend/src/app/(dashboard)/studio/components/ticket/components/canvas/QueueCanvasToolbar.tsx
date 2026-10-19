'use client';

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Magnet,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignLeft,
  AlignRight,
  ArrowUpToLine,
  ArrowDownToLine,
  PhoneCall,
} from 'lucide-react';
import { QueueLayoutItem } from '../../types';

interface QueueCanvasToolbarProps {
  canvasWidth: number;
  canvasHeight: number;
  isMagnetEnabled: boolean;
  setIsMagnetEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
  selectedItem: QueueLayoutItem | null;
  handleAlign: (type: 'centerH' | 'centerV' | 'left' | 'right' | 'top' | 'bottom') => void;
  callNextTicket: () => void;
  currentSimNumber: string;
  zoomLevel: number;
  setZoomLevel: (val: number | ((prev: number) => number)) => void;
}

export default function QueueCanvasToolbar({
  canvasWidth,
  canvasHeight,
  isMagnetEnabled,
  setIsMagnetEnabled,
  selectedItem,
  handleAlign,
  callNextTicket,
  currentSimNumber,
  zoomLevel,
  setZoomLevel,
}: QueueCanvasToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface-elevated)',
        flexWrap: 'wrap',
        gap: '10px',
        zIndex: 10,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Left: Resolution Badge & Magnet Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: '#10b981',
            color: '#ffffff',
          }}
        >
          {canvasWidth} × {canvasHeight} px
        </span>

        <button
          type="button"
          onClick={() => setIsMagnetEnabled((prev) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: isMagnetEnabled ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: isMagnetEnabled ? '#06b6d4' : 'var(--text-muted)',
            border: isMagnetEnabled ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
          title={isMagnetEnabled ? 'Magnet Snapping Aktif' : 'Magnet Snapping Nonaktif'}
        >
          <Magnet size={13} />
          Magnet Align
        </button>
      </div>

      {/* Center: Quick Alignment Tools (Disabled if no item selected) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '2px',
          opacity: selectedItem ? 1 : 0.4,
          pointerEvents: selectedItem ? 'auto' : 'none',
        }}
      >
        <button
          type="button"
          onClick={() => handleAlign('left')}
          className="btn btn-outline"
          style={{ padding: '5px', border: 'none' }}
          title="Rata Kiri Kanvas"
        >
          <AlignLeft size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleAlign('centerH')}
          className="btn btn-outline"
          style={{ padding: '5px', border: 'none' }}
          title="Rata Tengah Horizontal"
        >
          <AlignHorizontalJustifyCenter size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleAlign('right')}
          className="btn btn-outline"
          style={{ padding: '5px', border: 'none' }}
          title="Rata Kanan Kanvas"
        >
          <AlignRight size={13} />
        </button>
        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)', margin: '0 2px' }} />
        <button
          type="button"
          onClick={() => handleAlign('top')}
          className="btn btn-outline"
          style={{ padding: '5px', border: 'none' }}
          title="Rata Atas Kanvas"
        >
          <ArrowUpToLine size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleAlign('centerV')}
          className="btn btn-outline"
          style={{ padding: '5px', border: 'none' }}
          title="Rata Tengah Vertikal"
        >
          <AlignVerticalJustifyCenter size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleAlign('bottom')}
          className="btn btn-outline"
          style={{ padding: '5px', border: 'none' }}
          title="Rata Bawah Kanvas"
        >
          <ArrowDownToLine size={13} />
        </button>
      </div>

      {/* Right: Live Call Simulation & Zoom controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={callNextTicket}
          className="btn btn-primary"
          style={{ padding: '4px 12px', fontSize: '0.75rem', backgroundColor: '#059669', borderColor: '#059669' }}
        >
          <PhoneCall size={12} />
          Panggil ({currentSimNumber})
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.1))}
            style={{ background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer', color: 'var(--text-primary)' }}
            title="Perkecil"
          >
            <ZoomOut size={12} />
          </button>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0 4px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'center' }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.1))}
            style={{ background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer', color: 'var(--text-primary)' }}
            title="Perbesar"
          >
            <ZoomIn size={12} />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            style={{ background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer', color: 'var(--text-muted)' }}
            title="Fit Kanvas"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
