'use client';

import React, { useState } from 'react';
import { Search, X, Check, Film, Image as ImageIcon, PlayCircle, Clock } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';

export default function PlaylistPickerModal() {
  const { 
    pickerZoneId, 
    setPickerZoneId, 
    zones, 
    availablePlaylists, 
    mediaList, 
    updateSelectedZone 
  } = useLayoutEditor();
  
  const [searchQuery, setSearchQuery] = useState('');

  if (!pickerZoneId) return null;

  const targetZone = zones.find(z => z.id === pickerZoneId);
  if (!targetZone) return null;

  const handleClose = () => {
    setPickerZoneId(null);
  };

  const handleSelect = (plId: string) => {
    const newBlock = {
      id: 'temp-' + Date.now(),
      zone_id: targetZone.id,
      playlist_id: plId,
      start_time_seconds: 0, // Will be appended to the end of timeline in real implementation
      duration_seconds: 10, // Default duration
      transition_type: 'none',
      order_index: (targetZone.blocks?.length || 0)
    };
    // Append block
    updateSelectedZone('blocks', [...(targetZone.blocks || []), newBlock]);
    handleClose();
  };

  const filteredPlaylists = availablePlaylists.filter(pl => 
    pl.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        width: '600px',
        maxHeight: '85vh',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlayCircle size={18} color="var(--primary-500)" />
            Pilih Playlist untuk Zona
            <span style={{ color: 'var(--primary-600)', backgroundColor: 'var(--primary-50)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8125rem' }}>
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
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#fafafa' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Cari playlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '0.8125rem', width: '100%' }}
            />
          </div>
        </div>

        {/* Grid List */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-base)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            


            {/* Playlist Cards */}
            {filteredPlaylists.map(pl => {
              const isSelected = targetZone.blocks?.some(b => b.playlist_id === pl.id) || false;
              const firstItem = pl.items?.[0];
              const firstMedia = firstItem ? mediaList.find(m => m.id === firstItem.media_item_id) : null;
              const isVideo = firstMedia?.media_type === 2;

              return (
                <div 
                  key={pl.id}
                  onClick={() => handleSelect(pl.id)}
                  style={{
                    border: `2px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                    backgroundColor: isSelected ? 'var(--primary-50)' : '#fff',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--primary-300)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{ 
                    width: '64px', height: '48px', borderRadius: '6px', backgroundColor: '#0f172a', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0
                  }}>
                    {firstMedia?.public_url && !isVideo ? (
                      <img src={firstMedia.public_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : isVideo ? (
                      <Film size={16} color="var(--accent-amber)" />
                    ) : (
                      <ImageIcon size={16} color="#94a3b8" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pl.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Film size={10} /> {pl.items?.length || 0}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} /> {pl.total_duration_seconds || 0}s
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check size={16} color="var(--primary-500)" />}
                </div>
              );
            })}
          </div>
          
          {searchQuery && filteredPlaylists.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Tidak ada playlist yang cocok dengan pencarian.
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
