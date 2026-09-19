'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Layout, Zone } from '../../../../lib/api';
import { ArrowLeft, Save, Plus, Trash2, Palette, RefreshCw } from 'lucide-react';

export default function EditLayoutCanvasPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const [zones, setZones] = useState<Zone[]>([]);
  const [layoutName, setLayoutName] = useState('');

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true);
        const data = await api.getLayout(params.id);
        setLayout(data);
        setLayoutName(data.name);
        setZones(data.zones || []);
        if (data.zones?.length > 0) {
          setSelectedZoneId(data.zones[0].id);
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

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateLayout(params.id, { name: layoutName });
      alert('Template layout berhasil disimpan ke database gRPC!');
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
    };
    setZones([...zones, newZone]);
    setSelectedZoneId(newZone.id);
  };

  const handleDeleteZone = (zoneId: string) => {
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

  if (loading || !layout) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat Canvas Designer...</span>
      </div>
    );
  }

  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const scale = 540 / layout.canvas_width;
  const previewHeight = layout.canvas_height * scale;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href={`/layouts/${params.id}`} className="btn btn-outline" style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Appearance & Visual Layout Designer
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Desain template tata letak multi-kotak (multi-zone) untuk display Android player.
            </p>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          <Save size={14} />
          <span>{saving ? 'Menyimpan...' : 'Simpan & Terapkan Layout'}</span>
        </button>
      </div>

      {/* Main Studio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '20px', alignItems: 'start' }}>
        {/* Left: Canvas Area */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Interactive Canvas Preview
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--accent-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              {layout.canvas_width} × {layout.canvas_height} px ({layout.orientation})
            </span>
          </div>

          <div
            style={{
              width: '540px',
              height: `${previewHeight}px`,
              backgroundColor: '#0a0a0f',
              border: '2px solid var(--border-subtle)',
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
            }}
          >
            {zones.map((z, idx) => {
              const zColors = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
              const color = zColors[idx % zColors.length];
              const isSelected = z.id === selectedZoneId;

              return (
                <div
                  key={z.id}
                  onClick={() => setSelectedZoneId(z.id)}
                  style={{
                    position: 'absolute',
                    left: `${z.x * scale}px`,
                    top: `${z.y * scale}px`,
                    width: `${z.width * scale}px`,
                    height: `${z.height * scale}px`,
                    backgroundColor: `${color}${isSelected ? '44' : '22'}`,
                    border: `${isSelected ? '3px' : '2px'} solid ${color}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    boxSizing: 'border-box',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', textAlign: 'center' }}>
                    {z.name}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: color, marginTop: '2px', fontWeight: 600 }}>
                    {z.width} × {z.height} px
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '16px', alignItems: 'center' }}>
            <button onClick={handleAddZone} className="btn btn-secondary">
              <Plus size={14} />
              <span>Tambah Kotak / Zona Baru</span>
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Klik kotak visual di atas untuk mengedit properti
            </span>
          </div>
        </div>

        {/* Right: Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Layout Meta */}
          <div className="card-elevated" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Pengaturan Resolusi Layar
            </h3>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                NAMA LAYOUT / TEMPLATE
              </label>
              <input
                type="text"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Zone Inspector */}
          {selectedZone ? (
            <div className="card-elevated" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                  Inspector: {selectedZone.name}
                </h3>
                <button
                  onClick={() => handleDeleteZone(selectedZone.id)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--accent-rose)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Trash2 size={13} />
                  <span>Hapus Kotak</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    NAMA KOTAK / ZONA
                  </label>
                  <input
                    type="text"
                    value={selectedZone.name}
                    onChange={(e) => updateSelectedZone('name', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      POSISI X (PX)
                    </label>
                    <input
                      type="number"
                      value={selectedZone.x}
                      onChange={(e) => updateSelectedZone('x', Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      POSISI Y (PX)
                    </label>
                    <input
                      type="number"
                      value={selectedZone.y}
                      onChange={(e) => updateSelectedZone('y', Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      LEBAR KOTAK (PX)
                    </label>
                    <input
                      type="number"
                      value={selectedZone.width}
                      onChange={(e) => updateSelectedZone('width', Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      TINGGI KOTAK (PX)
                    </label>
                    <input
                      type="number"
                      value={selectedZone.height}
                      onChange={(e) => updateSelectedZone('height', Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-elevated" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Pilih zona kotak pada canvas untuk mengedit properti
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
