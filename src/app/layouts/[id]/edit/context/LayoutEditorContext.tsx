'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Layout, Zone as ApiZone, Playlist, MediaItem } from '../../../../../lib/api';

// Extend Zone for UI timeline properties
export interface Zone extends ApiZone {
  timeline_start?: number; // In pixels or seconds, we'll use pixels for UI simplicity initially
  timeline_width?: number; // In pixels
}

interface LayoutEditorContextType {
  layout: Layout | null;
  layoutName: string;
  setLayoutName: (name: string) => void;
  zones: Zone[];
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
  availablePlaylists: Playlist[];
  mediaList: MediaItem[];
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string | null) => void;
  loading: boolean;
  saving: boolean;
  handleSave: () => Promise<void>;
  handleAddZone: () => void;
  handleDeleteZone: (zoneId: string) => void;
  updateSelectedZone: (field: keyof Zone, value: any) => void;
  refreshPlaylistsAndMedia: () => Promise<void>;
  scale: number;
  previewHeight: number;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  playheadPosition: number;
  setPlayheadPosition: React.Dispatch<React.SetStateAction<number>>;
  timelineDuration: number;
  pxPerSecond: number;
  togglePlay: () => void;
  stopPlay: () => void;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMute: () => void;
  isZoneActive: (zone: Zone, currentPos?: number) => boolean;
}

const LayoutEditorContext = createContext<LayoutEditorContextType | undefined>(undefined);

