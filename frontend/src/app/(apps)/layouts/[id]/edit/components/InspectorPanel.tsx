'use client';

import React from 'react';
import Link from 'next/link';
import {
  Trash2,
  MousePointer2,
  ListMusic,
  ExternalLink,
  Film,
  Volume2,
  VolumeX,
  Clock,
  ChevronLeft,
  ChevronRight,
  Settings,
  Image as ImageIcon,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { updatePlaylistBlock } from '@/lib/services/studio/layout.service';
import { useLayoutEditor } from '../context/LayoutEditorContext';

export default function InspectorPanel() {
  const {
    layout,
    layoutName,
    setLayoutName,
    zones,
    setZones,
    selectedZoneId,
    setSelectedZoneId,
    handleDeleteZone,
    updateSelectedZone,
    availablePlaylists,
    mediaList,
    setPickerZoneId,
    setMediaPickerZoneId,
    isInspectorCollapsed,
    setIsInspectorCollapsed,
    selectedBlockId,
    setSelectedBlockId,
    inspectorTarget,
    setInspectorTarget,
    showToast,
    isPlaying,
    togglePlay,
    stopPlay,
    isMuted,
    toggleMute,
    playheadPosition,
    pxPerSecond,
    timelineDuration,
  } = useLayoutEditor();

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  // Find active block if block is selected
  let selectedBlock: any = null;
  let blockZone = selectedZone;
  if (selectedBlockId) {
    for (const z of zones) {
      const found = (z.blocksList || []).find((b) => b.id === selectedBlockId);
      if (found) {
        selectedBlock = found;
        blockZone = z;
        break;
      }
    }
  }

  // Helper to update specific block in state & API
  const handleUpdateBlock = async (updates: { durationSeconds?: number; startTimeSeconds?: number; isMuted?: boolean }) => {
    if (!selectedBlock || !blockZone) return;

    if (updates.isMuted !== undefined && !selectedBlock.id.startsWith('temp-')) {
      try {
        await updatePlaylistBlock(selectedBlock.id, { isMuted: updates.isMuted });
      } catch (err: any) {
        console.error('Failed to update block audio:', err);
      }
    }

    setZones((prev) =>
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

  // Helper to delete block
  const handleDeleteBlock = () => {
    if (!selectedBlock || !blockZone) return;
    if (window.confirm('Hapus item ini dari alokasi zona?')) {
      const newBlocks = (blockZone.blocksList || []).filter((b) => b.id !== selectedBlock.id);
      if (blockZone.id === selectedZoneId) {
        updateSelectedZone('blocksList', newBlocks);
      } else {
        setZones((prev) =>
          prev.map((z) => (z.id === blockZone!.id ? { ...z, blocksList: newBlocks } : z))
        );
      }
      setSelectedBlockId(null);
      setInspectorTarget('zone');
      showToast('Item berhasil dihapus dari alokasi');
    }
  };

  // If collapsed to 36px mini strip
  if (isInspectorCollapsed) {
    return (
      <div
        style={{
          width: '36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          flexShrink: 0,
          height: '100%',
          zIndex: 5,
        }}
      >
        <div
          style={{
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid var(--border-subtle)',
            width: '100%',
          }}
        >
          <button
            onClick={() => setIsInspectorCollapsed(false)}
            title="Buka Inspector Properties"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              border: '1px solid var(--border-subtle)',
              borderRadius: '5px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <ChevronLeft size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px', color: 'var(--text-muted)' }}>
          <button
            onClick={() => setIsInspectorCollapsed(false)}
            title="Properties Inspector"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-600)' }}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Determine what title to show in the single inspector header
  let headerTitle = 'Properti Zona';
  let headerIcon = <Settings size={14} />;

  if (inspectorTarget === 'block' && selectedBlock) {
    headerTitle = selectedBlock.mediaItemId ? 'Properti Media' : 'Properti Playlist';
    headerIcon = selectedBlock.mediaItemId ? <Film size={14} /> : <ListMusic size={14} />;
  } else if (inspectorTarget === 'timeline') {
    headerTitle = 'Pengaturan Timeline';
    headerIcon = <Clock size={14} />;
  } else if (inspectorTarget === 'layout' || (!selectedZone && !selectedBlock)) {
    headerTitle = 'Properti Layout';
    headerIcon = <Sparkles size={14} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        height: '100%',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Dynamic Header (No Tabs - single inspector panel like Android Studio) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          minHeight: '44px',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {headerIcon} {headerTitle}
        </span>
        <button
          onClick={() => setIsInspectorCollapsed(true)}
          title="Sembunyikan Panel Properti"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '5px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
        >
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Dynamic Body Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* CASE 1: BLOCK / MEDIA ITEM PROPERTIES */}
        {inspectorTarget === 'block' && selectedBlock ? (() => {
          const isMedia = !!selectedBlock.mediaItemId;
          const media = isMedia ? mediaList.find((m) => m.id === selectedBlock.mediaItemId) : null;
          const playlist = !isMedia ? availablePlaylists.find((p) => p.id === selectedBlock.playlistId) : null;
          const name = isMedia ? media?.name || 'Media Item' : playlist?.name || 'Playlist';
          const isVideo = isMedia && media?.mediaType === 2;
          const isImage = isMedia && media?.mediaType !== 2;
          const isBlockMuted = selectedBlock.isMuted !== undefined
            ? !!selectedBlock.isMuted
            : !!selectedBlock.itemOverridesList?.find((o: any) => o.playlistItemId === selectedBlock.id)?.isMuted;

          return (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Media Preview Box */}
              {isMedia && media?.publicUrl && (
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', backgroundColor: '#000', position: 'relative' }}>
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
                      href={`/playlists/${playlist.id}`}
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

              {/* Title & Zone Source */}
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
                  Dialokasikan pada layer: <strong style={{ color: 'var(--text-primary)' }}>{blockZone?.name || 'Zona'}</strong>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isBlockMuted ? <VolumeX size={16} color="var(--accent-rose)" /> : <Volume2 size={16} color="#10b981" />}
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {isBlockMuted ? 'Audio Dibisukan (Mute)' : 'Audio Aktif (Unmuted)'}
                    </span>
                  </div>
                  <button
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
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
                <button
                  onClick={() => {
                    if (blockZone) {
                      setSelectedZoneId(blockZone.id);
                      setSelectedBlockId(null);
                      setInspectorTarget('zone');
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Layers size={13} /> Edit Zona
                </button>
                <button
                  onClick={handleDeleteBlock}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    backgroundColor: 'rgba(225, 29, 72, 0.1)',
                    border: '1px solid rgba(225, 29, 72, 0.2)',
                    color: 'var(--accent-rose)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Trash2 size={13} /> Hapus
                </button>
              </div>
            </div>
          );
        })() : null}

        {/* CASE 2: ZONE / LAYER PROPERTIES */}
        {inspectorTarget === 'zone' && selectedZone ? (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Properti Dimensi & Posisi
              </span>
              <button
                onClick={() => handleDeleteZone(selectedZone.id)}
                style={{
                  backgroundColor: 'rgba(225, 29, 72, 0.1)',
                  border: '1px solid rgba(225, 29, 72, 0.2)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 7px',
                  borderRadius: '4px',
                }}
              >
                <Trash2 size={12} /> Hapus Zona
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  NAMA KOTAK / ZONA
                </label>
                <input
                  type="text"
                  value={selectedZone.name}
                  onChange={(e) => updateSelectedZone('name', e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    POSISI X (PX)
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedZone.x || 0)}
                    onChange={(e) => updateSelectedZone('x', Number(e.target.value))}
                    className="form-input"
                    style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    POSISI Y (PX)
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedZone.y || 0)}
                    onChange={(e) => updateSelectedZone('y', Number(e.target.value))}
                    className="form-input"
                    style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    LEBAR (PX)
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedZone.width || 200)}
                    onChange={(e) => updateSelectedZone('width', Number(e.target.value))}
                    className="form-input"
                    style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    TINGGI (PX)
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedZone.height || 200)}
                    onChange={(e) => updateSelectedZone('height', Number(e.target.value))}
                    className="form-input"
                    style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  TUMPUKAN (Z-INDEX)
                </label>
                <input
                  type="number"
                  value={selectedZone.zIndex || 1}
                  onChange={(e) => updateSelectedZone('zIndex', Number(e.target.value))}
                  className="form-input"
                  style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                />
              </div>

              {/* Quick block allocation button inside zone */}
              <div style={{ marginTop: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  TAMBAH ALOKASI KONTEN KE ZONA INI
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPickerZoneId(selectedZone.id)}
                    style={{ flex: 1, padding: '7px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--bg-base)', border: '1px dashed var(--border-subtle)', borderRadius: '6px', cursor: 'pointer', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <ListMusic size={13} /> Playlist
                  </button>
                  <button
                    onClick={() => setMediaPickerZoneId(selectedZone.id)}
                    style={{ flex: 1, padding: '7px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--bg-base)', border: '1px dashed var(--border-subtle)', borderRadius: '6px', cursor: 'pointer', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Film size={13} /> Media
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* CASE 3: TIMELINE SIMULATION & GLOBAL AUDIO SETTINGS */}
        {inspectorTarget === 'timeline' ? (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pengaturan Timeline Simulasi
              </span>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Atur durasi dan playback sinkronisasi antar track layer.
              </p>
            </div>

            {/* Playback Controls Box */}
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Kontrol Playback
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={togglePlay}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isPlaying ? 'Pause' : 'Play Simulation'}</span>
                </button>
                <button
                  onClick={stopPlay}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 10px' }}
                  title="Reset Playhead ke 0s"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Posisi Playhead:</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary-600)' }}>
                  {(playheadPosition / (pxPerSecond || 20)).toFixed(1)}s
                </span>
              </div>
            </div>

            {/* Master Audio Control */}
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isMuted ? <VolumeX size={16} color="var(--accent-rose)" /> : <Volume2 size={16} color="#10b981" />}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Master Audio
                  </span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                    {isMuted ? 'Semua audio dibisukan' : 'Audio menyala aktif'}
                  </span>
                </div>
              </div>
              <button
                onClick={toggleMute}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  borderRadius: '5px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: isMuted ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                  color: isMuted ? 'var(--accent-rose)' : '#059669',
                }}
              >
                {isMuted ? 'Unmute All' : 'Mute All'}
              </button>
            </div>

            {/* Timeline Tracks Overview */}
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Ringkasan Track ({zones.length} Layer)
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {zones.map((z, idx) => {
                  const zColors = ['#1d4ed8', '#047857', '#b45309', '#be185d', '#6d28d9', '#0f766e', '#4338ca'];
                  const color = zColors[idx % zColors.length];
                  return (
                    <div
                      key={z.id}
                      onClick={() => {
                        setSelectedZoneId(z.id);
                        setSelectedBlockId(null);
                        setInspectorTarget('zone');
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-base)',
                        borderLeft: `4px solid ${color}`,
                        border: '1px solid var(--border-subtle)',
                        borderLeftWidth: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {z.name}
                      </span>
                      <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                        {z.blocksList?.length || 0} blok
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* CASE 4: LAYOUT / CANVAS PROPERTIES (Or fallback when nothing is selected) */}
        {(inspectorTarget === 'layout' || (!selectedZone && !selectedBlock && inspectorTarget !== 'timeline')) ? (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resolusi & Properti Canvas
            </span>

            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                NAMA LAYOUT
              </label>
              <input
                type="text"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.75rem', padding: '6px 10px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  RESOLUSI LEBAR
                </label>
                <input
                  type="text"
                  disabled
                  value={`${layout?.canvasWidth || 1920} px`}
                  className="form-input"
                  style={{ fontSize: '0.75rem', padding: '6px 10px', backgroundColor: 'var(--bg-base)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  RESOLUSI TINGGI
                </label>
                <input
                  type="text"
                  disabled
                  value={`${layout?.canvasHeight || 1080} px`}
                  className="form-input"
                  style={{ fontSize: '0.75rem', padding: '6px 10px', backgroundColor: 'var(--bg-base)' }}
                />
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-base)', border: '1px dashed var(--border-subtle)', textAlign: 'center', marginTop: '8px' }}>
              <MousePointer2 size={20} style={{ opacity: 0.5, margin: '0 auto 6px auto', color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>
                Klik suatu <strong>Zona</strong> di canvas, item di <strong>Alokasi Playlist</strong>, atau blok di <strong>Timeline</strong> untuk langsung beralih melihat dan mengedit propertinya di panel ini.
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
