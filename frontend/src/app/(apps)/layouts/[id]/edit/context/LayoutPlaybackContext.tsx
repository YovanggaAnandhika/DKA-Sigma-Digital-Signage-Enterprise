'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Zone } from './LayoutStateContext';

interface LayoutPlaybackContextType {
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  playheadPosition: number;
  setPlayheadPosition: React.Dispatch<React.SetStateAction<number>>;
  timelineDuration: number;
  pxPerSecond: number;
  togglePlay: () => void;
  stopPlay: () => void;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMute: () => void;
  isZoneActive: (zone: Zone, currentPos?: number) => boolean;
}

const LayoutPlaybackContext = createContext<LayoutPlaybackContextType | undefined>(undefined);

export function LayoutPlaybackProvider({ children, zones }: { children: ReactNode; zones: Zone[] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const pxPerSecond = 20;

  let maxTimeSec = 60;
  for (const z of zones) {
    for (const b of (z.blocksList || [])) {
      const endSec = (b.startTimeSeconds || 0) + (b.durationSeconds || 10);
      if (endSec > maxTimeSec) {
        maxTimeSec = endSec;
      }
    }
  }
  const timelineDuration = maxTimeSec * pxPerSecond;

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      setPlayheadPosition((prev) => {
        const next = prev + deltaSec * pxPerSecond;
        if (next >= timelineDuration) {
          return 0;
        }
        return next;
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, timelineDuration]);

  const togglePlay = () => setIsPlaying((prev) => !prev);
  const stopPlay = () => {
    setIsPlaying(false);
    setPlayheadPosition(0);
  };
  const toggleMute = () => setIsMuted((prev) => !prev);

  const isZoneActive = (zone: Zone, currentPos = playheadPosition) => {
    if (!zone.blocksList || zone.blocksList.length === 0) return true;
    const sec = currentPos / pxPerSecond;
    return zone.blocksList.some((b) => sec >= b.startTimeSeconds && sec < b.startTimeSeconds + b.durationSeconds);
  };

  return (
    <LayoutPlaybackContext.Provider
      value={{
        isPlaying,
        setIsPlaying,
        playheadPosition,
        setPlayheadPosition,
        timelineDuration,
        pxPerSecond,
        togglePlay,
        stopPlay,
        isMuted,
        setIsMuted,
        toggleMute,
        isZoneActive,
      }}
    >
      {children}
    </LayoutPlaybackContext.Provider>
  );
}

export function useLayoutPlayback() {
  const context = useContext(LayoutPlaybackContext);
  if (!context) {
    throw new Error('useLayoutPlayback must be used within a LayoutPlaybackProvider');
  }
  return context;
}
