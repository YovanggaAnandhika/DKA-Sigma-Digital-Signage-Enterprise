'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, Tv } from 'lucide-react';
import { LiveStreamConfig, toYoutubeEmbedUrl } from '../types';

// Dynamic lazy load of HlsPlayer: only loaded when modal opens
const HlsPlayer = dynamic(() => import('@/components/ui/HlsPlayer'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        color: 'var(--text-muted)',
        fontSize: '0.8125rem',
      }}
    >
      Memuat pemutar siaran...
    </div>
  ),
});

interface LiveStreamPreviewModalProps {
  item: LiveStreamConfig | null;
  onClose: () => void;
}

export default function LiveStreamPreviewModal({ item, onClose }: LiveStreamPreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card-elevated"
        style={{
          width: '100%',
          maxWidth: '820px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {item.name}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Mode: {item.streamMode === 'SERVER_HOSTED_HLS' ? 'Server HLS Relay' : 'Direct Embed'} • Protokol: {item.sourceType}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
            aria-label="Tutup Pratinjau"
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            backgroundColor: '#000000',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {item.sourceType === 'YOUTUBE_EMBED' ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              <iframe
                src={toYoutubeEmbedUrl(item.sourceUrl, item.isMuted)}
                title={item.name}
                style={{
                  position: 'absolute',
                  top: '-14%',
                  left: 0,
                  width: '100%',
                  height: '128%',
                  border: 'none',
                  pointerEvents: 'none',
                }}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : item.streamMode === 'SERVER_HOSTED_HLS' ? (
            <HlsPlayer
              src={item.serverHlsEndpoint || `/streams/${item.id}/live.m3u8`}
              poster={item.posterImageUrl || undefined}
              isMuted={item.isMuted}
              autoPlay
              fallbackTitle="Menunggu Feed Live Stream Server"
              fallbackDescription={`Server sedang menyiapkan segmen HLS untuk stream ${item.name}.`}
            />
          ) : item.sourceType === 'HLS' ? (
            <HlsPlayer
              src={item.sourceUrl}
              poster={item.posterImageUrl || undefined}
              isMuted={item.isMuted}
              autoPlay
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '32px',
                textAlign: 'center',
              }}
            >
              <Tv size={42} style={{ color: 'var(--primary-500)' }} />
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Stream {item.sourceType} Siap Ditayangkan di Player Android (ExoPlayer RTSP/RTMP)
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '520px' }}>
                Protokol <code>{item.sourceType}</code> ({item.sourceUrl}) dirender secara native oleh Media3 ExoPlayer di perangkat TV Android atau melalui endpoint HLS Relay <code>{item.serverHlsEndpoint || `/streams/${item.id}/live.m3u8`}</code>.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

