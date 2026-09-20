'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, MousePointer2, ListMusic, ExternalLink, Film, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';

export default function InspectorPanel() {
  const { layoutName, setLayoutName, zones, selectedZoneId, handleDeleteZone, updateSelectedZone, availablePlaylists, mediaList, setPickerZoneId, isLayoutMetaExpanded, setIsLayoutMetaExpanded } = useLayoutEditor();
  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const firstBlock = selectedZone?.blocks?.[0];
  const selectedPlaylist = firstBlock 
    ? availablePlaylists.find(p => p.id === firstBlock.playlist_id) 
    : null;

  return (
    <div style={{ width: '300px', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)', overflowY: 'auto', zIndex: 5 }}>
      {/* Layout Meta */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div 
          onClick={() => setIsLayoutMetaExpanded(!isLayoutMetaExpanded)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', backgroundColor: isLayoutMetaExpanded ? 'transparent' : 'var(--bg-surface-elevated)' }}
        >
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Resolusi Layar
          </h3>
          {isLayoutMetaExpanded ? <ChevronUp size={14} color="var(--text-secondary)" /> : <ChevronDown size={14} color="var(--text-secondary)" />}
        </div>
        
        {isLayoutMetaExpanded && (
          <div style={{ padding: '0 20px 20px 20px' }}>
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
        )}
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
