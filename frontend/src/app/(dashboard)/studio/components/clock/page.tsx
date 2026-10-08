'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Plus, Search, Eye, Edit, Trash2, X, CloudSun, Calendar, MapPin, Droplets, Wind } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { ClockWeatherConfig, CLOCK_STORAGE_KEY, DEFAULT_CLOCKS, CITY_PRESETS } from './types';

export default function ClockPage() {
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
      } else {
        localStorage.setItem(CLOCK_STORAGE_KEY, JSON.stringify(DEFAULT_CLOCKS));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Hapus widget jam & cuaca "${name}"?`)) return;
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    try {
      localStorage.setItem(CLOCK_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.city.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Komponen Jam & Prakiraan Cuaca
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Widget penunjuk waktu digital real-time, tanggal bahasa Indonesia, serta informasi perkiraan cuaca kota ritel.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/studio/components/clock/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Tambah Widget Jam Baru</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search */}
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

      {/* Table Data */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Widget</th>
                <th>Kota Penunjuk</th>
                <th>Format Jam</th>
                <th>Detik</th>
                <th>Tema Tampilan</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Belum ada widget jam tersimpan. Klik tombol Tambah untuk membuat baru.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link href={`/studio/components/clock/${item.id}/edit`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {item.name}
                      </Link>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-400)' }}>
                        <MapPin size={12} /> {item.city}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {item.is24Hour ? '24-Jam (14:30)' : '12-Jam (02:30 PM)'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: item.showSeconds ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                        {item.showSeconds ? 'Aktif (:SS)' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          backgroundColor:
                            item.theme === 'glass'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : item.theme === 'emerald'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : item.theme === 'gold'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(255, 255, 255, 0.1)',
                          color:
                            item.theme === 'glass'
                              ? 'var(--primary-400)'
                              : item.theme === 'emerald'
                              ? 'var(--accent-emerald)'
                              : item.theme === 'gold'
                              ? '#fbbf24'
                              : 'var(--text-primary)',
                        }}
                      >
                        {item.theme}
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
                        <Link
                          href={`/studio/components/clock/${item.id}/edit`}
                          className="btn btn-secondary"
                          style={{ padding: '5px 8px' }}
                          title="Edit Widget Jam"
                        >
                          <Edit size={14} />
                        </Link>
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
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>

      {/* Modal Preview Live Clock */}
      {previewItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '680px',
              backgroundColor: '#0f172a',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px', backgroundColor: 'rgba(30, 41, 59, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#38bdf8" />
                <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#ffffff' }}>
                  Pratinjau Widget: {previewItem.name}
                </span>
              </div>
              <button onClick={() => setPreviewItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {/* Stage */}
            <div style={{ padding: '40px 24px', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(() => {
                const weather = CITY_PRESETS[previewItem.city] || CITY_PRESETS['Makassar'];
                const hours = previewItem.is24Hour
                  ? String(time.getHours()).padStart(2, '0')
                  : String(time.getHours() % 12 || 12).padStart(2, '0');
                const minutes = String(time.getMinutes()).padStart(2, '0');
                const seconds = String(time.getSeconds()).padStart(2, '0');
                const ampm = time.getHours() >= 12 ? 'PM' : 'AM';

                const formattedDate = time.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });

                return (
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '440px',
                      borderRadius: '24px',
                      padding: '28px',
                      background:
                        previewItem.theme === 'glass'
                          ? 'rgba(30, 41, 59, 0.7)'
                          : previewItem.theme === 'emerald'
                          ? 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'
                          : previewItem.theme === 'gold'
                          ? 'linear-gradient(135deg, #78350f 0%, #451a03 100%)'
                          : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(12px)',
                      color: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 700, color: '#93c5fd' }}>
                        <MapPin size={16} />
                        <span>{weather.city}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#fbbf24', fontWeight: 600 }}>
                        <CloudSun size={18} />
                        <span>{weather.condition}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '3.75rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
                        {hours}:{minutes}
                      </span>
                      {previewItem.showSeconds && (
                        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#94a3b8' }}>
                          :{seconds}
                        </span>
                      )}
                      {!previewItem.is24Hour && (
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', marginLeft: '4px' }}>
                          {ampm}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '20px' }}>
                      <Calendar size={14} color="#94a3b8" />
                      <span>{formattedDate}</span>
                    </div>

                    <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                        {weather.temp}°C
                      </div>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Droplets size={12} color="#38bdf8" />
                          <span>{weather.humidity}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Wind size={12} color="#34d399" />
                          <span>{weather.windSpeed} km/h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
