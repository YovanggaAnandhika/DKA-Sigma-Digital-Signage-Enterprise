'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/services';
import { ArrowLeft, Save, AlertCircle, RefreshCw } from 'lucide-react';

export default function CreateOrientasiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    value: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      setLoading(true);
      if (!formData.name.trim()) throw new Error('Nama orientasi wajib diisi');
      if (!formData.value.trim()) throw new Error('Kode sistem (value) wajib diisi');

      await api.createOrientation({
        name: formData.name.trim(),
        value: formData.value.toLowerCase().replace(/\s+/g, '_'),
      });

      router.push('/studio/layouts/orientasi');
    } catch (err: any) {
      const msg = err.message ? err.message.replace(/^\d+\s+[A-Z_]+:\s*/, '') : 'Gagal menambahkan orientasi';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <Link href="/studio/layouts/orientasi" className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{loading ? 'Menyimpan...' : 'Simpan Master Orientasi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
