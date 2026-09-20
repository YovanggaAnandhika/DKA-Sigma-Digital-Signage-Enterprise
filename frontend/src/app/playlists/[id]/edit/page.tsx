'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Playlist, MediaItem, PlaylistItem } from '../../../../lib/api';
import { ArrowLeft, Save, RefreshCw, Plus, Trash2, Film, Image as ImageIcon, Clock, Sparkles } from 'lucide-react';

export default function EditPlaylistPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Form playlist data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_shuffle: false,
  });

  // Form new item data
  const [newItem, setNewItem] = useState({
    media_item_id: '',
    duration_seconds: 10,
    transition_type: 'fade',
  });

  const fetchPlaylistAndMedia = useCallback(async () => {
    try {
      setLoading(true);
      const [plData, mediaRes] = await Promise.all([
        api.getPlaylist(params.id),
        api.getMedia({ limit: 100 }).catch(() => ({ data: [] })),
      ]);
      setPlaylist(plData);
      setMediaList(mediaRes.data || []);
      setFormData({
        name: plData.name,
        description: plData.description || '',
        is_shuffle: plData.is_shuffle,
      });
      if (mediaRes.data && mediaRes.data.length > 0) {
        const firstMedia = mediaRes.data[0];
        setNewItem((prev) => ({
          ...prev,
          media_item_id: firstMedia.id,
          duration_seconds: firstMedia.duration_seconds && firstMedia.duration_seconds > 0
            ? firstMedia.duration_seconds
            : 10,
        }));
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memuat playlist');
      router.push('/playlists');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchPlaylistAndMedia();
  }, [fetchPlaylistAndMedia]);

  const notifyStudioUpdate = () => {
    if (typeof window !== 'undefined') {
      try {
        const ch = new BroadcastChannel('omnisign_studio_events');
        ch.postMessage({ type: 'playlist_updated', playlist_id: params.id });
        ch.close();
      } catch (e) {}
      try {
        localStorage.setItem('omnisign_last_update', Date.now().toString());
      } catch (e) {}
    }
  };

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updatePlaylist(params.id, formData);
      alert('Pengaturan playlist berhasil disimpan!');
      const updated = await api.getPlaylist(params.id);
      setPlaylist(updated);
      notifyStudioUpdate();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui info playlist');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.media_item_id) {
      alert('Pilih media terlebih dahulu');
      return;
    }
    try {
      setAddingItem(true);
      const updated = await api.addPlaylistItem({
        playlist_id: params.id,
        media_item_id: newItem.media_item_id,
        duration_seconds: Number(newItem.duration_seconds) || 10,
        transition_type: newItem.transition_type,
      });
      setPlaylist(updated);
      setShowAddModal(false);
      notifyStudioUpdate();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan item ke playlist');
    } finally {
      setAddingItem(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Hapus item ini dari playlist?')) return;
    try {
      const updated = await api.removePlaylistItem(itemId, params.id);
      setPlaylist(updated);
      notifyStudioUpdate();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus item dari playlist');
    }
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedItemIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (idx !== dragOverIdx) setDragOverIdx(idx);
  };

  const handleDragLeave = () => {
    setDragOverIdx(null);
  };

  const handleDrop = async (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedItemIdx === null || draggedItemIdx === idx) {
      setDragOverIdx(null);
      setDraggedItemIdx(null);
      return;
    }

    const newItems = [...(playlist!.items || [])];
    const [dragged] = newItems.splice(draggedItemIdx, 1);
    newItems.splice(idx, 0, dragged);
    
    // Optimistic UI update
    setPlaylist({ ...playlist!, items: newItems });
    setDragOverIdx(null);
    setDraggedItemIdx(null);

    try {
      const idsInOrder = newItems.map(item => item.id!);
      await api.reorderPlaylistItems(params.id, idsInOrder);
      notifyStudioUpdate();
    } catch (err: any) {
      alert('Gagal mengubah urutan: ' + err.message);
      fetchPlaylistAndMedia(); // rollback
    }
  };

  if (loading || !playlist) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data playlist dan pustaka media...</span>
      </div>
    );
  }

  const totalDuration = playlist.items?.reduce((acc, i) => acc + (i.duration_seconds || 0), 0) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href={`/playlists/${params.id}`} className="btn btn-outline" style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Edit Playlist: {playlist.name}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Atur urutan item video/gambar promosi dan durasi tayang masing-masing.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Tambah Media ke Playlist</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Column: Playlist Settings */}
        <div className="card-elevated" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Pengaturan Dasar
          </h2>
          <form onSubmit={handleSubmitInfo} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Nama Daftar Putar <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <input
                  type="checkbox"
                  id="is_shuffle"
                  checked={formData.is_shuffle}
                  onChange={(e) => setFormData({ ...formData, is_shuffle: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="is_shuffle" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Putar secara acak (Shuffle mode)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '8px' }}>
                <button type="submit" disabled={saving} className="btn btn-secondary" style={{ width: 'auto' }}>
                  <Save size={14} />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Nama & Mode'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Stats Summary */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Item Media:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{playlist.items?.length || 0} media</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Durasi 1 Putaran:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{totalDuration} detik</span>
            </div>
          </div>
        </div>

        {/* Bottom Column: Playlist Items List */}
        <div className="card-elevated" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Urutan Rotasi Media ({playlist.items?.length || 0})
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
                {(!playlist.items || playlist.items.length === 0) ? (
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
                  playlist.items.map((item, idx) => {
                    const matchedMedia = mediaList.find(m => m.id === item.media_item_id);
                    const isVideo = matchedMedia?.media_type === 2;

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
                              {matchedMedia?.public_url && !isVideo ? (
                                <img
                                  src={matchedMedia.public_url}
                                  alt={matchedMedia.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : isVideo ? (
                                <Film size={18} color="var(--accent-amber)" />
                              ) : (
                                <ImageIcon size={18} color="var(--primary-500)" />
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {matchedMedia?.name || item.media_name || `Media ${item.media_item_id.substring(0, 8)}...`}
                              </div>
                              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                ID: {item.media_item_id.substring(0, 16)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--accent-amber)' }}>
                            <Clock size={13} /> {item.duration_seconds} detik
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
                            {item.transition_type || 'Fade'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
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
      </div>

      {/* Modal Add Media to Playlist */}
      {showAddModal && (
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
              maxWidth: '540px',
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--primary-500)" /> Tambah Media ke Playlist
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Pilih Aset Media dari Pustaka <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                {mediaList.length === 0 ? (
                  <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', color: '#92400e', fontSize: '0.8125rem' }}>
                    Belum ada media diunggah di Pustaka Media. Silakan unggah foto/video di menu <strong>Pustaka Media</strong> terlebih dahulu.
                  </div>
                ) : (
                  <select
                    className="form-input"
                    value={newItem.media_item_id}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const selMedia = mediaList.find(m => m.id === selId);
                      setNewItem({
                        ...newItem,
                        media_item_id: selId,
                        duration_seconds: selMedia?.duration_seconds && selMedia.duration_seconds > 0 ? selMedia.duration_seconds : 10,
                      });
                    }}
                    required
                  >
                    {mediaList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.media_type === 2 ? '🎬 [Video]' : '🖼️ [Gambar]'} {m.name} ({m.duration_seconds > 0 ? `${m.duration_seconds}s` : 'Statis'})
                      </option>
                    ))}
                  </select>
                )}

                {(() => {
                  const selMedia = mediaList.find((m) => m.id === newItem.media_item_id);
                  if (!selMedia) return null;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#0f172a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selMedia.public_url && selMedia.media_type !== 2 ? (
                          <img src={selMedia.public_url} alt={selMedia.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : selMedia.media_type === 2 ? (
                          <Film size={20} color="var(--accent-amber)" />
                        ) : (
                          <ImageIcon size={20} color="var(--primary-500)" />
                        )}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {selMedia.name}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {selMedia.width} × {selMedia.height} px • {selMedia.mime_type}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Durasi Tayang (Detik) <span style={{ color: 'var(--accent-rose)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3600}
                    required
                    value={newItem.duration_seconds}
                    onChange={(e) => setNewItem({ ...newItem, duration_seconds: Number(e.target.value) })}
                    className="form-input"
                  />
                  {(() => {
                    const selMedia = mediaList.find(m => m.id === newItem.media_item_id);
                    if (!selMedia) return null;
                    if (selMedia.media_type === 2 && selMedia.duration_seconds > 0) {
                      return (
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          ✅ Durasi video asli: <strong>{selMedia.duration_seconds} detik</strong> (sudah otomatis diisi)
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Efek Transisi
                  </label>
                  <select
                    className="form-input"
                    value={newItem.transition_type}
                    onChange={(e) => setNewItem({ ...newItem, transition_type: e.target.value })}
                  >
                    <option value="fade">Fade Smooth</option>
                    <option value="slide_left">Slide Left</option>
                    <option value="slide_right">Slide Right</option>
                    <option value="none">Cut (Tanpa Transisi)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addingItem || mediaList.length === 0}
                  className="btn btn-primary"
                >
                  <Plus size={14} />
                  <span>{addingItem ? 'Menambahkan...' : 'Tambahkan ke Urutan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
