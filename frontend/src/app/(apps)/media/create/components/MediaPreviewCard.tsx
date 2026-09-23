'use client';

import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface MediaPreviewCardProps {
  previewUrl: string | null;
  formData: {
    originalFilename: string;
    mediaType: number;
    mimeType: string;
    fileSizeBytes: number;
    width: number;
    height: number;
    durationSeconds: number;
  };
  fileSha256: string;
  handleClearFile: () => void;
}

export default function MediaPreviewCard({
  previewUrl,
  formData,
  fileSha256,
  handleClearFile,
}: MediaPreviewCardProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={16} color="#10b981" /> Berkas Terpilih & Terdeteksi
        </span>
        <button
          type="button"
          onClick={handleClearFile}
          className="btn btn-outline"
          style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <X size={14} /> Ganti Berkas
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', backgroundColor: 'var(--bg-base)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', alignItems: 'center' }}>
        {/* Media Preview Box */}
        <div
          style={{
            width: '160px',
            height: '100px',
            borderRadius: '6px',
            overflow: 'hidden',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
        >
          {formData.mediaType === 2 ? (
            <video src={previewUrl!} style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted />
          ) : (
            <img src={previewUrl!} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          )}
        </div>

        {/* Detected File Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {formData.originalFilename}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            <span>Ukuran: <strong>{formatBytes(formData.fileSizeBytes)}</strong></span>
            <span>Resolusi: <strong>{formData.width} × {formData.height} px</strong></span>
            <span>Format: <strong>{formData.mimeType}</strong></span>
            {formData.mediaType === 2 && (
              <span>Durasi: <strong style={{ color: 'var(--accent-amber)' }}>{formData.durationSeconds} detik</strong></span>
            )}
          </div>
          {fileSha256 && (
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              SHA-256: {fileSha256}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
