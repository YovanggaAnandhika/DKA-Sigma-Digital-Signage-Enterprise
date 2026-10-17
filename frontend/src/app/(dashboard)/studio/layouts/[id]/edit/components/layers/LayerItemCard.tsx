'use client';

import React, { useState } from 'react';
import { Film, ListMusic, GripVertical, Lock } from 'lucide-react';
import { useLayoutEditor } from '../../context/LayoutEditorContext';
import { Layer } from '../../context/LayoutStateContext';

interface LayerItemCardProps {
  z: Layer;
}

export default function LayerItemCard({ z }: LayerItemCardProps) {
  const {
    selectedLayerId,
    setSelectedLayerId,
    availablePlaylists,
    mediaList,
    setPickerZoneId,
    setInspectorTarget,
    setSelectedBlockId,
    setIsInspectorCollapsed,
    reorderLayers,
  } = useLayoutEditor();

  const [isDragOver, setIsDragOver] = useState(false);
  const isSelected = z.id === selectedLayerId;
  const hasBlocks = z.blocksList && z.blocksList.length > 0;
  const firstBlock = hasBlocks ? z.blocksList[0] : null;
  const assignedPl = firstBlock ? availablePlaylists.find((p) => p.id === firstBlock.playlistId) : null;
  const playlistName = hasBlocks ? `${z.blocksList.length} Konten` : null;
  const firstItem = assignedPl?.itemsList?.[0];
  const layerMedia = firstItem ? mediaList.find((m) => m.id === firstItem.mediaItemId) : null;
  const isVideo = layerMedia?.mediaType === 2;

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
        gap: '6px',
        padding: '8px 10px 8px 6px',
        backgroundColor: isDragOver ? 'rgba(56, 189, 248, 0.14)' : isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
        borderBottom: '1px solid var(--border-subtle)',
        borderTop: isDragOver ? '2px solid #38bdf8' : '2px solid transparent',
        borderLeft: isSelected ? '3px solid var(--primary-500)' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.1s ease, border 0.1s ease',
      }}
    >
      <div
        title="Tahan dan geser untuk ubah urutan layer (Z-Index)"
        style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', flexShrink: 0 }}
      >
        <GripVertical size={13} />
      </div>
      <div
        style={{
          width: '28px',
          height: '20px',
          borderRadius: '3px',
          overflow: 'hidden',
          backgroundColor: '#0f172a',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
        }}
      >
        {layerMedia?.publicUrl && !isVideo ? (
          <img
            src={layerMedia.publicUrl}
            alt={layerMedia.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : isVideo ? (
          <Film size={10} color="var(--accent-amber)" />
        ) : (
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              backgroundColor: isSelected ? 'var(--primary-500)' : '#94a3b8',
            }}
          />
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: isSelected ? 700 : 500,
              color: isSelected ? 'var(--primary-600)' : 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {z.name}
          </span>
          {z.isLocked && (
            <span title="Layer terkunci" style={{ display: 'flex', alignItems: 'center' }}>
              <Lock size={10} color="#f59e0b" style={{ flexShrink: 0 }} />
            </span>
          )}
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setPickerZoneId(z.id);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 4px',
            borderRadius: '4px',
            backgroundColor: hasBlocks ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-base)',
            border: `1px solid ${hasBlocks ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'}`,
            width: 'fit-content',
            marginTop: '2px',
            cursor: 'pointer',
          }}
          title="Klik untuk ubah konten layer"
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(0.95)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
          }}
        >
          {hasBlocks ? (
            <>
              <Film size={10} color="var(--accent-amber)" />
              <span
                style={{
                  fontSize: '0.625rem',
                  color: 'var(--accent-amber)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100px',
                }}
              >
                {playlistName || 'Playlist'}
              </span>
            </>
          ) : (
            <>
              <ListMusic size={10} color="var(--text-muted)" />
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                Belum dialokasikan
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
