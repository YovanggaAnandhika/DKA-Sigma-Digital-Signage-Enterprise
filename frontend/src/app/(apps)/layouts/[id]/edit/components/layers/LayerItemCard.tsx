'use client';

import React from 'react';
import { Film, ListMusic } from 'lucide-react';
import { useLayoutEditor } from '../../context/LayoutEditorContext';
import { Zone } from '../../context/LayoutStateContext';

interface LayerItemCardProps {
  z: Zone;
}

export default function LayerItemCard({ z }: LayerItemCardProps) {
  const { selectedZoneId, setSelectedZoneId, availablePlaylists, mediaList, setPickerZoneId, setInspectorTarget, setSelectedBlockId, setIsInspectorCollapsed } = useLayoutEditor();

  const isSelected = z.id === selectedZoneId;
  const hasBlocks = z.blocksList && z.blocksList.length > 0;
  const firstBlock = hasBlocks ? z.blocksList[0] : null;
  const assignedPl = firstBlock ? availablePlaylists.find((p) => p.id === firstBlock.playlistId) : null;
  const playlistName = hasBlocks ? `${z.blocksList.length} Blok Konten` : null;
  const firstItem = assignedPl?.itemsList?.[0];
  const layerMedia = firstItem ? mediaList.find((m) => m.id === firstItem.mediaItemId) : null;
  const isVideo = layerMedia?.mediaType === 2;

  const handleClick = () => {
    setSelectedZoneId(z.id);
    setSelectedBlockId(null);
    setInspectorTarget('zone');
    setIsInspectorCollapsed(false);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
        borderBottom: '1px solid var(--border-subtle)',
        borderLeft: isSelected ? '3px solid var(--primary-500)' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.1s ease',
      }}
    >
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
          title="Klik untuk ubah konten zona"
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
