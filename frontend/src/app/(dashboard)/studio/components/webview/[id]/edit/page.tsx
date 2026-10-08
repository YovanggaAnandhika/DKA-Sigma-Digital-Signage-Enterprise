'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Globe, Check, Shield, RefreshCw, Save } from 'lucide-react';
import { WEBVIEW_STORAGE_KEY, DEFAULT_WEBVIEWS, WebViewConfig } from '../../types';

export default function EditWebViewPage() {
  const params = useParams() as { id: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState(60);
  const [zoom, setZoom] = useState(100);
  const [bypassCache, setBypassCache] = useState(true);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [previewKey, setPreviewKey] = useState(Date.now());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WEBVIEW_STORAGE_KEY);
      const items: WebViewConfig[] = stored ? JSON.parse(stored) : DEFAULT_WEBVIEWS;
      const found = items.find((i) => i.id === params.id);
      if (found) {
        setName(found.name);
        setUrl(found.url);
        setInterval(found.refreshIntervalSeconds);
        setZoom(found.zoomScale);
        setBypassCache(found.bypassCache);
        setOrientation(found.orientation || 'landscape');
      } else {
        alert('Data Web View tidak ditemukan.');
        router.push('/studio/components/webview');
      }
    } catch {
      router.push('/studio/components/webview');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    try {
      const stored = localStorage.getItem(WEBVIEW_STORAGE_KEY);
      const items: WebViewConfig[] = stored ? JSON.parse(stored) : DEFAULT_WEBVIEWS;
      const updated = items.map((i) =>
        i.id === params.id
          ? {
              ...i,
              name: name.trim() || 'Halaman Web Tanpa Nama',
              url: validUrl,
              refreshIntervalSeconds: interval,
              zoomScale: zoom,
              bypassCache,
              orientation,
            }
          : i
      );
      localStorage.setItem(WEBVIEW_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    router.push('/studio/components/webview');
  };

  const previewUrl = url.trim()
    ? url.startsWith('http')
      ? url
      : `https://${url}`
    : 'https://example.com';

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data Web View...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/studio/components/webview" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Edit Web View: {name || params.id}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Perbarui konfigurasi URL web, interval refresh otomatis, dan skala tampilan.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '24px' }}>
        {/* Form Panel */}
        <form onSubmit={handleSubmit} className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Parameter Web View
          </h2>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Komponen
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Katalog Promo Akhir Pekan"
              className="form-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Alamat Web (URL)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/promo"
              className="form-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Interval Auto-Refresh (Detik)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                min="0"
                step="5"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="form-input"
                style={{ width: '120px' }}
              />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {interval === 0 ? 'Off (Tidak otomatis refresh)' : `Refresh tiap ${interval} detik`}
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Skala Zoom Layar ({zoom}%)
            </label>
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Orientasi Layar
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`btn ${orientation === 'landscape' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                Landscape (16:9)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`btn ${orientation === 'portrait' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                Portrait (9:16)
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="bypassCache"
              checked={bypassCache}
              onChange={(e) => setBypassCache(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="bypassCache" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer' }}>
              Bypass Cache Browser saat refresh
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <Link href="/studio/components/webview" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Save size={16} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>

        {/* Live Interactive Preview */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="var(--primary-400)" /> Pratinjau Tampilan Web
            </h2>
            <button
              type="button"
              onClick={() => setPreviewKey(Date.now())}
              className="btn btn-outline"
              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
            >
              <RefreshCw size={12} /> Segarkan Frame
            </button>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: '440px',
              backgroundColor: '#0a0a0a',
              borderRadius: '12px',
              border: '2px solid var(--border-subtle)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {url.trim() ? (
              <iframe
                key={previewKey}
                src={previewUrl}
                title="Pratinjau Web View"
                style={{
                  width: orientation === 'portrait' ? '56.25%' : '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: '#ffffff',
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left',
                }}
              />
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                <Globe size={36} style={{ margin: '0 auto 8px auto', opacity: 0.3 }} />
                <p style={{ fontSize: '0.875rem' }}>Masukkan URL web untuk melihat pratinjau live.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
