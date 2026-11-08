'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface ObsIngestCardProps {
  serverUrl: string;
  streamKey: string;
}

export default function ObsIngestCard({ serverUrl, streamKey }: ObsIngestCardProps) {
  const [copiedField, setCopiedField] = useState<'server' | 'key' | null>(null);

  const handleCopy = (text: string, field: 'server' | 'key') => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            Server RTMP OBS
          </label>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
            Siap Ingest
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            readOnly
            value={serverUrl}
            className="form-input"
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              padding: '5px 8px',
              backgroundColor: 'var(--bg-primary)',
            }}
          />
          <button
            type="button"
            onClick={() => handleCopy(serverUrl, 'server')}
            className="btn btn-outline"
            style={{ padding: '0 9px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.72rem' }}
            title="Salin Server RTMP"
          >
            {copiedField === 'server' ? (
              <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
            ) : (
              <Copy size={12} />
            )}
            <span>{copiedField === 'server' ? 'Disalin' : 'Salin'}</span>
          </button>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            Stream Key
          </label>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            UUID
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            readOnly
            value={streamKey}
            className="form-input"
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              padding: '5px 8px',
              backgroundColor: 'var(--bg-primary)',
            }}
          />
          <button
            type="button"
            onClick={() => handleCopy(streamKey, 'key')}
            className="btn btn-outline"
            style={{ padding: '0 9px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.72rem' }}
            title="Salin Stream Key"
          >
            {copiedField === 'key' ? (
              <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
            ) : (
              <Copy size={12} />
            )}
            <span>{copiedField === 'key' ? 'Disalin' : 'Salin'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
