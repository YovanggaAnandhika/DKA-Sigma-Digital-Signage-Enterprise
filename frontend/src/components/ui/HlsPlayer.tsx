'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Tv, Loader2 } from 'lucide-react';

export type StreamPlaybackStatus = 'OFFLINE' | 'BUFFERING' | 'LIVE';

interface HlsPlayerProps {
  src: string;
  poster?: string;
  isMuted?: boolean;
  volume?: number;
  lowLatencyMode?: boolean;
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
  interface Navigator {
    connection?: {
      effectiveType?: string;
      downlink?: number;
      saveData?: boolean;
    };
    deviceMemory?: number;
  }
}

function getAdaptiveStreamProfile(stallCount: number) {
  if (typeof navigator === 'undefined') {
    return { syncSegments: 2, maxLagSeconds: 3.5, hardDropSeconds: 6.5, catchUpRate: 1.12 };
  }
  const conn = navigator.connection;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;

  const isConstrainedNetwork =
    conn?.saveData ||
    conn?.effectiveType === '2g' ||
    conn?.effectiveType === 'slow-2g' ||
    conn?.effectiveType === '3g' ||
    (typeof conn?.downlink === 'number' && conn.downlink < 2.5);

  const isLowEndDevice = cores <= 2 || memory <= 2;

  if (isConstrainedNetwork || isLowEndDevice || stallCount >= 2) {
    return { syncSegments: 3, maxLagSeconds: 4.5, hardDropSeconds: 8.5, catchUpRate: 1.08 };
  }
  return { syncSegments: 1.5, maxLagSeconds: 2.8, hardDropSeconds: 5.5, catchUpRate: 1.18 };
}

