'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Copy, ExternalLink, AlertTriangle, UploadCloud } from 'lucide-react';
import { MediaItem } from '@/lib/services';

interface MediaVisualPreviewProps {
  media: MediaItem;
  copied: boolean;
  handleCopyUrl: () => void;
  mediaLoadError: boolean;
  setMediaLoadError: (val: boolean) => void;
}

export default function MediaVisualPreview({
  media,
  copied,
  handleCopyUrl,
  mediaLoadError,
  setMediaLoadError,
}: MediaVisualPreviewProps) {
  return (
    <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Pratinjau Visual (Media Preview)
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: media.mediaType === 2 ? 'rgba(6, 182, 212, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: media.mediaType === 2 ? 'var(--accent-cyan)' : 'var(--accent-emerald)',
              border: `1px solid ${media.mediaType === 2 ? 'rgba(6, 182, 212, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            }}
          >
            {media.mediaType === 2 ? '🎬 Video MP4' : media.mediaType === 3 ? '🌐 Web URL' : '🖼️ Gambar'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Salin URL Aset"
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Tersalin!' : 'Salin URL'}</span>
          </button>
          <a
            href={media.publicUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            title="Buka Berkas Asli di Tab Baru"
          >
            <ExternalLink size={14} />
            <span>Buka Asli</span>
          </a>
        </div>
      </div>

      {/* Visual Viewport Box */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '340px',
          maxHeight: '520px',
          backgroundColor: '#0a0f1d',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        {mediaLoadError ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', maxWidth: '480px' }}>
            <AlertTriangle size={40} color="var(--accent-amber)" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem', marginBottom: '8px' }}>
              Pratinjau Visual Tidak Dapat Dimuat
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.8125rem', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              {media.publicUrl.startsWith('blob:')
                ? 'Tautan ini sebelumnya tersimpan sebagai memori sementara (blob:) dan telah kedaluwarsa setelah refresh. Silakan unggah berkas baru agar tersimpan permanen di server.'
                : `Berkas pada alamat "${media.publicUrl}" tidak dapat diakses atau tidak ditemukan.`}
            </p>
            <Link href="/studio/media/create" className="btn btn-primary" style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <UploadCloud size={16} />
              <span>Unggah Media Baru</span>
            </Link>
          </div>
        ) : media.mediaType === 2 ? (
          <video
            src={media.publicUrl}
            controls
            autoPlay
            muted
            loop
            onError={() => setMediaLoadError(true)}
            style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
          />
        ) : media.mediaType === 3 ? (
          <iframe
            src={media.publicUrl}
            title={media.name}
            style={{ width: '100%', height: '460px', border: 'none' }}
          />
        ) : (
          <img
            src={media.publicUrl}
            alt={media.name}
            onError={() => setMediaLoadError(true)}
            style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
          />
        )}
      </div>
    </div>
  );
}
