'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Layout, Zone as ApiZone, Playlist, MediaItem } from '@/lib/services';

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
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  toast: { message: string; type: 'success' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  bufferedRanges: { start: number; end: number }[];
  reportBuffer: (ranges: { start: number; end: number }[]) => void;
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [bufferedRanges, setBufferedRanges] = useState<{ start: number; end: number }[]>([]);
  
  const reportBuffer = (ranges: { start: number; end: number }[]) => {
    setBufferedRanges(ranges);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const preFullscreenZoom = React.useRef<number>(1.0);
  // Callback ref so handleFsChange can access latest setZoomLevel
  const setZoomLevelRef = React.useRef<React.Dispatch<React.SetStateAction<number>> | null>(null);

  useEffect(() => {
    const handleFsChange = () => {
      const entering = !!document.fullscreenElement;
      if (entering && setZoomLevelRef.current) {
        // Set to 125% after fullscreen activates
        setZoomLevelRef.current(1.25);
      } else if (!entering && setZoomLevelRef.current) {
        // Restore previous zoom when exiting (Escape or button)
        setZoomLevelRef.current(preFullscreenZoom.current);
      }
      setIsFullscreen(entering);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const container = document.getElementById('layout-editor-container');
    if (!document.fullscreenElement) {
      // Save current zoom — zoom to 125% will be applied in handleFsChange after fullscreen activates
      preFullscreenZoom.current = zoomLevel;
      if (container && container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          setIsFullscreen(prev => !prev);
        });
      } else if (container && (container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else {
        // Fallback (no native fullscreen support)
        setZoomLevel(1.25);
        setIsFullscreen(prev => !prev);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setZoomLevel(preFullscreenZoom.current);
          setIsFullscreen(false);
        });
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else {
        setZoomLevel(preFullscreenZoom.current);
        setIsFullscreen(false);
      }
    }
  };

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
            if (!z.blocksList || z.blocksList.length === 0) return z;
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
        
        const rawZones = data.zonesList || [];
        const sanitizedZones = rawZones.map((z: any) => {
          const rawBlocks = z.blocksList || [];
          const blocks = rawBlocks.map((b: any) => ({
            ...b,
            id: b.id,
            zoneId: b.zoneId || b.zone_id,
            playlistId: b.playlistId || '',
            mediaItemId: b.mediaItemId || '',
            playlist: b.playlist,
            mediaItem: b.mediaItem,
            startTimeSeconds: b.startTimeSeconds ?? 0,
            durationSeconds: b.durationSeconds ?? 10,
            transitionType: b.transitionType || 'none',
            orderIndex: b.orderIndex ?? b.position ?? 0,
            itemOverridesList: (b.itemOverridesList || []).map((o: any) => ({
              id: o.id,
              zonePlaylistId: o.zonePlaylistId || o.zone_playlist_id,
              playlistItemId: o.playlistItemId,
              isMuted: o.isMuted ?? false,
            })),
          }));

          return {
            ...z,
            id: z.id,
            layoutId: z.layoutId || params.id,
            name: z.name,
            x: Number(z.x) || 0,
            y: Number(z.y) || 0,
            width: Number(z.width) || 200,
            height: Number(z.height) || 200,
            zIndex: Number(z.zIndex) || 1,
            backgroundColor: z.backgroundColor || '',
            blocksList: blocks,
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
        blocksList: (z.blocksList || []).filter((b) => b.id !== blockId),
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
        if (selectedZoneId === zoneId) setSelectedZoneId(null);
        try {
          await api.deleteZone(zoneId, params.id);
          setZones(prev => prev.filter(z => z.id !== zoneId));
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
        const z_index = Math.round(Number(z.zIndex) || 1);

        let realZoneId = z.id;
        if (z.id.startsWith('z-')) {
          const newZ = await api.createZone({
            layoutId: params.id,
            name: z.name,
            x,
            y,
            width,
            height,
            zIndex: z_index,
            backgroundColor: z.backgroundColor,
          });
          realZoneId = newZ.id;
        } else {
          await api.updateZone(z.id, {
            name: z.name,
            x,
            y,
            width,
            height,
            zIndex: z_index,
            backgroundColor: z.backgroundColor,
          });
        }

        // 3.5. Save blocks for this zone
        for (const b of (z.blocksList || [])) {
          if (b.id.startsWith('temp-')) {
            if (b.mediaItemId) {
              await api.addMediaBlock(realZoneId, b.mediaItemId, b.startTimeSeconds, b.durationSeconds);
            } else {
              await api.addPlaylistBlock(realZoneId, b.playlistId, b.startTimeSeconds, b.durationSeconds);
            }
          } else {
            await api.updatePlaylistBlock(b.id, { 
              startTimeSeconds: b.startTimeSeconds, 
              durationSeconds: b.durationSeconds,
              transitionType: b.transitionType
            });
          }
        }
      }

      // 4. Refetch fresh layout from backend
      const data = await api.getLayout(params.id);
      setLayout(data);
      setLayoutName(data.name);
      // Capture current zones BEFORE overwriting so we can restore local item_overrides (mute state)
      const prevZones = zones;
      const rawZones = data.zonesList || [];
      const sanitizedZones = rawZones.map((z: any) => {
        const prevZone = prevZones.find((pz) => pz.id === z.id);
        const rawBlocks = z.blocksList || [];
        const blocks = rawBlocks.map((b: any) => {
          const prevBlock = prevZone?.blocksList?.find((pb) => pb.id === b.id);
          return {
            ...b,
            id: b.id,
            zoneId: b.zoneId || b.zone_id,
            playlistId: b.playlistId || '',
            mediaItemId: b.mediaItemId || '',
            playlist: b.playlist,
            mediaItem: b.mediaItem,
            startTimeSeconds: b.startTimeSeconds ?? 0,
            durationSeconds: b.durationSeconds ?? 10,
            transitionType: b.transitionType || 'none',
            orderIndex: b.orderIndex ?? b.position ?? 0,
            itemOverridesList: prevBlock?.itemOverridesList || (b.itemOverridesList || []).map((o: any) => ({
              id: o.id,
              zonePlaylistId: o.zonePlaylistId || o.zone_playlist_id,
              playlistItemId: o.playlistItemId,
              isMuted: o.isMuted ?? false,
            })),
          };
        });
        return {
          ...z,
          id: z.id,
          layoutId: z.layoutId || params.id,
          name: z.name,
          x: Number(z.x) || 0,
          y: Number(z.y) || 0,
          width: Number(z.width) || 200,
          height: Number(z.height) || 200,
          zIndex: Number(z.zIndex) || 1,
          backgroundColor: z.backgroundColor || '',
          blocksList: blocks,
        };
      });
      setZones(sanitizedZones);

      showToast('Template layout dan seluruh posisi zona berhasil disimpan!');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan layout', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddZone = () => {
    if (!layout) return;
    const newZone: Zone = {
      id: `z-${Date.now()}`,
      layoutId: layout.id,
      name: `Kotak Zona ${zones.length + 1}`,
      x: 100,
      y: 100,
      width: Math.round(layout.canvasWidth * 0.4),
      height: Math.round(layout.canvasHeight * 0.4),
      zIndex: zones.length + 1,
      blocksList: [],
      backgroundColor: '#1e293b',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

    if (field === 'blocksList') {
      const currentBlocks = zones.find(z => z.id === selectedZoneId)?.blocksList || [];
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

  const maxContentEnd = zones.reduce((max, z) => {
    const zoneMax = (z.blocksList || []).reduce((bMax, b) => {
      const bEnd = (b.startTimeSeconds + b.durationSeconds) * pxPerSecond;
      return Math.max(bMax, bEnd);
    }, 0);
    return Math.max(max, zoneMax);
  }, 0);

  // Dynamic timeline duration based on maximum zone extent (minimum 30s / 600px)
  const maxZoneEnd = Math.max(600, maxContentEnd);
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
        // Loop back to start when we hit the actual end of all blocks (maxContentEnd),
        // or timelineDuration if there are no blocks.
        const loopPoint = Math.max(0, maxContentEnd);
        if (loopPoint > 0 && next >= loopPoint) {
          return 0; // loop back to start
        } else if (loopPoint === 0 && next >= timelineDuration) {
          return 0;
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
    return (zone.blocksList || []).some(b => 
      currentSec >= b.startTimeSeconds && currentSec < b.startTimeSeconds + b.durationSeconds
    );
  };

  const BASE_CANVAS_PX = 900;
  const [zoomLevel, setZoomLevel] = useState(1.0);
  // Keep ref in sync so the fullscreenchange listener (closed over on mount) can call it
  setZoomLevelRef.current = setZoomLevel;

  const zoomIn  = () => setZoomLevel(prev => Math.min(4.0, parseFloat((prev + 0.25).toFixed(2))));
  const zoomOut = () => setZoomLevel(prev => Math.max(0.25, parseFloat((prev - 0.25).toFixed(2))));
  const zoomFit = () => setZoomLevel(1.0);


  const scale = layout ? (BASE_CANVAS_PX * zoomLevel) / layout.canvasWidth : 1;
  const canvasDisplayWidth = BASE_CANVAS_PX * zoomLevel;
  const previewHeight = layout ? layout.canvasHeight * scale : 1;

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
    isFullscreen,
    toggleFullscreen,
    toast,
    showToast,
    bufferedRanges,
    reportBuffer,
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
