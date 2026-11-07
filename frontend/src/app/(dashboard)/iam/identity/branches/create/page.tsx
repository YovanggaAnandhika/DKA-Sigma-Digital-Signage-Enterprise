'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Store } from 'lucide-react';
import { api, Corporation } from '@/lib/services';

export default function CreateBranchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCorpId = searchParams.get('corporationId') || '';

  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    corporationId: preselectedCorpId,
    name: '',
    code: '',
    address: '',
  });

  useEffect(() => {
    const fetchCorps = async () => {
      try {
        const res = await api.getCorporations();
        setCorporations(res.data);
        if (!formData.corporationId && res.data.length > 0) {
          setFormData((prev) => ({ ...prev, corporationId: res.data[0].id }));
        }
      } catch (err) {
        console.error('Failed to load corporations for branch creation:', err);
      }
    };
    fetchCorps();
  }, [formData.corporationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.corporationId || !formData.name || !formData.code) {
      alert('Perusahaan induk, nama cabang, dan kode cabang wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      await api.createBranch({
        corporationId: formData.corporationId,
        name: formData.name,
        code: formData.code.toUpperCase().trim(),
        address: formData.address || undefined,
      });

      router.push('/iam/identity');
    } catch (err: any) {
      alert(err.message || 'Gagal membuat cabang');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Bar with Circular Icon-Only Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link
          href="/iam/identity"
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
          aria-label="Kembali ke Identitas"
          title="Kembali ke Identitas"
        >
          <ArrowLeft size={18} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Store size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Tambah Cabang Baru
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Daftarkan cabang lokasi atau gerai outlet baru di bawah perusahaan yang dipilih.
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="card-elevated" style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Perusahaan Induk <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <select
              required
              value={formData.corporationId}
              onChange={(e) => setFormData({ ...formData, corporationId: e.target.value })}
              className="form-input"
            >
              <option value="">Pilih Perusahaan</option>
              {corporations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Kode Cabang <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().trim() })}
                placeholder="HQ / JKT-01"
                className="form-input"
                style={{ fontFamily: 'monospace', fontWeight: 700 }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Kode unik dalam korporasi.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Nama Cabang <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Kantor Pusat (HQ) / Cabang Sudirman"
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Alamat Lengkap / Keterangan Lokasi
            </label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Gedung, lantai, nomor unit, atau kota..."
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Link href="/iam/identity" className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save size={16} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Cabang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

