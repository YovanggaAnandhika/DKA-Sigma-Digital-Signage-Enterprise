'use client';

import React from 'react';
import {
  Lock,
  Unlock,
  Copy,
  Trash2,
  Maximize,
  AlignCenter,
  Film,
  LayoutGrid,
} from 'lucide-react';
import { useLayoutEditor } from '../../context/LayoutEditorContext';

export default function InspectorLayerProperties() {
  const {
    layers,
    selectedLayerId,
    updateSelectedLayer,
    duplicateLayer,
    alignLayer,
    toggleLockLayer,
    handleDeleteLayer,
    setMediaPickerZoneId,
    setComponentPickerZoneId,
  } = useLayoutEditor();

  const selectedZone = layers.find((z) => z.id === selectedLayerId);
  if (!selectedZone) return null;

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Dimensi & Posisi
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={() => toggleLockLayer(selectedZone.id)}
            title={selectedZone.isLocked ? 'Buka Kunci Layer' : 'Kunci Layer (Cegah tergeser)'}
            style={{
              width: '26px',
              height: '26px',
              backgroundColor: selectedZone.isLocked ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-base)',
              border: `1px solid ${selectedZone.isLocked ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'}`,
              color: selectedZone.isLocked ? '#f59e0b' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '5px',
              flexShrink: 0,
              transition: 'all 0.1s',
            }}
          >
            {selectedZone.isLocked ? <Lock size={13} /> : <Unlock size={13} />}
          </button>

          <button
            type="button"
            onClick={() => duplicateLayer(selectedZone.id)}
            title="Duplikat Layer (Ctrl+D)"
            style={{
              width: '26px',
              height: '26px',
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '5px',
              flexShrink: 0,
              transition: 'all 0.1s',
            }}
          >
            <Copy size={13} />
          </button>

          <button
            type="button"
            onClick={() => handleDeleteLayer(selectedZone.id)}
            title="Hapus Layer (Del)"
            style={{
              width: '26px',
              height: '26px',
              backgroundColor: 'rgba(225, 29, 72, 0.1)',
              border: '1px solid rgba(225, 29, 72, 0.2)',
              color: 'var(--accent-rose)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '5px',
              flexShrink: 0,
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Nama Layer
          </label>
          <input
            type="text"
            value={selectedZone.name}
            onChange={(e) => updateSelectedLayer('name', e.target.value)}
            className="form-input"
            style={{ fontSize: '0.75rem', padding: '6px 10px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Posisi X
            </label>
            <input
              type="number"
              value={Math.round(selectedZone.x || 0)}
              onChange={(e) => updateSelectedLayer('x', Number(e.target.value))}
              className="form-input"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Posisi Y
            </label>
            <input
              type="number"
              value={Math.round(selectedZone.y || 0)}
              onChange={(e) => updateSelectedLayer('y', Number(e.target.value))}
              className="form-input"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Lebar
            </label>
            <input
              type="number"
              value={Math.round(selectedZone.width || 200)}
              onChange={(e) => updateSelectedLayer('width', Number(e.target.value))}
              className="form-input"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Tinggi
            </label>
            <input
              type="number"
              value={Math.round(selectedZone.height || 200)}
              onChange={(e) => updateSelectedLayer('height', Number(e.target.value))}
              className="form-input"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Z-Index
          </label>
          <input
            type="number"
            value={selectedZone.zIndex || 1}
            onChange={(e) => updateSelectedLayer('zIndex', Number(e.target.value))}
            className="form-input"
            style={{ fontSize: '0.75rem', padding: '6px 10px' }}
          />
        </div>

        {/* Quick alignment and position presets */}
        <div>
          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Preset Posisi
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button
              type="button"
              onClick={() => alignLayer(selectedZone.id, 'fill')}
              className="btn btn-outline"
              style={{ fontSize: '0.6875rem', padding: '5px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
              title="Penuhi Kanvas (100% Layar)"
            >
              <Maximize size={11} /> Fullscreen
            </button>
            <button
              type="button"
              onClick={() => {
                alignLayer(selectedZone.id, 'center');
                alignLayer(selectedZone.id, 'middle');
              }}
              className="btn btn-outline"
              style={{ fontSize: '0.6875rem', padding: '5px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
              title="Pusatkan di Tengah Kanvas"
            >
              <AlignCenter size={11} /> Tengah
            </button>
            <button
              type="button"
              onClick={() => alignLayer(selectedZone.id, 'split-left')}
              className="btn btn-outline"
              style={{ fontSize: '0.6875rem', padding: '5px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
              title="Setengah Layar Kiri (50%)"
            >
              Split Kiri
            </button>
            <button
              type="button"
              onClick={() => alignLayer(selectedZone.id, 'split-right')}
              className="btn btn-outline"
              style={{ fontSize: '0.6875rem', padding: '5px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
              title="Setengah Layar Kanan (50%)"
            >
              Split Kanan
            </button>
            <button
              type="button"
              onClick={() => alignLayer(selectedZone.id, 'ticker-bottom')}
              className="btn btn-outline"
              style={{ fontSize: '0.6875rem', padding: '5px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
              title="Banner Running Ticker di Bawah"
            >
              Banner Bawah
            </button>
            <button
              type="button"
              onClick={() => alignLayer(selectedZone.id, 'header-top')}
              className="btn btn-outline"
              style={{ fontSize: '0.6875rem', padding: '5px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
              title="Banner Header di Atas"
            >
              Header Atas
            </button>
          </div>
        </div>

        {/* Visual Styling: Background, Opacity, Scrim, Border */}
        <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Latar Belakang & Efek Zona
          </span>

          <div style={{ display: 'flex', backgroundColor: 'var(--bg-base)', padding: '2px', borderRadius: '6px' }}>
            <button
              type="button"
              onClick={() => updateSelectedLayer('backgroundColor', 'transparent')}
              style={{
                flex: 1,
                padding: '4px 6px',
                fontSize: '0.6875rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: !selectedZone.backgroundColor || selectedZone.backgroundColor === 'transparent' ? 'var(--primary-600)' : 'transparent',
                color: !selectedZone.backgroundColor || selectedZone.backgroundColor === 'transparent' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Transparan
            </button>
            <button
              type="button"
              onClick={() =>
                updateSelectedLayer(
                  'backgroundColor',
                  selectedZone.backgroundColor && selectedZone.backgroundColor !== 'transparent'
                    ? selectedZone.backgroundColor
                    : '#000000'
                )
              }
              style={{
                flex: 1,
                padding: '4px 6px',
                fontSize: '0.6875rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: selectedZone.backgroundColor && selectedZone.backgroundColor !== 'transparent' ? 'var(--primary-600)' : 'transparent',
                color: selectedZone.backgroundColor && selectedZone.backgroundColor !== 'transparent' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Warna Solid
            </button>
          </div>

          {selectedZone.backgroundColor && selectedZone.backgroundColor !== 'transparent' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="color"
                value={selectedZone.backgroundColor.startsWith('#') ? selectedZone.backgroundColor : '#000000'}
                onChange={(e) => updateSelectedLayer('backgroundColor', e.target.value)}
                style={{ width: '26px', height: '26px', borderRadius: '4px', border: 'none', cursor: 'pointer', padding: 0 }}
              />
              <input
                type="text"
                value={selectedZone.backgroundColor}
                onChange={(e) => updateSelectedLayer('backgroundColor', e.target.value)}
                className="form-input"
                style={{ flex: 1, padding: '4px 8px', fontSize: '0.72rem' }}
              />
            </div>
          )}

          {/* Opacity */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Opacity Zona</label>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                {Math.round((selectedZone.opacity ?? 1.0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round((selectedZone.opacity ?? 1.0) * 100)}
              onChange={(e) => updateSelectedLayer('opacity', Number(e.target.value) / 100)}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Scrim Overlay */}
          <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Overlay Scrim (Gelapkan/Warnai)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <input
                type="color"
                value={(selectedZone.overlayColor || '#000000').startsWith('#') ? (selectedZone.overlayColor || '#000000') : '#000000'}
                onChange={(e) => updateSelectedLayer('overlayColor', e.target.value)}
                style={{ width: '24px', height: '24px', borderRadius: '4px', border: 'none', cursor: 'pointer', padding: 0 }}
              />
              <input
                type="text"
                value={selectedZone.overlayColor || 'transparent'}
                onChange={(e) => updateSelectedLayer('overlayColor', e.target.value)}
                className="form-input"
                style={{ flex: 1, padding: '3px 6px', fontSize: '0.6875rem' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Opacity Overlay</span>
              <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                {Math.round((selectedZone.overlayOpacity ?? 0.0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round((selectedZone.overlayOpacity ?? 0.0) * 100)}
              onChange={(e) => updateSelectedLayer('overlayOpacity', Number(e.target.value) / 100)}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Border Radius & Width */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Border Radius</label>
              <input
                type="number"
                min={0}
                max={100}
                value={selectedZone.borderRadius || 0}
                onChange={(e) => updateSelectedLayer('borderRadius', parseInt(e.target.value, 10) || 0)}
                className="form-input"
                style={{ padding: '4px 6px', fontSize: '0.72rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Tebal Border</label>
              <input
                type="number"
                min={0}
                max={20}
                value={selectedZone.borderWidth || 0}
                onChange={(e) => updateSelectedLayer('borderWidth', parseInt(e.target.value, 10) || 0)}
                className="form-input"
                style={{ padding: '4px 6px', fontSize: '0.72rem' }}
              />
            </div>
          </div>
        </div>

        {/* Content allocation buttons */}
        <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Tambah Konten
          </span>
          <div className="layer-action-group">
            <button
              type="button"
              onClick={() => setMediaPickerZoneId(selectedZone.id)}
              className="btn-action-compact"
              title="Tambah Media (Gambar, Video)"
            >
              <Film size={14} style={{ flexShrink: 0 }} />
              <span className="btn-label">+ Media</span>
            </button>
            <button
              type="button"
              onClick={() => setComponentPickerZoneId(selectedZone.id)}
              className="btn-action-compact btn-action-accent"
              title="Tambah Komponen Layar (Jam, Teks Berjalan, Web View, Antrian, Album)"
            >
              <LayoutGrid size={14} style={{ flexShrink: 0 }} />
              <span className="btn-label">+ Komponen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
