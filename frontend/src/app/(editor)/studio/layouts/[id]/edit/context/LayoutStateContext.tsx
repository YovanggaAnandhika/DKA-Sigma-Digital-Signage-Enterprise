'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Layout, Layer as ApiLayer } from '@/lib/services';

export interface Layer extends ApiLayer {
  timeline_start?: number;
  timeline_width?: number;
}

interface LayoutStateContextType {
  layout: Layout | null;
  layoutName: string;
  setLayoutName: (name: string) => void;
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  loading: boolean;
  saving: boolean;
  handleSave: (showToast: (msg: string, type?: 'success' | 'error') => void) => Promise<void>;
  handleAddLayer: () => void;
  handleDeleteLayer: (layerId: string) => void;
  updateSelectedLayer: (field: keyof Layer, value: any) => void;
}

const LayoutStateContext = createContext<LayoutStateContextType | undefined>(undefined);

export function LayoutStateProvider({ children }: { children: ReactNode }) {
  const params = useParams() as { id: string };
  const router = useRouter();

  const [layout, setLayout] = useState<Layout | null>(null);
  const [layoutName, setLayoutName] = useState('');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [deletedLayerIds, setDeletedLayerIds] = useState<string[]>([]);
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

        const rawLayers = data.layersList || [];
        const sanitizedLayers = rawLayers.map((z: any) => {
          const rawBlocks = z.blocksList || [];
          const blocks = rawBlocks.map((b: any) => ({
            ...b,
            id: b.id,
            layerId: b.layerId || b.layer_id,
            playlistId: b.playlistId || '',
            mediaItemId: b.mediaItemId || '',
            playlist: b.playlist,
            mediaItem: b.mediaItem,
            startTimeSeconds: b.startTimeSeconds ?? 0,
            durationSeconds: b.durationSeconds ?? 10,
            transitionId: b.transitionId,
            transition: b.transition,
            orderIndex: b.orderIndex ?? b.position ?? 0,
            isMuted: b.isMuted ?? b.is_muted ?? false,
            itemOverridesList: (b.itemOverridesList || []).map((o: any) => ({
              id: o.id,
              layerPlaylistId: o.layerPlaylistId || o.layer_playlist_id,
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

        setLayers(sanitizedLayers);
        if (sanitizedLayers.length > 0) {
          setSelectedLayerId(sanitizedLayers[0].id);
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

      for (const delId of deletedLayerIds) {
        await api.deleteLayer(delId, params.id);
      }
      setDeletedLayerIds([]);

      for (const delBId of deletedBlockIds) {
        await api.removePlaylistBlock(delBId);
      }
      setDeletedBlockIds([]);

      for (const z of layers) {
        const x = Math.round(Number(z.x) || 0);
        const y = Math.round(Number(z.y) || 0);
        const width = Math.round(Number(z.width) || 200);
        const height = Math.round(Number(z.height) || 200);
        const z_index = Math.round(Number(z.zIndex) || 1);

        let realLayerId = z.id;
        if (z.id.startsWith('z-')) {
          const newZ = await api.createLayer({
            layoutId: params.id,
            name: z.name,
            x,
            y,
            width,
            height,
            zIndex: z_index,
            backgroundColor: z.backgroundColor,
          });
          realLayerId = newZ.id;
        } else {
          await api.updateLayer(z.id, {
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
              await api.addMediaBlock(realLayerId, b.mediaItemId, b.startTimeSeconds, b.durationSeconds);
            } else {
              await api.addPlaylistBlock(realLayerId, b.playlistId, b.startTimeSeconds, b.durationSeconds);
            }
          } else {
            const blockMuted = b.isMuted ?? b.itemOverridesList?.find((o: any) => o.playlistItemId === b.id)?.isMuted;
            await api.updatePlaylistBlock(b.id, {
              startTimeSeconds: b.startTimeSeconds,
              durationSeconds: b.durationSeconds,
              transitionId: b.transitionId,
              isMuted: blockMuted !== undefined ? blockMuted : false,
              volumeLevel: b.volumeLevel !== undefined ? b.volumeLevel : 100,
            });
          }
        }
      }

      const data = await api.getLayout(params.id);
      setLayout(data);
      setLayoutName(data.name);

      const prevLayers = layers;
      const rawLayers = data.layersList || [];
      const sanitizedLayers = rawLayers.map((z: any) => {
        const prevLayer = prevLayers.find((pz) => pz.id === z.id);
        const rawBlocks = z.blocksList || [];
        const blocks = rawBlocks.map((b: any) => {
          const prevBlock = prevLayer?.blocksList?.find((pb) => pb.id === b.id);
          return {
            ...b,
            id: b.id,
            layerId: b.layerId || b.layer_id,
            playlistId: b.playlistId || '',
            mediaItemId: b.mediaItemId || '',
            playlist: b.playlist,
            mediaItem: b.mediaItem,
            startTimeSeconds: b.startTimeSeconds ?? 0,
            durationSeconds: b.durationSeconds ?? 10,
            transitionId: b.transitionId,
            transition: b.transition,
            orderIndex: b.orderIndex ?? b.position ?? 0,
            volumeLevel: b.volumeLevel ?? prevBlock?.volumeLevel ?? 100,
            isMuted: b.isMuted ?? b.is_muted ?? prevBlock?.isMuted ?? false,
            itemOverridesList: prevBlock?.itemOverridesList || (b.itemOverridesList || []).map((o: any) => ({
              id: o.id,
              layerPlaylistId: o.layerPlaylistId || o.layer_playlist_id,
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
      setLayers(sanitizedLayers);
      showToast('Template layout dan seluruh posisi layer berhasil disimpan!');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan layout', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLayer = async () => {
    if (!layout) return;
    try {
      const newZ = await api.createLayer({
        layoutId: layout.id,
        name: `Kotak Lapisan ${layers.length + 1}`,
        x: 100,
        y: 100,
        width: Math.round(layout.canvasWidth * 0.4),
        height: Math.round(layout.canvasHeight * 0.4),
        zIndex: layers.length + 1,
        backgroundColor: '#1e293b',
      });
      const newLayer: Layer = {
        id: newZ.id,
        layoutId: layout.id,
        name: newZ.name,
        x: Number(newZ.x) || 100,
        y: Number(newZ.y) || 100,
        width: Number(newZ.width) || Math.round(layout.canvasWidth * 0.4),
        height: Number(newZ.height) || Math.round(layout.canvasHeight * 0.4),
        zIndex: Number(newZ.zIndex) || (layers.length + 1),
        blocksList: [],
        backgroundColor: newZ.backgroundColor || '#1e293b',
        createdAt: newZ.createdAt || new Date().toISOString(),
        updatedAt: newZ.updatedAt || new Date().toISOString(),
      };
      setLayers([...layers, newLayer]);
      setSelectedLayerId(newLayer.id);
    } catch (err: any) {
      console.error('Failed to create layer:', err);
    }
  };

  const handleDeleteLayer = (layerId: string) => {
    if (!layerId.startsWith('z-')) {
      setDeletedLayerIds((prev) => [...prev, layerId]);
    }
    const updated = layers.filter((z) => z.id !== layerId);
    setLayers(updated);
    if (selectedLayerId === layerId) {
      setSelectedLayerId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const updateSelectedLayer = (field: keyof Layer, value: any) => {
    if (!selectedLayerId) return;

    if (field === 'blocksList') {
      const currentBlocks = layers.find((z) => z.id === selectedLayerId)?.blocksList || [];
      const newBlocks = (value || []) as any[];
      const newBlockIds = newBlocks.map((b) => b.id);
      const removedBlocks = currentBlocks.filter((b) => !newBlockIds.includes(b.id) && !b.id.startsWith('temp-'));
      if (removedBlocks.length > 0) {
        setDeletedBlockIds((prev) => [...prev, ...removedBlocks.map((b) => b.id)]);
      }
    }

    setLayers((prev) =>
      prev.map((z) => {
        if (z.id === selectedLayerId) {
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
        layers,
        setLayers,
        selectedLayerId,
        setSelectedLayerId,
        loading,
        saving,
        handleSave,
        handleAddLayer,
        handleDeleteLayer,
        updateSelectedLayer,
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
