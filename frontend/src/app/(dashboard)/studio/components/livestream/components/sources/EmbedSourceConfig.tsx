'use client';

import React from 'react';

interface EmbedSourceConfigProps {
  sourceUrl: string;
  onChangeSourceUrl: (val: string) => void;
}

export default function EmbedSourceConfig({
  sourceUrl,
  onChangeSourceUrl,
}: EmbedSourceConfigProps) {
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
          URL Web Live Embed (Twitch / Vimeo / Lainnya)
        </label>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => onChangeSourceUrl(e.target.value)}
          placeholder="https://player.vimeo.com/video/... atau URL embed live"
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
        Ditampilkan melalui iframe / WebView terkelola di player Android maupun pratinjau CMS.
      </div>
    </div>
  );
}
