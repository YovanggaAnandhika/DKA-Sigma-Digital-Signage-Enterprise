'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, MousePointer2, ListMusic, ExternalLink, Film, Image as ImageIcon } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';

export default function InspectorPanel() {
  const { layoutName, setLayoutName, zones, selectedZoneId, handleDeleteZone, updateSelectedZone, availablePlaylists, mediaList, setPickerZoneId } = useLayoutEditor();
  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const firstBlock = selectedZone?.blocks?.[0];
  const selectedPlaylist = firstBlock 
    ? availablePlaylists.find(p => p.id === firstBlock.playlist_id) 
    : null;

  return (
    <div style={{ width: '300px', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)', overflowY: 'auto', zIndex: 5 }}>
      {/* Layout Meta */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Resolusi Layar
        </h3>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            NAMA LAYOUT
          </label>
          <input
            type="text"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            className="form-input"
            style={{ fontSize: '0.8125rem', padding: '8px 12px' }}
          />
        </div>
      </div>

      {/* Zone Inspector */}
      {selectedZone ? (
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Properti Zona
            </h3>
            <button
              onClick={() => handleDeleteZone(selectedZone.id)}
              style={{
                backgroundColor: 'rgba(225, 29, 72, 0.1)',
                border: '1px solid rgba(225, 29, 72, 0.2)',
                color: 'var(--accent-rose)',
                fontSize: '0.6875rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              <Trash2 size={12} /> Hapus
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                NAMA KOTAK / ZONA
              </label>
              <input
                type="text"
                value={selectedZone.name}
                onChange={(e) => updateSelectedZone('name', e.target.value)}
                className="form-input"
                style={{ fontSize: '0.8125rem', padding: '8px 12px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  POSISI X (PX)
                </label>
                <input
                  type="number"
                  value={Math.round(selectedZone.x || 0)}
                  onChange={(e) => updateSelectedZone('x', Number(e.target.value))}
                  className="form-input"
                  style={{ fontSize: '0.8125rem', padding: '8px 12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  POSISI Y (PX)
                </label>
                <input
                  type="number"
                  value={Math.round(selectedZone.y || 0)}
                  onChange={(e) => updateSelectedZone('y', Number(e.target.value))}
                  className="form-input"
                  style={{ fontSize: '0.8125rem', padding: '8px 12px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  LEBAR (PX)
                </label>
                <input
                  type="number"
                  value={Math.round(selectedZone.width || 200)}
                  onChange={(e) => updateSelectedZone('width', Number(e.target.value))}
                  className="form-input"
                  style={{ fontSize: '0.8125rem', padding: '8px 12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  TINGGI (PX)
                </label>
                <input
                  type="number"
                  value={Math.round(selectedZone.height || 200)}
                  onChange={(e) => updateSelectedZone('height', Number(e.target.value))}
                  className="form-input"
                  style={{ fontSize: '0.8125rem', padding: '8px 12px' }}
                />
              </div>
            </div>
            
            <div style={{ marginTop: '4px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                TUMPUKAN (Z-INDEX)
              </label>
              <input
                type="number"
                value={selectedZone.z_index || 1}
                onChange={(e) => updateSelectedZone('z_index', Number(e.target.value))}
                className="form-input"
                style={{ fontSize: '0.8125rem', padding: '8px 12px' }}
              />
            </div>

            {/* Alokasi Playlist */}
            <div style={{ marginTop: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ListMusic size={14} /> ALOKASI DAFTAR PUTAR
                </label>
                {(selectedZone.blocks && selectedZone.blocks.length > 0) && (
                  <Link
                    href={`/playlists/${selectedZone.blocks[0].playlist_id}`}
                    target="_blank"
                    style={{ fontSize: '0.6875rem', color: 'var(--primary-500)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    Buka <ExternalLink size={10} />
                  </Link>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {(selectedZone.blocks || []).length > 0 ? (
                  (selectedZone.blocks || []).map((block, index) => {
                    const pl = availablePlaylists.find(p => p.id === block.playlist_id);
                    return (
                      <div key={block.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pl?.name || 'Loading playlist...'}
                          </span>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{pl?.items?.length || 0} Media</span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--accent-amber)' }}>{pl?.total_duration_seconds || 0}s</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('Hapus blok playlist ini dari zona?')) {
                              const newBlocks = (selectedZone.blocks || []).filter(b => b.id !== block.id);
                              updateSelectedZone('blocks', newBlocks);
                            }
                          }}
                          style={{
                            padding: '6px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            borderRadius: '4px',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                          title="Hapus Blok"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.75rem', backgroundColor: 'var(--bg-base)', borderRadius: '6px', border: '1px dashed var(--border-subtle)' }}>
                    Belum ada playlist yang ditambahkan.
                  </div>
                )}
                
                <button
                  onClick={() => setPickerZoneId(selectedZone.id)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '4px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-50)'; e.currentTarget.style.borderColor = 'var(--primary-300)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                >
                  + Tambah Blok Playlist
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ marginBottom: '12px' }}>
            <MousePointer2 size={24} style={{ opacity: 0.5, margin: '0 auto' }} />
          </div>
          <span style={{ fontSize: '0.8125rem' }}>Pilih layer zona pada panel kiri atau canvas untuk mengedit</span>
        </div>
      )}
    </div>
  );
}
