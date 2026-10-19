'use client';

import React from 'react';
import {
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignLeft,
  AlignRight,
  ArrowUpToLine,
  ArrowDownToLine,
} from 'lucide-react';
import { useQueueEditor } from '../../../context/QueueEditorContext';
import { QueueLayoutItem } from '../../../types';

interface QueueItemGeometryInspectorProps {
  selectedItem: QueueLayoutItem;
  canvasWidth: number;
  canvasHeight: number;
}

export default function QueueItemGeometryInspector({
  selectedItem,
  canvasWidth,
  canvasHeight,
}: QueueItemGeometryInspectorProps) {
  const { updateLayoutItem } = useQueueEditor();

  const handleAlign = (type: 'centerH' | 'centerV' | 'left' | 'right' | 'top' | 'bottom') => {
    if (type === 'centerH') {
      updateLayoutItem(selectedItem.id, { x: Math.round((canvasWidth - selectedItem.width) / 2) });
    } else if (type === 'centerV') {
      updateLayoutItem(selectedItem.id, { y: Math.round((canvasHeight - selectedItem.height) / 2) });
    } else if (type === 'left') {
      updateLayoutItem(selectedItem.id, { x: 0 });
    } else if (type === 'right') {
      updateLayoutItem(selectedItem.id, { x: canvasWidth - selectedItem.width });
    } else if (type === 'top') {
      updateLayoutItem(selectedItem.id, { y: 0 });
    } else if (type === 'bottom') {
      updateLayoutItem(selectedItem.id, { y: canvasHeight - selectedItem.height });
    }
  };

  return (
    <div>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
        Posisi & Ukuran (px)
      </span>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div>
          <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>X</label>
          <input
            type="number"
            value={selectedItem.x}
            onChange={(e) => updateLayoutItem(selectedItem.id, { x: parseInt(e.target.value, 10) || 0 })}
            className="form-input"
            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Y</label>
          <input
            type="number"
            value={selectedItem.y}
            onChange={(e) => updateLayoutItem(selectedItem.id, { y: parseInt(e.target.value, 10) || 0 })}
            className="form-input"
            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Lebar</label>
          <input
            type="number"
            value={selectedItem.width}
            onChange={(e) => updateLayoutItem(selectedItem.id, { width: parseInt(e.target.value, 10) || 50 })}
            className="form-input"
            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Tinggi</label>
          <input
            type="number"
            value={selectedItem.height}
            onChange={(e) => updateLayoutItem(selectedItem.id, { height: parseInt(e.target.value, 10) || 30 })}
            className="form-input"
            style={{ padding: '5px 8px', fontSize: '0.78rem' }}
          />
        </div>
      </div>

      {/* Quick Alignment Tools */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', paddingTop: '4px' }}>
        <button
          type="button"
          onClick={() => handleAlign('left')}
          className="btn btn-secondary"
          style={{ padding: '6px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Rata Kiri Kanvas"
        >
          <AlignLeft size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleAlign('centerH')}
          className="btn btn-secondary"
          style={{ padding: '6px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Rata Tengah Horizontal"
        >
          <AlignHorizontalJustifyCenter size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleAlign('right')}
          className="btn btn-secondary"
          style={{ padding: '6px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Rata Kanan Kanvas"
        >
          <AlignRight size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleAlign('top')}
          className="btn btn-secondary"
          style={{ padding: '6px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Rata Atas Kanvas"
        >
          <ArrowUpToLine size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleAlign('centerV')}
          className="btn btn-secondary"
          style={{ padding: '6px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Rata Tengah Vertikal"
        >
          <AlignVerticalJustifyCenter size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleAlign('bottom')}
          className="btn btn-secondary"
          style={{ padding: '6px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Rata Bawah Kanvas"
        >
          <ArrowDownToLine size={13} />
        </button>
      </div>
    </div>
  );
}
