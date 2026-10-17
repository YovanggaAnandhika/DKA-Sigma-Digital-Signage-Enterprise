'use client';

import React from 'react';
import { MessageSquare, Gauge, Eye, Palette } from 'lucide-react';
import { useQueueEditor } from '../../context/QueueEditorContext';

const Marquee = 'marquee' as any;

export default function TabMarqueeTab() {
  const { queue, updateLayoutItem } = useQueueEditor();

  const marqueeItem = queue.items.find((it) => it.itemType === 'marquee');
  if (!marqueeItem) return null;

  const handleToggleVisible = () => {
    updateLayoutItem(marqueeItem.id, { isVisible: !marqueeItem.isVisible });
  };

  const handleInsertVar = (v: string) => {
    updateLayoutItem(marqueeItem.id, {
      templateContent: `${marqueeItem.templateContent} ${v}`.trim(),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Marquee Main Config */}
      <div className="card-elevated" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={18} color="var(--primary-500)" />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Teks Informasi Berjalan (Running Text / Marquee)
            </h4>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={marqueeItem.isVisible}
              onChange={handleToggleVisible}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
            />
            {marqueeItem.isVisible ? 'Aktif' : 'Nonaktif'}
          </label>
        </div>

        {marqueeItem.isVisible && (
          <>
            {/* Template input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Isi Pesan Running Text
              </label>
              <textarea
                rows={3}
                value={marqueeItem.templateContent}
                onChange={(e) => updateLayoutItem(marqueeItem.id, { templateContent: e.target.value })}
                className="form-textarea"
                placeholder="Tulis pesan pengumuman atau gunakan variabel seperti $queue_number$ dan $queue_counter$..."
              />
            </div>

            {/* Variable helper buttons */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Sisipkan variabel dinamis:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  { code: '$queue_number$', desc: 'Nomor Tiket' },
                  { code: '$queue_counter$', desc: 'Loket Tujuan' },
                  { code: '$queue_prefix$', desc: 'Awalan Huruf' },
                  { code: '$queue_name$', desc: 'Nama Layar' },
                ].map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => handleInsertVar(v.code)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.72rem', fontFamily: 'monospace' }}
                  >
                    +{v.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed & Colors Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Kecepatan Bergulir
                </label>
                <select
                  value={marqueeItem.config.speed || 'normal'}
                  onChange={(e) =>
                    updateLayoutItem(marqueeItem.id, {
                      config: { ...marqueeItem.config, speed: e.target.value as any },
                    })
                  }
                  className="form-select"
                >
                  <option value="slow">Lambat (Mudah Dibaca)</option>
                  <option value="normal">Sedang (Standar Ritel)</option>
                  <option value="fast">Cepat (Ringkas)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Warna Latar Marquee
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={marqueeItem.backgroundColor}
                    onChange={(e) => updateLayoutItem(marqueeItem.id, { backgroundColor: e.target.value })}
                    style={{ width: '40px', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer', padding: 0 }}
                  />
                  <input
                    type="text"
                    value={marqueeItem.backgroundColor}
                    onChange={(e) => updateLayoutItem(marqueeItem.id, { backgroundColor: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Warna Teks
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={marqueeItem.textColor}
                    onChange={(e) => updateLayoutItem(marqueeItem.id, { textColor: e.target.value })}
                    style={{ width: '40px', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer', padding: 0 }}
                  />
                  <input
                    type="text"
                    value={marqueeItem.textColor}
                    onChange={(e) => updateLayoutItem(marqueeItem.id, { textColor: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Strip */}
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Pratinjau Langsung Running Text:
              </span>
              <div
                style={{
                  width: '100%',
                  height: '56px',
                  backgroundColor: marqueeItem.backgroundColor,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Marquee
                  behavior="scroll"
                  direction={marqueeItem.config?.direction || 'left'}
                  scrollamount={marqueeItem.config?.speed === 'fast' ? 12 : marqueeItem.config?.speed === 'slow' ? 4 : 8}
                  style={{
                    color: marqueeItem.textColor,
                    fontSize: '1.1rem',
                    fontWeight: marqueeItem.fontWeight || 'bold',
                    width: '100%',
                  }}
                >
                  {marqueeItem.templateContent
                    .replaceAll('$queue_number$', 'A-025')
                    .replaceAll('$queue_counter$', 'LOKET 01')
                    .replaceAll('$queue_prefix$', queue.prefix || 'A')
                    .replaceAll('$queue_name$', queue.name || 'Antrian')}
                </Marquee>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
