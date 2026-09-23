'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Maximize, Minimize } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';
import { useParams } from 'next/navigation';

export default function TopToolbar() {
  const { saving, handleSave, isFullscreen, toggleFullscreen } = useLayoutEditor();
  const params = useParams() as { id: string };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link href={`/layouts/${params.id}`} className="btn btn-outline" style={{ width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Kembali ke Detail Layout">
          <ArrowLeft size={15} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h1 style={{ fontSize: '1.0625rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
            Layout Designer
          </h1>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            Multi-kotak display signage
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="btn btn-outline"
          style={{
            padding: '5px 10px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            borderColor: isFullscreen ? 'var(--primary-500)' : 'var(--border-subtle)',
            backgroundColor: isFullscreen ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-base)',
            color: isFullscreen ? 'var(--primary-400)' : 'var(--text-secondary)'
          }}
          title={isFullscreen ? 'Keluar Mode Fullscreen (Esc)' : 'Mode Layar Penuh Fokus Editor'}
        >
          {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
          <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>

        <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Save size={14} />
          <span>{saving ? 'Menyimpan...' : 'Simpan Layout'}</span>
        </button>
      </div>
    </div>
  );
}
