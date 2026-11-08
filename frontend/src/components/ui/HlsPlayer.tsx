'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Tv, Loader2 } from 'lucide-react';

export type StreamPlaybackStatus = 'OFFLINE' | 'BUFFERING' | 'LIVE';

interface HlsPlayerProps {
  src: string;
  poster?: string;
  isMuted?: boolean;
  volume?: number;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
  style?: React.CSSProperties;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onStatusChange?: (status: StreamPlaybackStatus) => void;
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
  volume = 0.8,
  autoPlay = true,
  controls = false,
  className,
  style,
  fallbackTitle = 'Stream Off',
  fallbackDescription = 'Siaran langsung sedang tidak aktif. Mulai streaming dari perangkat pengirim untuk menayangkan video.',
  onStatusChange,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<StreamPlaybackStatus>('OFFLINE');
  const [hasFirstFrame, setHasFirstFrame] = useState<boolean>(false);

  const statusRef = useRef<StreamPlaybackStatus>('OFFLINE');
  const hasFirstFrameRef = useRef<boolean>(false);
  const hlsInstanceRef = useRef<any>(null);
  const isStreamOnlineRef = useRef<boolean>(false);
  const lastMediaTimeRef = useRef<number>(-1);
  const lastMediaTickAtRef = useRef<number>(Date.now());

  const updateStatus = useCallback(
    (next: StreamPlaybackStatus) => {
      statusRef.current = next;
      setStatus((prev) => {
        if (prev !== next) {
          onStatusChange?.(next);
        }
        return next;
      });
    },
    [onStatusChange]
  );

  const markFirstFrame = useCallback(() => {
    hasFirstFrameRef.current = true;
    setHasFirstFrame(true);
  }, []);

