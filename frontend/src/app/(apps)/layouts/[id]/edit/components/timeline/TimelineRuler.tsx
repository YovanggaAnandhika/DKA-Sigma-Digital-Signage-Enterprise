'use client';

import React from 'react';
import { useLayoutPlayback } from '../../context/LayoutPlaybackContext';

export default function TimelineRuler() {
  const { timelineDuration, pxPerSecond, playheadPosition, setPlayheadPosition } = useLayoutPlayback();

  const secTicks = Math.ceil(timelineDuration / (pxPerSecond || 20));

  // Determine tick interval dynamically based on zoom (pxPerSecond) to keep ticks ~50px apart
  let step = 5;
  const targetPxDist = 50;
  const idealStep = targetPxDist / (pxPerSecond || 20);
  
  if (idealStep <= 1) step = 1;
  else if (idealStep <= 2) step = 2;
  else if (idealStep <= 5) step = 5;
  else if (idealStep <= 10) step = 10;
  else if (idealStep <= 30) step = 30;
  else if (idealStep <= 60) step = 60;
  else if (idealStep <= 120) step = 120;
  else step = 300;

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    setPlayheadPosition(Math.max(0, Math.min(timelineDuration, clickX)));
  };

  return (
    <div
      onClick={handleRulerClick}
      style={{
        height: '24px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface-elevated)',
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {Array.from({ length: secTicks + 1 }).map((_, sec) => {
        if (sec % step !== 0) return null;
        const leftPx = sec * pxPerSecond;
        return (
          <div
            key={sec}
            style={{
              position: 'absolute',
              left: `${leftPx}px`,
              top: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingLeft: '2px',
            }}
          >
            <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', fontFamily: 'monospace', lineHeight: 1, marginTop: '2px' }}>
              {sec}s
            </span>
            <div style={{ width: '1px', height: '6px', backgroundColor: 'var(--border-subtle)' }} />
          </div>
        );
      })}

      {/* Playhead indicator handle */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: `${playheadPosition}px`,
          transform: 'translateX(-50%)',
          width: '10px',
          height: '10px',
          backgroundColor: '#ef4444',
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
          zIndex: 30,
        }}
      />
    </div>
  );
}
