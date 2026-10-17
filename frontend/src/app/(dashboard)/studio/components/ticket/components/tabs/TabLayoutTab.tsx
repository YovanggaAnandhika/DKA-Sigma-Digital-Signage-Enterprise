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
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        backgroundColor: 'var(--bg-surface)',
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

      {/* Panel Kanan: Inspektor Properti */}
      <QueueItemInspector
        selectedItem={currentSelected}
        onSelect={setSelectedItem}
      />
    </div>
  );
}
