'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, MousePointer2, ListMusic, ExternalLink, Film, Image as ImageIcon } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';

export default function InspectorPanel() {
  const { layoutName, setLayoutName, zones, selectedZoneId, handleDeleteZone, updateSelectedZone, availablePlaylists, mediaList, setPickerZoneId } = useLayoutEditor();
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedZone.playlist_name || (selectedZone.assigned_playlist_id ? 'Playlist Terpasang' : 'Belum ada playlist')}
                  </span>
                </div>
                <button
                  onClick={() => setPickerZoneId(selectedZone.id)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    backgroundColor: '#fff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: 'var(--primary-600)',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  Ganti
                </button>
              </div>

              {selectedPlaylist ? (
                <>
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

                  {selectedPlaylist.items && selectedPlaylist.items.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                        Pratinjau Konten ({selectedPlaylist.items.length})
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                        {selectedPlaylist.items.map((item, idx) => {
                          const m = mediaList.find((media) => media.id === item.media_item_id);
                          const isVideo = m?.media_type === 2;
                          return (
                            <div
                              key={item.id || idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 8px',
                                backgroundColor: 'var(--bg-elevated)',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              <div
                                style={{
                                  width: '40px',
                                  height: '32px',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  backgroundColor: '#0f172a',
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid var(--border-subtle)',
                                }}
                              >
                                {m?.public_url && !isVideo ? (
                                  <img
                                    src={m.public_url}
                                    alt={m.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : isVideo ? (
                                  <Film size={14} color="var(--accent-amber)" />
                                ) : (
                                  <ImageIcon size={14} color="var(--primary-500)" />
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {m?.name || item.media_name || `Media ${idx + 1}`}
                                </span>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                  {item.duration_seconds || 10} detik &bull; {isVideo ? 'Video' : 'Gambar'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
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
