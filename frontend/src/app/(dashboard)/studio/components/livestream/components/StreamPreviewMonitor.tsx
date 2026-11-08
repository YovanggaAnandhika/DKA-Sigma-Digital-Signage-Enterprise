'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Radio, Tv, Volume2, VolumeX } from 'lucide-react';
import { StreamMode, StreamSourceType, toYoutubeEmbedUrl } from '../types';
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
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.8125rem',
      }}
    >
      Memuat pemutar siaran...
    </div>
  ),
});

interface StreamPreviewMonitorProps {
  name: string;
  streamMode: StreamMode;
  sourceType: StreamSourceType;
  sourceUrl: string;
  streamKey: string;
  isMuted: boolean;
  onToggleMute: (muted: boolean) => void;
  posterImageUrl?: string;
}

export default function StreamPreviewMonitor({
  name,
  streamMode,
  sourceType,
  sourceUrl,
  streamKey,
  isMuted,
  onToggleMute,
  posterImageUrl,
}: StreamPreviewMonitorProps) {
  const [volume, setVolume] = useState<number>(0.8);
  const [playbackStatus, setPlaybackStatus] = useState<StreamPlaybackStatus>('OFFLINE');

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) / 100;
    setVolume(val);
    if (val === 0 && !isMuted) {
      onToggleMute(true);
    } else if (val > 0 && isMuted) {
      onToggleMute(false);
    }
  };

  const displayPercent = isMuted ? 0 : Math.round(volume * 100);

  const isHlsManaged = streamMode === 'SERVER_HOSTED_HLS' || sourceType === 'HLS';
  const effectiveStatus: StreamPlaybackStatus = isHlsManaged
    ? playbackStatus
    : sourceUrl.trim()
      ? 'LIVE'
      : 'OFFLINE';

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
      className="card-elevated"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        alignSelf: 'start',
      }}
    >
      {/* Top Studio Monitor Control Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
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
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Monitor Siaran
          </h2>
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
            {sourceType === 'YOUTUBE_EMBED' ? 'YOUTUBE' : sourceType}
          </span>
        </div>

        {/* Dedicated Volume & Mute Icon Control */}
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
            onClick={() => onToggleMute(!isMuted)}
            title={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
            aria-label={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.14)',
              color: isMuted ? 'var(--accent-red)' : 'var(--accent-emerald)',
              transition: 'all 0.15s ease',
            }}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <input
            type="range"
            min={0}
            max={100}
            value={displayPercent}
            onChange={handleVolumeChange}
            aria-label="Volume Audio"
            style={{
              width: '76px',
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
            borderRadius: '10px',
            overflow: 'hidden',
            backgroundColor: '#090d16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {sourceType === 'YOUTUBE_EMBED' ? (
            !sourceUrl.trim() ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', padding: '24px' }}>
                <Radio size={32} style={{ marginBottom: '8px', opacity: 0.6 }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff' }}>
                  Masukkan URL Siaran
                </div>
              </div>
            ) : (
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
                  src={toYoutubeEmbedUrl(sourceUrl, isMuted)}
                  title={name || 'YouTube Live Preview'}
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
            )
          ) : streamMode === 'SERVER_HOSTED_HLS' ? (
            <HlsPlayer
              src={`/streams/${streamKey}/live.m3u8`}
              poster={posterImageUrl || undefined}
              isMuted={isMuted}
              volume={volume}
              autoPlay
              controls={false}
              fallbackTitle="Stream Off"
              fallbackDescription={
                sourceType === 'RTMP'
                  ? 'Siaran OBS Studio sedang tidak aktif. Mulai streaming dari OBS untuk menayangkan video secara langsung.'
                  : 'Aliran video dari sumber kamera sedang tidak aktif.'
              }
              onStatusChange={setPlaybackStatus}
            />
          ) : sourceType === 'HLS' ? (
            !sourceUrl.trim() ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', padding: '24px' }}>
                <Radio size={32} style={{ marginBottom: '8px', opacity: 0.6 }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff' }}>
                  Masukkan URL HLS
                </div>
              </div>
            ) : (
              <HlsPlayer
                src={sourceUrl.trim()}
                poster={posterImageUrl || undefined}
                isMuted={isMuted}
                volume={volume}
                autoPlay
                controls={false}
                fallbackTitle="Stream Off"
                onStatusChange={setPlaybackStatus}
              />
            )
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', maxWidth: '420px' }}>
              <Tv size={36} style={{ color: 'var(--primary-500)', marginBottom: '10px' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                Siaran {sourceType} Siap Ditayangkan
              </div>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', marginTop: '6px', lineHeight: 1.5 }}>
                Aliran video akan diputar langsung pada perangkat layar signage.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
