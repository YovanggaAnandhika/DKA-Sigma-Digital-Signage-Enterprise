'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, Plus, Film, ChevronLeft, ChevronRight, ListMusic, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';

export default function LayersPanel() {
  const { zones, selectedZoneId, setSelectedZoneId, handleAddZone, availablePlaylists, mediaList, setPickerZoneId, setMediaPickerZoneId, updateSelectedZone } = useLayoutEditor();
  const [collapsed, setCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(240);
  const [isDraggingResize, setIsDraggingResize] = useState(false);
  const [isPlaylistExpanded, setIsPlaylistExpanded] = useState(true);

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

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
            [...zones].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)).map((z) => {
              const isSelected = z.id === selectedZoneId;
              const hasBlocks = z.blocksList && z.blocksList.length > 0;
              const firstBlock = hasBlocks ? z.blocksList[0] : null;
              const assignedPl = firstBlock ? availablePlaylists.find(p => p.id === firstBlock.playlistId) : null;
              const playlistName = hasBlocks ? `${z.blocksList.length} Blok Playlist` : null;
              const firstItem = assignedPl?.itemsList?.[0];
              const layerMedia = firstItem ? mediaList.find(m => m.id === firstItem.mediaItemId) : null;
              const isVideo = layerMedia?.mediaType === 2;

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
                    {layerMedia?.publicUrl && !isVideo ? (
                      <img
                        src={layerMedia.publicUrl}
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

      {/* Playlist Allocation panel (bottom) */}
      {!collapsed && selectedZone && (
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
          <div 
            onClick={() => setIsPlaylistExpanded(!isPlaylistExpanded)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', backgroundColor: 'var(--bg-surface-elevated)' }}
          >
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <ListMusic size={14} /> ALOKASI PLAYLIST
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(selectedZone.blocksList && selectedZone.blocksList.length > 0) && (
                <Link
                  href={`/playlists/${selectedZone.blocksList[0].playlistId}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: '0.6875rem', color: 'var(--primary-500)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  Buka <ExternalLink size={10} />
                </Link>
              )}
              {isPlaylistExpanded ? <ChevronDown size={14} color="var(--text-secondary)" /> : <ChevronUp size={14} color="var(--text-secondary)" />}
            </div>
          </div>
          
          {isPlaylistExpanded && (
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {(selectedZone.blocksList || []).length > 0 ? (
                (selectedZone.blocksList || []).map((block, index) => {
                  const isMediaBlock = !!block.mediaItemId;
                  let name = 'Loading...';
                  let detail1 = '';
                  let detail2 = '';
                  let icon = <ListMusic size={14} />;

                  if (isMediaBlock) {
                    const m = mediaList.find(m => m.id === block.mediaItemId);
                    name = m?.name || 'Media';
                    detail1 = m?.mediaType === 2 ? 'Video' : 'Image';
                    detail2 = `${block.durationSeconds}s`;
                    icon = <Film size={14} />;
                  } else {
                    const pl = availablePlaylists.find(p => p.id === block.playlistId);
                    name = pl?.name || 'Playlist';
                    detail1 = `${pl?.itemsList?.length || 0} Media`;
                    detail2 = `${pl?.totalDurationSeconds || 0}s`;
                  }

                  return (
                    <div key={block.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {icon} {name}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{detail1}</span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--accent-amber)' }}>{detail2}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm('Hapus blok playlist ini dari zona?')) {
                            const newBlocks = (selectedZone.blocksList || []).filter(b => b.id !== block.id);
                            updateSelectedZone('blocksList', newBlocks);
                          }
                        }}
                        style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '4px' }}
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
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.75rem', backgroundColor: 'var(--bg-base)', borderRadius: '6px', border: '1px dashed var(--border-subtle)' }}>
                  Belum ada playlist yang ditambahkan.
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => setPickerZoneId(selectedZone.id)}
                  style={{ flex: 1, padding: '8px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--bg-surface-elevated)', border: '1px dashed var(--border-subtle)', borderRadius: '6px', cursor: 'pointer', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-50)'; e.currentTarget.style.borderColor = 'var(--primary-300)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  title="Tambah Playlist"
                >
                  <ListMusic size={14} /> Playlist
                </button>
                <button
                  onClick={() => setMediaPickerZoneId(selectedZone.id)}
                  style={{ flex: 1, padding: '8px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--bg-surface-elevated)', border: '1px dashed var(--border-subtle)', borderRadius: '6px', cursor: 'pointer', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-50)'; e.currentTarget.style.borderColor = 'var(--primary-300)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  title="Tambah Media Langsung"
                >
                  <Film size={14} /> Media
                </button>
              </div>
            </div>
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
