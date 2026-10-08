'use client';

import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, ExternalLink, Play, Pause, ZoomIn, Shield, Check, Plus, Trash2 } from 'lucide-react';

interface WebViewConfig {
  id: string;
  name: string;
  url: string;
  refreshIntervalSeconds: number;
  zoomScale: number;
  bypassCache: boolean;
  orientation: 'landscape' | 'portrait';
}

const STORAGE_KEY = 'dka_signage_webviews';

const DEFAULT_CONFIGS: WebViewConfig[] = [
  {
    id: 'wv-1',
    name: 'Katalog Menu & Promo Kafe',
    url: 'https://en.wikipedia.org/wiki/Digital_signage',
    refreshIntervalSeconds: 60,
    zoomScale: 100,
    bypassCache: true,
    orientation: 'landscape',
  },
  {
    id: 'wv-2',
    name: 'Live Dashboard Indikator Penjualan Toko',
    url: 'https://worldtimeapi.org',
    refreshIntervalSeconds: 30,
    zoomScale: 110,
    bypassCache: false,
    orientation: 'landscape',
  },
];

export default function WebViewManagerTab() {
  const [webViews, setWebViews] = useState<WebViewConfig[]>(DEFAULT_CONFIGS);
  const [selectedId, setSelectedId] = useState<string>('wv-1');
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formInterval, setFormInterval] = useState(60);
  const [formZoom, setFormZoom] = useState(100);
  const [formBypassCache, setFormBypassCache] = useState(true);
  const [formOrientation, setFormOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // Preview State
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [nextRefreshSec, setNextRefreshSec] = useState(60);
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(true);

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWebViews(parsed);
          setSelectedId(parsed[0].id);
        }
      }
    } catch {
      // fallback to defaults
    }
  }, []);

  const saveToStorage = (items: WebViewConfig[]) => {
    setWebViews(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  };

  const activeWebView = webViews.find((w) => w.id === selectedId) || webViews[0];

  useEffect(() => {
    if (activeWebView) {
      setFormName(activeWebView.name);
      setFormUrl(activeWebView.url);
      setFormInterval(activeWebView.refreshIntervalSeconds);
      setFormZoom(activeWebView.zoomScale);
      setFormBypassCache(activeWebView.bypassCache);
      setFormOrientation(activeWebView.orientation);
      setNextRefreshSec(activeWebView.refreshIntervalSeconds);
      setIframeKey(Date.now());
    }
  }, [activeWebView?.id]);

  // Auto-refresh countdown
  useEffect(() => {
    if (!isAutoRefreshActive || formInterval <= 0) return;

    const timer = setInterval(() => {
      setNextRefreshSec((prev) => {
        if (prev <= 1) {
          setIframeKey(Date.now());
          return formInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoRefreshActive, formInterval]);

  const handleManualRefresh = () => {
    setIframeKey(Date.now());
    setNextRefreshSec(formInterval);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUrl.trim()) return;

    let validUrl = formUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    const updated: WebViewConfig = {
      id: selectedId || `wv-${Date.now()}`,
      name: formName.trim() || 'Halaman Web Tanpa Nama',
      url: validUrl,
      refreshIntervalSeconds: formInterval,
      zoomScale: formZoom,
      bypassCache: formBypassCache,
      orientation: formOrientation,
    };

    const exists = webViews.some((w) => w.id === updated.id);
    const newItems = exists
      ? webViews.map((w) => (w.id === updated.id ? updated : w))
      : [...webViews, updated];

    saveToStorage(newItems);
    setSelectedId(updated.id);
    setIsEditing(false);
    handleManualRefresh();
  };

  const handleAddNew = () => {
    const newId = `wv-${Date.now()}`;
    const newConfig: WebViewConfig = {
      id: newId,
      name: 'Web View Baru',
      url: 'https://example.com',
      refreshIntervalSeconds: 60,
      zoomScale: 100,
      bypassCache: true,
      orientation: 'landscape',
    };
    const updated = [...webViews, newConfig];
    saveToStorage(updated);
    setSelectedId(newId);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (webViews.length <= 1) {
      alert('Minimal harus ada 1 konfigurasi Web View.');
      return;
    }
    if (!confirm('Hapus konfigurasi Web View ini?')) return;
    const filtered = webViews.filter((w) => w.id !== id);
    saveToStorage(filtered);
    setSelectedId(filtered[0].id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Komponen Web View (Auto-Refresh & Skala)
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Tampilkan URL website interaktif, live dashboard, atau katalog online dengan pembaruan otomatis berkala.
          </p>
        </div>

        <button onClick={handleAddNew} className="btn btn-primary">
          <Plus size={16} />
          <span>Tambah Web View Baru</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '24px' }}>
        {/* Left: Configuration Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Preset Selector */}
          <div className="card-elevated" style={{ padding: '16px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pilih Konfigurasi Tersimpan
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              {webViews.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: item.id === selectedId ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${item.id === selectedId ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <Globe size={16} style={{ color: item.id === selectedId ? 'var(--primary-400)' : 'var(--text-muted)', flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{item.refreshIntervalSeconds}s reload • {item.zoomScale}% zoom</div>
                    </div>
                  </div>
                  {webViews.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave} className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pengaturan Tampilan Web
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Nama Komponen
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Menu Makanan Hari Ini"
                className="form-input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Alamat Web (URL)
              </label>
              <input
                type="text"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://toko.com/katalog-promo"
                className="form-input"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Interval Auto-Refresh
                </label>
                <select
                  value={formInterval}
                  onChange={(e) => setFormInterval(Number(e.target.value))}
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
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Skala Zoom
                </label>
                <select
                  value={formZoom}
                  onChange={(e) => setFormZoom(Number(e.target.value))}
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Hapus Cache Saat Refresh
              </label>
              <input
                type="checkbox"
                checked={formBypassCache}
                onChange={(e) => setFormBypassCache(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
              <Check size={16} />
              <span>Simpan Konfigurasi Web</span>
            </button>
          </form>
        </div>

        {/* Right: Live Interactive Simulation Viewport */}
        <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Toolbar Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Simulasi Layar Display:
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeWebView?.url}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {formInterval > 0 && (
                <div
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: 'var(--primary-400)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  Reload dalam: {nextRefreshSec}s
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsAutoRefreshActive(!isAutoRefreshActive)}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                title={isAutoRefreshActive ? 'Jeda Auto-Refresh' : 'Mulai Auto-Refresh'}
              >
                {isAutoRefreshActive ? <Pause size={12} /> : <Play size={12} />}
                <span>{isAutoRefreshActive ? 'Jeda' : 'Aktifkan'}</span>
              </button>
              <button
                type="button"
                onClick={handleManualRefresh}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                title="Refresh Sekarang"
              >
                <RefreshCw size={12} />
                <span>Refresh Now</span>
              </button>
              <a
                href={activeWebView?.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                title="Buka di Tab Baru"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Browser Display Frame */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '520px',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#000',
              border: '2px solid var(--border-subtle)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <iframe
              key={iframeKey}
              src={activeWebView?.url}
              title={activeWebView?.name}
              style={{
                width: `${100 / (formZoom / 100)}%`,
                height: `${100 / (formZoom / 100)}%`,
                transform: `scale(${formZoom / 100})`,
                transformOrigin: 'top left',
                border: 'none',
                backgroundColor: '#fff',
              }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={14} style={{ color: 'var(--accent-emerald)' }} />
            <span>
              Sistem signage memuat halaman dengan sandbox isolasi untuk mencegah interupsi layar perangkat fisik Android.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