export function LayoutEditorProvider({ children }: { children: ReactNode }) {
  const params = useParams() as { id: string };
  const router = useRouter();
  
  const [layout, setLayout] = useState<Layout | null>(null);
  const [layoutName, setLayoutName] = useState('');
  const [zones, setZones] = useState<Zone[]>([]);
  const [availablePlaylists, setAvailablePlaylists] = useState<Playlist[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const pxPerSecond = 20;

  const refreshPlaylistsAndMedia = async () => {
    try {
      const [playlistsRes, mediaRes] = await Promise.all([
        api.getPlaylists({ limit: 100 }).catch(() => null),
        api.getMedia({ limit: 100 }).catch(() => null),
      ]);
      if (playlistsRes?.data) {
        const loadedPlaylists = playlistsRes.data;
        setAvailablePlaylists(loadedPlaylists);
        // Automatically sync zone durations if assigned playlist duration grew or changed
        setZones((prev) =>
          prev.map((z) => {
            if (!z.assigned_playlist_id) return z;
            const pl = loadedPlaylists.find((p: any) => p.id === z.assigned_playlist_id);
            if (!pl) return z;
            const plDur = pl.total_duration_seconds || (pl.items?.reduce((acc: number, it: any) => acc + (it.duration_seconds || 10), 0)) || 15;
            const targetWidth = Math.max(200, plDur * pxPerSecond);
            return {
              ...z,
              playlist_name: pl.name,
              timeline_width: Math.max(z.timeline_width || 200, targetWidth),
            };
          })
        );
      }
      if (mediaRes?.data) {
        setMediaList(mediaRes.data);
      }
    } catch (e) {
      console.error('Failed to auto-refresh playlists/media:', e);
    }
  };

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true);
        const [data, playlistsRes, mediaRes] = await Promise.all([
          api.getLayout(params.id),
          api.getPlaylists({ limit: 100 }).catch(() => ({ data: [] })),
          api.getMedia({ limit: 100 }).catch(() => ({ data: [] })),
        ]);
        setLayout(data);
        setLayoutName(data.name);
        const loadedPlaylists = (playlistsRes as any).data || [];
        setAvailablePlaylists(loadedPlaylists);
        setMediaList((mediaRes as any).data || []);
        
        const sanitizedZones = (data.zones || []).map((z: any) => {
          const matchedPl = loadedPlaylists.find((p: any) => p.id === z.assigned_playlist_id);
          const plDur = matchedPl?.total_duration_seconds || (matchedPl?.items?.reduce((acc: number, it: any) => acc + (it.duration_seconds || 10), 0)) || 15;
          const calculatedWidth = Math.max(200, plDur * pxPerSecond);

          return {
            ...z,
            x: Number(z.x) || 0,
            y: Number(z.y) || 0,
            width: Number(z.width) || 200,
            height: Number(z.height) || 200,
            z_index: Number(z.z_index) || 1,
            assigned_playlist_id: z.assigned_playlist_id || '',
            playlist_name: z.playlist_name || matchedPl?.name || '',
            timeline_start: 0,
            timeline_width: calculatedWidth,
          };
        });
        
        setZones(sanitizedZones);
        if (sanitizedZones.length > 0) {
          setSelectedZoneId(sanitizedZones[0].id);
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

  // Real-time synchronization listeners across tabs and background polling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFocus = () => {
      refreshPlaylistsAndMedia();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshPlaylistsAndMedia();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'omnisign_last_update') {
        refreshPlaylistsAndMedia();
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('omnisign_studio_events');
      channel.onmessage = (e) => {
        if (e.data?.type === 'playlist_updated' || e.data?.type === 'media_updated') {
          refreshPlaylistsAndMedia();
        }
      };
    } catch (e) {}

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);

    // Periodic background sync every 3 seconds
    const intervalId = setInterval(refreshPlaylistsAndMedia, 3000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
      clearInterval(intervalId);
    };
  }, []);

  const [deletedZoneIds, setDeletedZoneIds] = useState<string[]>([]);

  const handleSave = async () => {
    try {
      setSaving(true);
      // 1. Update layout name & info
      await api.updateLayout(params.id, { name: layoutName });

      // 2. Delete removed zones from backend
      for (const zoneId of deletedZoneIds) {
        try {
          await api.deleteZone(zoneId);
        } catch (e) {
          console.error('Failed to delete zone:', zoneId, e);
        }
      }
      setDeletedZoneIds([]);

      // 3. Save or update each zone
      for (const z of zones) {
        const x = Math.round(Number(z.x) || 0);
        const y = Math.round(Number(z.y) || 0);
        const width = Math.round(Number(z.width) || 200);
        const height = Math.round(Number(z.height) || 200);
        const z_index = Math.round(Number(z.z_index) || 1);
        const assigned_playlist_id = z.assigned_playlist_id && z.assigned_playlist_id.trim() !== '' ? z.assigned_playlist_id : '';

        if (z.id.startsWith('z-')) {
          await api.createZone({
            layout_id: params.id,
            name: z.name,
            x,
            y,
            width,
            height,
            z_index,
            assigned_playlist_id: assigned_playlist_id || undefined,
          });
        } else {
          await api.updateZone(z.id, {
            name: z.name,
            x,
            y,
            width,
            height,
            z_index,
            assigned_playlist_id,
          });
        }
      }

      // 4. Refetch fresh layout from backend
      const data = await api.getLayout(params.id);
      setLayout(data);
      setLayoutName(data.name);
      const sanitizedZones = (data.zones || []).map((z: any) => {
        const matchedPl = availablePlaylists.find((p: any) => p.id === z.assigned_playlist_id);
        const plDur = matchedPl?.total_duration_seconds || (matchedPl?.items?.reduce((acc: number, it: any) => acc + (it.duration_seconds || 10), 0)) || 15;
        const calculatedWidth = Math.max(200, plDur * pxPerSecond);

        return {
          ...z,
          x: Number(z.x) || 0,
          y: Number(z.y) || 0,
          width: Number(z.width) || 200,
          height: Number(z.height) || 200,
          z_index: Number(z.z_index) || 1,
          assigned_playlist_id: z.assigned_playlist_id || '',
          playlist_name: z.playlist_name || matchedPl?.name || '',
          timeline_start: 0,
          timeline_width: calculatedWidth,
        };
      });
      setZones(sanitizedZones);

      alert('Template layout dan seluruh posisi zona berhasil disimpan!');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan layout');
    } finally {
      setSaving(false);
    }
  };

  const handleAddZone = () => {
    if (!layout) return;
    const newZone: Zone = {
      id: `z-${Date.now()}`,
      layout_id: layout.id,
      name: `Kotak Zona ${zones.length + 1}`,
      x: 100,
      y: 100,
      width: Math.round(layout.canvas_width * 0.4),
      height: Math.round(layout.canvas_height * 0.4),
      z_index: zones.length + 1,
      timeline_start: 0,
      timeline_width: 300,
    };
    setZones([...zones, newZone]);
    setSelectedZoneId(newZone.id);
  };

  const handleDeleteZone = (zoneId: string) => {
    if (!zoneId.startsWith('z-')) {
      setDeletedZoneIds((prev) => [...prev, zoneId]);
    }
    const updated = zones.filter((z) => z.id !== zoneId);
    setZones(updated);
    if (selectedZoneId === zoneId) {
      setSelectedZoneId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const updateSelectedZone = (field: keyof Zone, value: any) => {
    if (!selectedZoneId) return;
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== selectedZoneId) return z;
        const updated = { ...z, [field]: value };
        if (field === 'assigned_playlist_id') {
          const matched = availablePlaylists.find((p) => p.id === value);
          const plDur = matched?.total_duration_seconds || (matched?.items?.reduce((acc: number, it: any) => acc + (it.duration_seconds || 10), 0)) || 15;
          updated.playlist_name = matched?.name || '';
          updated.timeline_width = Math.max(200, plDur * pxPerSecond);
        }
        return updated;
      })
    );
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);

  // Dynamic timeline duration based on maximum zone extent (minimum 30s / 600px)
  const maxZoneEnd = zones.reduce((max, z) => {
    const end = (z.timeline_start || 0) + (z.timeline_width || 300);
    return Math.max(max, end);
  }, 600);
  const timelineDuration = Math.max(600, Math.ceil((maxZoneEnd + 100) / 100) * 100);

  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();
    let animationFrameId: number;

    const tick = (currentTime: number) => {
      const deltaSec = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setPlayheadPosition((prev) => {
        const next = prev + deltaSec * pxPerSecond;
        if (next >= timelineDuration) {
          return 0; // loop back to start
        }
        return next;
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, timelineDuration, pxPerSecond]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const stopPlay = () => {
    setIsPlaying(false);
    setPlayheadPosition(0);
  };

  const isZoneActive = (zone: Zone, currentPos = playheadPosition) => {
    const start = zone.timeline_start || 0;
    const width = zone.timeline_width || 300;
    return currentPos >= start && currentPos <= start + width;
  };

  const scale = layout ? 540 / layout.canvas_width : 1;
  const previewHeight = layout ? layout.canvas_height * scale : 1;

  const contextValue: LayoutEditorContextType = {
    layout,
    layoutName,
    setLayoutName,
    zones,
    setZones,
    availablePlaylists,
    mediaList,
    selectedZoneId,
    setSelectedZoneId,
    loading,
    saving,
    handleSave,
    handleAddZone,
    handleDeleteZone,
    updateSelectedZone,
    refreshPlaylistsAndMedia,
    scale,
    previewHeight,
    isPlaying,
    setIsPlaying,
    playheadPosition,
    setPlayheadPosition,
    timelineDuration,
    pxPerSecond,
    togglePlay,
    stopPlay,
    isZoneActive,
  };

  return (
    <LayoutEditorContext.Provider value={contextValue}>
      {children}
    </LayoutEditorContext.Provider>
  );
}

export function useLayoutEditor() {
  const context = useContext(LayoutEditorContext);
  if (context === undefined) {
    throw new Error('useLayoutEditor must be used within a LayoutEditorProvider');
  }
  return context;
}
