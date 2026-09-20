'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Layout, Zone as ApiZone, Playlist } from '../../../../../lib/api';

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
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string | null) => void;
  loading: boolean;
  saving: boolean;
  handleSave: () => Promise<void>;
  handleAddZone: () => void;
  handleDeleteZone: (zoneId: string) => void;
  updateSelectedZone: (field: keyof Zone, value: any) => void;
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
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true);
        const [data, playlistsRes] = await Promise.all([
          api.getLayout(params.id),
          api.getPlaylists({ limit: 100 }).catch(() => ({ data: [] })),
        ]);
        setLayout(data);
        setLayoutName(data.name);
        const loadedPlaylists = (playlistsRes as any).data || [];
        setAvailablePlaylists(loadedPlaylists);
        
        const sanitizedZones = (data.zones || []).map((z: any) => ({
          ...z,
          x: Number(z.x) || 0,
          y: Number(z.y) || 0,
          width: Number(z.width) || 200,
          height: Number(z.height) || 200,
          z_index: Number(z.z_index) || 1,
          assigned_playlist_id: z.assigned_playlist_id || '',
          playlist_name: z.playlist_name || loadedPlaylists.find((p: any) => p.id === z.assigned_playlist_id)?.name || '',
          timeline_start: 0,
          timeline_width: 300,
        }));
        
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
        const assigned_playlist_id = z.assigned_playlist_id && z.assigned_playlist_id.trim() !== '' ? z.assigned_playlist_id : undefined;

        if (z.id.startsWith('z-')) {
          await api.createZone({
            layout_id: params.id,
            name: z.name,
            x,
            y,
            width,
            height,
            z_index,
            assigned_playlist_id,
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
      const sanitizedZones = (data.zones || []).map((z: any) => ({
        ...z,
        x: Number(z.x) || 0,
        y: Number(z.y) || 0,
        width: Number(z.width) || 200,
        height: Number(z.height) || 200,
        z_index: Number(z.z_index) || 1,
        assigned_playlist_id: z.assigned_playlist_id || '',
        playlist_name: z.playlist_name || availablePlaylists.find((p: any) => p.id === z.assigned_playlist_id)?.name || '',
        timeline_start: 0,
        timeline_width: 300,
      }));
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
      prev.map((z) => (z.id === selectedZoneId ? { ...z, [field]: value } : z))
    );
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const timelineDuration = 600; // 30 seconds at 20px/s
  const pxPerSecond = 20;

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
    selectedZoneId,
    setSelectedZoneId,
    loading,
    saving,
    handleSave,
    handleAddZone,
    handleDeleteZone,
    updateSelectedZone,
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
