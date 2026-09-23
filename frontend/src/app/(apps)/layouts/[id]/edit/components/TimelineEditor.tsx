'use client';

import React, { useRef, useState } from 'react';
import { useLayoutState } from '../context/LayoutStateContext';
import { useLayoutUI } from '../context/LayoutUIContext';
import { useLayoutPlayback } from '../context/LayoutPlaybackContext';
import TimelineControls from './timeline/TimelineControls';
import TimelineTrackHeader from './timeline/TimelineTrackHeader';
import TimelineRuler from './timeline/TimelineRuler';
import TimelineTrackBlock from './timeline/TimelineTrackBlock';

export default function TimelineEditor() {
  const { zones } = useLayoutState();
  const { isTimelineExpanded, bufferedRanges } = useLayoutUI();
  const { timelineDuration, pxPerSecond, playheadPosition } = useLayoutPlayback();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [timelineHeight, setTimelineHeight] = useState(220);
  const [isDraggingResize, setIsDraggingResize] = useState(false);

  // Drag-to-resize timeline height
  const handleResizeBarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingResize(true);
    document.body.style.userSelect = 'none';
    const startY = e.clientY;
    const startH = timelineHeight;

    const onMouseMove = (ev: MouseEvent) => {
      window.getSelection()?.removeAllRanges();
      const delta = startY - ev.clientY; // drag up = bigger
      setTimelineHeight(Math.min(500, Math.max(120, startH + delta)));
    };
    const onMouseUp = () => {
      setIsDraggingResize(false);
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div style={{ height: isTimelineExpanded ? `${timelineHeight}px` : '40px', backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', position: 'relative', flexShrink: 0, userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}>
      {/* Resize handle — drag upward to expand timeline */}
      {isTimelineExpanded && (
        <div
          onMouseDown={handleResizeBarMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            cursor: 'row-resize',
            zIndex: 30,
            backgroundColor: isDraggingResize ? 'var(--primary-400)' : 'transparent',
            transition: 'background 0.15s',
          }}
          title="Tarik ke atas untuk memperbesar timeline"
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.3)'; }}
          onMouseLeave={(e) => { if (!isDraggingResize) e.currentTarget.style.backgroundColor = 'transparent'; }}
        />
      )}

      {/* Top Header Bar */}
      <TimelineControls />
      
      {/* Timeline Workspace */}
      {isTimelineExpanded && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Track Headers */}
          <TimelineTrackHeader />

          {/* Right Scrollable Timeline Tracks and Ruler */}
          <div
            ref={scrollContainerRef}
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'auto',
              backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 99px, var(--border-subtle) 100px)',
              backgroundSize: '100px 100%'
            }}
          >
            {/* Ruler Bar */}
            <TimelineRuler />

            {/* Playhead Vertical Line */}
            <div
              style={{
                position: 'absolute',
                left: `${playheadPosition}px`,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: '#ef4444',
                zIndex: 25,
                pointerEvents: 'none',
              }}
            />

            {/* Real Yellow Seek Buffer Lines */}
            {bufferedRanges && bufferedRanges.map((range, idx) => (
              <div
                key={`buffer-${idx}`}
                style={{
                  position: 'absolute',
                  left: `${range.start * pxPerSecond}px`,
                  top: '20px',
                  height: '4px',
                  width: `${(range.end - range.start) * pxPerSecond}px`,
                  backgroundColor: 'var(--accent-amber)',
                  opacity: 0.6,
                  borderRadius: '2px',
                  zIndex: 15,
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Tracks Area */}
            <div style={{ position: 'relative', minWidth: `${timelineDuration + 200}px` }}>
              {zones.map((z, i) => {
                const zColors = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];
                const color = zColors[i % zColors.length];
                
                return (
                  <div key={z.id} style={{ height: '48px', borderBottom: '1px solid var(--border-subtle)', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    {(z.blocksList || []).map((block) => (
                      <TimelineTrackBlock
                        key={block.id}
                        zone={z}
                        block={block}
                        color={color}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
