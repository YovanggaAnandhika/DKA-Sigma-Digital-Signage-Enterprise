'use client';

import React from 'react';
import {
  Sliders,
  Type,
  Maximize2,
  Palette,
  Trash2,
  Copy,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignLeft,
  AlignRight,
  ArrowUpToLine,
  ArrowDownToLine,
  Layers,
  Monitor,
  Sparkles,
  Volume2,
  Box,
  Check,
} from 'lucide-react';
import { useQueueEditor } from '../../context/QueueEditorContext';
import { QueueLayoutItem } from '../../types';

interface QueueItemInspectorProps {
  selectedItem: QueueLayoutItem | null;
  onSelect: (item: QueueLayoutItem | null) => void;
}

export default function QueueItemInspector({ selectedItem, onSelect }: QueueItemInspectorProps) {
  const { queue, updateLayoutItem, setQueue, updateField, applyThemePreset, triggerChime } = useQueueEditor();

  const canvasWidth = queue.canvasWidth || 1920;
  const canvasHeight = queue.canvasHeight || 1080;

  // 1. CANVAS & THEME INSPECTOR (Shown when no element is selected)
  if (!selectedItem) {
    return (
      <div
        style={{
          width: '320px',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: '620px',
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { id: 'clean-light', label: 'Clean Light', bg: '#f8fafc', accent: '#0284c7' },
                { id: 'solid-dark', label: 'Solid Slate Dark', bg: '#020617', accent: '#38bdf8' },
                { id: 'medical-green', label: 'Medical Green', bg: '#f0fdf4', accent: '#059669' },
                { id: 'executive-blue', label: 'Executive Blue', bg: '#0f172a', accent: '#60a5fa' },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => applyThemePreset(th.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: queue.themePreset === th.id ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                    backgroundColor: queue.themePreset === th.id ? 'var(--bg-surface)' : 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: th.accent, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Warna Latar Kanvas */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Warna Latar Kanvas
            </span>
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

            {/* Quick swatches */}
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

          {/* Wallpaper / Gambar Background */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Gambar Background (Opsional)
            </span>
            <input
              type="text"
              value={queue.backgroundImageUrl || ''}
              onChange={(e) => updateField('backgroundImageUrl', e.target.value)}
              placeholder="https://... (URL gambar background)"
              className="form-input"
              style={{ fontSize: '0.78rem', padding: '6px 8px' }}
            />
            {queue.backgroundImageUrl && (
              <button
                type="button"
                onClick={() => updateField('backgroundImageUrl', '')}
                style={{ marginTop: '4px', fontSize: '0.6875rem', color: 'var(--accent-rose)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Hapus gambar background
              </button>
            )}
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

  // 2. ELEMENT INSPECTOR (Shown when an item is selected)
  const isTransparent = !selectedItem.backgroundColor || selectedItem.backgroundColor === 'transparent';

  const handleInsertVar = (code: string) => {
    updateLayoutItem(selectedItem.id, {
      templateContent: `${selectedItem.templateContent} ${code}`.trim(),
    });
  };

  const handleDelete = () => {
    setQueue((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== selectedItem.id),
    }));
    onSelect(null);
  };

  const handleDuplicate = () => {
    const maxZ = queue.items.reduce((max, it) => Math.max(max, it.zIndex || 1), 1) + 1;
    const duplicated: QueueLayoutItem = {
      ...selectedItem,
      id: `item-${Date.now()}`,
      name: `${selectedItem.name} (Salinan)`,
      x: Math.min(canvasWidth - selectedItem.width, selectedItem.x + 30),
      y: Math.min(canvasHeight - selectedItem.height, selectedItem.y + 30),
      zIndex: maxZ,
    };
    setQueue((prev) => ({
      ...prev,
      items: [...prev.items, duplicated],
    }));
    onSelect(duplicated);
  };

  const handleAlign = (type: 'centerH' | 'centerV' | 'left' | 'right' | 'top' | 'bottom') => {
    if (type === 'centerH') {
      updateLayoutItem(selectedItem.id, { x: Math.round((canvasWidth - selectedItem.width) / 2) });
    } else if (type === 'centerV') {
      updateLayoutItem(selectedItem.id, { y: Math.round((canvasHeight - selectedItem.height) / 2) });
    } else if (type === 'left') {
      updateLayoutItem(selectedItem.id, { x: 0 });
    } else if (type === 'right') {
      updateLayoutItem(selectedItem.id, { x: canvasWidth - selectedItem.width });
    } else if (type === 'top') {
      updateLayoutItem(selectedItem.id, { y: 0 });
    } else if (type === 'bottom') {
      updateLayoutItem(selectedItem.id, { y: canvasHeight - selectedItem.height });
    }
  };

  return (
    <div
      style={{
        width: '320px',
        backgroundColor: 'var(--bg-surface-elevated)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '620px',
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
          justifyContent: 'space-between',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-500)' }}>
            Inspektor Elemen
          </span>
          <h4
            style={{
              margin: '2px 0 0 0',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedItem.name}
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={handleDuplicate}
            className="btn btn-outline"
            style={{ padding: '5px' }}
            title="Duplikat Elemen"
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-outline"
            style={{ padding: '5px', color: 'var(--accent-rose)' }}
            title="Hapus Elemen"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Transform: Position & Size */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            Posisi & Ukuran (px)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>X</label>
              <input
                type="number"
                value={selectedItem.x}
                onChange={(e) => updateLayoutItem(selectedItem.id, { x: parseInt(e.target.value, 10) || 0 })}
                className="form-input"
                style={{ padding: '5px 8px', fontSize: '0.78rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Y</label>
              <input
                type="number"
                value={selectedItem.y}
                onChange={(e) => updateLayoutItem(selectedItem.id, { y: parseInt(e.target.value, 10) || 0 })}
                className="form-input"
                style={{ padding: '5px 8px', fontSize: '0.78rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Lebar</label>
              <input
                type="number"
                value={selectedItem.width}
                onChange={(e) => updateLayoutItem(selectedItem.id, { width: parseInt(e.target.value, 10) || 50 })}
                className="form-input"
                style={{ padding: '5px 8px', fontSize: '0.78rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Tinggi</label>
              <input
                type="number"
                value={selectedItem.height}
                onChange={(e) => updateLayoutItem(selectedItem.id, { height: parseInt(e.target.value, 10) || 30 })}
                className="form-input"
                style={{ padding: '5px 8px', fontSize: '0.78rem' }}
              />
            </div>
          </div>

          {/* Quick Alignment Tools */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={() => handleAlign('left')}
              className="btn btn-secondary"
              style={{ padding: '6px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Rata Kiri Kanvas"
            >
              <AlignLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleAlign('centerH')}
              className="btn btn-secondary"
              style={{ padding: '6px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Rata Tengah Horizontal"
            >
              <AlignHorizontalJustifyCenter size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleAlign('right')}
              className="btn btn-secondary"
              style={{ padding: '6px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Rata Kanan Kanvas"
            >
              <AlignRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleAlign('top')}
              className="btn btn-secondary"
              style={{ padding: '6px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Rata Atas Kanvas"
            >
              <ArrowUpToLine size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleAlign('centerV')}
              className="btn btn-secondary"
              style={{ padding: '6px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Rata Tengah Vertikal"
            >
              <AlignVerticalJustifyCenter size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleAlign('bottom')}
              className="btn btn-secondary"
              style={{ padding: '6px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Rata Bawah Kanvas"
            >
              <ArrowDownToLine size={13} />
            </button>
          </div>
        </div>

        {/* Content & Variables */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Konten Teks & Variabel
          </span>
          <textarea
            rows={2}
            value={selectedItem.templateContent}
            onChange={(e) => updateLayoutItem(selectedItem.id, { templateContent: e.target.value })}
            className="form-textarea"
            style={{ fontSize: '0.8125rem', fontFamily: 'inherit' }}
            placeholder="Ketik teks atau variabel dinamis..."
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
            {[
              { code: '$queue_number$', label: 'Nomor' },
              { code: '$queue_counter$', label: 'Loket' },
              { code: '$queue_prefix$', label: 'Prefix' },
              { code: '$queue_name$', label: 'Nama' },
            ].map((v) => (
              <button
                key={v.code}
                type="button"
                onClick={() => handleInsertVar(v.code)}
                className="btn btn-secondary"
                style={{ padding: '2px 7px', fontSize: '0.6875rem', fontFamily: 'monospace' }}
                title={`Sisipkan ${v.code}`}
              >
                +{v.code}
              </button>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            Tipografi
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Ukuran Font</label>
              <input
                type="number"
                min={10}
                max={260}
                value={selectedItem.fontSize || 36}
                onChange={(e) => updateLayoutItem(selectedItem.id, { fontSize: parseInt(e.target.value, 10) || 36 })}
                className="form-input"
                style={{ padding: '5px 8px', fontSize: '0.78rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Ketebalan Font</label>
              <select
                value={selectedItem.fontWeight || 'bold'}
                onChange={(e) => updateLayoutItem(selectedItem.id, { fontWeight: e.target.value as any })}
                className="form-select"
                style={{ padding: '5px 8px', fontSize: '0.78rem' }}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="800">Extra Bold</option>
                <option value="900">Black</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Perataan Teks</label>
              <select
                value={selectedItem.textAlign || 'center'}
                onChange={(e) => updateLayoutItem(selectedItem.id, { textAlign: e.target.value as any })}
                className="form-select"
                style={{ padding: '5px 8px', fontSize: '0.78rem' }}
              >
                <option value="left">Rata Kiri</option>
                <option value="center">Rata Tengah</option>
                <option value="right">Rata Kanan</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Warna Teks</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="color"
                  value={(selectedItem.textColor || '#ffffff').startsWith('#') ? selectedItem.textColor : '#ffffff'}
                  onChange={(e) => updateLayoutItem(selectedItem.id, { textColor: e.target.value })}
                  style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', cursor: 'pointer', padding: 0 }}
                />
                <input
                  type="text"
                  value={selectedItem.textColor || ''}
                  onChange={(e) => updateLayoutItem(selectedItem.id, { textColor: e.target.value })}
                  className="form-input"
                  style={{ flex: 1, padding: '4px 6px', fontSize: '0.72rem' }}
                />
              </div>
            </div>
          </div>

          {/* Quick color swatches for text */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            {['#0f172a', '#ffffff', '#0284c7', '#38bdf8', '#059669', '#f59e0b', '#e11d48', '#7c3aed'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateLayoutItem(selectedItem.id, { textColor: c })}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '3px',
                  backgroundColor: c,
                  border: selectedItem.textColor === c ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* GAYA TAMPILAN: TEKS BEBAS VS KOTAK/CARD */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Latar Belakang
            </span>
            <span style={{ fontSize: '0.6875rem', color: isTransparent ? 'var(--text-muted)' : 'var(--primary-500)', fontWeight: 600 }}>
              {isTransparent ? 'Transparan' : 'Solid Card'}
            </span>
          </div>

          {/* Segmented Mode Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '3px',
              gap: '4px',
              marginBottom: '10px',
            }}
          >
            <button
              type="button"
              onClick={() =>
                updateLayoutItem(selectedItem.id, {
                  backgroundColor: 'transparent',
                  config: { ...selectedItem.config, borderRadius: 0, borderWidth: 0 },
                })
              }
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isTransparent ? 'var(--primary-600)' : 'transparent',
                color: isTransparent ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              Teks Bebas (Transparan)
            </button>
            <button
              type="button"
              onClick={() =>
                updateLayoutItem(selectedItem.id, {
                  backgroundColor: selectedItem.backgroundColor !== 'transparent' ? selectedItem.backgroundColor : '#ffffff',
                  config: { ...selectedItem.config, borderRadius: selectedItem.config?.borderRadius || 12 },
                })
              }
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: !isTransparent ? 'var(--primary-600)' : 'transparent',
                color: !isTransparent ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              Card
            </button>
          </div>

          {isTransparent ? (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(6, 182, 212, 0.08)',
                border: '1px dashed rgba(6, 182, 212, 0.3)',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}
            >
              Elemen tampil transparan langsung di atas kanvas.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Warna Card
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="color"
                    value={(selectedItem.backgroundColor || '#ffffff').startsWith('#') ? selectedItem.backgroundColor : '#ffffff'}
                    onChange={(e) => updateLayoutItem(selectedItem.id, { backgroundColor: e.target.value })}
                    style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', cursor: 'pointer', padding: 0 }}
                  />
                  <input
                    type="text"
                    value={selectedItem.backgroundColor || ''}
                    onChange={(e) => updateLayoutItem(selectedItem.id, { backgroundColor: e.target.value })}
                    className="form-input"
                    style={{ flex: 1, padding: '4px 6px', fontSize: '0.72rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Radius Sudut</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={selectedItem.config?.borderRadius || 0}
                    onChange={(e) =>
                      updateLayoutItem(selectedItem.id, {
                        config: { ...selectedItem.config, borderRadius: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="form-input"
                    style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Tebal Border</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={selectedItem.config?.borderWidth || 0}
                    onChange={(e) =>
                      updateLayoutItem(selectedItem.id, {
                        config: { ...selectedItem.config, borderWidth: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="form-input"
                    style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Lapisan Z-Index */}
          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Urutan Lapisan (Z-Index)</label>
            <input
              type="number"
              min={1}
              max={999}
              value={selectedItem.zIndex || 1}
              onChange={(e) => updateLayoutItem(selectedItem.id, { zIndex: parseInt(e.target.value, 10) || 1 })}
              className="form-input"
              style={{ padding: '5px 8px', fontSize: '0.78rem', marginTop: '3px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
