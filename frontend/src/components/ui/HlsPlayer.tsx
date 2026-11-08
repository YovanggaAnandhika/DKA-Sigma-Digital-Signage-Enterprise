'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Radio, RefreshCw, AlertCircle } from 'lucide-react';

interface HlsPlayerProps {
  src: string;
  poster?: string;
  isMuted?: boolean;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
  style?: React.CSSProperties;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

declare global {
  interface Window {
    Hls?: any;
  }
}

export default function HlsPlayer({
  src,
  poster,
  isMuted = true,
  autoPlay = true,
  controls = true,
  className,
  style,
  fallbackTitle = 'Menunggu Feed Ingest dari OBS Studio',
  fallbackDescription = 'Pastikan OBS Studio sedang streaming ke alamat RTMP dan Stream Key yang ditentukan.',
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hlsInstanceRef = useRef<any>(null);

  // Sync muted property directly to DOM element (crucial for Safari/WebKit autoplay)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.defaultMuted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    let isCancelled = false;

    function cleanup() {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (hlsInstanceRef.current) {
        try {
          hlsInstanceRef.current.destroy();
        } catch {
          // ignore
        }
        hlsInstanceRef.current = null;
      }
    }

    function initPlayer() {
      cleanup();
      setHasError(false);
      const video = videoRef.current;
      if (!video || !src) return;

      video.muted = isMuted;
      video.defaultMuted = isMuted;
      video.playsInline = true;

      // Check if native HLS is supported (Safari on Mac / iOS)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.load();
        if (autoPlay) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                if (!isCancelled) setIsPlaying(true);
              })
              .catch(() => {
                // If autoplay blocked or segment loading
              });
          }
        }
        return;
      }

      // Otherwise, use hls.js for Chrome, Firefox, Edge
      function attachHlsJs() {
        if (!window.Hls || !window.Hls.isSupported()) {
          setHasError(true);
          return;
        }

        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          liveSyncDurationCount: 1,
          liveMaxLatencyDurationCount: 2,
          maxLiveSyncPlaybackRate: 1.5,
          backBufferLength: 3,
        });
        hlsInstanceRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay && video) {
            video.play().catch(() => {});
          }
          if (!isCancelled) setIsPlaying(true);
        });

        hls.on(window.Hls.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal) {
            if (!isCancelled) {
              setHasError(true);
              setIsPlaying(false);
            }
            switch (data.type) {
              case window.Hls.ErrorTypes.NETWORK_ERROR:
                retryTimerRef.current = setTimeout(() => {
                  if (!isCancelled) {
                    hls.loadSource(src);
                    hls.startLoad();
                  }
                }, 2500);
                break;
              case window.Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                cleanup();
                break;
            }
          }
        });
      }

      if (window.Hls) {
        attachHlsJs();
      } else {
        const scriptId = 'hls-js-cdn-script';
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js';
          script.async = true;
          script.onload = () => {
            if (!isCancelled) attachHlsJs();
          };
          script.onerror = () => {
            if (!isCancelled) setHasError(true);
          };
          document.head.appendChild(script);
        } else {
          const interval = setInterval(() => {
            if (window.Hls) {
              clearInterval(interval);
              if (!isCancelled) attachHlsJs();
            }
          }, 100);
          setTimeout(() => clearInterval(interval), 5000);
        }
      }
    }

    initPlayer();

    return () => {
      isCancelled = true;
      cleanup();
    };
  }, [src, autoPlay, isMuted]);

  const handleVideoError = () => {
    setIsPlaying(false);
    setHasError(true);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = setTimeout(() => {
      const video = videoRef.current;
      if (video && src && video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = `${src.split('?')[0]}?_t=${Date.now()}`;
        video.load();
        if (autoPlay) video.play().catch(() => {});
      }
    }, 2500);
  };

  const handleManualReload = () => {
    setIsPlaying(false);
    setHasError(false);
    const video = videoRef.current;
    if (video) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = `${src.split('?')[0]}?_t=${Date.now()}`;
        video.load();
        video.play().catch(() => {});
      } else if (hlsInstanceRef.current && window.Hls) {
        hlsInstanceRef.current.loadSource(src);
        hlsInstanceRef.current.startLoad();
      }
    }
  };

  const syncToLiveEdge = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.seekable && video.seekable.length > 0) {
        const liveEdge = video.seekable.end(video.seekable.length - 1);
        // If lagging more than 1.5 seconds behind the newest frame, jump to live edge!
        if (liveEdge - video.currentTime > 1.5) {
          video.currentTime = Math.max(0, liveEdge - 0.2);
        }
      }
    } catch {
      // ignore
    }
  };

  const markPlaying = () => {
    setIsPlaying(true);
    setHasError(false);
    syncToLiveEdge();
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      {/* Video is always mounted and rendered so WebKit/Safari actively decodes and fires events */}
      <video
        ref={videoRef}
        poster={poster}
        muted={isMuted}
        autoPlay={autoPlay}
        controls={controls}
        playsInline
        onPlaying={markPlaying}
        onCanPlay={markPlaying}
        onLoadedData={markPlaying}
        onTimeUpdate={(e) => {
          if (e.currentTarget.currentTime > 0) markPlaying();
        }}
        onError={handleVideoError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          position: 'relative',
          zIndex: 1,
        }}
      />

      {/* Overlay: only visible while video is not yet playing */}
      {!isPlaying && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
          }}
        >
          {hasError ? (
            <>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}
              >
                <AlertCircle size={24} style={{ color: 'var(--accent-red)' }} />
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {fallbackTitle}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                {fallbackDescription}
              </p>
              <button
                type="button"
                onClick={handleManualReload}
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '6px 14px', gap: '6px' }}
              >
                <RefreshCw size={13} />
                <span>Coba Muat Ulang Pratinjau</span>
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}
              >
                <Radio size={24} style={{ color: 'var(--accent-emerald)' }} />
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Menghubungkan ke Feed Siaran Langsung...
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.5, margin: 0 }}>
                Menyiapkan segmen HLS otomatis dari server...
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