export default function HlsPlayer({
  src,
  poster,
  isMuted = true,
  volume = 0.8,
  lowLatencyMode = true,
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
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const isStreamOnlineRef = useRef<boolean>(false);
  const lastMediaTimeRef = useRef<number>(-1);
  const lastAdvanceAtRef = useRef<number>(Date.now());
  const stallCountRef = useRef<number>(0);
  const lastHardDropAtRef = useRef<number>(0);

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

  // Sync muted & volume directly to DOM element without reloading stream
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.defaultMuted = isMuted;
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [isMuted, volume]);

  const stopAndResetVideo = useCallback(() => {
    if (pcRef.current) {
      try {
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.ontrack = null;
        pcRef.current.close();
      } catch {
        // ignore
      }
      pcRef.current = null;
    }
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
        video.srcObject = null;
        video.removeAttribute('src');
        video.load();
      } catch {
        // ignore
      }
    }
    hasFirstFrameRef.current = false;
    setHasFirstFrame(false);
  }, []);

  const handlePlaying = useCallback(() => {
    if (!isStreamOnlineRef.current && src.startsWith('/streams/')) return;
    lastAdvanceAtRef.current = Date.now();
    hasFirstFrameRef.current = true;
    setHasFirstFrame(true);
    updateStatus('LIVE');
  }, [src, updateStatus]);

  const startHlsPlayback = useCallback(() => {
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
    lastAdvanceAtRef.current = Date.now();

    video.srcObject = null;
    video.muted = isMuted;
    video.defaultMuted = isMuted;
    video.volume = Math.max(0, Math.min(1, volume));
    video.playsInline = true;

    const cleanSrc = src.split('?')[0];

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

      const profile = getAdaptiveStreamProfile(stallCountRef.current);
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false,
        liveSyncDurationCount: profile.syncSegments,
        liveMaxLatencyDurationCount: profile.syncSegments + 2,
        maxLiveSyncPlaybackRate: profile.catchUpRate,
        backBufferLength: 4,
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

  // Ultra-Low Latency WebRTC (UDP WHEP) Connection for Local Server Relay
  useEffect(() => {
    if (!src) {
      stopAndResetVideo();
      updateStatus('OFFLINE');
      return;
    }

    let isCancelled = false;
    const localMatch = src.match(/^\/streams\/([^/]+)\//);

    if (!localMatch) {
      isStreamOnlineRef.current = true;
      startHlsPlayback();
      return () => {
        isCancelled = true;
        stopAndResetVideo();
      };
    }

    const streamId = localMatch[1];
    const whepUrl = `/streams/${streamId}/whep?mode=${lowLatencyMode ? 'll' : 'hd'}`;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connectWebRtc = async () => {
      if (isCancelled) return;

      // Avoid re-connecting if WebRTC is already connected and playing
      if (
        pcRef.current &&
        (pcRef.current.connectionState === 'connected' ||
          pcRef.current.connectionState === 'connecting')
      ) {
        return;
      }

      try {
        const pc = new RTCPeerConnection({
          bundlePolicy: 'max-bundle',
        });
        pcRef.current = pc;

        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        pc.ontrack = (event) => {
          if (isCancelled) return;
          const video = videoRef.current;
          if (video && event.streams && event.streams[0]) {
            if (video.srcObject !== event.streams[0]) {
              video.srcObject = event.streams[0];
              video.muted = isMuted;
              video.defaultMuted = isMuted;
              video.volume = Math.max(0, Math.min(1, volume));
              video.playsInline = true;
              video
                .play()
                .then(() => {
                  isStreamOnlineRef.current = true;
                  handlePlaying();
                })
                .catch(() => {});
            }
          }
        };

        const handleDisconnect = () => {
          if (isCancelled) return;
          const state = pc.connectionState;
          const iceState = pc.iceConnectionState;
          if (
            state === 'disconnected' ||
            state === 'failed' ||
            state === 'closed' ||
            iceState === 'disconnected' ||
            iceState === 'failed'
          ) {
            isStreamOnlineRef.current = false;
            stopAndResetVideo();
            updateStatus('OFFLINE');
            if (!isCancelled) {
              const delay = typeof document !== 'undefined' && document.hidden ? 8000 : 3500;
              retryTimer = setTimeout(connectWebRtc, delay);
            }
          }
        };

        pc.onconnectionstatechange = handleDisconnect;
        pc.oniceconnectionstatechange = handleDisconnect;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Wait up to 250ms for local ICE candidates
        if (pc.iceGatheringState !== 'complete') {
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(resolve, 250);
            pc.onicegatheringstatechange = () => {
              if (pc.iceGatheringState === 'complete') {
                clearTimeout(timeout);
                resolve();
              }
            };
          });
        }

        const res = await fetch(whepUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: pc.localDescription?.sdp || offer.sdp,
          cache: 'no-store',
        });

        if (isCancelled) {
          pc.close();
          return;
        }

        if (!res.ok) {
          // 404 = stream not currently published by OBS
          pc.close();
          pcRef.current = null;
          if (isStreamOnlineRef.current || statusRef.current !== 'OFFLINE') {
            isStreamOnlineRef.current = false;
            stopAndResetVideo();
            updateStatus('OFFLINE');
          }
          const offlineDelay = typeof document !== 'undefined' && document.hidden ? 8000 : 4000;
          retryTimer = setTimeout(connectWebRtc, offlineDelay);
          return;
        }

        isStreamOnlineRef.current = true;
        if (!hasFirstFrameRef.current) {
          updateStatus('BUFFERING');
        }

        const answerSdp = await res.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      } catch {
        if (pcRef.current) {
          try {
            pcRef.current.close();
          } catch {
            // ignore
          }
          pcRef.current = null;
        }
        if (!isCancelled) {
          const errDelay = typeof document !== 'undefined' && document.hidden ? 8000 : 4000;
          retryTimer = setTimeout(connectWebRtc, errDelay);
        }
      }
    };

    connectWebRtc();

    // Watchdog to detect immediate freeze if OBS stops sending frames before ICE timeout
    const watchdog = setInterval(() => {
      if (isCancelled) return;
      if (
        isStreamOnlineRef.current &&
        statusRef.current === 'LIVE' &&
        Date.now() - lastAdvanceAtRef.current > 2400
      ) {
        // Verify stream still active via lightweight WHEP probe or reset
        isStreamOnlineRef.current = false;
        stopAndResetVideo();
        updateStatus('OFFLINE');
        connectWebRtc();
      }
    }, 1200);

    return () => {
      isCancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      clearInterval(watchdog);
      isStreamOnlineRef.current = false;
      stopAndResetVideo();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, lowLatencyMode]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const current = video.currentTime;
    if (current !== lastMediaTimeRef.current) {
      lastMediaTimeRef.current = current;
      lastAdvanceAtRef.current = Date.now();
      if (!hasFirstFrameRef.current) {
        hasFirstFrameRef.current = true;
        setHasFirstFrame(true);
      }
      if (statusRef.current !== 'LIVE') {
        updateStatus('LIVE');
      }

      // Only apply HLS live-edge sync when not using WebRTC (srcObject)
      if (!video.srcObject) {
        const now = Date.now();
        let liveEdge = 0;
        if (hlsInstanceRef.current && typeof hlsInstanceRef.current.liveSyncPosition === 'number') {
          liveEdge = hlsInstanceRef.current.liveSyncPosition;
        } else if (video.seekable && video.seekable.length > 0) {
          liveEdge = video.seekable.end(video.seekable.length - 1);
        } else if (video.buffered && video.buffered.length > 0) {
          liveEdge = video.buffered.end(video.buffered.length - 1);
        }

        if (liveEdge > 0) {
          const profile = getAdaptiveStreamProfile(stallCountRef.current);
          const lag = liveEdge - current;

          if (lag > profile.hardDropSeconds && now - lastHardDropAtRef.current > 4000) {
            lastHardDropAtRef.current = now;
            video.currentTime = Math.max(0, liveEdge - 1.0);
            video.playbackRate = 1.0;
          } else if (lag > profile.maxLagSeconds && video.playbackRate !== profile.catchUpRate) {
            video.playbackRate = profile.catchUpRate;
          } else if (lag <= 1.8 && video.playbackRate !== 1.0) {
            video.playbackRate = 1.0;
          }
        }
      }
    }
  };

  const handleWaiting = () => {
    if (isStreamOnlineRef.current && !videoRef.current?.srcObject) {
      stallCountRef.current += 1;
      updateStatus('BUFFERING');
    }
  };

  const handleVideoError = () => {
    if (!videoRef.current?.srcObject) {
      isStreamOnlineRef.current = false;
      stopAndResetVideo();
      updateStatus('OFFLINE');
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
        onTimeUpdate={handleTimeUpdate}
        onWaiting={handleWaiting}
        onEnded={handleVideoError}
        onError={handleVideoError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          position: 'relative',
          zIndex: 1,
          opacity: status === 'OFFLINE' ? 0 : 1,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Buffering Overlay */}
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
