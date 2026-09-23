'use client';

import React from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ChevronDown, ChevronUp, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useLayoutPlayback } from '../../context/LayoutPlaybackContext';
import { useLayoutUI } from '../../context/LayoutUIContext';

export default function TimelineControls() {
  const {
    isPlaying,
    togglePlay,
    stopPlay,
    isMuted,
    toggleMute,
    playheadPosition,
    pxPerSecond,
    setPxPerSecond,
    zoomInTimeline,
    zoomOutTimeline,
    resetTimelineZoom,
  } = useLayoutPlayback();
  const { isTimelineExpanded, setIsTimelineExpanded, setInspectorTarget, setIsInspectorCollapsed } = useLayoutUI();

  const formattedTime = (playheadPosition / (pxPerSecond || 20)).toFixed(1);

  return (
    <div style={{ height: '40px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)' }}
        >
          {isTimelineExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        <button
          onClick={togglePlay}
          className="btn btn-sm btn-primary"
          style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={isPlaying ? 'Jeda Simulasi (Pause)' : 'Putar Simulasi (Play)'}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} />}
        </button>

        <button
          onClick={stopPlay}
          className="btn btn-sm btn-secondary"
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
          title="Reset Playhead"
        >
          <RotateCcw size={12} />
        </button>

        <button
          onClick={toggleMute}
          className="btn btn-sm btn-secondary"
          style={{ padding: '4px 8px', fontSize: '0.75rem', color: isMuted ? 'var(--accent-rose)' : 'inherit' }}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>

        <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', marginLeft: '6px' }}>
          {formattedTime}s
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Timeline Zoom Range Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-surface)', padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={zoomOutTimeline}
            disabled={pxPerSecond <= 5}
            title="Zoom Out Durasi"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: pxPerSecond <= 5 ? 'not-allowed' : 'pointer',
              color: pxPerSecond <= 5 ? 'var(--text-muted)' : 'var(--text-secondary)',
            }}
          >
            <ZoomOut size={13} />
          </button>

          <input
            type="range"
            min="5"
            max="80"
            step="1"
            value={pxPerSecond}
            onChange={(e) => setPxPerSecond(Number(e.target.value))}
            title={`Zoom Timeline: ${Math.round((pxPerSecond / 20) * 100)}%`}
            style={{
              width: '84px',
              height: '4px',
              accentColor: 'var(--primary-500)',
              cursor: 'pointer',
            }}
          />

          <button
            type="button"
            onClick={zoomInTimeline}
            disabled={pxPerSecond >= 80}
            title="Zoom In Durasi"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: pxPerSecond >= 80 ? 'not-allowed' : 'pointer',
              color: pxPerSecond >= 80 ? 'var(--text-muted)' : 'var(--text-secondary)',
            }}
          >
            <ZoomIn size={13} />
          </button>

          <span
            onClick={resetTimelineZoom}
            title="Klik dua kali / klik untuk reset ke 100%"
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: 'var(--text-primary)',
              minWidth: '36px',
              textAlign: 'right',
              cursor: 'pointer',
            }}
          >
            {Math.round((pxPerSecond / 20) * 100)}%
          </span>
        </div>

        <div
          onClick={() => {
            setInspectorTarget('timeline');
            setIsInspectorCollapsed(false);
          }}
          style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          title="Klik untuk melihat properti & pengaturan timeline di panel kanan"
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-600)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          SIMULASI TIMELINE LAYER
        </div>
      </div>
    </div>
  );
}
