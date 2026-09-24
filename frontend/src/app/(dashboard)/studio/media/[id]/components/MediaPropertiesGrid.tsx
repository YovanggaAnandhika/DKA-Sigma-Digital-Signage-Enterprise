'use client';

import React from 'react';
import { MediaItem } from '@/lib/services';

interface MediaPropertiesGridProps {
  media: MediaItem;
}

export default function MediaPropertiesGrid({ media }: MediaPropertiesGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
      <div className="card-elevated" style={{ padding: '18px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIPE & FORMAT</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
          {media.mimeType || 'video/mp4'}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Durasi: {media.durationSeconds > 0 ? `${media.durationSeconds} detik` : 'Statis'}
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '18px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DIMENSI PIXEL</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
          {media.width} × {media.height} px
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Rasio: {(media.width / (media.height || 1)).toFixed(2)}:1
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '18px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>UKURAN FILE</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
          {(media.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          {media.fileSizeBytes.toLocaleString()} bytes
        </div>
      </div>
    </div>
  );
}
