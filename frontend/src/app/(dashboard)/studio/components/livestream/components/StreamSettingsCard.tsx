'use client';

import React from 'react';

interface StreamSettingsCardProps {
  lowLatencyMode: boolean;
  onToggleLowLatency: (val: boolean) => void;
  autoReconnect: boolean;
  onToggleAutoReconnect: (val: boolean) => void;
}

export default function StreamSettingsCard({
  lowLatencyMode,
  onToggleLowLatency,
  autoReconnect,
  onToggleAutoReconnect,
}: StreamSettingsCardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
      {/* Low Latency Switch */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          transition: 'border-color 0.2s ease, background-color 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '12px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Mode Low-Latency
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Buffer minimal untuk siaran langsung real-time
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={lowLatencyMode}
          onClick={() => onToggleLowLatency(!lowLatencyMode)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            width: '38px',
            height: '22px',
            padding: '2px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: lowLatencyMode ? 'var(--primary-500)' : 'var(--bg-surface)',
            border: `1px solid ${lowLatencyMode ? 'var(--primary-500)' : 'var(--border-strong)'}`,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
              transform: lowLatencyMode ? 'translateX(16px)' : 'translateX(0)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </button>
      </div>

      {/* Auto Reconnect Switch */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          transition: 'border-color 0.2s ease, background-color 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '12px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Auto-Reconnect Otomatis
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Menyambungkan ulang otomatis jika koneksi jaringan atau kamera terputus
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoReconnect}
          onClick={() => onToggleAutoReconnect(!autoReconnect)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            width: '38px',
            height: '22px',
            padding: '2px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: autoReconnect ? 'var(--primary-500)' : 'var(--bg-surface)',
            border: `1px solid ${autoReconnect ? 'var(--primary-500)' : 'var(--border-strong)'}`,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
              transform: autoReconnect ? 'translateX(16px)' : 'translateX(0)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </button>
      </div>
    </div>
  );
}

