'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Edit,
  ArrowRightLeft,
  Store,
  Monitor,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { api, Corporation, Branch } from '@/lib/services';
import { getStoredSession, UserSession } from '@/lib/auth';
import { modal } from '@/components/ui/ModalDialog';
import { useImpersonation } from '@/context/ImpersonationContext';

export default function ViewCorporationPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const { impersonatedCorp, startImpersonation, stopImpersonation } = useImpersonation();
  const [session, setSession] = useState<UserSession | null>(null);
  const [corp, setCorp] = useState<Corporation | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getStoredSession());
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [corpData, branchesData] = await Promise.all([
          api.getCorporation(params.id),
          api.getBranches({ corporationId: params.id }),
        ]);
        setCorp(corpData);
        setBranches(branchesData.data);
      } catch (err: any) {
        alert(err.message || 'Gagal memuat detail perusahaan');
        router.push('/iam/identity');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  const handleStartImpersonation = () => {
    if (!corp) return;
    startImpersonation({
      id: corp.id,
      name: corp.name,
      slug: corp.slug,
    });
    modal.alert({
      title: 'Mode Impersonasi Aktif',
      message: `Anda sekarang mengelola korporasi "${corp.name}". Seluruh data layout, device, dan antrian terfilter untuk korporasi ini.`,
      variant: 'success',
    });
  };

  if (loading || !corp) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data perusahaan...</span>
      </div>
    );
  }

  const isDefaultCorp = corp.slug === 'default-corp' || corp.id === '00000000-0000-0000-0000-000000000001';
  const isOwnCorp = isDefaultCorp || (session?.corporationId ? session.corporationId === corp.id : false);
  const isCurrentImpersonated = !isOwnCorp && impersonatedCorp?.id === corp.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
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
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--primary-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
              }}
            >
              {corp.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  {corp.name}
                </h1>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: 'var(--primary-400)',
                  }}
                >
                  {corp.subscriptionTier}
                </span>
                {isDefaultCorp && (
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Utama (HQ)
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Slug: {corp.slug}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isOwnCorp && (
            isCurrentImpersonated ? (
              <button
                onClick={() => {
                  stopImpersonation();
                  modal.alert({ title: 'Impersonasi Dihentikan', message: 'Kembali ke sesi default master.', variant: 'info' });
                }}
                className="btn btn-secondary"
                style={{ color: '#d97706', borderColor: 'rgba(245, 158, 11, 0.5)' }}
              >
                <ArrowRightLeft size={16} />
                <span>Hentikan Impersonasi</span>
              </button>
            ) : (
              <button onClick={handleStartImpersonation} className="btn btn-primary">
                <ArrowRightLeft size={16} />
                <span>Impersonasi Akun Ini</span>
              </button>
            )
          )}

          <Link href={`/iam/identity/corporations/${corp.id}/edit`} className="btn btn-secondary">
            <Edit size={16} />
            <span>Edit Perusahaan</span>
          </Link>
        </div>
      </div>

      {/* Info Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>
            <Monitor size={16} />
            <span>Kuota Layar Display</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {corp.maxScreens} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Layar</span>
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>
            <Store size={16} />
            <span>Kuota Cabang</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {branches.length} / {corp.maxBranches} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Cabang</span>
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>
            <Calendar size={16} />
            <span>Masa Aktif Lisensi</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {corp.activeUntil
              ? new Date(corp.activeUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Aktif Permanen'}
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>
            <span>Status Layanan</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            {corp.isActive ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontSize: '0.95rem', fontWeight: 700 }}>
                <CheckCircle2 size={18} /> Aktif Beroperasi
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)', fontSize: '0.95rem', fontWeight: 700 }}>
                <XCircle size={18} /> Ditangguhkan / Nonaktif
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {corp.description && (
        <div className="card-elevated" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Deskripsi Perusahaan
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {corp.description}
          </p>
        </div>
      )}

      {/* Branches of This Corporation */}
      <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Daftar Cabang ({branches.length})
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Cabang dan site lokasi di bawah naungan {corp.name}.
            </p>
          </div>
          <Link href={`/iam/identity/branches/create?corporationId=${corp.id}`} className="btn btn-primary" style={{ padding: '7px 14px', fontSize: '0.8125rem' }}>
            <Plus size={14} />
            <span>Tambah Cabang</span>
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px' }}>Kode</th>
                <th style={{ padding: '10px 14px' }}>Nama Cabang</th>
                <th style={{ padding: '10px 14px' }}>Alamat</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada cabang terdaftar untuk perusahaan ini.
                  </td>
                </tr>
              ) : (
                branches.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'monospace' }}>
                      {b.code}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {b.name}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {b.address || '-'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {b.isActive ? (
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '0.8125rem' }}>Aktif</span>
                      ) : (
                        <span style={{ color: 'var(--accent-rose)', fontWeight: 600, fontSize: '0.8125rem' }}>Nonaktif</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <Link href={`/iam/identity/branches/${b.id}`} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

