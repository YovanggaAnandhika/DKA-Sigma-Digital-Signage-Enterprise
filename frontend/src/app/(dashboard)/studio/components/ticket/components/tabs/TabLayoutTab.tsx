'use client';

import React, { useState } from 'react';
import { useQueueEditor } from '../../context/QueueEditorContext';
import { QueueLayoutItem } from '../../types';
import QueueLayersPanel from '../canvas/QueueLayersPanel';
import QueueCanvasWorkspace from '../canvas/QueueCanvasWorkspace';
import QueueItemInspector from '../canvas/QueueItemInspector';

export default function TabLayoutTab() {
  const { queue } = useQueueEditor();
  const [selectedItem, setSelectedItem] = useState<QueueLayoutItem | null>(null);

  // Keep selectedItem reference in sync with latest queue.items
  const currentSelected = selectedItem
    ? queue.items.find((it) => it.id === selectedItem.id) || null
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, minHeight: 0 }}>
      {/* 3-Panel Integrated Studio IDE Workspace (Seamless Edge-to-Edge) */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-surface)',
          minHeight: '660px',
          height: 'calc(100vh - 190px)',
        }}
      >
        {/* Panel Kiri: Lapisan & Tambah Elemen */}
        <QueueLayersPanel
          selectedItemId={currentSelected?.id || null}
          onSelectItem={setSelectedItem}
        />

        {/* Panel Tengah: Kanvas Interaktif + Magnet Snapping */}
        <QueueCanvasWorkspace
          selectedItemId={currentSelected?.id || null}
          onSelectItem={setSelectedItem}
        />

        {/* Panel Kanan: Inspektor Properti (Kanvas & Tema jika null, atau Elemen jika dipilih) */}
        <QueueItemInspector
          selectedItem={currentSelected}
          onSelect={setSelectedItem}
        />
      </div>
    </div>
  );
}
