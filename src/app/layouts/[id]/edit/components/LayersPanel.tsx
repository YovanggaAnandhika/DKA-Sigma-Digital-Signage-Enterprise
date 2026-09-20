'use client';

import React, { useState } from 'react';
import { Layers, Plus, Film, ChevronLeft, ChevronRight, ListMusic } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';

export default function LayersPanel() {
  const { zones, selectedZoneId, setSelectedZoneId, handleAddZone, availablePlaylists, mediaList, setPickerZoneId } = useLayoutEditor();
  const [collapsed, setCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(240);
  const [isDraggingResize, setIsDraggingResize] = useState(false);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingResize(true);
    const startX = e.clientX;
    const startW = panelWidth;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      setPanelWidth(Math.min(500, Math.max(160, startW + delta)));
    };
    const onMouseUp = () => {
      setIsDraggingResize(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      style={{
        width: collapsed ? '36px' : `${panelWidth}px`,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        zIndex: 5,
        transition: isDraggingResize ? 'none' : 'width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: collapsed ? '10px 6px' : '10px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          backgroundColor: 'var(--bg-surface-elevated)',
          minHeight: '44px',
          flexShrink: 0,
          gap: '6px',
        }}
      >
        {!collapsed && (
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, flex: 1 }}>
            <Layers size={14} />
            Layers
          </h3>
        )}

        {!collapsed && (
          <button
            onClick={handleAddZone}
            className="btn btn-primary"
            style={{ padding: '3px 7px', fontSize: '0.6875rem', height: 'auto', flexShrink: 0 }}
          >
            <Plus size={12} /> Baru
          </button>
        )}

        <button
          onClick={() => setCollapsed(prev => !prev)}
          title={collapsed ? 'Tampilkan panel Layers' : 'Sembunyikan panel Layers'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '5px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Zone list */}
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
          {zones.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 16px' }}>
              Belum ada layer. Klik &ldquo;Baru&rdquo; untuk menambahkan.
            </div>
          ) : (
            [...zones].sort((a, b) => (b.z_index || 0) - (a.z_index || 0)).map((z) => {
              const isSelected = z.id === selectedZoneId;
              const hasBlocks = z.blocks && z.blocks.length > 0;
              const firstBlock = hasBlocks ? z.blocks[0] : null;
              const assignedPl = firstBlock ? availablePlaylists.find(p => p.id === firstBlock.playlist_id) : null;
              const playlistName = hasBlocks ? `${z.blocks.length} Blok Playlist` : null;
              const firstItem = assignedPl?.items?.[0];
              const layerMedia = firstItem ? mediaList.find(m => m.id === firstItem.media_item_id) : null;
              const isVideo = layerMedia?.media_type === 2;

              return (
                <div
                  key={z.id}
                  onClick={() => setSelectedZoneId(z.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderLeft: isSelected ? '3px solid var(--primary-500)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '20px',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      backgroundColor: '#0f172a',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    {layerMedia?.public_url && !isVideo ? (
                      <img
                        src={layerMedia.public_url}
                        alt={layerMedia.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : isVideo ? (
                      <Film size={10} color="var(--accent-amber)" />
                    ) : (
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: isSelected ? 'var(--primary-500)' : '#94a3b8' }} />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary-600)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {z.name}
                    </span>
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerZoneId(z.id);
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        backgroundColor: hasBlocks ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-base)',
                        border: `1px solid ${hasBlocks ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'}`,
                        width: 'fit-content',
                        marginTop: '2px',
                        cursor: 'pointer'
                      }}
                      title="Klik untuk ubah alokasi playlist"
                      onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.95)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                    >
                      {hasBlocks ? (
                        <>
                          <Film size={10} color="var(--accent-amber)" />
                          <span style={{ fontSize: '0.625rem', color: 'var(--accent-amber)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                            {playlistName || 'Playlist'}
                          </span>
                        </>
                      ) : (
                        <>
                          <ListMusic size={10} color="var(--text-muted)" />
                          <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Belum dialokasikan</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Collapsed: zone dots */}
      {collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', paddingTop: '8px' }}>
          {zones.map((z) => {
            const isSelected = z.id === selectedZoneId;
            return (
              <button
                key={z.id}
                onClick={() => setSelectedZoneId(z.id)}
                title={z.name}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid var(--primary-500)' : '2px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-base)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'all 0.1s',
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isSelected ? 'var(--primary-500)' : '#94a3b8' }} />
              </button>
            );
          })}
          <button
            onClick={handleAddZone}
            title="Tambah Layer Baru"
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '1px dashed var(--primary-400)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              marginTop: '4px',
              color: 'var(--primary-500)',
            }}
          >
            <Plus size={10} />
          </button>
        </div>
      )}

      {/* Resize Handle */}
      {!collapsed && (
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '5px',
            cursor: 'col-resize',
            zIndex: 10,
            backgroundColor: isDraggingResize ? 'var(--primary-400)' : 'transparent',
            transition: 'background 0.15s',
          }}
          title="Tarik untuk mengubah lebar panel"
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.3)'; }}
          onMouseLeave={(e) => { if (!isDraggingResize) e.currentTarget.style.backgroundColor = 'transparent'; }}
        />
      )}
    </div>
  );
}
