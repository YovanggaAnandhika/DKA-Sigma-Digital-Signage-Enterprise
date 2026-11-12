'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Volume2, VolumeX } from 'lucide-react';
import { StreamSourceType } from '../types';
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
  name?: string;
  sourceType: StreamSourceType;
  sourceUrl?: string;
  streamKey: string;
  serverHost?: string;
  isRelayActive?: boolean;
  lowLatencyMode?: boolean;
  autoReconnect?: boolean;
  isMuted?: boolean;
  onToggleMute?: (muted: boolean) => void;
  posterImageUrl?: string;
  bottomSlot?: React.ReactNode;
}

export default function StreamPreviewMonitor({
  sourceType,
  streamKey,
  lowLatencyMode = true,
  isMuted: initialMuted = true,
  onToggleMute,
  posterImageUrl,
  bottomSlot,
}: StreamPreviewMonitorProps) {
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(initialMuted);
  const [playbackStatus, setPlaybackStatus] = useState<StreamPlaybackStatus>('OFFLINE');

  React.useEffect(() => {
    setIsMuted(initialMuted);
  }, [initialMuted]);

  const handleMuteToggle = (muted: boolean) => {
    setIsMuted(muted);
    onToggleMute?.(muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) / 100;
    setVolume(val);
    if (val === 0 && !isMuted) {
      handleMuteToggle(true);
    } else if (val > 0 && isMuted) {
      handleMuteToggle(false);
    }
  };

  const displayPercent = isMuted ? 0 : Math.round(volume * 100);
  const effectiveStatus: StreamPlaybackStatus = playbackStatus;

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
      style={{
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '12px',
        backgroundColor: 'var(--bg-surface)',
        minHeight: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Top Monitor Status Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: statusColor,
              }}
            />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Monitor Siaran
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: statusColor,
                backgroundColor:
                  effectiveStatus === 'LIVE'
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              {statusLabel}
            </span>
          </div>

          {/* Volume Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleMuteToggle(!isMuted)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isMuted ? 'var(--text-muted)' : 'var(--primary-400)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px',
              }}
              title={isMuted ? 'Nyalakan Audio' : 'Matikan Audio'}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={displayPercent}
              onChange={handleVolumeChange}
              style={{
                width: '65px',
                height: '4px',
                accentColor: 'var(--primary-500)',
                cursor: 'pointer',
              }}
              aria-label="Volume Siaran"
            />
            <span
              style={{
                fontSize: '0.6875rem',
                fontFamily: 'monospace',
                color: 'var(--text-muted)',
                minWidth: '28px',
                textAlign: 'right',
              }}
            >
              {isMuted ? 'MUTE' : `${displayPercent}%`}
            </span>
          </div>
        </div>

        {/* Video Player Display */}
        <div
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: '9px',
            overflow: 'hidden',
            backgroundColor: '#090d16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <HlsPlayer
            src={`/streams/${streamKey}/live.m3u8`}
            poster={posterImageUrl || undefined}
            isMuted={isMuted}
            volume={volume}
            lowLatencyMode={lowLatencyMode}
            autoPlay
            controls={false}
            fallbackTitle="STREAM OFF"
            fallbackDescription={
              sourceType === 'RTMP' || sourceType === 'WHIP' || sourceType === 'SRT'
                ? 'Siaran OBS Studio sedang tidak aktif. Mulai streaming dari OBS untuk menayangkan video secara langsung.'
                : 'Aliran video dari sumber kamera sedang tidak aktif.'
            }
            onStatusChange={setPlaybackStatus}
          />
        </div>
      </div>

      {bottomSlot}
    </div>
  );
}
