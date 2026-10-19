'use client';

import React from 'react';
import { MousePointer2 } from 'lucide-react';
import { useLayoutEditor } from '../../context/LayoutEditorContext';

export default function InspectorLayoutProperties() {
  const {
    layout,
    layoutName,
    setLayoutName,
  } = useLayoutEditor();

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Resolusi & Properti Canvas
      </span>

      <div>
        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          NAMA LAYOUT
        </label>
        <input
          type="text"
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value)}
          className="form-input"
          style={{ fontSize: '0.75rem', padding: '6px 10px' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            RESOLUSI LEBAR
          </label>
          <input
            type="text"
            disabled
            value={`${layout?.canvasWidth || 1920} px`}
            className="form-input"
            style={{ fontSize: '0.75rem', padding: '6px 10px', backgroundColor: 'var(--bg-base)' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            RESOLUSI TINGGI
          </label>
          <input
            type="text"
            disabled
            value={`${layout?.canvasHeight || 1080} px`}
            className="form-input"
            style={{ fontSize: '0.75rem', padding: '6px 10px', backgroundColor: 'var(--bg-base)' }}
          />
        </div>
      </div>

      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-base)', border: '1px dashed var(--border-subtle)', textAlign: 'center', marginTop: '8px' }}>
        <MousePointer2 size={20} style={{ opacity: 0.5, margin: '0 auto 6px auto', color: 'var(--text-secondary)' }} />
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>
          Klik suatu <strong>Layer</strong> di canvas, item di <strong>Konten Layer</strong>, atau blok di <strong>Timeline</strong> untuk langsung beralih melihat dan mengedit propertinya di panel ini.
        </span>
      </div>
    </div>
  );
}
