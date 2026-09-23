'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ListMusic, ChevronLeft, ChevronRight, ExternalLink, Film, Trash2 } from 'lucide-react';
import { useLayoutEditor } from '../../context/LayoutEditorContext';

export default function LayerBlockList() {
  const { zones, selectedZoneId, availablePlaylists, mediaList, updateSelectedZone, setPickerZoneId, setMediaPickerZoneId, isPlaylistCollapsed, setIsPlaylistCollapsed } = useLayoutEditor();
  const collapsed = isPlaylistCollapsed;
  const setCollapsed = setIsPlaylistCollapsed;

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        width: collapsed ? '36px' : '100%',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '10px 6px' : '10px 14px',
          minHeight: '44px',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderBottom: collapsed ? 'none' : '1px solid var(--border-subtle)',
          flexShrink: 0,
          gap: '6px',
        }}
      >
        {!collapsed && (
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            <ListMusic size={14} style={{ flexShrink: 0 }} /> ALOKASI PLAYLIST
          </label>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {!collapsed && selectedZone?.blocksList && selectedZone.blocksList.length > 0 && (
            <Link
              href={`/playlists/${selectedZone.blocksList[0].playlistId}`}
              target="_blank"
              style={{ fontSize: '0.6875rem', color: 'var(--primary-500)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              Buka <ExternalLink size={10} />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(prev => !prev)}
            title={collapsed ? 'Tampilkan Alokasi Playlist' : 'Sembunyikan Alokasi Playlist'}
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
      </div>
      
      {/* Collapsed Strip: Icon when collapsed */}
      {collapsed && (
        <div 
          onClick={() => setCollapsed(false)}
          title="Klik untuk membuka Alokasi Playlist"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '12px', cursor: 'pointer', color: 'var(--primary-600)' }}
        >
          <ListMusic size={16} />
        </div>
      )}

      {/* Expanded Content */}
      {!collapsed && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!selectedZone ? (
            <div style={{ padding: '20px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Pilih layer/zona di atas untuk mengatur alokasi playlist.
            </div>
          ) : (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
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
  </div>
  );
}
