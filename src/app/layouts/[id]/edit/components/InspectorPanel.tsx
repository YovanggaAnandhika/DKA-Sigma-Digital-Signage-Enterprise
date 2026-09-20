'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, MousePointer2, ListMusic, ExternalLink } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';

export default function InspectorPanel() {
  const { layoutName, setLayoutName, zones, selectedZoneId, handleDeleteZone, updateSelectedZone, availablePlaylists } = useLayoutEditor();
  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const selectedPlaylist = selectedZone?.assigned_playlist_id 
    ? availablePlaylists.find(p => p.id === selectedZone.assigned_playlist_id) 
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
                {selectedZone.assigned_playlist_id && (
                  <Link
                    href={`/playlists/${selectedZone.assigned_playlist_id}`}
                    target="_blank"
                    style={{ fontSize: '0.6875rem', color: 'var(--primary-500)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    Buka <ExternalLink size={10} />
                  </Link>
                )}
              </div>
              
              <select
                value={selectedZone.assigned_playlist_id || ''}
                onChange={(e) => {
                  const plId = e.target.value;
                  updateSelectedZone('assigned_playlist_id', plId);
                  const matched = availablePlaylists.find(p => p.id === plId);
                  updateSelectedZone('playlist_name', matched?.name || '');
                }}
                className="form-input"
                style={{ fontSize: '0.8125rem', padding: '8px 12px', cursor: 'pointer', backgroundColor: '#fff' }}
              >
                <option value="">-- Rotasi Default (Tanpa Playlist) --</option>
                {availablePlaylists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    🎬 {pl.name} ({pl.items?.length || 0} media • {pl.total_duration_seconds || 0}s)
                  </option>
                ))}
              </select>

              {selectedPlaylist ? (
                <div style={{ marginTop: '10px', padding: '10px 12px', backgroundColor: 'rgba(56, 189, 248, 0.08)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Jumlah Konten:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedPlaylist.items?.length || 0} Media</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <span>Durasi Putaran:</span>
                    <strong style={{ color: 'var(--accent-amber)' }}>{selectedPlaylist.total_duration_seconds || 0} detik</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <span>Mode Putar:</span>
                    <strong>{selectedPlaylist.is_shuffle ? 'Acak (Shuffle)' : 'Berurutan'}</strong>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Pilih playlist di atas untuk memutar video atau gambar secara otomatis di zona ini.
                </p>
              )}
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