  // Sync muted & volume directly to DOM element without reloading stream
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.defaultMuted = isMuted;
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [isMuted, volume]);

  const stopAndResetVideo = useCallback(() => {
    if (hlsInstanceRef.current) {
      try {
        hlsInstanceRef.current.destroy();
      } catch {
        // ignore
      }
      hlsInstanceRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch {
        // ignore
      }
    }
    hasFirstFrameRef.current = false;
    setHasFirstFrame(false);
  }, []);

  const syncToLiveEdge = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.seekable && video.seekable.length > 0) {
        const liveEdge = video.seekable.end(video.seekable.length - 1);
        if (liveEdge - video.currentTime > 1.8) {
          video.currentTime = Math.max(0, liveEdge - 0.3);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handlePlaying = useCallback(() => {
    if (!isStreamOnlineRef.current && src.startsWith('/streams/')) return;
    lastMediaTickAtRef.current = Date.now();
    markFirstFrame();
    updateStatus('LIVE');
    syncToLiveEdge();
  }, [src, markFirstFrame, updateStatus, syncToLiveEdge]);

  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (hlsInstanceRef.current) {
      try {
        hlsInstanceRef.current.destroy();
      } catch {
        // ignore
      }
      hlsInstanceRef.current = null;
    }

    updateStatus('BUFFERING');

    video.muted = isMuted;
    video.defaultMuted = isMuted;
    video.volume = Math.max(0, Math.min(1, volume));
    video.playsInline = true;

    const cleanSrc = `${src.split('?')[0]}?_t=${Date.now()}`;

    // Native HLS (Safari on macOS / iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = cleanSrc;
      video.load();
      if (autoPlay) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              handlePlaying();
            })
            .catch(() => {});
        }
      }
      return;
    }

    // hls.js for Chrome, Firefox, Edge
    const attachHlsJs = () => {
      if (!window.Hls || !window.Hls.isSupported()) {
        updateStatus('OFFLINE');
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

      hls.loadSource(cleanSrc);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay && video) {
          video
            .play()
            .then(() => handlePlaying())
            .catch(() => {});
        }
        handlePlaying();
      });

      hls.on(window.Hls.Events.ERROR, (_event: any, data: any) => {
        if (data.fatal) {
          if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            isStreamOnlineRef.current = false;
            stopAndResetVideo();
            updateStatus('OFFLINE');
          }
        }
      });
    };

    if (window.Hls) {
      attachHlsJs();
    } else {
      const scriptId = 'hls-js-cdn-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js';
        script.async = true;
        script.onload = () => attachHlsJs();
        document.head.appendChild(script);
      } else {
        const waitTimer = setInterval(() => {
          if (window.Hls) {
            clearInterval(waitTimer);
            attachHlsJs();
          }
        }, 100);
        setTimeout(() => clearInterval(waitTimer), 4000);
      }
    }
  }, [src, autoPlay, isMuted, volume, handlePlaying, stopAndResetVideo, updateStatus]);

  // Real-time Watchdog: detects instant start, instant stop, and slow network buffering
  useEffect(() => {
    if (!src) {
      stopAndResetVideo();
      updateStatus('OFFLINE');
      return;
    }

    let isCancelled = false;
    const isLocalRelay = src.startsWith('/streams/');

    if (!isLocalRelay) {
      isStreamOnlineRef.current = true;
      startPlayback();
      return () => {
        isCancelled = true;
        stopAndResetVideo();
      };
    }

    const checkStreamAvailability = async () => {
      if (isCancelled) return;
      try {
        const res = await fetch(`${src.split('?')[0]}?_t=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (isCancelled) return;

        if (res.ok) {
          if (!isStreamOnlineRef.current) {
            // Stream is ONLINE -> start playback immediately!
            isStreamOnlineRef.current = true;
            lastMediaTickAtRef.current = Date.now();
            startPlayback();
          } else {
            const video = videoRef.current;
            if (video) {
              // If video already has enough data to play, ensure it is playing & marked LIVE
              if (video.readyState >= 2) {
                if (video.paused && autoPlay) {
                  video.play().catch(() => {});
                }
                if (statusRef.current !== 'LIVE') {
                  handlePlaying();
                }
              } else if (hasFirstFrameRef.current && Date.now() - lastMediaTickAtRef.current > 2500) {
                updateStatus('BUFFERING');
              }
            }
          }
        } else {
          // 404: Stream stopped -> immediately switch to STREAM OFF!
          if (isStreamOnlineRef.current || statusRef.current !== 'OFFLINE') {
            isStreamOnlineRef.current = false;
            stopAndResetVideo();
            updateStatus('OFFLINE');
          }
        }
      } catch {
        if (!isCancelled && isStreamOnlineRef.current) {
          updateStatus('BUFFERING');
        }
      }
    };

    checkStreamAvailability();
    const interval = setInterval(checkStreamAvailability, 1200);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      isStreamOnlineRef.current = false;
      stopAndResetVideo();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const current = e.currentTarget.currentTime;
    if (current !== lastMediaTimeRef.current) {
      lastMediaTimeRef.current = current;
      lastMediaTickAtRef.current = Date.now();
      markFirstFrame();
      if (statusRef.current !== 'LIVE') {
        updateStatus('LIVE');
      }
      syncToLiveEdge();
    }
  };

  const handleWaiting = () => {
    const video = videoRef.current;
    if (isStreamOnlineRef.current && video && video.readyState < 2) {
      updateStatus('BUFFERING');
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#090d16',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      <video
        ref={videoRef}
        poster={poster}
        muted={isMuted}
        autoPlay={autoPlay}
        controls={controls}
        playsInline
        onPlaying={handlePlaying}
        onCanPlay={handlePlaying}
        onLoadedData={handlePlaying}
        onLoadedMetadata={handlePlaying}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={handleWaiting}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'relative',
          zIndex: 1,
          opacity: status === 'OFFLINE' ? 0 : 1,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Buffering Overlay: Translucent so video underneath remains visible if frames already loaded */}
      {status === 'BUFFERING' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            backgroundColor: hasFirstFrame ? 'rgba(9, 13, 22, 0.45)' : 'rgba(9, 13, 22, 0.85)',
            backdropFilter: 'blur(3px)',
            color: '#ffffff',
            pointerEvents: 'none',
          }}
        >
          <Loader2
            size={32}
            className="animate-spin"
            style={{ color: 'var(--primary-400)' }}
          />
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.02em' }}>
            Memuat Aliran Video...
          </div>
        </div>
      )}

      {/* Stream Off Overlay */}
      {status === 'OFFLINE' && (
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
            backgroundColor: '#090d16',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <Tv size={22} style={{ color: 'var(--accent-red)' }} />
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(239, 68, 68, 0.14)',
              color: 'var(--accent-red)',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-red)',
              }}
            />
            {fallbackTitle}
          </div>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)',
              maxWidth: '360px',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {fallbackDescription}
          </p>
        </div>
      )}
    </div>
  );
}
