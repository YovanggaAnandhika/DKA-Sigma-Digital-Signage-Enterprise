'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe, Plus, Search, RefreshCw, Eye, Trash2, ExternalLink, X, Shield, Clock } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

export interface WebViewConfig {
  id: string;
  name: string;
  url: string;
  refreshIntervalSeconds: number;
  zoomScale: number;
  bypassCache: boolean;
  orientation: 'landscape' | 'portrait';
  createdAt?: string;
}

export const WEBVIEW_STORAGE_KEY = 'dka_signage_webviews';

export const DEFAULT_WEBVIEWS: WebViewConfig[] = [
  {
    id: 'wv-1',
    name: 'Katalog Menu & Promo Kafe',
    url: 'https://en.wikipedia.org/wiki/Digital_signage',
    refreshIntervalSeconds: 60,
    zoomScale: 100,
    bypassCache: true,
    orientation: 'landscape',
    createdAt: '2026-10-08',
  },
  {
    id: 'wv-2',
    name: 'Live Dashboard Indikator Penjualan Toko',
    url: 'https://worldtimeapi.org',
    refreshIntervalSeconds: 30,
    zoomScale: 110,
    bypassCache: false,
    orientation: 'landscape',
    createdAt: '2026-10-08',
  },
];

export default function WebViewManagerTab() {
  const [items, setItems] = useState<WebViewConfig[]>(DEFAULT_WEBVIEWS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [previewItem, setPreviewItem] = useState<WebViewConfig | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WEBVIEW_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {}
  }, []);

  const saveItems = (updated: WebViewConfig[]) => {
    setItems(updated);
    try {
      localStorage.setItem(WEBVIEW_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Hapus konfigurasi Web View "${name}"?`)) return;
    const updated = items.filter((item) => item.id !== id);
    saveItems(updated);
  };

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.url.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Action & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Daftar Komponen Web View
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Kelola URL halaman web interaktif, live reporting, atau menu online dengan auto-refresh berkala.
          </p>
        </div>

        <Link href="/studio/components/webview/create" className="btn btn-primary">
          <Plus size={16} />
          <span>Tambah Web View Baru</span>
        </Link>
      </div>

      {/* Search Input */}
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
            placeholder="Cari web view berdasarkan nama atau URL..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Komponen</th>
                <th>Alamat Web (URL)</th>
                <th>Interval Auto-Refresh</th>
                <th>Skala Tampilan</th>
                <th>Mode Cache</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Belum ada konfigurasi Web View tersimpan. Klik "Tambah Web View Baru" untuk membuat.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Globe size={18} style={{ color: 'var(--primary-400)', flexShrink: 0 }} />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>{item.url}</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          color: 'var(--primary-400)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={10} />
                        {item.refreshIntervalSeconds > 0 ? `${item.refreshIntervalSeconds} Detik` : 'Manual (Off)'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {item.zoomScale}% Zoom
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: item.bypassCache ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                        {item.bypassCache ? 'Bypass Cache' : 'Cache Standar'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px' }}
                          title="Pratinjau Layar"
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

      {/* Interactive Preview Modal */}
      {previewItem && (
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
              maxWidth: '900px',
              height: '620px',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              borderRadius: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={20} style={{ color: 'var(--primary-400)' }} />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Pratinjau Web View: {previewItem.name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {previewItem.url} • Reload: {previewItem.refreshIntervalSeconds}s • Skala: {previewItem.zoomScale}%
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPreviewItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Simulated Frame */}
            <div style={{ flex: 1, backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
              <iframe
                src={previewItem.url}
                title={previewItem.name}
                style={{
                  width: `${100 / (previewItem.zoomScale / 100)}%`,
                  height: `${100 / (previewItem.zoomScale / 100)}%`,
                  transform: `scale(${previewItem.zoomScale / 100})`,
                  transformOrigin: 'top left',
                  border: 'none',
                  backgroundColor: '#fff',
                }}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
