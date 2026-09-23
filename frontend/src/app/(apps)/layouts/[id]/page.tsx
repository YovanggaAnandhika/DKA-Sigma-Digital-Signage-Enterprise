'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api, Layout, Playlist, MediaItem } from '@/lib/services';
import { ArrowLeft, Edit, RefreshCw } from 'lucide-react';
import LayoutLayerList from './components/LayoutLayerList';

// Dynamically import LayoutLivePreview since it relies on heavy DOM / video rendering
const LayoutLivePreview = dynamic(() => import('./components/LayoutLivePreview'), {
  ssr: false,
});

export default function ViewLayoutPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [globalMuted, setGlobalMuted] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true);
        const [layoutData, playlistsRes, mediaRes] = await Promise.all([
          api.getLayout(params.id),
          api.getPlaylists({ limit: 100 }).catch(() => ({ data: [] })),
          api.getMedia({ limit: 100 }).catch(() => ({ data: [] })),
        ]);
        const sanitizedLayout: Layout = {
          ...layoutData,
          canvasWidth: layoutData.canvasWidth || 1920,
          canvasHeight: layoutData.canvasHeight || 1080,
          layersList: (layoutData.layersList || []).map((z: any) => ({
            ...z,
            id: z.id,
            layout_id: z.layoutId || z.layout_id,
            x: Number(z.x) || 0,
            y: Number(z.y) || 0,
            width: Number(z.width) || 200,
            height: Number(z.height) || 200,
            zIndex: Number(z.zIndex ?? z.zIndex) || 1,
            blocksList: (z.blocksList || []).map((b: any) => ({
              ...b,
              id: b.id,
              zone_id: b.zoneId || b.zone_id,
              playlistId: b.playlistId || '',
              mediaItemId: b.mediaItemId || '',
              playlist: b.playlist,
              mediaItem: b.mediaItem,
              startTimeSeconds: b.startTimeSeconds ?? 0,
              durationSeconds: b.durationSeconds ?? 10,
              transitionType: b.transitionType || 'none',
              position: b.orderIndex ?? b.position ?? 0,
              itemOverridesList: (b.itemOverridesList || []).map((o: any) => ({
                id: o.id,
                zone_playlist_id: o.zonePlaylistId || o.zone_playlist_id,
                playlistItemId: o.playlistItemId,
                isMuted: o.isMuted ?? false,
              })),
            })),
          })),
        };

        setLayout(sanitizedLayout);
        setPlaylists((playlistsRes as any).data || []);
        setMediaList((mediaRes as any).data || []);
        if (sanitizedLayout.layersList?.length > 0) {
          setSelectedLayerId(sanitizedLayout.layersList[0].id);
        }
      } catch (err: any) {
        alert(err.message || 'Gagal memuat layout');
        router.push('/layouts');
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, [params.id, router]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      videoRefs.current.forEach((video) => {
        if (next) video.play().catch(() => {});
        else video.pause();
      });
      return next;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setGlobalMuted((prev) => {
      const next = !prev;
      videoRefs.current.forEach((video) => {
        video.muted = next;
        video.volume = next ? 0 : 1;
      });
      return next;
    });
  }, []);

  // Helper: resolve first media item for a zone
  const resolveZoneMedia = (zone: Layout['layersList'][number]) => {
    const blocks = zone.blocksList || [];
    for (const block of blocks) {
      if (block.mediaItemId) {
        const m = (block.mediaItem as MediaItem) || mediaList.find((m) => m.id === block.mediaItemId);
        if (m) return { media: m, playlistName: null };
      }
      if (block.playlistId) {
        const pl = (block.playlist as Playlist) || playlists.find((p) => p.id === block.playlistId);
        const plItems = pl?.itemsList || [];
        if (plItems.length) {
          const firstItem = plItems[0];
          const m = (firstItem as any).mediaItem || mediaList.find((m) => m.id === firstItem.mediaItemId);
          if (m) return { media: m as MediaItem, playlistName: pl?.name || '' };
        }
      }
    }
    return null;
  };

  if (loading || !layout) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data layout dari gRPC backend...</span>
      </div>
    );
  }

  const zColors = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/layouts" className="btn btn-outline" style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {layout.name}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Resolusi: {layout.canvasWidth} × {layout.canvasHeight} px ({layout.orientation}) &bull; {layout.layersList?.length || 0} Lapisan Kotak
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href={`/layouts/${layout.id}/edit`} className="btn btn-primary">
            <Edit size={14} />
            <span>Buka Canvas Designer</span>
          </Link>
        </div>
      </div>

      {/* Main Content: two-column full height layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'stretch', minHeight: 'calc(100vh - 220px)' }}>
        {/* LEFT: Canvas Preview */}
        <LayoutLivePreview
          layout={layout}
          isPlaying={isPlaying}
          togglePlayPause={togglePlayPause}
          globalMuted={globalMuted}
          toggleMute={toggleMute}
          selectedLayerId={selectedLayerId}
          setSelectedLayerId={setSelectedLayerId}
          resolveZoneMedia={resolveZoneMedia}
          videoRefs={videoRefs}
          zColors={zColors}
          playlists={playlists}
        />

        {/* RIGHT: Zones Panel */}
        <LayoutLayerList
          layout={layout}
          selectedLayerId={selectedLayerId}
          setSelectedLayerId={setSelectedLayerId}
          resolveZoneMedia={resolveZoneMedia}
          zColors={zColors}
          playlists={playlists}
          mediaList={mediaList}
        />
      </div>
    </div>
  );
}
