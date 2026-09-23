'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Layout, Zone as ApiZone } from '@/lib/services';

export interface Zone extends ApiZone {
  timeline_start?: number;
  timeline_width?: number;
}

interface LayoutStateContextType {
  layout: Layout | null;
  layoutName: string;
  setLayoutName: (name: string) => void;
  zones: Zone[];
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string | null) => void;
  loading: boolean;
  saving: boolean;
  handleSave: (showToast: (msg: string, type?: 'success' | 'error') => void) => Promise<void>;
  handleAddZone: () => void;
  handleDeleteZone: (zoneId: string) => void;
  updateSelectedZone: (field: keyof Zone, value: any) => void;
}

const LayoutStateContext = createContext<LayoutStateContextType | undefined>(undefined);

export function LayoutStateProvider({ children }: { children: ReactNode }) {
  const params = useParams() as { id: string };
  const router = useRouter();

  const [layout, setLayout] = useState<Layout | null>(null);
  const [layoutName, setLayoutName] = useState('');
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [deletedZoneIds, setDeletedZoneIds] = useState<string[]>([]);
  const [deletedBlockIds, setDeletedBlockIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true);
        const data = await api.getLayout(params.id);
        setLayout(data);
        setLayoutName(data.name);

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
            isMuted: b.isMuted ?? b.is_muted ?? false,
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

  const handleSave = async (showToast: (msg: string, type?: 'success' | 'error') => void) => {
    if (!layout) return;
    try {
      setSaving(true);

      if (layoutName !== layout.name) {
        await api.updateLayout(params.id, { name: layoutName });
      }

      for (const delId of deletedZoneIds) {
        await api.deleteZone(delId, params.id);
      }
      setDeletedZoneIds([]);

      for (const delBId of deletedBlockIds) {
        await api.removePlaylistBlock(delBId);
      }
      setDeletedBlockIds([]);

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

        for (const b of (z.blocksList || [])) {
          if (b.id.startsWith('temp-')) {
            if (b.mediaItemId) {
              await api.addMediaBlock(realZoneId, b.mediaItemId, b.startTimeSeconds, b.durationSeconds);
            } else {
              await api.addPlaylistBlock(realZoneId, b.playlistId, b.startTimeSeconds, b.durationSeconds);
            }
          } else {
            const blockMuted = b.isMuted ?? b.itemOverridesList?.find((o: any) => o.playlistItemId === b.id)?.isMuted;
            await api.updatePlaylistBlock(b.id, {
              startTimeSeconds: b.startTimeSeconds,
              durationSeconds: b.durationSeconds,
              transitionType: b.transitionType,
              isMuted: blockMuted !== undefined ? blockMuted : false,
            });
          }
        }
      }

      const data = await api.getLayout(params.id);
      setLayout(data);
      setLayoutName(data.name);

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
            isMuted: b.isMuted ?? b.is_muted ?? prevBlock?.isMuted ?? false,
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
      const currentBlocks = zones.find((z) => z.id === selectedZoneId)?.blocksList || [];
      const newBlocks = (value || []) as any[];
      const newBlockIds = newBlocks.map((b) => b.id);
      const removedBlocks = currentBlocks.filter((b) => !newBlockIds.includes(b.id) && !b.id.startsWith('temp-'));
      if (removedBlocks.length > 0) {
        setDeletedBlockIds((prev) => [...prev, ...removedBlocks.map((b) => b.id)]);
      }
    }

    setZones((prev) =>
      prev.map((z) => {
        if (z.id === selectedZoneId) {
          return { ...z, [field]: value };
        }
        return z;
      })
    );
  };

  return (
    <LayoutStateContext.Provider
      value={{
        layout,
        layoutName,
        setLayoutName,
        zones,
        setZones,
        selectedZoneId,
        setSelectedZoneId,
        loading,
        saving,
        handleSave,
        handleAddZone,
        handleDeleteZone,
        updateSelectedZone,
      }}
    >
      {children}
    </LayoutStateContext.Provider>
  );
}

export function useLayoutState() {
  const context = useContext(LayoutStateContext);
  if (!context) {
    throw new Error('useLayoutState must be used within a LayoutStateProvider');
  }
  return context;
}
