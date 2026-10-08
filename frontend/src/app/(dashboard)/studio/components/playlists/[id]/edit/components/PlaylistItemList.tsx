'use client';

import React from 'react';
import { Plus, Film, Image as ImageIcon, Clock, Trash2 } from 'lucide-react';
import { Playlist, MediaItem } from '@/lib/services';

interface PlaylistItemListProps {
  playlist: Playlist;
  mediaList: MediaItem[];
  setShowAddModal: (show: boolean) => void;
  draggedItemIdx: number | null;
  dragOverIdx: number | null;
  handleDragStart: (e: React.DragEvent, idx: number) => void;
  handleDragOver: (e: React.DragEvent, idx: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, idx: number) => void;
  handleRemoveItem: (itemId: string) => void;
}

export default function PlaylistItemList({
  playlist,
  mediaList,
  setShowAddModal,
  draggedItemIdx,
  dragOverIdx,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleRemoveItem
}: PlaylistItemListProps) {
  return (
    <div className="card-elevated" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Urutan Rotasi Media ({playlist.itemsList?.length || 0})
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Media akan diputar berurutan dari atas ke bawah sesuai durasi masing-masing.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-outline"
          style={{ fontSize: '0.75rem', padding: '6px 12px' }}
        >
          <Plus size={14} /> Tambah Media
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>No</th>
              <th>Nama Media</th>
              <th>Durasi Tayang</th>
              <th>Efek Transisi</th>
              <th style={{ textAlign: 'right', width: '80px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(!playlist.itemsList || playlist.itemsList.length === 0) ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <Film size={32} style={{ opacity: 0.4, margin: '0 auto' }} />
                  </div>
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Belum ada konten media di playlist ini</p>
                  <p style={{ fontSize: '0.8125rem', marginBottom: '16px' }}>Klik tombol di bawah untuk memilih media promosi dari Pustaka Media</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary"
                    style={{ margin: '0 auto' }}
                  >
                    <Plus size={16} /> Pilih Media Sekarang
                  </button>
                </td>
              </tr>
            ) : (
              playlist.itemsList.map((item, idx) => {
                const matchedMedia = mediaList.find(m => m.id === item.mediaItemId);
                const isVideo = matchedMedia?.mediaType === 2;

                return (
                  <tr 
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, idx)}
                    style={{
                      cursor: 'grab',
                      opacity: draggedItemIdx === idx ? 0.4 : 1,
                      backgroundColor: dragOverIdx === idx ? 'rgba(56, 189, 248, 0.1)' : undefined,
                      transition: 'background-color 0.1s'
                    }}
                  >
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            backgroundColor: '#0f172a',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {matchedMedia?.publicUrl && !isVideo ? (
                            <img
                              src={matchedMedia.publicUrl}
                              alt={matchedMedia.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : isVideo && matchedMedia?.publicUrl ? (
                            <video src={matchedMedia.publicUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : isVideo ? (
                            <Film size={18} color="var(--accent-amber)" />
                          ) : (
                            <ImageIcon size={18} color="var(--primary-500)" />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {matchedMedia?.name || item.mediaItem?.name || `Media ${item.mediaItemId.substring(0, 8)}...`}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            ID: {item.mediaItemId.substring(0, 16)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--accent-amber)' }}>
                        <Clock size={13} /> {item.durationSeconds} detik
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {item.transitionType || 'Fade'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id!)}
                        className="btn btn-danger"
                        style={{ padding: '6px 8px' }}
                        title="Hapus dari playlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
