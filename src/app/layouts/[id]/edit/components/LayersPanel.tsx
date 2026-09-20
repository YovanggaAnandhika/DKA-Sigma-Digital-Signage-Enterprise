'use client';

import React from 'react';
import { Layers, Plus } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';

export default function LayersPanel() {
  const { zones, selectedZoneId, setSelectedZoneId, handleAddZone, availablePlaylists } = useLayoutEditor();

  return (
    <div style={{ width: '280px', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)', zIndex: 5 }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fafafa' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Layers size={16} className="text-primary-500" />
          Layers
        </h3>
        <button onClick={handleAddZone} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}>
          <Plus size={14} /> Baru
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
        {zones.length === 0 ? (
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 20px' }}>
            Belum ada layer. Klik "Baru" untuk menambahkan.
          </div>
        ) : (
          [...zones].sort((a, b) => (b.z_index || 0) - (a.z_index || 0)).map((z) => {
            const isSelected = z.id === selectedZoneId;
            const playlistName = z.playlist_name || availablePlaylists.find(p => p.id === z.assigned_playlist_id)?.name;
            return (
              <div
                key={z.id}
                onClick={() => setSelectedZoneId(z.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                  borderBottom: '1px solid var(--border-subtle)',
                  borderLeft: isSelected ? '3px solid var(--primary-500)' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: isSelected ? 'var(--primary-500)' : '#cbd5e1', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary-600)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {z.name}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: z.assigned_playlist_id ? 'var(--accent-amber)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {z.assigned_playlist_id ? `🎬 ${playlistName || 'Playlist'}` : 'Tanpa playlist'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
