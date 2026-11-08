'use client';

import React from 'react';

interface YoutubeSourceConfigProps {
  sourceUrl: string;
  onChangeSourceUrl: (val: string) => void;
}

export default function YoutubeSourceConfig({
  sourceUrl,
  onChangeSourceUrl,
}: YoutubeSourceConfigProps) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
        URL Siaran YouTube Live / Video
      </label>
      <input
        type="url"
        value={sourceUrl}
        onChange={(e) => onChangeSourceUrl(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=jfKfPfyJRdk"
        className="form-input"
        style={{ fontFamily: 'monospace', fontSize: '0.76rem' }}
        required
      />
      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
        Mendukung URL standar YouTube (<code>watch?v=...</code>), link pendek (<code>youtu.be/...</code>), atau link live (<code>/live/...</code>).
      </span>
    </div>
  );
}

