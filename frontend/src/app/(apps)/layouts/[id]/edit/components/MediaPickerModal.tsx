'use client';

import React, { useState } from 'react';
import { Search, X, Check, Film, Image as ImageIcon, PlayCircle, Clock } from 'lucide-react';
import { addMediaBlock, createZone } from '@/lib/services/studio/layout.service';
import { useLayoutEditor } from '../context/LayoutEditorContext';

export default function MediaPickerModal() {
  const { 
    mediaPickerZoneId, 
    setMediaPickerZoneId, 
    zones, 
    setZones,
    mediaList, 
    showToast,
  } = useLayoutEditor();
  
  const [searchQuery, setSearchQuery] = useState('');

  if (!mediaPickerZoneId) return null;

  const targetZone = zones.find(z => z.id === mediaPickerZoneId);
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
        const newZ = await createZone({
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
        zoneId: realZoneId,
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

      setZones((prev) =>
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

  const filteredMedia = mediaList.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '95vw',
        maxWidth: '1100px',
        maxHeight: '90vh',
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
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface)' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ImageIcon size={20} color="var(--primary-500)" />
            Pilih Media Langsung untuk Zona
            <span style={{ color: 'var(--primary-400)', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8125rem' }}>
              {targetZone.name}
            </span>
          </h2>
          <button 
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Cari media (gambar/video)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '0.8125rem', width: '100%' }}
            />
          </div>
        </div>

        {/* Grid List */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-primary)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
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
                    borderRadius: '8px',
                    padding: '12px',
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
                    width: '68px', height: '52px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {media.publicUrl && !isVideo ? (
                      <img src={media.publicUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : isVideo ? (
                      <Film size={18} color="var(--accent-amber)" />
                    ) : (
                      <ImageIcon size={18} color="var(--text-muted)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {media.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {isVideo ? <Film size={10} /> : <ImageIcon size={10} />}
                        {isVideo ? 'Video' : 'Gambar'}
                      </span>
                      {isVideo && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={10} /> {media.durationSeconds || 0}s
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={16} color="var(--primary-500)" />}
                </div>
              );
            })}
          </div>
          
          {searchQuery && filteredMedia.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Tidak ada media yang cocok dengan pencarian.
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
