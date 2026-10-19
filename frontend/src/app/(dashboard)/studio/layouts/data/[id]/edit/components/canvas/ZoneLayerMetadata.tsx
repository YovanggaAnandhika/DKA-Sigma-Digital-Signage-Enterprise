'use client';

import React from 'react';
import { Volume2, VolumeX, Lock } from 'lucide-react';
import { Layer } from '../../context/LayoutStateContext';

interface ZoneLayerMetadataProps {
  layer: Layer;
  active: boolean;
  isSelected: boolean;
  isHovered: boolean;
  color: string;
  availablePlaylists: any[];
  activeMedia: any;
  activeBlock: any;
  isEffectiveMuted: boolean;
}

export default function ZoneLayerMetadata({
  layer: z,
  active,
  isSelected,
  isHovered,
  color,
  availablePlaylists,
  activeMedia,
  activeBlock,
  isEffectiveMuted,
}: ZoneLayerMetadataProps) {
  const hasContent = !!(activeMedia?.publicUrl || activeBlock?.widgetType);

  if (hasContent) {
    return (
      <>
        {/* Minimal corner tag: only visible when hovered or selected */}
        <div
          style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'var(--bg-surface-elevated)',
            backdropFilter: 'blur(4px)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            maxWidth: '85%',
            opacity: isHovered || isSelected ? 1 : 0,
            transform: isHovered || isSelected ? 'translateY(0)' : 'translateY(-2px)',
            transition: 'opacity 0.15s ease, transform 0.15s ease',
            pointerEvents: isHovered || isSelected ? 'auto' : 'none',
          }}
        >
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {z.name}
          </span>
          {z.blocksList && z.blocksList.length > 0 && (
            <span
              style={{
                fontSize: '0.5625rem',
                color: 'var(--accent-amber)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                borderLeft: '1px solid var(--border-subtle)',
                paddingLeft: '4px',
              }}
            >
              {z.blocksList[0].widgetType
                ? z.blocksList[0].widgetData?.name || z.blocksList[0].widgetType
                : z.blocksList[0].mediaItemId
                ? 'Media'
                : availablePlaylists.find((p) => p.id === z.blocksList[0].playlistId)?.name || 'Playlist'}
            </span>
          )}
          {activeMedia?.mediaType === 2 && (
            <span
              style={{
                fontSize: '0.5625rem',
                color: isEffectiveMuted ? '#f87171' : '#4ade80',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                borderLeft: '1px solid var(--border-subtle)',
                paddingLeft: '4px',
              }}
              title={isEffectiveMuted ? 'Audio dibisukan' : 'Audio aktif'}
            >
              {isEffectiveMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
            </span>
          )}
          {z.isLocked && (
            <span
              style={{
                fontSize: '0.5625rem',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                borderLeft: '1px solid var(--border-subtle)',
                paddingLeft: '4px',
              }}
              title="Layer terkunci"
            >
              <Lock size={10} />
            </span>
          )}
        </div>

        {/* Bottom right dimension tag (only when selected) */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              bottom: '6px',
              right: '6px',
              zIndex: 2,
              backgroundColor: 'var(--bg-surface-elevated)',
              backdropFilter: 'blur(4px)',
              padding: '2px 5px',
              borderRadius: '4px',
              fontSize: '0.5625rem',
              fontWeight: 600,
              color: 'var(--primary-500)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {Math.round(z.width)}×{Math.round(z.height)}
          </div>
        )}
      </>
    );
  }

  /* Fallback centered label for empty layersList without media */
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: active ? `${color}${isSelected ? '55' : '22'}` : 'var(--bg-surface-elevated)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          textAlign: 'center',
          opacity: isHovered || isSelected ? 1 : 0.45,
          transition: 'opacity 0.15s ease',
        }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: active ? '#ffffff' : '#94a3b8',
            textAlign: 'center',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}
        >
          {z.name}
        </div>
        <div
          style={{
            fontSize: '0.625rem',
            color: isSelected ? '#93c5fd' : '#94a3b8',
            marginTop: '2px',
            fontWeight: 600,
          }}
        >
          {Math.round(z.width)}×{Math.round(z.height)}
        </div>
        {!active && !isSelected && (
          <span
            style={{
              fontSize: '0.5625rem',
              color: '#94a3b8',
              marginTop: '2px',
              fontStyle: 'italic',
            }}
          >
            (Mati di timeline)
          </span>
        )}
      </div>
    </>
  );
}
