'use client';

import React from 'react';
import { Sun, Volume2 } from 'lucide-react';
import { getMediaStreamUrl } from '@/lib/services/studio/media.service';

export interface ManifestAsset {
  mediaId: string;
  url: string;
  sha256Hash: string;
  fileSizeBytes: number;
  localFilename: string;
  mediaType: number;
}

export interface LayerBlock {
  id: string;
  playlistId?: string;
  mediaItemId?: string;
  startTimeSeconds?: number;
  durationSeconds?: number;
  tickerId?: string;
  clockId?: string;
  webviewId?: string;
  queueId?: string;
  albumId?: string;
  widgetData?: any;
  widgetDataJson?: string;
}

export interface Layer {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  backgroundColor?: string;
  blocksList?: LayerBlock[];
}

interface PlayerLayerRendererProps {
  layer: Layer;
  canvasW: number;
  canvasH: number;
  currentTime: string;
  weatherData: { temp: number; code: number } | null;
  queueState: { ticket: string; counter: string; isCalling: boolean };
  matchedAsset?: ManifestAsset;
  videoRefs: React.MutableRefObject<Map<string, HTMLVideoElement>>;
  isAudioDucked: boolean;
  isMuted: boolean;
}

export default function PlayerLayerRenderer({
  layer,
  canvasW,
  canvasH,
  currentTime,
  weatherData,
  queueState,
  matchedAsset,
  videoRefs,
  isAudioDucked,
  isMuted,
}: PlayerLayerRendererProps) {
  const leftPercent = (layer.x / canvasW) * 100;
  const topPercent = (layer.y / canvasH) * 100;
  const widthPercent = (layer.width / canvasW) * 100;
  const heightPercent = (layer.height / canvasH) * 100;

  const firstBlock = layer.blocksList?.[0];

  return (
    <div
      key={layer.id}
      style={{
        position: 'absolute',
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
        zIndex: layer.zIndex || 1,
        backgroundColor: layer.backgroundColor || 'transparent',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Check if widget block */}
      {firstBlock?.clockId || layer.name.toLowerCase().includes('clock') || layer.name.toLowerCase().includes('jam') ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: 'clamp(1.5rem, 4vw, 4rem)',
            fontWeight: 800,
            fontFamily: 'monospace',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            letterSpacing: '0.05em',
          }}
        >
          {currentTime}
        </div>
      ) : layer.name.toLowerCase().includes('cuaca') || layer.name.toLowerCase().includes('weather') ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.8), rgba(15, 23, 42, 0.9))',
            backdropFilter: 'blur(10px)',
            color: '#ffffff',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Sun size={32} color="#fbbf24" />
          </div>
          <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 800 }}>
            {weatherData ? `${weatherData.temp}°C` : '31°C'}
          </div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#93c5fd' }}>
            Makassar, Sulawesi Selatan
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#cbd5e1' }}>
            Prakiraan: Cerah Berawan
          </div>
        </div>
      ) : layer.name.toLowerCase().includes('qr') ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: '#ffffff',
            color: '#0f172a',
            padding: '12px',
          }}
        >
          {/* Clean SVG QR Code pattern */}
          <svg width="70%" height="70%" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" fill="white" />
            <rect x="10" y="10" width="25" height="25" fill="#0f172a" />
            <rect x="15" y="15" width="15" height="15" fill="white" />
            <rect x="18" y="18" width="9" height="9" fill="#0f172a" />
            <rect x="65" y="10" width="25" height="25" fill="#0f172a" />
            <rect x="70" y="15" width="15" height="15" fill="white" />
            <rect x="73" y="18" width="9" height="9" fill="#0f172a" />
            <rect x="10" y="65" width="25" height="25" fill="#0f172a" />
            <rect x="15" y="70" width="15" height="15" fill="white" />
            <rect x="18" y="73" width="9" height="9" fill="#0f172a" />
            <rect x="42" y="15" width="8" height="25" fill="#0f172a" />
            <rect x="42" y="55" width="18" height="8" fill="#0f172a" />
            <rect x="65" y="65" width="10" height="20" fill="#0f172a" />
            <rect x="80" y="65" width="10" height="10" fill="#0f172a" />
          </svg>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#334155' }}>
            Scan Promo Smartphone
          </span>
        </div>
      ) : firstBlock?.queueId || layer.name.toLowerCase().includes('antrian') || layer.name.toLowerCase().includes('queue') ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(12px, 3vh, 24px)',
            background: 'linear-gradient(145deg, #0f172a, #1e293b)',
            border: queueState.isCalling ? '3px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            boxShadow: queueState.isCalling ? '0 0 40px rgba(16, 185, 129, 0.4)' : 'none',
            padding: '24px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.75rem)',
              fontWeight: 700,
              color: '#94a3b8',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Layar Antrian Baru
          </div>

          <div
            style={{
              fontSize: 'clamp(3.5rem, 10vw, 7.5rem)',
              fontWeight: 900,
              fontFamily: 'monospace',
              color: queueState.isCalling ? '#10b981' : '#38bdf8',
              letterSpacing: '0.04em',
              textShadow: queueState.isCalling ? '0 0 35px rgba(16, 185, 129, 0.8)' : '0 4px 15px rgba(0,0,0,0.5)',
              transition: 'all 0.3s ease',
            }}
          >
            {queueState.ticket}
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#059669',
              color: '#ffffff',
              padding: '12px 36px',
              borderRadius: '9999px',
              fontSize: 'clamp(1.125rem, 2.5vw, 2rem)',
              fontWeight: 800,
              letterSpacing: '0.08em',
              boxShadow: '0 4px 20px rgba(5, 150, 105, 0.5)',
            }}
          >
            {queueState.counter}
          </div>

          {queueState.isCalling && (
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                padding: '6px 16px',
                borderRadius: '9999px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <Volume2 size={14} />
              <span>SEDANG DIPANGGIL (AUDIO DUCKING 15%)</span>
            </div>
          )}
        </div>
      ) : firstBlock?.tickerId || layer.name.toLowerCase().includes('ticker') || layer.name.toLowerCase().includes('berita') ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)',
            color: '#ffffff',
            padding: '0 16px',
            fontWeight: 600,
            fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              paddingLeft: '100%',
              animation: 'marquee 15s linear infinite',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
            LIVE FEED: Selamat Datang di Layar Informasi Digital Signage Enterprise • Suhu Kota Makassar {weatherData?.temp ?? 31}°C Cerah • Update Berita & Penawaran Spesial Terkini
          </span>
          <style>{`@keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }`}</style>
        </div>
      ) : matchedAsset ? (
        matchedAsset.url?.endsWith('.mp4') || matchedAsset.url?.endsWith('.webm') ? (
          <video
            ref={(el) => {
              if (el) {
                videoRefs.current.set(layer.id, el);
                el.volume = isAudioDucked ? 0.15 : 1.0;
              } else {
                videoRefs.current.delete(layer.id);
              }
            }}
            src={getMediaStreamUrl(matchedAsset.localFilename)}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <img
            src={getMediaStreamUrl(matchedAsset.localFilename)}
            alt={layer.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {layer.name}
        </div>
      )}
    </div>
  );
}
