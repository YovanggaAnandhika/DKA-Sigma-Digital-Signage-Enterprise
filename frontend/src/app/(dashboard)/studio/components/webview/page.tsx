'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Globe, Plus, Search, RefreshCw, Eye, Edit, Trash2, ExternalLink, X, Shield, Clock } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { WebViewConfig } from './types';
import { getWebviews, deleteWebview } from '@/lib/services/studio/webview.service';
import { modal } from '@/components/ui/ModalDialog';

export default function WebViewPage() {
  const [items, setItems] = useState<WebViewConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [previewItem, setPreviewItem] = useState<WebViewConfig | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWebviews();
      setItems(data);
    } catch (err) {
      console.error('Failed to load webviews', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    const ok = await modal.confirm({
      title: 'Hapus Web View',
      message: `Hapus konfigurasi web view "${name}"? Tindakan ini akan menghapusnya dari database.`,
      variant: 'danger',
      confirmText: 'Hapus',
    });
    if (!ok) return;

    try {
      await deleteWebview(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      await modal.alert({
        title: 'Gagal Menghapus',
        message: err?.message || 'Terjadi kesalahan saat menghapus data webview.',
        variant: 'danger',
      });
    }
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
            Integrasi URL situs web dan dashboard analitik dari backend server.
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
          <Link
            href="/studio/components/webview/create"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
          >
            <Plus size={16} />
            <span>Tambah Web View</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', height: '36px', fontSize: '0.8125rem', width: '100%' }}
            placeholder="Cari berdasarkan nama atau URL..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Grid Cards Web Views */}
      {loading ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '0.875rem' }}>Memuat daftar Web View dari database...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Globe size={40} style={{ margin: '0 auto 12px', color: 'var(--text-muted)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {search ? 'Tidak ada web view yang cocok' : 'Belum Ada Konfigurasi Web View'}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 16px' }}>
            {search
              ? 'Silakan gunakan kata kunci pencarian yang lain.'
              : 'Tambahkan URL web atau dashboard Anda untuk diintegrasikan ke zona signage.'}
          </p>
          {!search && (
            <Link href="/studio/components/webview/create" className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
              <Plus size={14} style={{ marginRight: '6px' }} />
              Tambah Web View Pertama
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {paginated.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '18px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-500)',
                      }}
                    >
                      <Globe size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {item.name}
                      </h4>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        ID: {item.id}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: item.orientation === 'portrait' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: item.orientation === 'portrait' ? 'rgb(168, 85, 247)' : 'rgb(16, 185, 129)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.orientation}
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    marginBottom: '12px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {item.url}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    <span>Refresh: {item.refreshIntervalSeconds}s</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={13} />
                    <span>Cache: {item.bypassCache ? 'Bypass' : 'Standar'}</span>
                  </div>
                  <div>
                    <span>Skala: {item.zoomScale}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="btn btn-outline"
                    style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Eye size={13} />
                    <span>Preview</span>
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline"
                    style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ExternalLink size={13} />
                    <span>Buka URL</span>
                  </a>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <Link
                    href={`/studio/components/webview/${item.id}/edit`}
                    className="btn btn-outline"
                    style={{ padding: '6px', color: 'var(--text-secondary)' }}
                    title="Edit Web View"
                  >
                    <Edit size={14} />
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="btn btn-outline"
                    style={{ padding: '6px', color: 'var(--accent-red)' }}
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > limit && (
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
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: previewItem.orientation === 'portrait' ? '450px' : '900px',
              height: '80vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-surface)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={16} style={{ color: 'var(--primary-500)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {previewItem.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({previewItem.orientation})</span>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="btn btn-outline"
                style={{ padding: '4px', border: 'none' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Iframe View */}
            <div style={{ flex: 1, position: 'relative', background: '#ffffff' }}>
              <iframe
                src={previewItem.url}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  transformOrigin: '0 0',
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                title={previewItem.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
