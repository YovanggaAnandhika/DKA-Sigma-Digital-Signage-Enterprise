'use client';

import React from 'react';

interface HlsSourceConfigProps {
  sourceUrl: string;
  onChangeSourceUrl: (val: string) => void;
}

export default function HlsSourceConfig({
  sourceUrl,
  onChangeSourceUrl,
}: HlsSourceConfigProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '4px',
          }}
        >
          URL Playlist HLS (.m3u8)
        </label>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => onChangeSourceUrl(e.target.value)}
          placeholder="https://cdn.example.com/live/stream.m3u8"
          className="form-input"
          style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
          required
        />
      </div>

      <div
        style={{
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          lineHeight: 1.45,
        }}
      >
        Diputar langsung oleh player Android (Media3 ExoPlayer HLS) dan browser tanpa relay ulang
        di server.
      </div>
    </div>
  );
}
