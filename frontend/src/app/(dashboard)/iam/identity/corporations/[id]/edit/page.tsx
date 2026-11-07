'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Building2, Trash2, RefreshCw } from 'lucide-react';
import { api, Corporation } from '@/lib/services';
import { modal } from '@/components/ui/ModalDialog';

export default function EditCorporationPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [corp, setCorp] = useState<Corporation | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    activeUntil: '',
    maxScreens: 10,
    maxBranches: 5,
    subscriptionTier: 'standard',
    isActive: true,
  });

  useEffect(() => {
    const fetchCorp = async () => {
      try {
        setLoading(true);
        const data = await api.getCorporation(params.id);
        setCorp(data);

        let activeUntilStr = '';
        if (data.activeUntil) {
          try {
            const d = new Date(data.activeUntil);
            activeUntilStr = d.toISOString().slice(0, 16);
          } catch (_) {}
        }

        setFormData({
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          activeUntil: activeUntilStr,
          maxScreens: data.maxScreens || 10,
          maxBranches: data.maxBranches || 5,
          subscriptionTier: data.subscriptionTier || 'standard',
          isActive: data.isActive,
        });
      } catch (err: any) {
        alert(err.message || 'Gagal memuat data perusahaan');
        router.push('/iam/identity');
      } finally {
        setLoading(false);
      }
    };
    fetchCorp();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Nama perusahaan wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      const activeUntilIso = formData.activeUntil
        ? new Date(formData.activeUntil).toISOString()
        : undefined;

      await api.updateCorporation({
        id: params.id,
        name: formData.name,
        description: formData.description,
        activeUntil: activeUntilIso,
        maxScreens: Number(formData.maxScreens),
        maxBranches: Number(formData.maxBranches),
        subscriptionTier: formData.subscriptionTier,
        isActive: formData.isActive,
      });

      router.push(`/iam/identity/corporations/${params.id}`);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui data perusahaan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!corp) return;
    if (corp.slug === 'default-corp') {
      alert('Korporasi default utama dilindungi dan tidak dapat dihapus.');
      return;
    }

    const confirmed = await modal.confirm({
      title: 'Hapus Perusahaan?',
      message: `Apakah Anda yakin ingin menghapus "${corp.name}"? Semua cabang dan display di dalamnya akan terhapus permanen.`,
      variant: 'danger',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
    });
    if (!confirmed) return;

    try {
      setSaving(true);
      await api.deleteCorporation(params.id);
      router.push('/iam/identity');
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus perusahaan');
      setSaving(false);
    }
  };

  if (loading || !corp) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data perusahaan...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Bar with Circular Icon-Only Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link
          href={`/iam/identity/corporations/${params.id}`}
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
          aria-label="Kembali ke Detail Perusahaan"
          title="Kembali ke Detail Perusahaan"
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
            <Building2 size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Edit Perusahaan
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Perbarui konfigurasi lisensi, kuota layar & cabang untuk {corp.name}.
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="card-elevated" style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Nama Perusahaan <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Slug Sistem (Terkunci)
              </label>
              <input
                type="text"
                disabled
                value={formData.slug}
                className="form-input"
                style={{ opacity: 0.65, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Deskripsi Singkat
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Maksimal Layar Display
              </label>
              <input
                type="number"
                min={1}
                value={formData.maxScreens}
                onChange={(e) => setFormData({ ...formData, maxScreens: parseInt(e.target.value) || 1 })}
                className="form-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Maksimal Cabang
              </label>
              <input
                type="number"
                min={1}
                value={formData.maxBranches}
                onChange={(e) => setFormData({ ...formData, maxBranches: parseInt(e.target.value) || 1 })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Masa Aktif Lisensi
              </label>
              <input
                type="datetime-local"
                value={formData.activeUntil}
                onChange={(e) => setFormData({ ...formData, activeUntil: e.target.value })}
                className="form-input"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Kosongkan untuk lisensi permanen tanpa batas waktu.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Paket Berlangganan
              </label>
              <select
                value={formData.subscriptionTier}
                onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value })}
                className="form-input"
              >
                <option value="standard">Standard</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <input
              type="checkbox"
              id="corpIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-500)', cursor: 'pointer' }}
            />
            <label htmlFor="corpIsActive" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
              Status Akun Perusahaan Aktif
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            {corp.slug !== 'default-corp' ? (
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-secondary"
                style={{ color: 'var(--accent-rose)' }}
              >
                <Trash2 size={16} />
                <span>Hapus Perusahaan</span>
              </button>
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href={`/iam/identity/corporations/${params.id}`} className="btn btn-secondary">
                Batal
              </Link>
              <button type="submit" disabled={saving} className="btn btn-primary">
                <Save size={16} />
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

