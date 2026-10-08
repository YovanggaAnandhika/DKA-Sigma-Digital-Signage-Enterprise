'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe, Plus, Search, RefreshCw, Eye, Edit, Trash2, ExternalLink, X, Shield, Clock } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { WebViewConfig, WEBVIEW_STORAGE_KEY, DEFAULT_WEBVIEWS } from './types';

export default function WebViewPage() {
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
      } else {
        localStorage.setItem(WEBVIEW_STORAGE_KEY, JSON.stringify(DEFAULT_WEBVIEWS));
      }
    } catch {}
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Hapus konfigurasi web view "${name}"?`)) return;
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    try {
      localStorage.setItem(WEBVIEW_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.url.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Komponen Web View
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Tampilkan situs web, dashboard analitik, atau katalog digital interaktif dengan auto-refresh otomatis.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/studio/components/webview/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Tambah Web View Baru</span>
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
            placeholder="Cari web view berdasarkan nama atau URL situs..."
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
                <th>Alamat Web (URL)</th>
                <th>Auto-Refresh</th>
                <th>Zoom Skala</th>
                <th>Bypass Cache</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Tidak ada web view yang ditemukan. Klik tombol Tambah untuk membuat baru.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link href={`/studio/components/webview/${item.id}/edit`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {item.name}
                      </Link>
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
                        {item.bypassCache ? 'Bypass Aktif' : 'Cache Standar'}
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
                        <Link
                          href={`/studio/components/webview/${item.id}/edit`}
                          className="btn btn-secondary"
                          style={{ padding: '5px 8px' }}
                          title="Edit Web View"
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

      {/* Modal Preview Live */}
      {previewItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
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
              maxWidth: '1000px',
              height: '80vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} color="var(--primary-400)" />
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  Pratinjau: {previewItem.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({previewItem.url})</span>
              </div>
              <button onClick={() => setPreviewItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, backgroundColor: '#000000', position: 'relative', overflow: 'hidden' }}>
              <iframe
                src={previewItem.url}
                title={previewItem.name}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  transform: `scale(${previewItem.zoomScale / 100})`,
                  transformOrigin: 'top left',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
