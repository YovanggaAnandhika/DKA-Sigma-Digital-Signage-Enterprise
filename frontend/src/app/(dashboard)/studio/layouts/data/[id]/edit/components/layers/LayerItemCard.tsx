'use client';

import React, { useState } from 'react';
import { GripVertical, Lock } from 'lucide-react';
import { useLayoutEditor } from '../../context/LayoutEditorContext';
import { Layer } from '../../context/LayoutStateContext';

interface LayerItemCardProps {
  z: Layer;
}

export default function LayerItemCard({ z }: LayerItemCardProps) {
  const {
    selectedLayerId,
    setSelectedLayerId,
    setInspectorTarget,
    setSelectedBlockId,
    setIsInspectorCollapsed,
    reorderLayers,
  } = useLayoutEditor();

  const [isDragOver, setIsDragOver] = useState(false);
  const isSelected = z.id === selectedLayerId;

  const handleClick = () => {
    setSelectedLayerId(z.id);
    setSelectedBlockId(null);
    setInspectorTarget('layer');
    setIsInspectorCollapsed(false);
  };

  return (
    <div
      onClick={handleClick}
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', z.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const sourceId = e.dataTransfer.getData('text/plain');
        if (sourceId && sourceId !== z.id) {
          reorderLayers(sourceId, z.id);
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '9px 12px',
        backgroundColor: isDragOver ? 'rgba(56, 189, 248, 0.14)' : isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
        borderBottom: '1px solid var(--border-subtle)',
        borderTop: isDragOver ? '2px solid #38bdf8' : '2px solid transparent',
        borderLeft: isSelected ? '3px solid var(--primary-500)' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.1s ease, border 0.1s ease',
      }}
    >
      <div
        title="Geser untuk ubah urutan layer (Z-Index)"
        style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', flexShrink: 0 }}
      >
        <GripVertical size={13} />
      </div>

      <span
        style={{
          fontSize: '0.8125rem',
          fontWeight: isSelected ? 600 : 500,
          color: isSelected ? 'var(--primary-600)' : 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
        }}
      >
        {z.name}
      </span>

      {z.isLocked && (
        <span title="Layer terkunci" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Lock size={12} color="var(--accent-amber)" />
        </span>
      )}
    </div>
  );
}

