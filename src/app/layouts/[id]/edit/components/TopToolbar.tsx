'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';
import { useParams } from 'next/navigation';

export default function TopToolbar() {
  const { saving, handleSave } = useLayoutEditor();
  const params = useParams() as { id: string };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={`/layouts/${params.id}`} className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
            Appearance & Visual Layout Designer
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            Desain template tata letak multi-kotak untuk display Android player.
          </p>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
        <Save size={16} />
        <span>{saving ? 'Menyimpan...' : 'Simpan Layout'}</span>
      </button>
    </div>
  );
}
