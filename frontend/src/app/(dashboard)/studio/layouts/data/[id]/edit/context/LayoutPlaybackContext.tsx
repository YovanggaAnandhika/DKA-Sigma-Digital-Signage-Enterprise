'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Layer } from './LayoutStateContext';

interface LayoutPlaybackContextType {
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  playheadPosition: number;
  setPlayheadPosition: React.Dispatch<React.SetStateAction<number>>;
  timelineDuration: number;
  pxPerSecond: number;
  setPxPerSecond: React.Dispatch<React.SetStateAction<number>>;
  zoomInTimeline: () => void;
  zoomOutTimeline: () => void;
  resetTimelineZoom: () => void;
  togglePlay: () => void;
  stopPlay: () => void;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMute: () => void;
  isLayerActive: (layer: Layer, currentPos?: number) => boolean;
}

const LayoutPlaybackContext = createContext<LayoutPlaybackContextType | undefined>(undefined);

export function LayoutPlaybackProvider({ children, layers }: { children: ReactNode; layers: Layer[] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [pxPerSecond, setPxPerSecond] = useState(20);

  const zoomInTimeline = () => {
    setPxPerSecond((prev) => Math.min(80, Math.round(prev * 1.3)));
  };

  const zoomOutTimeline = () => {
    setPxPerSecond((prev) => Math.max(0.5, prev / 1.3));
  };

  const resetTimelineZoom = () => {
    setPxPerSecond(20);
  };

  let contentMaxTimeSec = 0;
  for (const z of layers) {
    for (const b of (z.blocksList || [])) {
      const endSec = (b.startTimeSeconds || 0) + (b.durationSeconds || 10);
      if (endSec > contentMaxTimeSec) {
        contentMaxTimeSec = endSec;
      }
    }
  }
  
  // Actual content ends here. If empty, default to loop every 10s.
  const loopEndSec = contentMaxTimeSec > 0 ? contentMaxTimeSec : 10;
  const loopEndPx = loopEndSec * pxPerSecond;
  
  // Visual timeline duration should always give some extra space (min 60s)
  const visualMaxSec = Math.max(60, contentMaxTimeSec + 30);
  const timelineDuration = visualMaxSec * pxPerSecond;

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      setPlayheadPosition((prev) => {
        const next = prev + deltaSec * pxPerSecond;
        if (next >= loopEndPx) {
          return 0; // Loop back to start based on actual content duration!
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

  const isLayerActive = (layer: Layer, currentPos = playheadPosition) => {
    if (!layer.blocksList || layer.blocksList.length === 0) return true;
    const sec = currentPos / pxPerSecond;
    return layer.blocksList.some((b) => sec >= b.startTimeSeconds && sec < b.startTimeSeconds + b.durationSeconds);
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
        setPxPerSecond,
        zoomInTimeline,
        zoomOutTimeline,
        resetTimelineZoom,
        togglePlay,
        stopPlay,
        isMuted,
        setIsMuted,
        toggleMute,
        isLayerActive,
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
