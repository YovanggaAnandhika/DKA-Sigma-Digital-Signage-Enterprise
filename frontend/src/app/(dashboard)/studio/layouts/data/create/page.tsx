'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/services';
import type { Resolution } from '@/lib/services';
import { ArrowLeft, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { SingleSelect } from '@/components/ui/SingleSelect';

export default function CreateLayoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [name, setName] = useState('');
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [selectedResolution, setSelectedResolution] = useState<string>('');

  useEffect(() => {
    api.getResolutions().then((items) => {
      setResolutions(items);
      if (items.length > 0) {
        setSelectedResolution(`${items[0].width}x${items[0].height}`);
      }
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      setLoading(true);
      const [width, height] = (selectedResolution || '').split('x').map(Number);
      if (!width || !height) {
        throw new Error('Pilih resolusi terlebih dahulu');
      }

      const layout = await api.createLayout({
        name: name.trim(),
        canvasWidth: width,
        canvasHeight: height,
      });

      router.push(`/studio/layouts/data/${layout.id}/edit`);
    } catch (err: any) {
      const msg = err.message ? err.message.replace(/^\d+\s+[A-Z_]+:\s*/, '') : 'Gagal membuat template layout';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const resolutionOptions = React.useMemo(() => {
    return resolutions.map((r) => ({
      value: `${r.width}x${r.height}`,
      label: r.name,
      hint: `${r.width} × ${r.height} (${r.aspectRatio})`,
    }));
  }, [resolutions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/studio/layouts/data" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
            Buat Template Layout Baru
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
            Tentukan nama dan dimensi kanvas untuk membuka Visual Canvas Designer.
          </p>
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '28px', width: '100%' }}>
        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--accent-rose)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Template Layout <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Supermarket Promo Dual-Zone 1080p"
              className="form-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Preset Resolusi Kanvas
            </label>
            <SingleSelect
              value={selectedResolution}
              onChange={(val) => setSelectedResolution(val)}
              options={resolutionOptions}
              placeholder="Pilih Resolusi Kanvas..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <Link href="/studio/layouts/data" className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{loading ? 'Menyimpan ke server...' : 'Buka Visual Designer →'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
