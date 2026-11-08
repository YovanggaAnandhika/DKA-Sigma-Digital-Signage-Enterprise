'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Radio, Tv } from 'lucide-react';
import { StreamMode, StreamSourceType, toYoutubeEmbedUrl } from '../types';

// Dynamic lazy load of HlsPlayer: only loaded on-demand in client
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
      Memuat pemutar video...
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
  posterImageUrl?: string;
}

export default function StreamPreviewMonitor({
  name,
  streamMode,
  sourceType,
  sourceUrl,
  streamKey,
  isMuted,
  posterImageUrl,
}: StreamPreviewMonitorProps) {
  return (
    <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Monitor Pratinjau Siaran
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
            Simulasi tampilan zona Live Stream pada kanvas layar signage.
          </p>
        </div>
        <span className="badge badge-neutral">{sourceType}</span>
      </div>

      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {sourceType === 'YOUTUBE_EMBED' ? (
          !sourceUrl.trim() ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
              <Radio size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Masukkan URL Sumber Stream</div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                Pratinjau video akan tampil secara otomatis di sini.
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
            poster={posterImageUrl?.trim() || undefined}
            isMuted={isMuted}
            autoPlay
            fallbackTitle={
              sourceType === 'RTMP'
                ? 'Menunggu Feed Ingest dari OBS Studio'
                : 'Menunggu Feed Live Stream Server'
            }
            fallbackDescription={
              sourceType === 'RTMP'
                ? `Mulai streaming dari OBS dengan Stream Key ${streamKey}. Segmen HLS akan langsung diputar otomatis di sini.`
                : 'Server sedang menghubungkan dan mengonversi feed sumber ke HLS.'
            }
          />
        ) : sourceType === 'HLS' ? (
          !sourceUrl.trim() ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
              <Radio size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Masukkan URL Sumber HLS</div>
            </div>
          ) : (
            <HlsPlayer
              src={sourceUrl.trim()}
              poster={posterImageUrl?.trim() || undefined}
              isMuted={isMuted}
              autoPlay
            />
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', maxWidth: '460px' }}>
            <Tv size={40} style={{ color: 'var(--primary-500)', marginBottom: '10px' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Feed {sourceType} Siap Dirender di Player Android
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
              Alamat <code>{sourceUrl}</code> akan diputar secara native oleh Media3 ExoPlayer (RTSP/HLS) pada
              perangkat Android TV dengan proteksi Auto-Reconnect.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

