'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Globe, Check, Shield, RefreshCw } from 'lucide-react';
import { WEBVIEW_STORAGE_KEY, DEFAULT_WEBVIEWS, WebViewConfig } from '../../tabs/WebViewManagerTab';

export default function CreateWebViewPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState(60);
  const [zoom, setZoom] = useState(100);
  const [bypassCache, setBypassCache] = useState(true);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [previewKey, setPreviewKey] = useState(Date.now());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    const newConfig: WebViewConfig = {
      id: `wv-${Date.now()}`,
      name: name.trim() || 'Halaman Web Tanpa Nama',
      url: validUrl,
      refreshIntervalSeconds: interval,
      zoomScale: zoom,
      bypassCache,
      orientation,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      const stored = localStorage.getItem(WEBVIEW_STORAGE_KEY);
      const existing: WebViewConfig[] = stored ? JSON.parse(stored) : DEFAULT_WEBVIEWS;
      const updated = [newConfig, ...existing];
      localStorage.setItem(WEBVIEW_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    router.push('/studio/components?tab=webview');
  };

  const previewUrl = url.trim()
    ? url.startsWith('http')
      ? url
      : `https://${url}`
    : 'https://example.com';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/studio/components?tab=webview" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Tambah Web View Baru
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Konfigurasikan URL situs web atau live dashboard untuk ditayangkan pada zona layout signage.
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
              placeholder="https://toko.com/katalog-promo"
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Auto-Refresh
              </label>
              <select
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="form-input"
              >
                <option value={0}>Nonaktif (Manual)</option>
                <option value={15}>15 Detik</option>
                <option value={30}>30 Detik</option>
                <option value={60}>1 Menit</option>
                <option value={300}>5 Menit</option>
                <option value={900}>15 Menit</option>
                <option value={3600}>1 Jam</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Skala Zoom
              </label>
              <select
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="form-input"
              >
                <option value={75}>75% (Kecil)</option>
                <option value={90}>90%</option>
                <option value={100}>100% (Normal)</option>
                <option value={110}>110%</option>
                <option value={125}>125%</option>
                <option value={150}>150% (Besar)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Orientasi Layar
            </label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as any)}
              className="form-input"
            >
              <option value="landscape">Landscape (16:9 Mendatar)</option>
              <option value="portrait">Portrait (9:16 Tegak)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Bypass Cache Saat Refresh
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                Memaksa unduh versi data web terbaru setiap interval reload
              </div>
            </div>
            <input
              type="checkbox"
              checked={bypassCache}
              onChange={(e) => setBypassCache(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <Link href="/studio/components?tab=webview" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Check size={16} />
              <span>Simpan Komponen</span>
            </button>
          </div>
        </form>

        {/* Live Preview Panel */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pratinjau Langsung: {previewUrl}
            </span>
            <button
              type="button"
              onClick={() => setPreviewKey(Date.now())}
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
            >
              <RefreshCw size={12} />
              <span>Uji Refresh</span>
            </button>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              height: orientation === 'portrait' ? '600px' : '460px',
              maxWidth: orientation === 'portrait' ? '360px' : '100%',
              margin: '0 auto',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#000',
              border: '2px solid var(--border-subtle)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <iframe
              key={previewKey}
              src={previewUrl}
              title="Preview Web View"
              style={{
                width: `${100 / (zoom / 100)}%`,
                height: `${100 / (zoom / 100)}%`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
                border: 'none',
                backgroundColor: '#fff',
              }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={14} style={{ color: 'var(--accent-emerald)' }} />
            <span>Situs akan dirender dengan sandbox aman di aplikasi Android player ritel.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
