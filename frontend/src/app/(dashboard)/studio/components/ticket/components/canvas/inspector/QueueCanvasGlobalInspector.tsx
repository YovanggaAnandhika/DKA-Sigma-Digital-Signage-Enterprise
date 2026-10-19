'use client';

import React from 'react';
import { Monitor, Volume2 } from 'lucide-react';
import SearchSelect from '@/components/ui/SearchSelect';
import { useQueueEditor } from '../../../context/QueueEditorContext';

const THEME_OPTIONS = [
  { value: 'clean-light', label: 'Clean Light', swatch: '#0284c7' },
  { value: 'solid-dark', label: 'Solid Slate Dark', swatch: '#38bdf8' },
  { value: 'medical-green', label: 'Medical Green', swatch: '#059669' },
  { value: 'executive-blue', label: 'Executive Blue', swatch: '#60a5fa' },
];

interface QueueCanvasGlobalInspectorProps {
  imageOptions: { value: string; label: string }[];
}

export default function QueueCanvasGlobalInspector({ imageOptions }: QueueCanvasGlobalInspectorProps) {
  const { queue, updateField, applyThemePreset, triggerChime } = useQueueEditor();

  const canvasWidth = queue.canvasWidth || 1920;
  const canvasHeight = queue.canvasHeight || 1080;

  return (
    <div
      style={{
        width: '320px',
        backgroundColor: 'var(--bg-surface-elevated)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Monitor size={16} color="var(--primary-500)" />
        <div>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Properti Kanvas & Tema
          </h4>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            Resolusi {canvasWidth} × {canvasHeight} px (16:9)
          </span>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Preset Tema Studio */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            Preset Tema Studio
          </span>
          <SearchSelect
            value={queue.themePreset || ''}
            options={THEME_OPTIONS}
            onChange={(v) => v && applyThemePreset(v as any)}
            placeholder="Cari tema..."
          />
        </div>

        {/* Warna & Mode Latar Kanvas */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Latar Belakang Kanvas
            </span>
            <span style={{ fontSize: '0.6875rem', color: queue.backgroundColor === 'transparent' ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 600 }}>
              {queue.backgroundColor === 'transparent' ? 'Transparan (Default)' : 'Warna Solid'}
            </span>
          </div>

          {/* Segmented Mode Button */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '3px', gap: '4px', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={() => updateField('backgroundColor', 'transparent')}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: queue.backgroundColor === 'transparent' ? 'var(--primary-600)' : 'transparent',
                color: queue.backgroundColor === 'transparent' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Transparan
            </button>
            <button
              type="button"
              onClick={() => updateField('backgroundColor', queue.backgroundColor && queue.backgroundColor !== 'transparent' ? queue.backgroundColor : '#f8fafc')}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: queue.backgroundColor !== 'transparent' ? 'var(--primary-600)' : 'transparent',
                color: queue.backgroundColor !== 'transparent' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Warna Solid
            </button>
          </div>

          {queue.backgroundColor !== 'transparent' && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="color"
                  value={(queue.backgroundColor || '#f8fafc').startsWith('#') ? (queue.backgroundColor || '#f8fafc') : '#f8fafc'}
                  onChange={(e) => updateField('backgroundColor', e.target.value)}
                  style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', cursor: 'pointer', padding: 0 }}
                />
                <input
                  type="text"
                  value={queue.backgroundColor || ''}
                  onChange={(e) => updateField('backgroundColor', e.target.value)}
                  className="form-input"
                  style={{ flex: 1, padding: '5px 8px', fontSize: '0.78rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {['#f8fafc', '#ffffff', '#020617', '#0f172a', '#f0fdf4', '#1e1b4b'].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => updateField('backgroundColor', hex)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: hex,
                      border: queue.backgroundColor === hex ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                    title={hex}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Opacity Kanvas */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Opacity Kanvas
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)' }}>
              {Math.round((queue.opacity ?? 1.0) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round((queue.opacity ?? 1.0) * 100)}
            onChange={(e) => updateField('opacity', Number(e.target.value) / 100)}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        {/* Overlay Warna & Overlay Opacity */}
        <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            Warna Overlay (Scrim)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <input
              type="color"
              value={(queue.overlayColor || '#000000').startsWith('#') ? (queue.overlayColor || '#000000') : '#000000'}
              onChange={(e) => updateField('overlayColor', e.target.value)}
              style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', cursor: 'pointer', padding: 0 }}
            />
            <input
              type="text"
              value={queue.overlayColor || 'transparent'}
              onChange={(e) => updateField('overlayColor', e.target.value)}
              className="form-input"
              style={{ flex: 1, padding: '4px 6px', fontSize: '0.75rem' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Opacity Overlay</span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary-400)' }}>
              {Math.round((queue.overlayOpacity ?? 0.0) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round((queue.overlayOpacity ?? 0.0) * 100)}
            onChange={(e) => updateField('overlayOpacity', Number(e.target.value) / 100)}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        {/* Wallpaper / Gambar Background */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Gambar Background
          </span>
          <SearchSelect
            value={queue.backgroundImageUrl || ''}
            options={imageOptions}
            onChange={(v) => updateField('backgroundImageUrl', v)}
            placeholder="Pilih dari Pustaka Media..."
            clearable
          />
        </div>

        {/* Awalan Tiket */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Awalan Tiket (Prefix)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              maxLength={4}
              value={queue.prefix}
              onChange={(e) => updateField('prefix', e.target.value.toUpperCase())}
              className="form-input"
              style={{ width: '80px', padding: '6px 8px', fontSize: '0.875rem', textAlign: 'center', fontWeight: 700 }}
              placeholder="A"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Format nomor: {queue.prefix}-001, {queue.prefix}-002
            </span>
          </div>
        </div>

        {/* Audio Chime Bel */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Audio Chime Bel
            </span>
            <button
              type="button"
              onClick={triggerChime}
              className="btn btn-secondary"
              style={{ padding: '3px 8px', fontSize: '0.6875rem', gap: '4px' }}
            >
              <Volume2 size={12} />
              Uji Bel
            </button>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem' }}>
            <input
              type="checkbox"
              checked={queue.audioChimeEnabled}
              onChange={(e) => updateField('audioChimeEnabled', e.target.checked)}
              style={{ accentColor: 'var(--primary-500)' }}
            />
            <span>Putar bel otomatis saat panggil nomor</span>
          </label>
        </div>

        {/* Hint info */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          Pilih elemen pada kanvas atau panel lapisan untuk mengatur tipografi, warna, dan dimensi.
        </div>
      </div>
    </div>
  );
}
