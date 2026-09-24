'use client';

import React from 'react';
import { Sparkles, Film, Image as ImageIcon, Plus } from 'lucide-react';
import { MediaItem } from '@/lib/services';

interface AddPlaylistItemModalProps {
  mediaList: MediaItem[];
  newItem: { mediaItemId: string; durationSeconds: number; transitionType: string };
  setNewItem: (item: any) => void;
  setShowAddModal: (show: boolean) => void;
  handleAddItem: (e: React.FormEvent) => void;
  addingItem: boolean;
}

export default function AddPlaylistItemModal({
  mediaList,
  newItem,
  setNewItem,
  setShowAddModal,
  handleAddItem,
  addingItem
}: AddPlaylistItemModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        className="card-elevated"
        style={{
          width: '100%',
          maxWidth: '1200px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="var(--primary-500)" /> Pilih & Tambah Media ke Playlist
          </h3>
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Side: Media Gallery Grid */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: 'var(--bg-base)' }}>
            {mediaList.length === 0 ? (
              <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px', color: '#92400e', fontSize: '0.9375rem', textAlign: 'center' }}>
                Belum ada media diunggah di Pustaka Media. Silakan unggah foto/video di menu <strong>Pustaka Media</strong> terlebih dahulu.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                {mediaList.map((m) => {
                  const isSelected = m.id === newItem.mediaItemId;
                  const isVideo = m.mediaType === 2;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setNewItem({
                          ...newItem,
                          mediaItemId: m.id,
                          durationSeconds: m.durationSeconds > 0 ? m.durationSeconds : 10,
                        });
                      }}
                      style={{
                        borderRadius: '10px',
                        border: `2px solid ${isSelected ? 'var(--primary-500)' : 'transparent'}`,
                        backgroundColor: 'var(--bg-surface-elevated)',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: isSelected ? '0 0 0 2px rgba(56, 189, 248, 0.4), 0 10px 15px -3px rgba(0,0,0,0.3)' : '0 4px 6px -1px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#0f172a', position: 'relative' }}>
                        {m.publicUrl && !isVideo ? (
                          <img src={m.publicUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : isVideo && m.publicUrl ? (
                          <video src={m.publicUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : isVideo ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Film size={32} color="var(--accent-amber)" opacity={0.8} />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <ImageIcon size={32} color="var(--primary-500)" opacity={0.8} />
                          </div>
                        )}
                        
                        {/* Media Type Badge */}
                        <div style={{ position: 'absolute', top: '8px', left: '8px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(15,23,42,0.8)', color: '#fff', fontSize: '0.625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)' }}>
                          {isVideo ? <Film size={10} color="#fcd34d" /> : <ImageIcon size={10} color="#93c5fd" />}
                          {isVideo ? 'Video' : 'Image'}
                        </div>

                        {/* Duration Badge */}
                        {m.durationSeconds > 0 && (
                          <div style={{ position: 'absolute', bottom: '8px', right: '8px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(15,23,42,0.8)', color: '#fff', fontSize: '0.625rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                            {m.durationSeconds}s
                          </div>
                        )}
                      </div>
                      
                      <div style={{ padding: '12px' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                          {m.name}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {m.width} × {m.height} px
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side: Selected Media Details & Form */}
          <div style={{ width: '340px', padding: '24px', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', flexDirection: 'column' }}>
            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Media Terpilih</h4>
              
              {(() => {
                const selMedia = mediaList.find((m) => m.id === newItem.mediaItemId);
                if (!selMedia) return (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                    <ImageIcon size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                    <p style={{ fontSize: '0.8125rem' }}>Silakan pilih media dari galeri di samping</p>
                  </div>
                );

                const isVideo = selMedia.mediaType === 2;

                return (
                  <div style={{ flex: 1 }}>
                    {/* Selected Preview */}
                    <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0f172a', marginBottom: '16px', position: 'relative' }}>
                      {selMedia.publicUrl && !isVideo ? (
                        <img src={selMedia.publicUrl} alt={selMedia.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : isVideo && selMedia.publicUrl ? (
                        <video src={selMedia.publicUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : isVideo ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Film size={40} color="var(--accent-amber)" />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <ImageIcon size={40} color="var(--primary-500)" />
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', wordBreak: 'break-word' }}>
                      {selMedia.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                      {selMedia.width} × {selMedia.height} px • {selMedia.mimeType}
                    </div>

                    {/* Form Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          Durasi Tayang (Detik) <span style={{ color: 'var(--accent-rose)' }}>*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={3600}
                          required
                          value={newItem.durationSeconds}
                          onChange={(e) => setNewItem({ ...newItem, durationSeconds: Number(e.target.value) })}
                          className="form-input"
                        />
                        {isVideo && selMedia.durationSeconds > 0 && (
                          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            ✅ Durasi video asli: <strong>{selMedia.durationSeconds} detik</strong>
                          </p>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          Efek Transisi
                        </label>
                        <select
                          className="form-input"
                          value={newItem.transitionType}
                          onChange={(e) => setNewItem({ ...newItem, transitionType: e.target.value })}
                        >
                          <option value="fade">Fade Smooth</option>
                          <option value="slide_left">Slide Left</option>
                          <option value="slide_right">Slide Right</option>
                          <option value="none">Cut (Tanpa Transisi)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addingItem || mediaList.length === 0 || !newItem.mediaItemId}
                  className="btn btn-primary"
                  style={{ flex: 2, display: 'flex', justifyContent: 'center' }}
                >
                  <Plus size={16} />
                  <span>{addingItem ? 'Proses...' : 'Tambahkan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
