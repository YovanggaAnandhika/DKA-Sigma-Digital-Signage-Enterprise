'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquareText, Plus, Search, Eye, Edit, Trash2, X, Sparkles } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { TickerConfig, TICKER_STORAGE_KEY, DEFAULT_TICKERS, THEME_STYLES } from './types';

const Marquee = 'marquee' as any;

export default function TickerPage() {
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
      } else {
        localStorage.setItem(TICKER_STORAGE_KEY, JSON.stringify(DEFAULT_TICKERS));
      }
    } catch { }
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Hapus komponen teks berjalan "${name}"?`)) return;
    const updated = tickers.filter((t) => t.id !== id);
    setTickers(updated);
    try {
      localStorage.setItem(TICKER_STORAGE_KEY, JSON.stringify(updated));
    } catch { }
  };

  const filtered = tickers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.badge.toLowerCase().includes(search.toLowerCase()) ||
      t.messages.some((m) => m.toLowerCase().includes(search.toLowerCase()))
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Komponen Teks Berjalan (Ticker)
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Banner pengumuman teks horizontal (marquee) dengan badge promo, pilihan palet warna ritel, dan pengaturan kecepatan.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/studio/components/ticker/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Tambah Teks Berjalan Baru</span>
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
            placeholder="Cari teks berjalan berdasarkan nama, badge, atau pesan teks..."
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
                <th>Badge Promo</th>
                <th>Isi Pesan Teks</th>
                <th>Kecepatan</th>
                <th>Tema Warna</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Belum ada teks berjalan tersimpan. Klik tombol Tambah untuk membuat baru.
                  </td>
                </tr>
              ) : (
                paginated.map((ticker) => {
                  const theme = THEME_STYLES[ticker.theme] || THEME_STYLES.blue;
                  return (
                    <tr key={ticker.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <Link href={`/studio/components/ticker/${ticker.id}/edit`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {ticker.name}
                        </Link>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            backgroundColor: theme.badgeBg,
                            color: theme.badgeText,
                          }}
                        >
                          {ticker.badge}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticker.messages.join(' • ')}
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
                          }}
                        >
                          {ticker.speed === 'slow' ? 'Lambat' : ticker.speed === 'fast' ? 'Cepat' : 'Sedang'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              backgroundColor: theme.bg,
                              border: '1px solid rgba(255,255,255,0.3)',
                            }}
                          />
                          <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                            {ticker.theme}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => setPreviewTicker(ticker)}
                            className="btn btn-outline"
                            style={{ padding: '5px 8px' }}
                            title="Pratinjau Marquee"
                          >
                            <Eye size={14} />
                          </button>
                          <Link
                            href={`/studio/components/ticker/${ticker.id}/edit`}
                            className="btn btn-secondary"
                            style={{ padding: '5px 8px' }}
                            title="Edit Teks Berjalan"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(ticker.id, ticker.name)}
                            className="btn btn-danger"
                            style={{ padding: '5px 8px' }}
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Modal Preview Banner Marquee */}
      {previewTicker && (
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
              maxWidth: '900px',
              backgroundColor: '#0f172a',
              borderRadius: '16px',
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
                <MessageSquareText size={18} color="#38bdf8" />
                <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#ffffff' }}>
                  Pratinjau Banner: {previewTicker.name}
                </span>
              </div>
              <button onClick={() => setPreviewTicker(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {/* Banner Marquee Stage */}
            <div style={{ padding: '40px 24px', backgroundColor: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {(() => {
                const theme = THEME_STYLES[previewTicker.theme] || THEME_STYLES.blue;
                return (
                  <div
                    style={{
                      width: '100%',
                      backgroundColor: theme.bg,
                      color: theme.text,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                      height: '56px',
                    }}
                  >
                    <div
                      style={{
                        padding: '0 16px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: theme.badgeBg,
                        color: theme.badgeText,
                        fontWeight: 900,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        zIndex: 2,
                      }}
                    >
                      {previewTicker.badge}
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden', padding: '0 12px' }}>
                      <Marquee
                        scrollamount={previewTicker.speed === 'fast' ? 12 : previewTicker.speed === 'slow' ? 4 : 7}
                        style={{ fontSize: `${previewTicker.fontSize || 16}px`, fontWeight: 600, display: 'flex', alignItems: 'center' }}
                      >
                        {previewTicker.messages.join(' ✦ ')}
                      </Marquee>
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
