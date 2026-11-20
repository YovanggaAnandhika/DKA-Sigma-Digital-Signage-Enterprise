'use client';

import React, { useMemo } from 'react';
import { parseYouTubeLiveUrl } from '@/lib/core/youtubeLive';

interface YoutubeSourceConfigProps {
  sourceUrl: string;
  onChangeSourceUrl: (val: string) => void;
}

export default function YoutubeSourceConfig({
  sourceUrl,
  onChangeSourceUrl,
}: YoutubeSourceConfigProps) {
  const parsed = useMemo(() => parseYouTubeLiveUrl(sourceUrl), [sourceUrl]);

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
          URL Siaran YouTube Live
        </label>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => onChangeSourceUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=... atau /channel/UC.../live"
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
        {parsed ? (
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
            {parsed.kind === 'video'
              ? `Terdeteksi Video ID: ${parsed.videoId}`
              : `Terdeteksi Channel Live: ${parsed.channelId} (otomatis mengikuti live terbaru)`}
          </span>
        ) : (
          <span>
            Mendukung link <code>youtube.com/watch?v=</code>, <code>/live/</code>,{' '}
            <code>youtu.be/</code>, dan link permanen <code>/channel/UC.../live</code>.
          </span>
        )}
      </div>
    </div>
  );
}
