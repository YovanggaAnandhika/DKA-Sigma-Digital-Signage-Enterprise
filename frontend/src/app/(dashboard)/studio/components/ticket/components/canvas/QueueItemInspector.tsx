'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Copy, Trash2 } from 'lucide-react';
import { getMedia, getMediaDisplayUrl } from '@/lib/services/studio/media.service';
import { useQueueEditor } from '../../context/QueueEditorContext';
import { QueueLayoutItem } from '../../types';

const QueueCanvasGlobalInspector = dynamic(() => import('./inspector/QueueCanvasGlobalInspector'), {
  ssr: false,
  loading: () => <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Memuat properti kanvas...</div>,
});

const QueueItemGeometryInspector = dynamic(() => import('./inspector/QueueItemGeometryInspector'), {
  ssr: false,
  loading: () => <div style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Memuat geometri...</div>,
});

const QueueItemStyleInspector = dynamic(() => import('./inspector/QueueItemStyleInspector'), {
  ssr: false,
  loading: () => <div style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Memuat gaya & tipografi...</div>,
});

interface QueueItemInspectorProps {
  selectedItem: QueueLayoutItem | null;
  onSelect: (item: QueueLayoutItem | null) => void;
}

export default function QueueItemInspector({ selectedItem, onSelect }: QueueItemInspectorProps) {
  const { queue, setQueue } = useQueueEditor();
  const [imageOptions, setImageOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    getMedia({ limit: 200 })
      .then((res) =>
        setImageOptions(
          (res.data || [])
            .filter((m) => m.mediaType === 1 || m.mimeType?.startsWith('image/'))
            .map((m) => ({ value: getMediaDisplayUrl(m), label: m.name || m.originalFilename || m.id }))
        )
      )
      .catch((err) => console.error('Gagal memuat media gambar:', err));
  }, []);

  const canvasWidth = queue.canvasWidth || 1920;
  const canvasHeight = queue.canvasHeight || 1080;

  // 1. CANVAS & THEME INSPECTOR (Shown when no element is selected)
  if (!selectedItem) {
    return <QueueCanvasGlobalInspector imageOptions={imageOptions} />;
  }

  // 2. ELEMENT INSPECTOR (Shown when an item is selected)
  const handleDelete = () => {
    setQueue((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== selectedItem.id),
    }));
    onSelect(null);
  };

  const handleDuplicate = () => {
    const maxZ = queue.items.reduce((max, it) => Math.max(max, it.zIndex || 1), 1) + 1;
    const duplicated: QueueLayoutItem = {
      ...selectedItem,
      id: `item-${Date.now()}`,
      name: `${selectedItem.name} (Salinan)`,
      x: Math.min(canvasWidth - selectedItem.width, selectedItem.x + 30),
      y: Math.min(canvasHeight - selectedItem.height, selectedItem.y + 30),
      zIndex: maxZ,
    };
    setQueue((prev) => ({
      ...prev,
      items: [...prev.items, duplicated],
    }));
    onSelect(duplicated);
  };

  return (
    <div
      style={{
        width: '320px',
        backgroundColor: 'var(--bg-surface-elevated)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-500)' }}>
            Inspektor Elemen
          </span>
          <h4
            style={{
              margin: '2px 0 0 0',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedItem.name}
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={handleDuplicate}
            className="btn btn-outline"
            style={{ padding: '5px' }}
            title="Duplikat Elemen"
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-outline"
            style={{ padding: '5px', color: 'var(--accent-rose)' }}
            title="Hapus Elemen"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <QueueItemGeometryInspector
          selectedItem={selectedItem}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />

        <QueueItemStyleInspector selectedItem={selectedItem} />
      </div>
    </div>
  );
}
