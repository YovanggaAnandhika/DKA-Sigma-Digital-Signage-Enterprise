'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useDisplayDetail } from '../context/DisplayDetailContext';

export default function DisplayScreenshotModal() {
  const { selectedScreenshot, setSelectedScreenshot } = useDisplayDetail();

  if (!selectedScreenshot) return null;

  return (
    <div
      onClick={() => setSelectedScreenshot(null)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Tangkapan Layar Langsung (Live Screen Capture)
          </span>
          <button
            type="button"
            onClick={() => setSelectedScreenshot(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
          <img
            src={selectedScreenshot}
            alt="Enlarged screenshot"
            style={{ maxWidth: '85vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: '4px' }}
          />
        </div>
      </div>
    </div>
  );
}
