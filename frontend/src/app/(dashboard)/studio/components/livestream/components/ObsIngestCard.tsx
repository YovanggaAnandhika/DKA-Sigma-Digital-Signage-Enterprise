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
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '14px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Parameter Ingest OBS Studio
        </span>
        <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
          Siap Ingest
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '4px',
            }}
          >
            Server RTMP
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              readOnly
              value={serverUrl}
              className="form-input"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                padding: '6px 10px',
                backgroundColor: 'var(--bg-primary)',
              }}
            />
            <button
              type="button"
              onClick={() => handleCopy(serverUrl, 'server')}
              className="btn btn-outline"
              style={{ padding: '0 10px', gap: '5px', whiteSpace: 'nowrap', fontSize: '0.75rem' }}
              title="Salin Server RTMP"
            >
              {copiedField === 'server' ? (
                <Check size={13} style={{ color: 'var(--accent-emerald)' }} />
              ) : (
                <Copy size={13} />
              )}
              <span>{copiedField === 'server' ? 'Disalin' : 'Salin'}</span>
            </button>
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '4px',
            }}
          >
            Stream Key
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              readOnly
              value={streamKey}
              className="form-input"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                padding: '6px 10px',
                backgroundColor: 'var(--bg-primary)',
              }}
            />
            <button
              type="button"
              onClick={() => handleCopy(streamKey, 'key')}
              className="btn btn-outline"
              style={{ padding: '0 10px', gap: '5px', whiteSpace: 'nowrap', fontSize: '0.75rem' }}
              title="Salin Stream Key"
            >
              {copiedField === 'key' ? (
                <Check size={13} style={{ color: 'var(--accent-emerald)' }} />
              ) : (
                <Copy size={13} />
              )}
              <span>{copiedField === 'key' ? 'Disalin' : 'Salin'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
