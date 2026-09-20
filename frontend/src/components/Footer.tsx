'use client';

import React from 'react';

export function Footer() {
  return (
    <footer
      style={{
        height: '48px',
        borderTop: '2px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        position: 'sticky',
        bottom: 0,
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      <div style={{ fontWeight: 500 }}>
        &copy; 2026 OmniSign Digital Signage Platform. All rights reserved.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '0.6875rem',
            backgroundColor: 'var(--bg-surface-elevated)',
            padding: '2px 8px',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          v1.0.0-stable
        </span>
        <a href="#" style={{ color: 'inherit', fontWeight: 500 }} className="hover:text-primary-500">
          Dokumentasi
        </a>
        <a href="#" style={{ color: 'inherit', fontWeight: 500 }} className="hover:text-primary-500">
          Bantuan
        </a>
      </div>
    </footer>
  );
}
