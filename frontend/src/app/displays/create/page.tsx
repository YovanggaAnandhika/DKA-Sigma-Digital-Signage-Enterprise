'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { ArrowLeft, Save, Tv, Link2 } from 'lucide-react';

export default function CreateDisplayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pairing_code: '',
    device_name: '',
    default_layout_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.pairDevice({
        pairing_code: formData.pairing_code.toUpperCase(),
        device_name: formData.device_name,
        default_layout_id: formData.default_layout_id || undefined,
      });
      router.push('/displays');
    } catch (err: any) {
      alert(err.message || 'Gagal melakukan pairing display player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/displays" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Daftarkan Layar Retail Baru
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Buat entitas display player di database untuk mendapatkan kode pairing 6-karakter.
          </p>
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '24px', maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px 16px', background: 'rgba(99,102,241,0.08)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)' }}>
          <Link2 size={16} color="var(--accent-purple)" />
          <p style={{ fontSize: '0.8125rem', color: 'var(--accent-purple)', lineHeight: 1.5 }}>
            Jalankan aplikasi Android di perangkat terlebih dahulu untuk mendapatkan <strong>Kode Pairing</strong>, lalu masukkan di sini.
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Kode Pairing dari Perangkat <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              required
              maxLength={10}
              value={formData.pairing_code}
              onChange={(e) => setFormData({ ...formData, pairing_code: e.target.value.toUpperCase() })}
              placeholder="Contoh: XR8-992"
              className="form-input"
              style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.1em' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Display / Lokasi Layar <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formData.device_name}
              onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
              placeholder="Contoh: Layar Kasir 01 (Grand Indonesia)"
              className="form-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              ID Layout Default (opsional)
            </label>
            <input
              type="text"
              value={formData.default_layout_id}
              onChange={(e) => setFormData({ ...formData, default_layout_id: e.target.value })}
              placeholder="UUID layout dari halaman Desain Layout"
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Link href="/displays" className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Save size={14} />
              <span>{loading ? 'Menghubungkan...' : 'Pair & Tambah Perangkat'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
