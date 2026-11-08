'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Clock, Plus, Search, Eye, Edit, Trash2, X, CloudSun, Calendar, MapPin, Droplets, Wind, RefreshCw } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { modal } from '@/components/ui/ModalDialog';
import { ClockWeatherConfig, CITY_PRESETS } from './types';
import { getClocks, deleteClock } from '@/lib/services/studio/clock.service';

export default function ClockPage() {
  const [items, setItems] = useState<ClockWeatherConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [previewItem, setPreviewItem] = useState<ClockWeatherConfig | null>(null);
  const [time, setTime] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClocks();
      setItems(data);
    } catch (err) {
      console.error('Failed to load clocks', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDelete = async (id: string, name: string) => {
    const ok = await modal.confirm({
      title: 'Hapus Widget Jam & Cuaca',
      message: `Apakah Anda yakin ingin menghapus widget jam & cuaca "${name}"? Tindakan ini akan menghapusnya dari database.`,
      variant: 'danger',
      confirmText: 'Hapus Widget',
    });
    if (!ok) return;

    try {
      await deleteClock(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      await modal.alert({
        title: 'Gagal Menghapus',
        message: err?.message || 'Terjadi kesalahan saat menghapus widget jam.',
        variant: 'danger',
      });
    }
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
            Widget Jam Digital & Cuaca
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Kelola tampilan jam digital real-time dan prakiraan cuaca otomatis untuk zona layar signage.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={loadData}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
            title="Muat ulang dari server"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link href="/studio/components/clock/create" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
            <Plus size={16} />
            <span>Tambah Widget Baru</span>
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
                <th>Nama Komponen</th>
                <th>Lokasi Kota</th>
                <th>Format Jam</th>
                <th>Detik</th>
                <th>Tema Tampilan</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <div>Memuat widget jam dari database...</div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} style={{ color: 'var(--primary-400)' }} />
                        <span>{item.city}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-surface-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {item.is24Hour ? '24 Jam' : '12 Jam (AM/PM)'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: item.showSeconds ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                        {item.showSeconds ? 'Aktif' : 'Tersembunyi'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          color: 'var(--primary-400)',
                          textTransform: 'capitalize',
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
                          title="Edit Widget"
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

      {/* Modal Preview Widget */}
      {previewItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(6px)',
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
              maxWidth: '520px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--primary-400)" />
                <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  Pratinjau Widget: {previewItem.name}
                </span>
              </div>
              <button onClick={() => setPreviewItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Widget Stage */}
            <div style={{ padding: '32px 24px', backgroundColor: 'var(--bg-primary)', display: 'flex', justifyContent: 'center' }}>
              {(() => {
                const weather = CITY_PRESETS[previewItem.city] || CITY_PRESETS.Makassar;
                const hours = previewItem.is24Hour
                  ? time.getHours().toString().padStart(2, '0')
                  : ((time.getHours() % 12) || 12).toString().padStart(2, '0');
                const minutes = time.getMinutes().toString().padStart(2, '0');
                const seconds = time.getSeconds().toString().padStart(2, '0');
                const ampm = time.getHours() >= 12 ? 'PM' : 'AM';

                return (
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '380px',
                      padding: '24px',
                      borderRadius: '16px',
                      background: previewItem.theme === 'glass' ? 'rgba(30, 41, 59, 0.7)' : previewItem.theme === 'emerald' ? 'linear-gradient(135deg, #064e3b, #022c22)' : 'linear-gradient(135deg, #1e1b4b, #0f172a)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', opacity: 0.9 }}>
                        <MapPin size={14} />
                        <span>{previewItem.city}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', opacity: 0.9 }}>
                        <Calendar size={14} />
                        <span>{time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                        {hours}:{minutes}
                      </span>
                      {previewItem.showSeconds && (
                        <span style={{ fontSize: '1.25rem', fontWeight: 600, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>
                          :{seconds}
                        </span>
                      )}
                      {!previewItem.is24Hour && (
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, marginLeft: '6px', opacity: 0.8 }}>
                          {ampm}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CloudSun size={24} style={{ color: '#f59e0b' }} />
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 700 }}>{weather.temp}°C</div>
                          <div style={{ fontSize: '0.6875rem', opacity: 0.8 }}>{weather.condition}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.6875rem', opacity: 0.8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Droplets size={12} />
                          <span>{weather.humidity}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Wind size={12} />
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
