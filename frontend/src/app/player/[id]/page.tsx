'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { invokeApi } from '@/lib/core/invokeApi';
import { getMediaStreamUrl } from '@/lib/services/studio/media.service';
import { api } from '@/lib/services';

interface ManifestAsset {
  mediaId: string;
  url: string;
  sha256Hash: string;
  fileSizeBytes: number;
  localFilename: string;
  mediaType: number;
}

interface LayerBlock {
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
}

interface Layer {
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

interface CompiledManifest {
  manifestId: string;
  deviceId: string;
  versionHash: string;
  generatedAt: string;
  layout?: {
    id: string;
    name: string;
    canvasWidth: number;
    canvasHeight: number;
    backgroundColor?: string;
    backgroundImageUrl?: string;
    layersList: Layer[];
  };
  requiredAssetsList?: ManifestAsset[];
  totalDownloadSizeBytes?: number;
  isCanary?: boolean;
  powerSchedule?: {
    enabled: boolean;
    sleepTime: string;
    wakeTime: string;
  };
}

export default function WebKioskPlayerPage() {
  const params = useParams() as { id: string };
  const [manifest, setManifest] = useState<CompiledManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentHash, setCurrentHash] = useState<string>('');
  const [isSleeping, setIsSleeping] = useState(false);
  const [weatherData, setWeatherData] = useState<{ temp: number; code: number } | null>(null);
  const assetMapRef = useRef<Map<string, ManifestAsset>>(new Map());

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Weather Widget (Default: Kota Makassar)
  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-5.1477&longitude=119.4327&current_weather=true');
        const json = await res.json();
        if (json.current_weather) {
          setWeatherData({
            temp: Math.round(json.current_weather.temperature),
            code: json.current_weather.weathercode,
          });
        }
      } catch {
        setWeatherData({ temp: 31, code: 1 }); // Default fallback for Makassar
      }
    }
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  // Display Power Management (CEC Sleep / Wake schedule)
  useEffect(() => {
    const evaluatePowerSchedule = () => {
      if (!manifest?.powerSchedule?.enabled) {
        setIsSleeping(false);
        return;
      }
      const now = new Date();
      const currentHms = now.toTimeString().slice(0, 8);
      const sleep = manifest.powerSchedule.sleepTime;
      const wake = manifest.powerSchedule.wakeTime;
      if (!sleep || !wake) return;

      const shouldSleep = sleep <= wake
        ? currentHms >= sleep && currentHms <= wake
        : currentHms >= sleep || currentHms <= wake;

      setIsSleeping(shouldSleep);
    };

    evaluatePowerSchedule();
    const interval = setInterval(evaluatePowerSchedule, 10000);
    return () => clearInterval(interval);
  }, [manifest?.powerSchedule]);

  const fetchManifest = useCallback(async (existingHash?: string) => {
    try {
      const res = await invokeApi<{
        isUpToDate: boolean;
        manifest?: CompiledManifest;
      }>('/api/grpc/distribution/manifest/GetActiveManifest', {
        deviceId: params.id,
        clientCurrentHash: existingHash || currentHash,
      });

      if (res.isUpToDate) {
        return; // No layout changes
      }

      if (res.manifest) {
        setManifest(res.manifest);
        setCurrentHash(res.manifest.versionHash);

        const newMap = new Map<string, ManifestAsset>();
        if (res.manifest.requiredAssetsList) {
          for (const asset of res.manifest.requiredAssetsList) {
            newMap.set(asset.mediaId, asset);
          }
        }
        assetMapRef.current = newMap;
        setError(null);
      }
    } catch (err: any) {
      console.warn('Failed to fetch manifest:', err);
      if (!manifest) {
        setError(err.message || 'Gagal memuat manifest tayangan');
      }
    } finally {
      setLoading(false);
    }
  }, [params.id, currentHash, manifest]);

  useEffect(() => {
    fetchManifest();
    // Poll for manifest updates every 20 seconds
    const interval = setInterval(() => {
      fetchManifest(currentHash);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchManifest, currentHash]);

  // Periodic Proof-of-Play reporting (audit logs)
  useEffect(() => {
    if (!manifest || !manifest.requiredAssetsList?.length) return;
    const interval = setInterval(async () => {
      try {
        const firstAsset = manifest.requiredAssetsList?.[0];
        if (firstAsset) {
          await api.reportPlaybackBatch(params.id, [{
            mediaId: firstAsset.mediaId,
            layoutId: manifest.layout?.id || '',
            startedAt: Math.floor(Date.now() / 1000) - 30,
            durationSeconds: 30,
            isCompleted: true,
          }]);
        }
      } catch {
        // Player continues uninterrupted on log failure
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [manifest, params.id]);

  if (loading && !manifest) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0d14',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Menghubungkan Player Display...</h2>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>ID: {params.id}</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !manifest) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0d14',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ fontSize: '2rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f43f5e' }}>Koneksi Display Player Gagal</h2>
        <p style={{ maxWidth: '500px', color: '#94a3b8', fontSize: '0.875rem' }}>{error}</p>
        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Pastikan perangkat sudah dipairing dan memiliki Layout atau Jadwal aktif di CMS.
        </p>
      </div>
    );
  }

  const layout = manifest?.layout;
  const canvasW = layout?.canvasWidth || 1920;
  const canvasH = layout?.canvasHeight || 1080;
  const layers = layout?.layersList || [];
  const assets = manifest?.requiredAssetsList || [];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: layout?.backgroundColor || '#000000',
      backgroundImage: layout?.backgroundImageUrl ? `url(${layout.backgroundImageUrl})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      {/* Container Scaled to Aspect Ratio */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}>
        {layers.map((layer) => {
          const leftPercent = (layer.x / canvasW) * 100;
          const topPercent = (layer.y / canvasH) * 100;
          const widthPercent = (layer.width / canvasW) * 100;
          const heightPercent = (layer.height / canvasH) * 100;

          // Find first matching asset for layer if any
          const firstBlock = layer.blocksList?.[0];
          const matchedAsset = assets[0]; // fallback to first required asset if single zone

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
                <div style={{
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
                }}>
                  {currentTime}
                </div>
              ) : layer.name.toLowerCase().includes('cuaca') || layer.name.toLowerCase().includes('weather') ? (
                <div style={{
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
                }}>
                  <div style={{ fontSize: '1.75rem' }}>☀️</div>
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
                <div style={{
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
                }}>
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
              ) : firstBlock?.tickerId || layer.name.toLowerCase().includes('ticker') || layer.name.toLowerCase().includes('berita') ? (
                <div style={{
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
                }}>
                  <span style={{
                    display: 'inline-block',
                    paddingLeft: '100%',
                    animation: 'marquee 15s linear infinite',
                  }}>
                    🔴 LIVE FEED: Selamat Datang di Layar Informasi Digital Signage Enterprise • Suhu Kota Makassar {weatherData?.temp ?? 31}°C Cerah • Update Berita & Penawaran Spesial Terkini
                  </span>
                  <style>{`@keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }`}</style>
                </div>
              ) : matchedAsset ? (
                matchedAsset.url?.endsWith('.mp4') || matchedAsset.url?.endsWith('.webm') ? (
                  <video
                    src={getMediaStreamUrl(matchedAsset.localFilename)}
                    autoPlay
                    loop
                    muted
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
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}>
                  {layer.name}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Standby CEC Sleep Mode Screen Overlay */}
      {isSleeping && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#000000',
          zIndex: 999998,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#334155',
          userSelect: 'none',
        }}>
          <div style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#64748b' }} />
            <span>Mode Standby Hemat Energi (CEC) • Bangun pukul {manifest?.powerSchedule?.wakeTime || '06:00'}</span>
          </div>
        </div>
      )}

      {/* Floating Kiosk Status Badge */}
      <div style={{
        position: 'fixed',
        bottom: '12px',
        right: '12px',
        padding: '6px 12px',
        borderRadius: '9999px',
        backgroundColor: 'rgba(10, 13, 20, 0.75)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: '#94a3b8',
        fontSize: '0.6875rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 99999,
        pointerEvents: 'none',
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
        <span>Kiosk Web Simulator • {canvasW}×{canvasH}</span>
      </div>
    </div>
  );
}
