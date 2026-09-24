'use client';

import React, { useRef, useEffect } from 'react';
import { Film } from 'lucide-react';

export interface SynchronizedVideoProps {
  src: string;
  isPlaying: boolean;
  active: boolean;
  isMuted: boolean;
  volumeLevel?: number;
  targetTimeSec: number;
  onBufferUpdate?: (ranges: { start: number; end: number }[]) => void;
  timelineStartSec?: number;
}

export default function SynchronizedVideo({
  src,
  isPlaying,
  active,
  isMuted,
  volumeLevel = 100,
  targetTimeSec,
  onBufferUpdate,
  timelineStartSec = 0,
}: SynchronizedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = React.useState(false);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : (volumeLevel / 100);
    }
  }, [isMuted, volumeLevel]);

  const prevTargetTime = useRef(targetTimeSec);

  // Sync playback state and position
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const safeTarget =
      video.duration && !isNaN(video.duration) && video.duration > 0
        ? targetTimeSec % video.duration
        : targetTimeSec;

    // Detect if user is scrubbing/clicking the timeline (jump > 0.2s)
    const isUserSeek = Math.abs(targetTimeSec - prevTargetTime.current) > 0.2;
    prevTargetTime.current = targetTimeSec;

    if (isPlaying && active) {
      // Force seek if user manually scrubbed, otherwise allow 1.5s natural drift tolerance
      if (isUserSeek || Math.abs(video.currentTime - safeTarget) > 1.5) {
        video.currentTime = safeTarget;
      }
      if (video.paused) {
        video.muted = isMuted;
        video.volume = isMuted ? 0 : (volumeLevel / 100);
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Autoplay sound blocked by browser policy:', err);
          });
        }
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
      // ONLY seek if the layer is actually active.
      // If it's outside the timeline block, it shouldn't scrub forward.
      if (active && Math.abs(video.currentTime - safeTarget) > 0.05) {
        video.currentTime = safeTarget;
      }
    }
  }, [isPlaying, active, targetTimeSec, isMuted, volumeLevel]);

  // When metadata loads or src updates, position properly
  const handleLoadedMetadata = () => {
    setIsReady(true);
    const video = videoRef.current;
    if (!video) return;
    const safeTarget =
      video.duration && !isNaN(video.duration) && video.duration > 0
        ? targetTimeSec % video.duration
        : targetTimeSec;
    video.currentTime = safeTarget;
    video.muted = isMuted;
    video.volume = isMuted ? 0 : (volumeLevel / 100);
    if (isPlaying && active && video.paused) {
      video.play().catch(() => {});
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onBufferUpdate) return;
    const updateBuffer = () => {
      const ranges = [];
      for (let i = 0; i < video.buffered.length; i++) {
        ranges.push({
          start: video.buffered.start(i) + timelineStartSec,
          end: video.buffered.end(i) + timelineStartSec,
        });
      }
      onBufferUpdate(ranges);
    };
    video.addEventListener('progress', updateBuffer);
    return () => video.removeEventListener('progress', updateBuffer);
  }, [timelineStartSec, onBufferUpdate]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000', overflow: 'hidden' }}>
      {!isReady && (
        <div 
          style={{ 
            position: 'absolute', 
            inset: 0, 
            zIndex: 10, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            // SMPTE Color Bars gradient
            background: `linear-gradient(to right, 
              #c0c0c0 0%, #c0c0c0 14.28%, 
              #c0c000 14.28%, #c0c000 28.57%, 
              #00c0c0 28.57%, #00c0c0 42.85%, 
              #00c000 42.85%, #00c000 57.14%, 
              #c000c0 57.14%, #c000c0 71.42%, 
              #c00000 71.42%, #c00000 85.71%, 
              #0000c0 85.71%, #0000c0 100%
            )`
          }}
        >
          {/* Overlay to darken the bars slightly so the center pops out */}
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.1)' }} />
          
          <div style={{ position: 'absolute', inset: '10%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8%' }}>
             {/* Center circle */}
             <div 
               style={{ 
                 position: 'relative', 
                 width: '100%',
                 maxWidth: '140px',
                 maxHeight: '140px',
                 aspectRatio: '1', 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'center',
                 backgroundColor: '#111',
                 borderRadius: '50%',
                 border: '4px solid #fff',
                 boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                 overflow: 'hidden'
               }}
             >
               {/* Moving sweeping radar animation inside circle */}
               <div 
                 className="absolute inset-0 animate-spin" 
                 style={{ 
                   background: 'conic-gradient(from 0deg, transparent 60%, rgba(255,255,255,0.7) 100%)', 
                   animationDuration: '2s' 
                 }} 
               />
               <div style={{ position: 'absolute', inset: '4px', backgroundColor: '#111', borderRadius: '50%' }} />
               
               <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80%' }}>
                 <span className="animate-pulse" style={{ color: '#fff', fontSize: 'clamp(8px, 1.2em, 16px)', fontWeight: 800, letterSpacing: '2px', textAlign: 'center', lineHeight: '1.2' }}>
                   STAND<br/>BY
                 </span>
               </div>
             </div>
             
             {/* Bottom pill text */}
             <div style={{ 
               backgroundColor: '#111', 
               padding: '4% 8%',
               borderRadius: '20px', 
               border: '2px solid rgba(255,255,255,0.2)',
               boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
               maxWidth: '100%',
               display: 'flex',
               justifyContent: 'center'
             }}>
               <span style={{ fontSize: 'clamp(8px, 1em, 14px)', color: '#fff', fontWeight: 700, letterSpacing: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="animate-pulse">
                 MEMUAT VIDEO
               </span>
             </div>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        playsInline
        loop
        muted={isMuted}
        onLoadedData={() => setIsReady(true)}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={() => setIsReady(true)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
}
