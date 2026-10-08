'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquareText, Plus, Search, Eye, Trash2, X, Sparkles } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

export interface TickerConfig {
  id: string;
  name: string;
  badge: string;
  messages: string[];
  speed: 'slow' | 'normal' | 'fast';
  theme: 'blue' | 'red' | 'dark' | 'emerald' | 'amber';
  fontSize: number;
  createdAt?: string;
}

export const TICKER_STORAGE_KEY = 'dka_signage_tickers';

export const THEME_STYLES: Record<string, { bg: string; text: string; badgeBg: string; badgeText: string }> = {
  blue: { bg: '#1e3a8a', text: '#ffffff', badgeBg: '#3b82f6', badgeText: '#ffffff' },
  red: { bg: '#991b1b', text: '#ffffff', badgeBg: '#ef4444', badgeText: '#ffffff' },
  dark: { bg: '#111827', text: '#f3f4f6', badgeBg: '#374151', badgeText: '#f9fafb' },
  emerald: { bg: '#065f46', text: '#ffffff', badgeBg: '#10b981', badgeText: '#ffffff' },
  amber: { bg: '#92400e', text: '#ffffff', badgeBg: '#f59e0b', badgeText: '#000000' },
};

export const SPEED_SECONDS: Record<string, number> = {
  slow: 25,
  normal: 15,
  fast: 8,
};

export const DEFAULT_TICKERS: TickerConfig[] = [
  {
    id: 't-1',
    name: 'Pengumuman Promo Kasir & Diskon Member',
    badge: 'PROMO HARI INI',
    messages: [
      'Dapatkan diskon 20% untuk semua produk segar buah & sayur setiap hari Jumat hingga Minggu!',
      'Gunakan kartu member DKASigma Point untuk mendapatkan poin ganda di seluruh kasir.',
    ],
    speed: 'normal',
    theme: 'blue',
    fontSize: 16,
    createdAt: '2026-10-08',
  },
  {
    id: 't-2',
    name: 'Flash Sale Akhir Pekan',
    badge: 'FLASH SALE',
    messages: [
      'Beli 2 Gratis 1 untuk aneka minuman dingin & es krim!',
      'Hanya berlaku sampai jam 21:00 malam ini selagi persediaan masih ada!',
    ],
    speed: 'fast',
    theme: 'red',
    fontSize: 18,
    createdAt: '2026-10-08',
  },
];

export default function TickerManagerTab() {
  const [tickers, setTickers] = useState<TickerConfig[]>(DEFAULT_TICKERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [previewTicker, setPreviewTicker] = useState<TickerConfig | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TICKER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTickers(parsed);
        }
      }
    } catch {}
  }, []);

  const saveTickers = (updated: TickerConfig[]) => {
    setTickers(updated);
    try {
      localStorage.setItem(TICKER_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Hapus teks berjalan "${name}"?`)) return;
    const updated = tickers.filter((t) => t.id !== id);
    saveTickers(updated);
  };

  const filtered = tickers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.badge.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Daftar Komponen Teks Berjalan (Running Text / Ticker)
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Kelola banner teks pengumuman bergerak di bagian header atau footer layar display ritel.
          </p>
        </div>

        <Link href="/studio/components/ticker/create" className="btn btn-primary">
          <Plus size={16} />
          <span>Tambah Teks Berjalan Baru</span>
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
            placeholder="Cari teks berjalan berdasarkan nama atau badge..."
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
                <th>Nama Komponen</th>
                <th>Label / Badge Awalan</th>
                <th>Cuplikan Pesan</th>
                <th>Kecepatan</th>
                <th>Tema Warna</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Belum ada teks berjalan tersimpan. Klik "Tambah Teks Berjalan Baru" untuk membuat.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageSquareText size={18} style={{ color: 'var(--primary-400)', flexShrink: 0 }} />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          backgroundColor: THEME_STYLES[item.theme]?.badgeBg || '#3b82f6',
                          color: THEME_STYLES[item.theme]?.badgeText || '#fff',
                        }}
                      >
                        {item.badge}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.messages.join(' • ')}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {item.speed === 'slow' ? 'Lambat (25s)' : item.speed === 'normal' ? 'Normal (15s)' : 'Cepat (8s)'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: THEME_STYLES[item.theme]?.bg }} />
                        <span style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{item.theme}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setPreviewTicker(item)}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px' }}
                          title="Pratinjau Marquee"
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

      {/* Marquee Preview Modal */}
      {previewTicker && (
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
          onClick={() => setPreviewTicker(null)}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '800px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Pratinjau Teks Berjalan: {previewTicker.name}
              </h3>
              <button
                onClick={() => setPreviewTicker(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                width: '100%',
                backgroundColor: THEME_STYLES[previewTicker.theme]?.bg,
                color: THEME_STYLES[previewTicker.theme]?.text,
                borderRadius: '10px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                height: '52px',
                position: 'relative',
              }}
            >
              {previewTicker.badge && (
                <div
                  style={{
                    backgroundColor: THEME_STYLES[previewTicker.theme]?.badgeBg,
                    color: THEME_STYLES[previewTicker.theme]?.badgeText,
                    padding: '0 16px',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    zIndex: 2,
                  }}
                >
                  {previewTicker.badge}
                </div>
              )}

              <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative' }}>
                <div
                  style={{
                    display: 'inline-block',
                    paddingLeft: '100%',
                    animation: `modalTickerScroll ${SPEED_SECONDS[previewTicker.speed]}s linear infinite`,
                    fontSize: `${previewTicker.fontSize}px`,
                    fontWeight: 600,
                  }}
                >
                  {previewTicker.messages.join('   •   ')}
                </div>
              </div>
            </div>

            <style jsx>{`
              @keyframes modalTickerScroll {
                0% {
                  transform: translateX(0);
                }
                100% {
                  transform: translateX(-100%);
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
