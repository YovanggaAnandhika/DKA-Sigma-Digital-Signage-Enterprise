'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Layout } from '@/lib/services';

interface LayoutCanvasContextType {
  scale: number;
  previewHeight: number;
  canvasDisplayWidth: number;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
}

const BASE_CANVAS_PX = 960;
const LayoutCanvasContext = createContext<LayoutCanvasContextType | undefined>(undefined);

export function LayoutCanvasProvider({ children, layout }: { children: ReactNode; layout: Layout | null }) {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const setZoomLevelRef = useRef(setZoomLevel);

  setZoomLevelRef.current = setZoomLevel;

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setZoomLevelRef.current(1.25);
      } else {
        setZoomLevelRef.current(1.0);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const zoomIn = () => setZoomLevel((prev) => Math.min(4.0, parseFloat((prev + 0.25).toFixed(2))));
  const zoomOut = () => setZoomLevel((prev) => Math.max(0.25, parseFloat((prev - 0.25).toFixed(2))));
  const zoomFit = () => setZoomLevel(1.0);

  const scale = layout ? (BASE_CANVAS_PX * zoomLevel) / (layout.canvasWidth || 1920) : 1;
  const canvasDisplayWidth = BASE_CANVAS_PX * zoomLevel;
  const previewHeight = layout ? (layout.canvasHeight || 1080) * scale : 1;

  return (
    <LayoutCanvasContext.Provider
      value={{
        scale,
        previewHeight,
        canvasDisplayWidth,
        zoomLevel,
        setZoomLevel,
        zoomIn,
        zoomOut,
        zoomFit,
      }}
    >
      {children}
    </LayoutCanvasContext.Provider>
  );
}

export function useLayoutCanvas() {
  const context = useContext(LayoutCanvasContext);
  if (!context) {
    throw new Error('useLayoutCanvas must be used within a LayoutCanvasProvider');
  }
  return context;
}
