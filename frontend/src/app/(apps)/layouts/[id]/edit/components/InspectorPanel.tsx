'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trash2,
  MousePointer2,
  ListMusic,
  ExternalLink,
  Film,
  Layers,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Settings,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';
import LayerItemCard from './layers/LayerItemCard';

export default function InspectorPanel() {
  const {
    layoutName,
    setLayoutName,
    zones,
    selectedZoneId,
    setSelectedZoneId,
    handleAddZone,
    handleDeleteZone,
    updateSelectedZone,
    availablePlaylists,
    mediaList,
    setPickerZoneId,
    setMediaPickerZoneId,
    hiddenZones,
    toggleZoneVisibility,
    isInspectorCollapsed,
    setIsInspectorCollapsed,
    isLayoutMetaExpanded,
    setIsLayoutMetaExpanded,
  } = useLayoutEditor();

  const [activeTab, setActiveTab] = useState<'properties' | 'playlist' | 'layers' | 'timeline'>('properties');
  const [isZonePropsOpen, setIsZonePropsOpen] = useState(true);

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

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
            title="Tampilkan Panel Kanan"
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px' }}>
          <button
            onClick={() => { setIsInspectorCollapsed(false); setActiveTab('properties'); }}
            title="Properti Zona"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'properties' ? 'var(--primary-600)' : 'var(--text-muted)' }}
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => { setIsInspectorCollapsed(false); setActiveTab('playlist'); }}
            title="Alokasi Playlist"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'playlist' ? 'var(--primary-600)' : 'var(--text-muted)' }}
          >
            <ListMusic size={16} />
          </button>
          <button
            onClick={() => { setIsInspectorCollapsed(false); setActiveTab('layers'); }}
            title="Daftar Zona / Layers"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'layers' ? 'var(--primary-600)' : 'var(--text-muted)' }}
          >
            <Layers size={16} />
          </button>
          <button
            onClick={() => { setIsInspectorCollapsed(false); setActiveTab('timeline'); }}
            title="Semua Playlist Timeline"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'timeline' ? 'var(--primary-600)' : 'var(--text-muted)' }}
          >
            <Clock size={16} />
          </button>
        </div>
      </div>
    );
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
      {/* Top Header with Collapse Button & Title */}
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
          <Settings size={14} /> Inspektor & Pengaturan
        </span>
        <button
          onClick={() => setIsInspectorCollapsed(true)}
          title="Sembunyikan Panel Kanan"
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

      {/* Tabs Header */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-base)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setActiveTab('properties')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '0.6875rem',
            fontWeight: activeTab === 'properties' ? 700 : 500,
            color: activeTab === 'properties' ? 'var(--primary-600)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'properties' ? '2px solid var(--primary-600)' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
          title="Properti Layout & Zona"
        >
          <Settings size={12} /> Properti
        </button>
        <button
          onClick={() => setActiveTab('playlist')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '0.6875rem',
            fontWeight: activeTab === 'playlist' ? 700 : 500,
            color: activeTab === 'playlist' ? 'var(--primary-600)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'playlist' ? '2px solid var(--primary-600)' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
          title="Alokasi Playlist Zona Terpilih"
        >
          <ListMusic size={12} /> Playlist
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '0.6875rem',
            fontWeight: activeTab === 'layers' ? 700 : 500,
            color: activeTab === 'layers' ? 'var(--primary-600)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'layers' ? '2px solid var(--primary-600)' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
          title="Daftar Semua Layer"
        >
          <Layers size={12} /> Layers
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '0.6875rem',
            fontWeight: activeTab === 'timeline' ? 700 : 500,
            color: activeTab === 'timeline' ? 'var(--primary-600)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'timeline' ? '2px solid var(--primary-600)' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
          title="Semua Playlist Timeline"
        >
          <Clock size={12} /> Timeline
        </button>
      </div>

      {/* Tab Content Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* TAB 1: PROPERTIES (Resolusi Layar + Properti Zona) */}
        {activeTab === 'properties' && (
          <div>
            {/* Resolusi Layar */}
            <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div
                onClick={() => setIsLayoutMetaExpanded(!isLayoutMetaExpanded)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', backgroundColor: isLayoutMetaExpanded ? 'transparent' : 'var(--bg-surface-elevated)' }}
              >
                <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Resolusi Layar
                </h3>
                {isLayoutMetaExpanded ? <ChevronUp size={14} color="var(--text-secondary)" /> : <ChevronDown size={14} color="var(--text-secondary)" />}
              </div>
              {isLayoutMetaExpanded && (
                <div style={{ padding: '0 16px 16px 16px' }}>
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
              )}
            </div>

            {/* Properti Zona */}
            {selectedZone ? (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    Properti Zona
                  </h3>
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
                    <Trash2 size={12} /> Hapus
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
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <MousePointer2 size={24} style={{ opacity: 0.5, margin: '0 auto 8px auto' }} />
                <span style={{ fontSize: '0.75rem' }}>Pilih zona layer pada canvas atau tab layers untuk melihat properti</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALOKASI PLAYLIST */}
        {activeTab === 'playlist' && (
          <div style={{ padding: '14px' }}>
            {selectedZone ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                    Alokasi Playlist ({selectedZone.name})
                  </span>
                  {selectedZone.blocksList && selectedZone.blocksList.length > 0 && (
                    <Link
                      href={`/playlists/${selectedZone.blocksList[0].playlistId}`}
                      target="_blank"
                      style={{ fontSize: '0.6875rem', color: 'var(--primary-500)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      Buka <ExternalLink size={10} />
                    </Link>
                  )}
                </div>

                {(selectedZone.blocksList || []).length > 0 ? (
                  (selectedZone.blocksList || []).map((block, index) => {
                    const isMediaBlock = !!block.mediaItemId;
                    let name = 'Loading...';
                    let detail1 = '';
                    let detail2 = '';
                    let icon = <ListMusic size={14} />;

                    if (isMediaBlock) {
                      const m = mediaList.find(m => m.id === block.mediaItemId);
                      name = m?.name || 'Media';
                      detail1 = m?.mediaType === 2 ? 'Video' : 'Image';
                      detail2 = `${block.durationSeconds}s`;
                      icon = <Film size={14} />;
                    } else {
                      const pl = availablePlaylists.find(p => p.id === block.playlistId);
                      name = pl?.name || 'Playlist';
                      detail1 = `${pl?.itemsList?.length || 0} Media`;
                      detail2 = `${pl?.totalDurationSeconds || 0}s`;
                    }

                    return (
                      <div key={block.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {icon} {name}
                          </span>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{detail1}</span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--accent-amber)' }}>{detail2}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('Hapus blok playlist ini dari zona?')) {
                              const newBlocks = (selectedZone.blocksList || []).filter(b => b.id !== block.id);
                              updateSelectedZone('blocksList', newBlocks);
                            }
                          }}
                          style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '4px' }}
                          title="Hapus Blok"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', backgroundColor: 'var(--bg-base)', borderRadius: '6px', border: '1px dashed var(--border-subtle)' }}>
                    Belum ada playlist yang dialokasikan pada zona ini.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    onClick={() => setPickerZoneId(selectedZone.id)}
                    style={{ flex: 1, padding: '7px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--bg-surface-elevated)', border: '1px dashed var(--border-subtle)', borderRadius: '6px', cursor: 'pointer', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <ListMusic size={14} /> Playlist
                  </button>
                  <button
                    onClick={() => setMediaPickerZoneId(selectedZone.id)}
                    style={{ flex: 1, padding: '7px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--bg-surface-elevated)', border: '1px dashed var(--border-subtle)', borderRadius: '6px', cursor: 'pointer', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Film size={14} /> Media
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <MousePointer2 size={24} style={{ opacity: 0.5, margin: '0 auto 8px auto' }} />
                <span style={{ fontSize: '0.75rem' }}>Pilih zona untuk melihat atau mengatur alokasi playlist</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LAYERS (ZONA) */}
        {activeTab === 'layers' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} /> Total {zones.length} Layer
              </span>
              <button
                onClick={handleAddZone}
                className="btn btn-primary"
                style={{ padding: '3px 7px', fontSize: '0.6875rem', height: 'auto' }}
              >
                <Plus size={12} /> Baru
              </button>
            </div>
            {zones.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 16px' }}>
                Belum ada layer. Klik &ldquo;Baru&rdquo; untuk menambahkan.
              </div>
            ) : (
              [...zones].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)).map((z) => (
                <LayerItemCard key={z.id} z={z} />
              ))
            )}
          </div>
        )}

        {/* TAB 4: TIMELINE PLAYLIST LIST */}
        {activeTab === 'timeline' && (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> Ringkasan Semua Playlist di Timeline
            </span>

            {zones.map((z, idx) => {
              const blocks = z.blocksList || [];
              const isHidden = hiddenZones.includes(z.id);
              const zColors = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];
              const color = zColors[idx % zColors.length];

              return (
                <div
                  key={z.id}
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    onClick={() => setSelectedZoneId(z.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderLeft: `4px solid ${color}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {z.name}
                      </span>
                      <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                        {blocks.length} blok playlist
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleZoneVisibility(z.id);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isHidden ? 'var(--text-muted)' : 'var(--text-secondary)' }}
                      title={isHidden ? 'Tampilkan Layer' : 'Sembunyikan Layer'}
                    >
                      {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {blocks.length === 0 ? (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Tidak ada blok media/playlist di track timeline ini.
                      </span>
                    ) : (
                      blocks.map((b, bIdx) => {
                        const isMedia = !b.playlistId && !!b.mediaItemId;
                        const pl = !isMedia ? availablePlaylists.find(p => p.id === b.playlistId) : null;
                        const med = isMedia ? mediaList.find(m => m.id === b.mediaItemId) : null;
                        const name = isMedia ? med?.name || 'Media' : pl?.name || 'Playlist';

                        return (
                          <div
                            key={b.id || bIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.6875rem',
                              padding: '4px 6px',
                              backgroundColor: 'var(--bg-surface)',
                              borderRadius: '4px',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {isMedia ? <Film size={11} /> : <ListMusic size={11} />} {name}
                            </span>
                            <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                              {b.durationSeconds}s
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
