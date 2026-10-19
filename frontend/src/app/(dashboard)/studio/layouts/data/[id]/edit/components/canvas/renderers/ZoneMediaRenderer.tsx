'use client';

import React from 'react';
import SynchronizedVideo from '../SynchronizedVideo';
import { Layer } from '../../../context/LayoutStateContext';

interface ZoneMediaRendererProps {
  activeMedia: any;
  layer: Layer;
  isPlaying: boolean;
  active: boolean;
  isEffectiveMuted: boolean;
  currentVolumeLevel: number;
  itemOffsetSec: number;
  absoluteStartSec: number;
  reportBuffer?: (ranges: { start: number; end: number }[]) => void;
  filterCssString: string;
}

export default function ZoneMediaRenderer({
  activeMedia,
  layer: z,
  isPlaying,
  active,
  isEffectiveMuted,
  currentVolumeLevel,
  itemOffsetSec,
  absoluteStartSec,
  reportBuffer,
  filterCssString,
}: ZoneMediaRendererProps) {
  if (!activeMedia?.publicUrl) return null;

  if (activeMedia.mediaType === 2) {
    return (
      <div style={{ filter: filterCssString, width: '100%', height: '100%' }}>
        <SynchronizedVideo
          src={activeMedia.publicUrl}
          isPlaying={isPlaying}
          active={active}
          isMuted={isEffectiveMuted}
          volumeLevel={currentVolumeLevel}
          targetTimeSec={itemOffsetSec}
          onBufferUpdate={reportBuffer}
          timelineStartSec={absoluteStartSec}
        />
      </div>
    );
  }

  if (activeMedia.mediaType === 3) {
    return (
      <iframe
        src={activeMedia.publicUrl || activeMedia.originalFilename}
        title={activeMedia.name || z.name}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          filter: filterCssString,
          pointerEvents: isPlaying ? 'auto' : 'none',
        }}
      />
    );
  }

  return (
    <img
      src={activeMedia.publicUrl}
      alt={activeMedia.name || z.name}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        filter: filterCssString,
      }}
      onError={(e) => {
        (e.target as HTMLElement).style.display = 'none';
      }}
    />
  );
}
