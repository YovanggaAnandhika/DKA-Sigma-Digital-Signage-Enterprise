'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, MediaItem } from '@/lib/services';
import { Pagination } from '@/components/ui/Pagination';
import { FolderOpen, Plus, RefreshCw } from 'lucide-react';
import MediaGalleryGrid from './components/MediaGalleryGrid';
import MediaDetailsSidebar from './components/MediaDetailsSidebar';
import MediaFilterBar from './components/MediaFilterBar';

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getMedia({ search, page, limit });
      setMediaItems(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus media asset "${name}"?`)) return;
    try {
      await api.deleteMedia(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus media');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '16px',
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
            }}
          >
            <FolderOpen size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Pustaka Media (Asset Library)
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              File video dan gambar promosi tervalidasi SHA-256 untuk distribusi cache player.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={loadData} className="btn btn-secondary" title="Segarkan data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/studio/media/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Unggah Media Baru</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <MediaFilterBar search={search} setSearch={setSearch} setPage={setPage} />

      {/* Main Content Area: Grid Gallery + Sidebar */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* Gallery Grid */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <MediaGalleryGrid
            mediaItems={mediaItems}
            loading={loading}
            selectedMedia={selectedMedia}
            setSelectedMedia={setSelectedMedia}
          />
          
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>

        {/* Right Sidebar (Details Panel) */}
        {selectedMedia && (
          <MediaDetailsSidebar
            selectedMedia={selectedMedia}
            setSelectedMedia={setSelectedMedia}
            handleDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
