'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const [detailsWidth, setDetailsWidth] = useState(320);
  const splitLayoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerWidth = splitLayoutRef.current?.clientWidth;
    if (containerWidth) {
      setDetailsWidth(Math.max(240, Math.min(560, Math.round(containerWidth * 0.3))));
    }
  }, []);

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
      <div ref={splitLayoutRef} className="media-split-layout" style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
        
        {/* Gallery Grid */}
        <div className="media-split-gallery" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          <>
            <div
              className="media-panel-resizer"
              role="separator"
              aria-label="Sesuaikan lebar panel detail media"
              aria-orientation="vertical"
              aria-valuemin={240}
              aria-valuemax={560}
              aria-valuenow={detailsWidth}
              tabIndex={0}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                const container = event.currentTarget.parentElement;
                if (!container) return;
                const maxWidth = Math.max(240, Math.min(560, container.clientWidth - 304));
                setDetailsWidth(Math.max(240, Math.min(maxWidth, container.getBoundingClientRect().right - event.clientX - 12)));
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  setDetailsWidth((width) => Math.min(560, width + 16));
                }
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  setDetailsWidth((width) => Math.max(240, width - 16));
                }
              }}
            />
            <MediaDetailsSidebar
              selectedMedia={selectedMedia}
              setSelectedMedia={setSelectedMedia}
              handleDelete={handleDelete}
              width={detailsWidth}
            />
          </>
        )}
      </div>
    </div>
  );
}
