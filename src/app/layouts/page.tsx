'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, Move, Tv, Layers } from 'lucide-react';

interface ZoneItem {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z_index: number;
  playlist_name: string;
  playlist_id: string;
  color: string;
}

export default function LayoutsPage() {
  const [layoutName, setLayoutName] = useState('Supermarket Promo Dual-Zone');
  const [resolutionPreset, setResolutionPreset] = useState<'1080p_land' | '1080p_port' | '4k_land' | 'custom'>('1080p_land');
  const [canvasWidth, setCanvasWidth] = useState(1920);
  const [canvasHeight, setCanvasHeight] = useState(1080);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('z1');

  const [zones, setZones] = useState<ZoneItem[]>([
    {
      id: 'z1',
      name: 'Kotak Video Utama (70% Layar)',
      x: 0,
      y: 0,
      width: 1344,
      height: 960,
      z_index: 1,
      playlist_id: 'pl-1',
      playlist_name: 'Playlist Video Promo Bulanan (3 Video)',
      color: '#4f46e5',
    },
    {
      id: 'z2',
      name: 'Kotak Banner Samping (30% Layar)',
      x: 1344,
      y: 0,
      width: 576,
      height: 960,
      z_index: 2,
      playlist_id: 'pl-2',
      playlist_name: 'Slide Banner Produk Baru (6 Gambar)',
      color: '#06b6d4',
    },
    {
      id: 'z3',
      name: 'Kotak Running Text Bawah',
      x: 0,
      y: 960,
      width: 1920,
      height: 120,
      z_index: 3,
      playlist_id: 'pl-3',
      playlist_name: 'Flash Sale Ticker Text',
      color: '#10b981',
    },
  ]);

  const handlePresetChange = (preset: '1080p_land' | '1080p_port' | '4k_land' | 'custom') => {
    setResolutionPreset(preset);
    if (preset === '1080p_land') {
      setCanvasWidth(1920);
      setCanvasHeight(1080);
    } else if (preset === '1080p_port') {
      setCanvasWidth(1080);
      setCanvasHeight(1920);
    } else if (preset === '4k_land') {
      setCanvasWidth(3840);
      setCanvasHeight(2160);
    }
  };

  const handleAddZone = () => {
    const newZone: ZoneItem = {
      id: `z-${Date.now()}`,
      name: `Kotak Zona ${zones.length + 1}`,
      x: 100,
      y: 100,
      width: Math.round(canvasWidth * 0.4),
      height: Math.round(canvasHeight * 0.4),
      z_index: zones.length + 1,
      playlist_id: 'pl-new',
      playlist_name: 'Pilih Playlist...',
      color: '#f59e0b',
    };
    setZones([...zones, newZone]);
    setSelectedZoneId(newZone.id);
  };

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  const updateSelectedZone = (field: keyof ZoneItem, value: any) => {
    if (!selectedZoneId) return;
    setZones(
      zones.map((z) => (z.id === selectedZoneId ? { ...z, [field]: value } : z))
    );
  };

  const handleDeleteZone = (id: string) => {
    setZones(zones.filter((z) => z.id !== id));
    if (selectedZoneId === id) setSelectedZoneId(null);
  };

  // Scaled preview inside container
  const previewScale = Math.min(640 / canvasWidth, 380 / canvasHeight);

  return (
    <div>
      {/* Header action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Appearance & Visual Layout Designer
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Desain template tata letak multi-kotak (multi-zone) dan tentukan alokasi playlist media untuk Android Player
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => alert('Layout berhasil dikirim ke Tonic gRPC via Envoy Proxy!')}
        >
          <Save size={16} />
          <span>Simpan & Terapkan Layout</span>
        </button>
      </div>

      {/* Main Designer Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Left Column: Visual Canvas */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Interactive Canvas Preview
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-online">
                {canvasWidth} × {canvasHeight} px ({canvasWidth > canvasHeight ? 'Landscape' : 'Portrait'})
              </span>
            </div>
          </div>

          {/* Canvas Viewport Frame */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#04070f',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              minHeight: '440px',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                width: `${canvasWidth * previewScale}px`,
                height: `${canvasHeight * previewScale}px`,
                background: '#000000',
                position: 'relative',
                boxShadow: '0 10px 40px rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  style={{
                    position: 'absolute',
                    left: `${zone.x * previewScale}px`,
                    top: `${zone.y * previewScale}px`,
                    width: `${zone.width * previewScale}px`,
                    height: `${zone.height * previewScale}px`,
                    zIndex: zone.z_index,
                    backgroundColor: `${zone.color}40`,
                    border: selectedZoneId === zone.id ? '2px solid #ffffff' : `1.5px dashed ${zone.color}`,
                    borderRadius: '2px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      textAlign: 'center',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    {zone.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: '#cbd5e1',
                      textAlign: 'center',
                      marginTop: '4px',
                      background: 'rgba(0,0,0,0.4)',
                      padding: '1px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    ▶ {zone.playlist_name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={handleAddZone} style={{ fontSize: '0.85rem' }}>
              <Plus size={16} />
              <span>Tambah Kotak / Zona Baru</span>
            </button>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Klik pada kotak visual di atas untuk mengedit properti & memilih playlist
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Selected Zone Properties */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Layout & Resolution Settings */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Pengaturan Resolusi Layar Android
            </h3>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Nama Layout / Template</label>
              <input
                type="text"
                className="form-input"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Preset Resolusi Layar</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handlePresetChange('1080p_land')}
                  className={`btn ${resolutionPreset === '1080p_land' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '8px 10px' }}
                >
                  1920 × 1080 (Landscape)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('1080p_port')}
                  className={`btn ${resolutionPreset === '1080p_port' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '8px 10px' }}
                >
                  1080 × 1920 (Portrait)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('4k_land')}
                  className={`btn ${resolutionPreset === '4k_land' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '8px 10px' }}
                >
                  3840 × 2160 (4K UHD)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('custom')}
                  className={`btn ${resolutionPreset === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '8px 10px' }}
                >
                  Custom Resolusi
                </button>
              </div>
            </div>

            {resolutionPreset === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Lebar (px)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={canvasWidth}
                    onChange={(e) => setCanvasWidth(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tinggi (px)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={canvasHeight}
                    onChange={(e) => setCanvasHeight(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Selected Zone Inspector */}
          {selectedZone ? (
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--border-focus)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  Inspector: {selectedZone.name}
                </h3>
                <button
                  onClick={() => handleDeleteZone(selectedZone.id)}
                  style={{
                    color: 'var(--accent-rose)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                  }}
                >
                  <Trash2 size={14} />
                  <span>Hapus Kotak</span>
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Nama Kotak / Zona</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedZone.name}
                  onChange={(e) => updateSelectedZone('name', e.target.value)}
                />
              </div>

              {/* Playlist Selection for this box */}
              <div
                style={{
                  marginBottom: '16px',
                  background: 'var(--hover-surface)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--accent-primary)' }}>
                  <Tv size={15} /> Playlist Konten (1 Kotak Bisa Banyak Video/Gambar)
                </label>
                <select
                  className="form-select"
                  value={selectedZone.playlist_id}
                  onChange={(e) => {
                    const selName = e.target.options[e.target.selectedIndex].text;
                    updateSelectedZone('playlist_id', e.target.value);
                    updateSelectedZone('playlist_name', selName);
                  }}
                >
                  <option value="pl-1">Playlist Video Promo Bulanan (3 Video)</option>
                  <option value="pl-2">Slide Banner Produk Baru (6 Gambar)</option>
                  <option value="pl-3">Flash Sale Ticker Text</option>
                  <option value="pl-4">Daily Lookbook Fashion (12 Slide)</option>
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Konten dalam playlist ini akan diputar berurutan/looping di kotak ini pada player Android.
                </div>
              </div>

              {/* Coordinates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Posisi X (px)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={selectedZone.x}
                    onChange={(e) => updateSelectedZone('x', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Posisi Y (px)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={selectedZone.y}
                    onChange={(e) => updateSelectedZone('y', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lebar Kotak (px)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={selectedZone.width}
                    onChange={(e) => updateSelectedZone('width', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tinggi Kotak (px)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={selectedZone.height}
                    onChange={(e) => updateSelectedZone('height', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Pilih sebuah kotak pada kanvas preview untuk mengatur koordinat & playlist.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
