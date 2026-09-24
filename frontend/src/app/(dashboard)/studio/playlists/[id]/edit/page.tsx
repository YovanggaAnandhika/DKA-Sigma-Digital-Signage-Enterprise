'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api, Playlist, MediaItem } from '@/lib/services';
import { ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import PlaylistInfoForm from './components/PlaylistInfoForm';
import PlaylistItemList from './components/PlaylistItemList';

// Dynamically import the Add Modal
const AddPlaylistItemModal = dynamic(() => import('./components/AddPlaylistItemModal'), {
  ssr: false,
});

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
    isShuffle: false,
  });

  // Form new item data
  const [newItem, setNewItem] = useState({
    mediaItemId: '',
    durationSeconds: 10,
    transitionType: 'fade',
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
        isShuffle: plData.isShuffle,
      });
      if (mediaRes.data && mediaRes.data.length > 0) {
        const firstMedia = mediaRes.data[0];
        setNewItem((prev) => ({
          ...prev,
          mediaItemId: firstMedia.id,
          durationSeconds: firstMedia.durationSeconds && firstMedia.durationSeconds > 0
            ? firstMedia.durationSeconds
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
        const ch = new BroadcastChannel('dkasigma_studio_events');
        ch.postMessage({ type: 'playlist_updated', playlistId: params.id });
        ch.close();
      } catch (e) {}
      try {
        localStorage.setItem('dkasigma_last_update', Date.now().toString());
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
    if (!newItem.mediaItemId) {
      alert('Pilih media terlebih dahulu');
      return;
    }
    try {
      setAddingItem(true);
      const updated = await api.addPlaylistItem({
        playlistId: params.id,
        mediaItemId: newItem.mediaItemId,
        durationSeconds: Number(newItem.durationSeconds) || 10,
        transitionType: newItem.transitionType,
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

    const newItems = [...(playlist!.itemsList || [])];
    const [dragged] = newItems.splice(draggedItemIdx, 1);
    newItems.splice(idx, 0, dragged);
    
    // Optimistic UI update
    setPlaylist({ ...playlist!, itemsList: newItems });
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

  const totalDuration = playlist.itemsList?.reduce((acc, i) => acc + (i.durationSeconds || 0), 0) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href={`/studio/playlists/${params.id}`} className="btn btn-outline" style={{ padding: '8px' }}>
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
        <PlaylistInfoForm
          formData={formData}
          setFormData={setFormData}
          handleSubmitInfo={handleSubmitInfo}
          saving={saving}
          playlist={playlist}
          totalDuration={totalDuration}
        />

        {/* Bottom Column: Playlist Items List */}
        <PlaylistItemList
          playlist={playlist}
          mediaList={mediaList}
          setShowAddModal={setShowAddModal}
          draggedItemIdx={draggedItemIdx}
          dragOverIdx={dragOverIdx}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleRemoveItem={handleRemoveItem}
        />
      </div>

      {/* Modal Add Media to Playlist (Dynamically Loaded) */}
      {showAddModal && (
        <AddPlaylistItemModal
          mediaList={mediaList}
          newItem={newItem}
          setNewItem={setNewItem}
          setShowAddModal={setShowAddModal}
          handleAddItem={handleAddItem}
          addingItem={addingItem}
        />
      )}
    </div>
  );
}
