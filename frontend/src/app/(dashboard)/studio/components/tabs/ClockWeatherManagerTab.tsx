'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Plus, Search, Eye, Trash2, X, CloudSun, Calendar, MapPin, Droplets, Wind } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

export interface ClockWeatherConfig {
  id: string;
  name: string;
  city: string;
  showSeconds: boolean;
  is24Hour: boolean;
  theme: 'glass' | 'dark' | 'emerald' | 'gold';
  createdAt?: string;
}

export const CLOCK_STORAGE_KEY = 'dka_signage_clock_widgets';

export const CITY_PRESETS: Record<string, { city: string; temp: number; condition: string; humidity: number; windSpeed: number }> = {
  Makassar: { city: 'Makassar', temp: 31, condition: 'Cerah Berawan', humidity: 72, windSpeed: 14 },
  Jakarta: { city: 'Jakarta', temp: 33, condition: 'Cerah', humidity: 68, windSpeed: 12 },
  Surabaya: { city: 'Surabaya', temp: 34, condition: 'Cerah Panas', humidity: 65, windSpeed: 16 },
  Bandung: { city: 'Bandung', temp: 24, condition: 'Hujan Ringan', humidity: 85, windSpeed: 10 },
  Denpasar: { city: 'Denpasar', temp: 30, condition: 'Cerah', humidity: 75, windSpeed: 18 },
  Medan: { city: 'Medan', temp: 29, condition: 'Berawan', humidity: 80, windSpeed: 11 },
};

export const DEFAULT_CLOCKS: ClockWeatherConfig[] = [
  {
    id: 'cw-1',
    name: 'Widget Jam Utama Makassar',
    city: 'Makassar',
    showSeconds: true,
    is24Hour: true,
    theme: 'glass',
    createdAt: '2026-10-08',
  },
  {
    id: 'cw-2',
    name: 'Widget Jam Layar Toko Jakarta',
    city: 'Jakarta',
    showSeconds: false,
    is24Hour: true,
    theme: 'emerald',
    createdAt: '2026-10-08',
  },
];

export default function ClockWeatherManagerTab() {
  const [items, setItems] = useState<ClockWeatherConfig[]>(DEFAULT_CLOCKS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [previewItem, setPreviewItem] = useState<ClockWeatherConfig | null>(null);
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CLOCK_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const saveItems = (updated: ClockWeatherConfig[]) => {
    setItems(updated);
    try {
      localStorage.setItem(CLOCK_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Hapus widget "${name}"?`)) return;
    const updated = items.filter((w) => w.id !== id);
    saveItems(updated);
  };

  const filtered = items.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.city.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const weather = previewItem ? CITY_PRESETS[previewItem.city] || CITY_PRESETS['Makassar'] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Daftar Komponen Jam Digital & Cuaca
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Widget penunjuk waktu presisi dan perkiraan cuaca kota untuk zona sudut layar promosi toko.
          </p>
        </div>

        <Link href="/studio/components/clock/create" className="btn btn-primary">
          <Plus size={16} />
          <span>Tambah Widget Jam & Cuaca</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="card-elevated" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari widget berdasarkan nama atau kota..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Table List */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Widget</th>
                <th>Lokasi Kota</th>
                <th>Format Jam</th>
                <th>Detik Berjalan</th>
                <th>Gaya Tema</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Belum ada widget tersimpan. Klik "Tambah Widget Jam & Cuaca" untuk membuat.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Clock size={18} style={{ color: 'var(--primary-400)', flexShrink: 0 }} />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          color: 'var(--primary-400)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <MapPin size={10} />
                        {item.city}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {item.is24Hour ? '24 Jam (14:30)' : '12 Jam (02:30 PM)'}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: item.showSeconds ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                        {item.showSeconds ? '✓ Aktif' : '-'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
                        {item.theme === 'glass' ? 'Glassmorphism' : item.theme}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px' }}
                          title="Pratinjau Widget"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px' }}
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          limit={limit}
          total={filtered.length}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Widget Preview Modal */}
      {previewItem && weather && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '680px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Pratinjau Widget: {previewItem.name}
              </h3>
              <button
                onClick={() => setPreviewItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Widget Card */}
            <div
              style={{
                padding: '28px 36px',
                borderRadius: '16px',
                background:
                  previewItem.theme === 'glass'
                    ? 'rgba(15, 23, 42, 0.85)'
                    : previewItem.theme === 'dark'
                    ? '#09090b'
                    : previewItem.theme === 'emerald'
                    ? '#064e3b'
                    : '#78350f',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px',
                color: '#ffffff',
                boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
              }}
            >
              <div>
                <div style={{ fontSize: '3.2rem', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
                  {time.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: previewItem.showSeconds ? '2-digit' : undefined,
                    hour12: !previewItem.is24Hour,
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
                  <Calendar size={13} style={{ color: '#60a5fa' }} />
                  <span>
                    {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '20px' }}>
                <CloudSun size={36} style={{ color: '#fbbf24' }} />
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>{weather.temp}°C</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fef08a', marginTop: '2px' }}>{weather.condition}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{weather.city}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
