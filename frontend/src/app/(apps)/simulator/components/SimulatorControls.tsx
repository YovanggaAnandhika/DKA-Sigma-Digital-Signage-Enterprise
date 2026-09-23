'use client';

import React from 'react';
import { Play, Pause, RotateCw } from 'lucide-react';

interface SimulatorControlsProps {
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  nextSlide: () => void;
}

export default function SimulatorControls({
  isPlaying,
  setIsPlaying,
  nextSlide,
}: SimulatorControlsProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="btn btn-primary"
        style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
      >
        {isPlaying ? (
          <>
            <Pause size={14} />
            <span>Jeda Playback</span>
          </>
        ) : (
          <>
            <Play size={14} />
            <span>Lanjutkan</span>
          </>
        )}
      </button>
      <button
        onClick={nextSlide}
        className="btn btn-secondary"
        style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
      >
        <RotateCw size={14} />
        <span>Next Slide</span>
      </button>
    </div>
  );
}
