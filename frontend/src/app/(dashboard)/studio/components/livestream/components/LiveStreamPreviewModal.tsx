'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { X, Tv, Volume2, VolumeX } from 'lucide-react';
import { LiveStreamConfig, toYoutubeEmbedUrl } from '../types';
import type { StreamPlaybackStatus } from '@/components/ui/HlsPlayer';

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
        backgroundColor: '#090d16',
        color: 'rgba(255,255,255,0.55)',
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
  const [isMuted, setIsMuted] = useState<boolean>(item?.isMuted ?? true);
  const [volume, setVolume] = useState<number>(0.8);
  const [playbackStatus, setPlaybackStatus] = useState<StreamPlaybackStatus>('OFFLINE');

  useEffect(() => {
    if (item) {
      setIsMuted(item.isMuted);
      setPlaybackStatus('OFFLINE');
    }
  }, [item]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) / 100;
    setVolume(val);
    if (val === 0 && !isMuted) {
      setIsMuted(true);
    } else if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const displayPercent = isMuted ? 0 : Math.round(volume * 100);

  const isHlsManaged = item.streamMode === 'SERVER_HOSTED_HLS' || item.sourceType === 'HLS';
  const effectiveStatus: StreamPlaybackStatus = isHlsManaged ? playbackStatus : 'LIVE';

  const statusColor =
    effectiveStatus === 'LIVE'
      ? 'var(--accent-emerald)'
      : effectiveStatus === 'BUFFERING'
        ? '#f59e0b'
        : 'var(--accent-red)';

  const statusLabel =
    effectiveStatus === 'LIVE'
      ? 'LIVE'
      : effectiveStatus === 'BUFFERING'
        ? 'BUFFERING'
        : 'STREAM OFF';

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
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '18px',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Modal Header with Live Status Badge, Audio Controls & Close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: statusColor,
                boxShadow: `0 0 8px ${statusColor}`,
                display: 'inline-block',
                transition: 'all 0.2s ease',
              }}
            />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {item.name}
            </h3>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                backgroundColor:
                  effectiveStatus === 'LIVE'
                    ? 'rgba(16, 185, 129, 0.14)'
                    : effectiveStatus === 'BUFFERING'
                      ? 'rgba(245, 158, 11, 0.14)'
                      : 'rgba(239, 68, 68, 0.14)',
                color: statusColor,
              }}
            >
              {statusLabel}
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
              {item.sourceType === 'YOUTUBE_EMBED' ? 'YOUTUBE' : item.sourceType}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Custom Volume & Mute Icon Control */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px 4px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
                aria-label={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.14)',
                  color: isMuted ? 'var(--accent-red)' : 'var(--accent-emerald)',
                }}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>

              <input
                type="range"
                min={0}
                max={100}
                value={displayPercent}
                onChange={handleVolumeChange}
                aria-label="Volume Audio"
                style={{
                  width: '72px',
                  height: '4px',
                  accentColor: isMuted ? 'var(--text-muted)' : 'var(--primary-500)',
                  cursor: 'pointer',
                }}
              />

              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  minWidth: '32px',
                  textAlign: 'right',
                  color: isMuted ? 'var(--text-muted)' : 'var(--text-primary)',
                }}
              >
                {isMuted ? 'MUTE' : `${displayPercent}%`}
              </span>
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
        </div>

        {/* Dedicated Broadcast Monitor Frame Bezel */}
        <div
          style={{
            padding: '8px',
            borderRadius: '16px',
            backgroundColor: '#0b0f19',
            border: '2px solid var(--border-strong)',
            boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.65), 0 12px 24px -8px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              backgroundColor: '#090d16',
              borderRadius: '10px',
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
                  src={toYoutubeEmbedUrl(item.sourceUrl, isMuted)}
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
                isMuted={isMuted}
                volume={volume}
                autoPlay
                controls={false}
                fallbackTitle="Stream Off"
                fallbackDescription={`Siaran ${item.name} sedang tidak aktif.`}
                onStatusChange={setPlaybackStatus}
              />
            ) : item.sourceType === 'HLS' ? (
              <HlsPlayer
                src={item.sourceUrl}
                poster={item.posterImageUrl || undefined}
                isMuted={isMuted}
                volume={volume}
                autoPlay
                controls={false}
                fallbackTitle="Stream Off"
                onStatusChange={setPlaybackStatus}
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
                <Tv size={38} style={{ color: 'var(--primary-500)' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                  Siaran {item.sourceType} Siap Ditayangkan
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', maxWidth: '460px' }}>
                  Aliran {item.sourceType} akan diputar langsung pada perangkat layar signage.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
