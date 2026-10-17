'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { useLayoutState, Layer } from '../../context/LayoutStateContext';
import { useLayoutUI } from '../../context/LayoutUIContext';
import { useLayoutPlayback } from '../../context/LayoutPlaybackContext';

interface TimelineTrackHeaderRowProps {
  z: Layer;
  color: string;
  isSelected: boolean;
  isHidden: boolean;
  active: boolean;
  onClick: () => void;
  onToggleVisibility: () => void;
  reorderLayers: (sourceId: string, targetId: string) => void;
}

function TimelineTrackHeaderRow({
  z,
  color,
  isSelected,
  isHidden,
  active,
  onClick,
  onToggleVisibility,
  reorderLayers,
}: TimelineTrackHeaderRowProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onClick={onClick}
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
        height: '34px',
        borderBottom: '1px solid var(--border-subtle)',
        borderTop: isDragOver ? '2px solid #38bdf8' : '2px solid transparent',
        padding: '0 8px 0 4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isDragOver
          ? 'rgba(56, 189, 248, 0.14)'
          : isSelected
          ? 'var(--bg-surface-elevated)'
          : 'var(--bg-surface)',
        borderLeft: `4px solid ${color}`,
        cursor: 'pointer',
        opacity: isHidden ? 0.4 : 1,
        transition: 'background 0.1s ease, border 0.1s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
        <div
          title="Tahan dan geser untuk ubah urutan track timeline (Z-Index)"
          style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', flexShrink: 0 }}
        >
          <GripVertical size={13} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {z.name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
              {z.blocksList?.length || 0} block(s)
            </span>
            {active && (
              <span style={{ fontSize: '0.5625rem', padding: '1px 4px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 700 }}>
                ACTIVE
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isHidden ? 'var(--text-muted)' : 'var(--text-secondary)', padding: '4px' }}
        title={isHidden ? 'Tampilkan Layer' : 'Sembunyikan Layer'}
      >
        {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

export default function TimelineTrackHeader() {
  const { layers, selectedLayerId, setSelectedLayerId, reorderLayers } = useLayoutState();
  const { hiddenZones, toggleZoneVisibility, setInspectorTarget, setSelectedBlockId, setIsInspectorCollapsed } = useLayoutUI();
  const { playheadPosition, isLayerActive } = useLayoutPlayback();

  return (
    <div style={{ width: '220px', backgroundColor: 'var(--bg-surface)', flexShrink: 0 }}>
      {layers.map((z, idx) => {
        const active = isLayerActive(z, playheadPosition);
        const isSelected = z.id === selectedLayerId;
        const isHidden = hiddenZones.includes(z.id);
        const zColors = ['#1d4ed8', '#047857', '#b45309', '#be185d', '#6d28d9', '#0f766e', '#4338ca'];
        const color = zColors[idx % zColors.length];

        const handleTrackClick = () => {
          setSelectedLayerId(z.id);
          setSelectedBlockId(null);
          setInspectorTarget('layer');
          setIsInspectorCollapsed(false);
        };

        return (
          <TimelineTrackHeaderRow
            key={z.id}
            z={z}
            color={color}
            isSelected={isSelected}
            isHidden={isHidden}
            active={active}
            onClick={handleTrackClick}
            onToggleVisibility={() => toggleZoneVisibility(z.id)}
            reorderLayers={reorderLayers}
          />
        );
      })}
    </div>
  );
}
