'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/services';
import { ArrowLeft, Save } from 'lucide-react';

export default function CreateOrientasiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!formData.name.trim()) throw new Error('Nama orientasi wajib diisi');
      if (!formData.value.trim()) throw new Error('Kode sistem (value) wajib diisi');

      await api.createOrientation({
        name: formData.name,
        value: formData.value.toLowerCase().replace(/\s+/g, '_'),
      });

      router.push('/studio/layouts/orientasi');
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan orientasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/studio/layouts/orientasi" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
            Tambah Master Orientasi
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
            Definisikan orientasi layar fisik baru yang didukung oleh player client.
          </p>
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '24px', width: '100%', maxWidth: '640px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Orientasi <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({
                  name: val,
                  value: formData.value ? formData.value : val.toLowerCase().replace(/\s+/g, '_'),
                });
              }}
              placeholder="Contoh: Landscape Inverted, Square Banner"
              className="form-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Kode Sistem (Value) <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="Contoh: landscape_inverted, square_banner"
              className="form-input"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Digunakan oleh sistem player client untuk mengenali konfigurasi rotasi display.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Link href="/studio/layouts/orientasi" className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Save size={14} />
              <span>{loading ? 'Menyimpan...' : 'Simpan Master Orientasi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
