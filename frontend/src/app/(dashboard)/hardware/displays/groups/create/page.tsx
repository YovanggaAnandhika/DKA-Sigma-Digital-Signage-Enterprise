'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/services';
import { ArrowLeft, Save, MonitorPlay } from 'lucide-react';

export default function CreateDisplayGroupPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createDisplayGroup({
        name: formData.name,
        description: formData.description,
      });
      router.push('/hardware/displays/groups');
    } catch (err: any) {
      alert(err.message || 'Gagal membuat grup layar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link
          href="/hardware/displays/groups"
          className="btn btn-outline"
          style={{
            width: '42px',
            minWidth: '42px',
            height: '42px',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
          }}
          aria-label="Kembali ke Grup Layar"
          title="Kembali ke Grup Layar"
        >
          <ArrowLeft size={18} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '14px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MonitorPlay size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
              Tambah Grup Layar Baru
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
              Buat kelompok layar untuk kemudahan manajemen distribusi konten massal.
            </p>
          </div>
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '24px', width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Grup Layar *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder="Contoh: Jabodetabek Area"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Deskripsi (Opsional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input"
              placeholder="Grup untuk mengontrol semua display di cabang Jabodetabek..."
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Link href="/hardware/displays/groups" className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" disabled={saving || !formData.name} className="btn btn-primary">
              <Save size={14} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Grup Layar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
