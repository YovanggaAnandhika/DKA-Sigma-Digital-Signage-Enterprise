'use client';

import React from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Volume2,
  VolumeX,
  Sliders,
  Scissors,
  Trash2,
  Layers,
} from 'lucide-react';
import VolumeSlider from './VolumeSlider';
import { useLayoutEditor } from '../../context/LayoutEditorContext';
import {
  updatePlaylistBlock,
  addPlaylistBlock,
  addMediaBlock,
  removePlaylistBlock,
} from '@/lib/services/studio/layout.service';

export default function InspectorBlockProperties() {
  const {
    layers,
    setLayers,
    selectedLayerId,
    setSelectedLayerId,
    updateSelectedLayer,
    availablePlaylists,
    mediaList,
    transitionsList,
    visualFiltersList,
    selectedBlockId,
    setSelectedBlockId,
    setInspectorTarget,
    showToast,
    playheadPosition,
    pxPerSecond,
  } = useLayoutEditor();

  const selectedZone = layers.find((z) => z.id === selectedLayerId);

  let selectedBlock: any = null;
  let blockZone = selectedZone;
  if (selectedBlockId) {
    for (const z of layers) {
      const found = (z.blocksList || []).find((b) => b.id === selectedBlockId);
      if (found) {
        selectedBlock = found;
        blockZone = z;
        break;
      }
    }
  }

  if (!selectedBlock || !blockZone) return null;

  const isMedia = !!selectedBlock.mediaItemId;
  const media = isMedia ? mediaList.find((m) => m.id === selectedBlock.mediaItemId) : null;
  const playlist = !isMedia
    ? availablePlaylists.find((p) => p.id === selectedBlock.playlistId)
    : null;
  const name = isMedia ? media?.name || 'Media Item' : playlist?.name || 'Playlist';
  const isVideo = isMedia && media?.mediaType === 2;
  const isBlockMuted =
    selectedBlock.isMuted !== undefined
      ? !!selectedBlock.isMuted
      : !!selectedBlock.itemOverridesList?.find((o: any) => o.playlistItemId === selectedBlock.id)
          ?.isMuted;

  const handleUpdateBlock = async (updates: {
    durationSeconds?: number;
    startTimeSeconds?: number;
    isMuted?: boolean;
    volumeLevel?: number;
    transitionId?: string;
    visualFilterId?: string;
  }) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      selectedBlock.id
    );
    if (
      (updates.isMuted !== undefined ||
        updates.volumeLevel !== undefined ||
        'transitionId' in updates ||
        'visualFilterId' in updates) &&
      isUuid
    ) {
      try {
        await updatePlaylistBlock(selectedBlock.id, {
          isMuted: updates.isMuted !== undefined ? updates.isMuted : selectedBlock.isMuted,
          volumeLevel:
            updates.volumeLevel !== undefined ? updates.volumeLevel : selectedBlock.volumeLevel,
          transitionId: updates.transitionId,
          visualFilterId: updates.visualFilterId,
        });
      } catch (err: any) {
        console.error('Failed to update block audio:', err);
      }
    }

    setLayers((prev) =>
      prev.map((z) => {
        if (z.id === blockZone!.id) {
          return {
            ...z,
            blocksList: (z.blocksList || []).map((b) => {
              if (b.id === selectedBlock.id) {
                return { ...b, ...updates };
              }
              return b;
            }),
          };
        }
        return z;
      })
    );
  };

  const handleDeleteBlock = () => {
    if (window.confirm('Hapus item ini dari alokasi layer?')) {
      const newBlocks = (blockZone.blocksList || []).filter((b) => b.id !== selectedBlock.id);
      if (blockZone.id === selectedLayerId) {
        updateSelectedLayer('blocksList', newBlocks);
      } else {
        setLayers((prev) =>
          prev.map((z) => (z.id === blockZone!.id ? { ...z, blocksList: newBlocks } : z))
        );
      }
      setSelectedBlockId(null);
      setInspectorTarget('layer');
      showToast('Item berhasil dihapus dari alokasi');

      if (!selectedBlock.id.startsWith('temp-')) {
        try {
          removePlaylistBlock(selectedBlock.id);
        } catch (_) {}
      }
    }
  };

  const handleSplitBlock = async () => {
    const playheadSec = playheadPosition / (pxPerSecond || 20);
    const blockStart = selectedBlock.startTimeSeconds || 0;
    const blockDur = selectedBlock.durationSeconds || 0;
    const cutOffset = playheadSec - blockStart;

    if (cutOffset > 0 && cutOffset < blockDur) {
      const newDur1 = Math.floor(cutOffset);
      const newDur2 = Math.floor(blockDur - cutOffset);

      handleUpdateBlock({ durationSeconds: newDur1 });

      const newBlockId = `temp-${Date.now()}`;
      const newBlock = {
        ...selectedBlock,
        id: newBlockId,
        startTimeSeconds: Math.floor(playheadSec),
        durationSeconds: newDur2,
      };

      setLayers((prev) =>
        prev.map((z) => {
          if (z.id === blockZone.id) {
            return {
              ...z,
              blocksList: [...(z.blocksList || []), newBlock],
            };
          }
          return z;
        })
      );

      if (!selectedBlock.id.startsWith('temp-')) {
        try {
          if (newBlock.mediaItemId) {
            await addMediaBlock(
              blockZone.id,
              newBlock.mediaItemId,
              newBlock.startTimeSeconds,
              newBlock.durationSeconds
            );
          } else if (newBlock.playlistId) {
            await addPlaylistBlock(
              blockZone.id,
              newBlock.playlistId,
              newBlock.startTimeSeconds,
              newBlock.durationSeconds
            );
          }
        } catch (_) {}
      }

      showToast('Berhasil dipotong!');
    } else {
      showToast('Garis playhead tidak berada di dalam durasi block ini', 'error');
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Media Preview Box */}
      {isMedia && media?.publicUrl && (
        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', position: 'relative' }}>
          {isVideo ? (
            <video
              src={media.publicUrl}
              controls
              muted={isBlockMuted}
              style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <img
              src={media.publicUrl}
              alt={name}
              style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', display: 'block' }}
            />
          )}
          <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {isVideo ? 'Format Video' : 'Format Gambar'}
            </span>
            <a
              href={media.publicUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.6875rem', color: 'var(--primary-600)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
            >
              Lihat Asli <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      {/* Playlist Info Box */}
      {!isMedia && playlist && (
        <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)' }}>
              Daftar Isi Playlist
            </span>
            <Link
              href={`/studio/playlists/${playlist.id}`}
              target="_blank"
              style={{ fontSize: '0.6875rem', color: 'var(--primary-600)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
            >
              Buka Playlist <ExternalLink size={10} />
            </Link>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
            Berisi {playlist.itemsList?.length || 0} media dengan total durasi loop {playlist.totalDurationSeconds || 0} detik.
          </span>
        </div>
      )}

      {/* Title & Layer Source */}
      <div>
        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          NAMA ITEM
        </label>
        <input
          type="text"
          value={name}
          disabled
          className="form-input"
          style={{ fontSize: '0.75rem', padding: '6px 10px', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
        />
        <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
          Dialokasikan pada layer: <strong style={{ color: 'var(--text-primary)' }}>{blockZone?.name || 'Layer'}</strong>
        </span>
      </div>

      {/* Duration and Start Time Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            MULAI (DETIK)
          </label>
          <input
            type="number"
            min={0}
            value={selectedBlock.startTimeSeconds || 0}
            onChange={(e) => handleUpdateBlock({ startTimeSeconds: Math.max(0, Number(e.target.value) || 0) })}
            className="form-input"
            style={{ fontSize: '0.75rem', padding: '6px 10px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            DURASI (DETIK)
          </label>
          <input
            type="number"
            min={1}
            value={selectedBlock.durationSeconds || 10}
            onChange={(e) => handleUpdateBlock({ durationSeconds: Math.max(1, Number(e.target.value) || 1) })}
            className="form-input"
            style={{ fontSize: '0.75rem', padding: '6px 10px' }}
          />
        </div>
      </div>

      {/* Audio & Volume Settings */}
      <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
          Pengaturan Audio Track
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isBlockMuted ? <VolumeX size={16} color="var(--accent-rose)" /> : <Volume2 size={16} color="#10b981" />}
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBlockMuted ? 'Audio Dibisukan (Mute)' : 'Audio Aktif (Unmuted)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleUpdateBlock({ isMuted: !isBlockMuted })}
            style={{
              padding: '4px 10px',
              fontSize: '0.6875rem',
              fontWeight: 700,
              borderRadius: '5px',
              cursor: 'pointer',
              border: '1px solid var(--border-subtle)',
              backgroundColor: isBlockMuted ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
              color: isBlockMuted ? 'var(--accent-rose)' : '#059669',
            }}
          >
            {isBlockMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              VOLUME LEVEL
            </label>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {selectedBlock.volumeLevel ?? 100}%
            </span>
          </div>
          <VolumeSlider
            initialVolume={selectedBlock.volumeLevel ?? 100}
            onCommit={(val) => handleUpdateBlock({ volumeLevel: val })}
          />
        </div>
      </div>

      {/* Visual Effects (Transitions & Filters) */}
      <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sliders size={13} /> Efek Visual
        </span>

        {/* Transitions */}
        <div>
          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            TRANSISI MASUK
          </label>
          <select
            className="form-input"
            style={{ fontSize: '0.75rem', padding: '6px 10px' }}
            value={selectedBlock.transitionId || ''}
            onChange={(e) => handleUpdateBlock({ transitionId: e.target.value || undefined })}
          >
            <option value="">Tanpa Transisi</option>
            {transitionsList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.durationMs}ms)
              </option>
            ))}
          </select>
        </div>

        {/* Visual Filter */}
        {isMedia && (
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              VISUAL FILTER EFEK
            </label>
            <select
              className="form-input"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
              value={selectedBlock.visualFilterId || ''}
              onChange={(e) => handleUpdateBlock({ visualFilterId: e.target.value || undefined })}
            >
              <option value="">(Original - Tanpa Filter)</option>
              {visualFiltersList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
        <button
          type="button"
          onClick={() => {
            if (blockZone) {
              setSelectedLayerId(blockZone.id);
              setSelectedBlockId(null);
              setInspectorTarget('layer');
            }
          }}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, fontSize: '0.6875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '28px' }}
        >
          <Layers size={13} /> Edit Layer
        </button>
        <button
          type="button"
          onClick={handleSplitBlock}
          title="Potong (Split) di posisi Playhead"
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, fontSize: '0.6875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '28px' }}
        >
          <Scissors size={13} /> Split
        </button>
        <button
          type="button"
          onClick={handleDeleteBlock}
          title="Hapus Item dari Alokasi Layer"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '5px',
            backgroundColor: 'rgba(225, 29, 72, 0.1)',
            border: '1px solid rgba(225, 29, 72, 0.2)',
            color: 'var(--accent-rose)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
