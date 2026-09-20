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
  canvasDisplayWidth: number;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
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
  pickerZoneId: string | null;
  setPickerZoneId: React.Dispatch<React.SetStateAction<string | null>>;
  mediaPickerZoneId: string | null;
  setMediaPickerZoneId: React.Dispatch<React.SetStateAction<string | null>>;
  hiddenZones: string[];
  toggleZoneVisibility: (zoneId: string) => void;
  isTimelineExpanded: boolean;
  setIsTimelineExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isLayoutMetaExpanded: boolean;
  setIsLayoutMetaExpanded: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [pickerZoneId, setPickerZoneId] = useState<string | null>(null);
  const [mediaPickerZoneId, setMediaPickerZoneId] = useState<string | null>(null);
  const [hiddenZones, setHiddenZones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);
  const [isLayoutMetaExpanded, setIsLayoutMetaExpanded] = useState(true);

  const toggleZoneVisibility = (zoneId: string) => {
    setHiddenZones(prev => 
      prev.includes(zoneId) ? prev.filter(id => id !== zoneId) : [...prev, zoneId]
    );
  };

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
            if (!z.blocks || z.blocks.length === 0) return z;
            return z;
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
          return {
            ...z,
            x: Number(z.x) || 0,
            y: Number(z.y) || 0,
            width: Number(z.width) || 200,
            height: Number(z.height) || 200,
            z_index: Number(z.z_index) || 1,
            blocks: z.blocks || [],
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
      if (e.key === 'dkasigma_last_update') {
        refreshPlaylistsAndMedia();
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('dkasigma_studio_events');
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
  const [deletedBlockIds, setDeletedBlockIds] = useState<string[]>([]);

  const handleDeleteBlock = (blockId: string) => {
    if (!blockId.startsWith('temp-')) {
      setDeletedBlockIds((prev) => [...prev, blockId]);
    }
    setZones((prev) =>
      prev.map((z) => ({
        ...z,
        blocks: (z.blocks || []).filter((b) => b.id !== blockId),
      }))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // 1. Update layout name & info
      await api.updateLayout(params.id, { name: layoutName });

      // 2. Delete removed zones and blocks from backend
      for (const zoneId of deletedZoneIds) {
        try {
          await api.deleteZone(zoneId);
        } catch (e) {
          console.error('Failed to delete zone:', zoneId, e);
        }
      }
      setDeletedZoneIds([]);

      for (const blockId of deletedBlockIds) {
        try {
          // Import layout.service directly if needed or use api namespace
          await api.removePlaylistBlock(blockId);
        } catch (e) {
          console.error('Failed to delete block:', blockId, e);
        }
      }
      setDeletedBlockIds([]);

      // 3. Save or update each zone
      for (const z of zones) {
        const x = Math.round(Number(z.x) || 0);
        const y = Math.round(Number(z.y) || 0);
        const width = Math.round(Number(z.width) || 200);
        const height = Math.round(Number(z.height) || 200);
        const z_index = Math.round(Number(z.z_index) || 1);

        let realZoneId = z.id;
        if (z.id.startsWith('z-')) {
          const newZ = await api.createZone({
            layout_id: params.id,
            name: z.name,
            x,
            y,
            width,
            height,
            z_index,
          });
          realZoneId = newZ.id;
        } else {
          await api.updateZone(z.id, {
            name: z.name,
            x,
            y,
            width,
            height,
            z_index,
            background_color: z.background_color,
          });
        }

        // 3.5. Save blocks for this zone
        for (const b of (z.blocks || [])) {
          if (b.id.startsWith('temp-')) {
            if (b.media_item_id) {
              await api.addMediaBlock(realZoneId, b.media_item_id, b.start_time_seconds, b.duration_seconds);
            } else {
              await api.addPlaylistBlock(realZoneId, b.playlist_id, b.start_time_seconds, b.duration_seconds);
            }
          } else {
            await api.updatePlaylistBlock(b.id, { 
              start_time_seconds: b.start_time_seconds, 
              duration_seconds: b.duration_seconds,
              transition_type: b.transition_type
            });
          }
        }
      }

      // 4. Refetch fresh layout from backend
      const data = await api.getLayout(params.id);
      setLayout(data);
      setLayoutName(data.name);
      const sanitizedZones = (data.zones || []).map((z: any) => {
        return {
          ...z,
          x: Number(z.x) || 0,
          y: Number(z.y) || 0,
          width: Number(z.width) || 200,
          height: Number(z.height) || 200,
          z_index: Number(z.z_index) || 1,
          blocks: z.blocks || [],
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
      blocks: [],
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

    if (field === 'blocks') {
      const currentBlocks = zones.find(z => z.id === selectedZoneId)?.blocks || [];
      const newBlocks = (value || []) as any[];
      const newBlockIds = newBlocks.map(b => b.id);
      const removedBlocks = currentBlocks.filter(b => !newBlockIds.includes(b.id) && !b.id.startsWith('temp-'));
      if (removedBlocks.length > 0) {
        setDeletedBlockIds(prev => [...prev, ...removedBlocks.map(b => b.id)]);
      }
    }

    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== selectedZoneId) return z;
        const updated = { ...z, [field]: value };
        return updated;
      })
    );
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

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
    const currentSec = currentPos / pxPerSecond;
    return (zone.blocks || []).some(b => 
      currentSec >= b.start_time_seconds && currentSec < b.start_time_seconds + b.duration_seconds
    );
  };

  const BASE_CANVAS_PX = 900;
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const zoomIn  = () => setZoomLevel(prev => Math.min(4.0, parseFloat((prev + 0.25).toFixed(2))));
  const zoomOut = () => setZoomLevel(prev => Math.max(0.25, parseFloat((prev - 0.25).toFixed(2))));
  const zoomFit = () => setZoomLevel(1.0);

  const scale = layout ? (BASE_CANVAS_PX * zoomLevel) / layout.canvas_width : 1;
  const canvasDisplayWidth = BASE_CANVAS_PX * zoomLevel;
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
    canvasDisplayWidth,
    zoomLevel,
    setZoomLevel,
    zoomIn,
    zoomOut,
    zoomFit,
    isPlaying,
    setIsPlaying,
    playheadPosition,
    setPlayheadPosition,
    timelineDuration,
    pxPerSecond,
    togglePlay,
    stopPlay,
    isMuted,
    setIsMuted,
    toggleMute,
    isZoneActive,
    pickerZoneId,
    setPickerZoneId,
    mediaPickerZoneId,
    setMediaPickerZoneId,
    hiddenZones,
    toggleZoneVisibility,
    isTimelineExpanded,
    setIsTimelineExpanded,
    isLayoutMetaExpanded,
    setIsLayoutMetaExpanded,
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
