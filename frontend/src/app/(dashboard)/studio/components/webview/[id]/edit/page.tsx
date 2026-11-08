'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Globe, Check, Shield, RefreshCw } from 'lucide-react';
import { getWebview, updateWebview } from '@/lib/services/studio/webview.service';
import { modal } from '@/components/ui/ModalDialog';

export default function EditWebViewPage() {
  const params = useParams() as { id: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState(60);
  const [zoom, setZoom] = useState(100);
  const [bypassCache, setBypassCache] = useState(true);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [previewKey, setPreviewKey] = useState(Date.now());

  useEffect(() => {
    let isMounted = true;
    getWebview(params.id)
      .then((found) => {
        if (!isMounted) return;
        setName(found.name);
        setUrl(found.url);
        setInterval(found.refreshIntervalSeconds);
        setZoom(found.zoomScale);
        setBypassCache(found.bypassCache);
        setOrientation(found.orientation || 'landscape');
      })
      .catch((err) => {
        if (!isMounted) return;
        alert(err?.message || 'Data Web View tidak ditemukan di database.');
        router.push('/studio/components/webview');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    setSubmitting(true);
    try {
      await updateWebview(params.id, {
        name: name.trim() || 'Halaman Web Tanpa Nama',
        url: validUrl,
        refreshIntervalSeconds: interval,
        zoomScale: zoom,
        bypassCache,
        orientation,
      });

      router.push('/studio/components/webview');
    } catch (err: any) {
      await modal.alert({
        title: 'Gagal Menyimpan',
        message: err?.message || 'Terjadi kesalahan saat menyimpan perubahan ke database.',
        variant: 'danger',
      });
      setSubmitting(false);
    }
  };

  const previewUrl = url.trim()
    ? url.startsWith('http')
      ? url
      : `https://${url}`
    : 'https://example.com';

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: '0.875rem' }}>Memuat data Web View dari database...</p>
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Ubah Konfigurasi Web View
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            ID: {params.id}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 1.2fr', gap: '24px' }}>
        {/* Form Settings */}
        <form onSubmit={handleSubmit} className="card" style={{ padding: '24px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 600 }}>
                Nama Konfigurasi
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="misal: Dashboard Metrik Toko"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', height: '38px', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 600 }}>
                Target URL
              </label>
              <div style={{ position: 'relative' }}>
                <Globe
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
                  placeholder="https://contoh-dashboard.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  style={{ width: '100%', height: '38px', paddingLeft: '36px', fontSize: '0.8125rem' }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Pastikan situs mengizinkan embedding (Header X-Frame-Options tidak DENY/SAMEORIGIN).
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 600 }}>
                  Interval Refresh (Detik)
                </label>
                <input
                  type="number"
                  min="0"
                  max="86400"
                  className="form-input"
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value))}
                  style={{ width: '100%', height: '38px', fontSize: '0.8125rem' }}
                />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>0 = Nonaktifkan auto-reload</span>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 600 }}>
                  Skala Zoom (%)
                </label>
                <input
                  type="number"
                  min="25"
                  max="200"
                  className="form-input"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ width: '100%', height: '38px', fontSize: '0.8125rem' }}
                />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Default: 100%</span>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 600 }}>
                Orientasi Layar Target
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`btn ${orientation === 'landscape' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, padding: '8px', fontSize: '0.8125rem' }}
                >
                  Landscape (16:9)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`btn ${orientation === 'portrait' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, padding: '8px', fontSize: '0.8125rem' }}
                >
                  Portrait (9:16)
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Bypass Browser Cache
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  Memaksa player memuat konten terbaru setiap interval refresh
                </div>
              </div>
              <input
                type="checkbox"
                checked={bypassCache}
                onChange={(e) => setBypassCache(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Link href="/studio/components/webview" className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
                Batal
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
              >
                <Check size={16} />
                <span>{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Live Simulator Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Pratinjau Simulator
            </span>
            <button
              onClick={() => setPreviewKey(Date.now())}
              className="btn btn-outline"
              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} />
              <span>Muat Ulang Iframe</span>
            </button>
          </div>

          <div
            className="card"
            style={{
              padding: '12px',
              background: '#0a0a0c',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '480px',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: orientation === 'portrait' ? '320px' : '100%',
                aspectRatio: orientation === 'portrait' ? '9/16' : '16/9',
                background: '#ffffff',
                borderRadius: '6px',
                overflow: 'hidden',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                position: 'relative',
              }}
            >
              {url.trim() ? (
                <iframe
                  key={previewKey}
                  src={previewUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: '0 0',
                  }}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  title="Preview"
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#64748b',
                    gap: '8px',
                  }}
                >
                  <Globe size={32} />
                  <span style={{ fontSize: '0.8125rem' }}>Masukkan URL untuk melihat simulasi</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
