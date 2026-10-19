'use client';

import React from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useLayoutEditor } from '../../context/LayoutEditorContext';

export default function InspectorTimelineProperties() {
  const {
    isPlaying,
    togglePlay,
    stopPlay,
    playheadPosition,
    pxPerSecond,
    isMuted,
    toggleMute,
    layers,
    setSelectedLayerId,
    setSelectedBlockId,
    setInspectorTarget,
  } = useLayoutEditor();

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Pengaturan Timeline Simulasi
        </span>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Atur durasi dan playback sinkronisasi antar track layer.
        </p>
      </div>

      {/* Playback Controls Box */}
      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Kontrol Playback
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={togglePlay}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'Pause' : 'Play Simulation'}</span>
          </button>
          <button
            onClick={stopPlay}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 10px' }}
            title="Reset Playhead ke 0s"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Posisi Playhead:</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary-600)' }}>
            {(playheadPosition / (pxPerSecond || 20)).toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Master Audio Control */}
      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isMuted ? <VolumeX size={16} color="var(--accent-rose)" /> : <Volume2 size={16} color="#10b981" />}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Master Audio
            </span>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
              {isMuted ? 'Semua audio dibisukan' : 'Audio menyala aktif'}
            </span>
          </div>
        </div>
        <button
          onClick={toggleMute}
          style={{
            padding: '4px 10px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            borderRadius: '5px',
            cursor: 'pointer',
            border: '1px solid var(--border-subtle)',
            backgroundColor: isMuted ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
            color: isMuted ? 'var(--accent-rose)' : '#059669',
          }}
        >
          {isMuted ? 'Unmute All' : 'Mute All'}
        </button>
      </div>

      {/* Timeline Tracks Overview */}
      <div>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
          Ringkasan Track ({layers.length} Layer)
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {layers.map((z, idx) => {
            const zColors = ['#1d4ed8', '#047857', '#b45309', '#be185d', '#6d28d9', '#0f766e', '#4338ca'];
            const color = zColors[idx % zColors.length];
            return (
              <div
                key={z.id}
                onClick={() => {
                  setSelectedLayerId(z.id);
                  setSelectedBlockId(null);
                  setInspectorTarget('layer');
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-base)',
                  borderLeft: `4px solid ${color}`,
                  border: '1px solid var(--border-subtle)',
                  borderLeftWidth: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {z.name}
                </span>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                  {z.blocksList?.length || 0} blok
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
