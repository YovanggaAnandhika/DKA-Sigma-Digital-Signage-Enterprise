'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Store, Trash2, RefreshCw } from 'lucide-react';
import { api, Branch } from '@/lib/services';
import { modal } from '@/components/ui/ModalDialog';

export default function EditBranchPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branch, setBranch] = useState<Branch | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    isActive: true,
  });

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        setLoading(true);
        const data = await api.getBranch(params.id);
        setBranch(data);
        setFormData({
          name: data.name,
          code: data.code,
          address: data.address || '',
          isActive: data.isActive,
        });
      } catch (err: any) {
        alert(err.message || 'Gagal memuat cabang');
        router.push('/iam/identity');
      } finally {
        setLoading(false);
      }
    };
    fetchBranch();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      alert('Nama dan kode cabang wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      await api.updateBranch({
        id: params.id,
        name: formData.name,
        code: formData.code.toUpperCase().trim(),
        address: formData.address || undefined,
        isActive: formData.isActive,
      });

      router.push(`/iam/identity/branches/${params.id}`);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui cabang');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!branch) return;
    const confirmed = await modal.confirm({
      title: 'Hapus Cabang?',
      message: `Hapus cabang "${branch.name}" (${branch.code})?`,
      variant: 'danger',
      confirmText: 'Hapus',
      cancelText: 'Batal',
    });
    if (!confirmed) return;

    try {
      setSaving(true);
      await api.deleteBranch(params.id);
      router.push('/iam/identity');
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus cabang');
      setSaving(false);
    }
  };

  if (loading || !branch) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data cabang...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Bar with Circular Icon-Only Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link
          href={`/iam/identity/branches/${params.id}`}
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
          aria-label="Kembali ke Detail Cabang"
          title="Kembali ke Detail Cabang"
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
              Edit Cabang
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Perbarui informasi kode, nama, atau alamat cabang {branch.name}.
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="card-elevated" style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                className="form-input"
                style={{ fontFamily: 'monospace', fontWeight: 700 }}
              />
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
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Alamat Lengkap / Lokasi
            </label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <input
              type="checkbox"
              id="branchIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-500)', cursor: 'pointer' }}
            />
            <label htmlFor="branchIsActive" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
              Status Cabang Aktif Beroperasi
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-secondary"
              style={{ color: 'var(--accent-rose)' }}
            >
              <Trash2 size={16} />
              <span>Hapus Cabang</span>
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href={`/iam/identity/branches/${params.id}`} className="btn btn-secondary">
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

