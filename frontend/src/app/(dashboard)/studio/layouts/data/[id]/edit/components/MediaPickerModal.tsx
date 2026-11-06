'use client';

import React, { useState } from 'react';
import { Search, X, Check, Film, Image as ImageIcon, PlayCircle, Clock } from 'lucide-react';
import { addMediaBlock, createLayer } from '@/lib/services/studio/layout.service';
import { useLayoutEditor } from '../context/LayoutEditorContext';

export default function MediaPickerModal() {
  const { 
    mediaPickerZoneId, 
    setMediaPickerZoneId, 
    layers, 
    setLayers,
    mediaList, 
    showToast,
  } = useLayoutEditor();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');

  if (!mediaPickerZoneId) return null;

  const targetZone = layers.find(z => z.id === mediaPickerZoneId);
  if (!targetZone) return null;

  const handleClose = () => {
    setMediaPickerZoneId(null);
  };

  const handleSelect = async (mediaId: string) => {
    const media = mediaList.find(m => m.id === mediaId);
    if (!media) return;
    
    // Calculate the start time of the new block by summing all previous block durations
    const currentBlocks = targetZone.blocksList || [];
    let start_time_seconds = 0;
    for (const b of currentBlocks) {
      start_time_seconds += (b.durationSeconds || 10);
    }
    
    const duration_seconds = media.durationSeconds > 0 ? media.durationSeconds : 10;

    try {
      let realZoneId = targetZone.id;
      if (realZoneId.startsWith('z-')) {
        const newZ = await createLayer({
          layoutId: targetZone.layoutId,
          name: targetZone.name,
          x: targetZone.x,
          y: targetZone.y,
          width: targetZone.width,
          height: targetZone.height,
          zIndex: targetZone.zIndex,
          backgroundColor: targetZone.backgroundColor,
        });
        realZoneId = newZ.id;
      }

      const res = await addMediaBlock(realZoneId, mediaId, start_time_seconds, duration_seconds);
      const createdBlock = res.block || res;

      const newBlock: any = {
        ...createdBlock,
        id: createdBlock.id,
        layerId: realZoneId,
        playlistId: '',
        mediaItemId: mediaId,
        mediaItem: media,
        startTimeSeconds: start_time_seconds,
        durationSeconds: duration_seconds,
        transitionType: 'none',
        orderIndex: currentBlocks.length,
        itemOverridesList: [],
        isMuted: false,
        createdAt: new Date().toISOString(),
      };

      setLayers((prev) =>
        prev.map((z) => {
          if (z.id === targetZone.id || z.id === realZoneId) {
            return {
              ...z,
              id: realZoneId,
              blocksList: [...(z.blocksList || []), newBlock],
            };
          }
          return z;
        })
      );
      showToast('Media berhasil ditambahkan');
      handleClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan media block', 'error');
    }
  };

  const filteredMedia = mediaList.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.originalFilename.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (mediaTypeFilter === 'image') return m.mediaType === 1;
    if (mediaTypeFilter === 'video') return m.mediaType === 2;
    return true;
  });

  const imageCount = mediaList.filter((m) => m.mediaType === 1).length;
  const videoCount = mediaList.filter((m) => m.mediaType === 2).length;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(6px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '94vw',
        maxWidth: '1240px',
        height: '82vh',
        minHeight: '600px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '14px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface-elevated)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ImageIcon size={20} color="var(--primary-500)" />
            Pilih Media Langsung untuk Layer
            <span style={{ color: 'var(--primary-400)', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
              {targetZone.name}
            </span>
          </h2>
          <button 
            onClick={handleClose}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '50%', color: 'var(--text-secondary)' }}
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar: Search & Type Filter Tabs */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Cari media gambar atau video berdasarkan nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '0.82rem', height: '38px', width: '100%' }}
            />
          </div>

          {/* Quick Segmented Filter */}
          <div style={{ display: 'inline-flex', padding: 3, borderRadius: 8, backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setMediaTypeFilter('all')}
              style={{
                padding: '5px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: mediaTypeFilter === 'all' ? 'var(--primary-500)' : 'transparent',
                color: mediaTypeFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              Semua ({mediaList.length})
            </button>
            <button
              type="button"
              onClick={() => setMediaTypeFilter('image')}
              style={{
                padding: '5px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: mediaTypeFilter === 'image' ? 'var(--primary-500)' : 'transparent',
                color: mediaTypeFilter === 'image' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              Gambar ({imageCount})
            </button>
            <button
              type="button"
              onClick={() => setMediaTypeFilter('video')}
              style={{
                padding: '5px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: mediaTypeFilter === 'video' ? 'var(--primary-500)' : 'transparent',
                color: mediaTypeFilter === 'video' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              Video ({videoCount})
            </button>
          </div>
        </div>

        {/* Grid List */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-primary)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {/* Media Cards */}
            {filteredMedia.map(media => {
              const isSelected = targetZone.blocksList?.some(b => b.mediaItemId === media.id) || false;
              const isVideo = media.mediaType === 2;

              return (
                <div 
                  key={media.id}
                  onClick={() => handleSelect(media.id)}
                  style={{
                    border: `1.5px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-surface)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--primary-400)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                    }
                  }}
                >
                  <div style={{ 
                    width: '72px', height: '54px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {media.publicUrl && !isVideo ? (
                      <img src={media.publicUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : isVideo ? (
                      <Film size={20} color="var(--accent-amber)" />
                    ) : (
                      <ImageIcon size={20} color="var(--text-muted)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {media.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {isVideo ? <Film size={11} /> : <ImageIcon size={11} />}
                        {isVideo ? 'Video' : 'Gambar'}
                      </span>
                      {isVideo && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> {media.durationSeconds || 0}s
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected ? (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: 'var(--primary-500)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Check size={14} />
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)', flexShrink: 0 }}>
                      Pilih +
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          {filteredMedia.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <ImageIcon size={40} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>
                {searchQuery ? 'Tidak ada media yang cocok dengan pencarian.' : 'Belum ada media pada kategori ini.'}
              </p>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}} />
    </div>
  );
}
