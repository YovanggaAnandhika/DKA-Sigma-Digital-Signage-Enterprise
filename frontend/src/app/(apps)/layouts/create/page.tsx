'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/services';
import { ArrowLeft, Save, Palette } from 'lucide-react';

export default function CreateLayoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [preset, setPreset] = useState<'1080p_land' | '1080p_port' | '4k_land'>('1080p_land');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let width = 1920;
      let height = 1080;
      let orientation = 'landscape';

      if (preset === '1080p_port') {
        width = 1080;
        height = 1920;
        orientation = 'portrait';
      } else if (preset === '4k_land') {
        width = 3840;
        height = 2160;
        orientation = 'landscape';
      }

      const layout = await api.createLayout({
        name,
        canvas_width: width,
        canvas_height: height,
        orientation,
      });

      router.push(`/layouts/${layout.id}/edit`);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat layout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/layouts" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Buat Template Layout Baru
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Tentukan nama dan dimensi kanvas untuk membuka Visual Canvas Designer.
          </p>
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '24px', width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
            <select
              value={preset}
              onChange={(e: any) => setPreset(e.target.value)}
              className="form-select"
            >
              <option value="1080p_land">1920 × 1080 px (Landscape FHD)</option>
              <option value="1080p_port">1080 × 1920 px (Portrait / Totem FHD)</option>
              <option value="4k_land">3840 × 2160 px (Landscape 4K UHD)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Link href="/layouts" className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Save size={14} />
              <span>{loading ? 'Menyimpan ke gRPC...' : 'Buka Visual Designer →'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
