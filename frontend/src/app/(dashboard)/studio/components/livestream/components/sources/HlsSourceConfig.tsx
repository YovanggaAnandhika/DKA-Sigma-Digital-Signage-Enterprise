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
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
        URL Sumber Siaran HLS (.m3u8)
      </label>
      <input
        type="url"
        value={sourceUrl}
        onChange={(e) => onChangeSourceUrl(e.target.value)}
        placeholder="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        className="form-input"
        style={{ fontFamily: 'monospace', fontSize: '0.76rem' }}
        required
      />
      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
        Masukkan tautan playlist HLS berformat <code>.m3u8</code> dari CDN atau server streaming Anda.
      </span>
    </div>
  );
}

