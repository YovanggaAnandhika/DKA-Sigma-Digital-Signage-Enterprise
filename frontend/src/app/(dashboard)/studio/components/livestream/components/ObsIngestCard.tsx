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
        gap: '12px',
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Parameter Ingest OBS Studio
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Salin parameter berikut ke OBS Studio (Settings → Stream → Service: Custom).
          </div>
        </div>
        <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
          Ingest Siap
        </span>
      </div>

      {/* Server RTMP Row */}
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
          Server RTMP
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            readOnly
            value={serverUrl}
            className="form-input"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem', backgroundColor: 'var(--bg-primary)' }}
          />
          <button
            type="button"
            onClick={() => handleCopy(serverUrl, 'server')}
            className="btn btn-outline"
            style={{ padding: '0 12px', gap: '6px', whiteSpace: 'nowrap' }}
            title="Salin URL Server"
          >
            {copiedField === 'server' ? (
              <Check size={14} style={{ color: 'var(--accent-emerald)' }} />
            ) : (
              <Copy size={14} />
            )}
            <span>{copiedField === 'server' ? 'Tersalin' : 'Salin'}</span>
          </button>
        </div>
      </div>

      {/* Stream Key Row */}
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
          Stream Key (Murni UUID)
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            readOnly
            value={streamKey}
            className="form-input"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem', backgroundColor: 'var(--bg-primary)' }}
          />
          <button
            type="button"
            onClick={() => handleCopy(streamKey, 'key')}
            className="btn btn-outline"
            style={{ padding: '0 12px', gap: '6px', whiteSpace: 'nowrap' }}
            title="Salin Stream Key UUID"
          >
            {copiedField === 'key' ? (
              <Check size={14} style={{ color: 'var(--accent-emerald)' }} />
            ) : (
              <Copy size={14} />
            )}
            <span>{copiedField === 'key' ? 'Tersalin' : 'Salin'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

