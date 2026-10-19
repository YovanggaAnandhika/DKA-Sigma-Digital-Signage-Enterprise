'use client';

import React from 'react';

interface QueueCanvasSnapGuidesProps {
  snapGuides: { x: number | null; y: number | null };
  scale: number;
}

export default function QueueCanvasSnapGuides({ snapGuides, scale }: QueueCanvasSnapGuidesProps) {
  return (
    <>
      {/* Visual Prediction Magnet Align Guides (Cyan Glow) */}
      {snapGuides.x !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${snapGuides.x * scale}px`,
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: '#06b6d4',
            boxShadow: '0 0 8px 1.5px rgba(6, 182, 212, 0.85)',
            pointerEvents: 'none',
            zIndex: 99999,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 4,
              fontSize: '9px',
              fontWeight: 700,
              fontFamily: 'monospace',
              backgroundColor: '#0891b2',
              color: '#ffffff',
              padding: '1px 5px',
              borderRadius: '3px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            X: {Math.round(snapGuides.x)}px
          </div>
        </div>
      )}

      {snapGuides.y !== null && (
        <div
          style={{
            position: 'absolute',
            top: `${snapGuides.y * scale}px`,
            left: 0,
            right: 0,
            height: '1px',
            backgroundColor: '#06b6d4',
            boxShadow: '0 0 8px 1.5px rgba(6, 182, 212, 0.85)',
            pointerEvents: 'none',
            zIndex: 99999,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 8,
              top: 4,
              fontSize: '9px',
              fontWeight: 700,
              fontFamily: 'monospace',
              backgroundColor: '#0891b2',
              color: '#ffffff',
              padding: '1px 5px',
              borderRadius: '3px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            Y: {Math.round(snapGuides.y)}px
          </div>
        </div>
      )}
    </>
  );
}
