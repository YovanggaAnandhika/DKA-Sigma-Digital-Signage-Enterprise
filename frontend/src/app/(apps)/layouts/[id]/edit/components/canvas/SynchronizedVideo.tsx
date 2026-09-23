'use client';

import React, { useRef, useEffect } from 'react';

export interface SynchronizedVideoProps {
  src: string;
  isPlaying: boolean;
  active: boolean;
  isMuted: boolean;
  targetTimeSec: number;
  onBufferUpdate?: (ranges: { start: number; end: number }[]) => void;
  timelineStartSec?: number;
}

export default function SynchronizedVideo({
  src,
  isPlaying,
  active,
  isMuted,
  targetTimeSec,
  onBufferUpdate,
  timelineStartSec = 0,
}: SynchronizedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : 1;
    }
  }, [isMuted]);

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
        video.volume = isMuted ? 0 : 1;
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
      // ONLY seek if the zone is actually active.
      // If it's outside the timeline block, it shouldn't scrub forward.
      if (active && Math.abs(video.currentTime - safeTarget) > 0.05) {
        video.currentTime = safeTarget;
      }
    }
  }, [isPlaying, active, targetTimeSec, isMuted]);

  // When metadata loads or src updates, position properly
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const safeTarget =
      video.duration && !isNaN(video.duration) && video.duration > 0
        ? targetTimeSec % video.duration
        : targetTimeSec;
    video.currentTime = safeTarget;
    video.muted = isMuted;
    video.volume = isMuted ? 0 : 1;
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
    <video
      ref={videoRef}
      src={src}
      playsInline
      loop
      muted={isMuted}
      onLoadedMetadata={handleLoadedMetadata}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  );
}
