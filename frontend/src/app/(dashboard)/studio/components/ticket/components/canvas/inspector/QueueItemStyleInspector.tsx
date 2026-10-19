'use client';

import React from 'react';
import { useQueueEditor } from '../../../context/QueueEditorContext';
import { QueueLayoutItem } from '../../../types';

interface QueueItemStyleInspectorProps {
  selectedItem: QueueLayoutItem;
}

export default function QueueItemStyleInspector({ selectedItem }: QueueItemStyleInspectorProps) {
  const { queue, updateLayoutItem } = useQueueEditor();
  const isTransparent = !selectedItem.backgroundColor || selectedItem.backgroundColor === 'transparent';

  const handleInsertVar = (code: string) => {
    updateLayoutItem(selectedItem.id, {
      templateContent: `${selectedItem.templateContent} ${code}`.trim(),
    });
  };

  return (
    <>
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
            { code: '$queue_number$', label: queue.ticketLabel || 'Nomor' },
            { code: '$queue_counter$', label: queue.counterLabel || 'Loket' },
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

            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Warna Border</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="color"
                  value={(selectedItem.config?.borderColor || '#000000').startsWith('#') ? (selectedItem.config?.borderColor || '#000000') : '#000000'}
                  onChange={(e) =>
                    updateLayoutItem(selectedItem.id, {
                      config: { ...selectedItem.config, borderColor: e.target.value },
                    })
                  }
                  style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', cursor: 'pointer', padding: 0 }}
                />
                <input
                  type="text"
                  value={selectedItem.config?.borderColor || 'transparent'}
                  onChange={(e) =>
                    updateLayoutItem(selectedItem.id, {
                      config: { ...selectedItem.config, borderColor: e.target.value },
                    })
                  }
                  className="form-input"
                  style={{ flex: 1, padding: '4px 6px', fontSize: '0.72rem' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Opacity Elemen */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Opacity Elemen</label>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary-400)' }}>
              {Math.round((selectedItem.opacity ?? 1.0) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round((selectedItem.opacity ?? 1.0) * 100)}
            onChange={(e) => updateLayoutItem(selectedItem.id, { opacity: Number(e.target.value) / 100 })}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

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
    </>
  );
}
