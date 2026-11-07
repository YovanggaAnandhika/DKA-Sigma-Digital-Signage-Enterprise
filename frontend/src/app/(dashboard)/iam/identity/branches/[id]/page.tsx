'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Store,
  Building2,
  Edit,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MapPin,
  Calendar,
} from 'lucide-react';
import { api, Branch, Corporation } from '@/lib/services';

export default function ViewBranchPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [corp, setCorp] = useState<Corporation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const b = await api.getBranch(params.id);
        setBranch(b);
        try {
          const c = await api.getCorporation(b.corporationId);
          setCorp(c);
        } catch (_) {}
      } catch (err: any) {
        alert(err.message || 'Gagal memuat cabang');
        router.push('/iam/identity');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  if (loading || !branch) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data cabang...</span>
      </div>
    );
  }

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
              }}
            >
              <Store size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  {branch.name}
                </h1>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {branch.code}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Perusahaan Induk: {corp ? corp.name : branch.corporationId}
              </p>
            </div>
          </div>
        </div>

        <Link href={`/iam/identity/branches/${branch.id}/edit`} className="btn btn-primary">
          <Edit size={16} />
          <span>Edit Cabang</span>
        </Link>
      </div>

      {/* Info Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>
            <Building2 size={16} />
            <span>Perusahaan Induk</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {corp ? corp.name : branch.corporationId.slice(0, 8)}
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>
            <span>Status Cabang</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            {branch.isActive ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontSize: '0.95rem', fontWeight: 700 }}>
                <CheckCircle2 size={18} /> Aktif Beroperasi
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)', fontSize: '0.95rem', fontWeight: 700 }}>
                <XCircle size={18} /> Nonaktif
              </span>
            )}
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>
            <Calendar size={16} />
            <span>Terdaftar Sejak</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>
            {new Date(branch.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Address Details */}
      <div className="card-elevated" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <MapPin size={16} style={{ color: 'var(--primary-400)' }} />
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Alamat & Lokasi
          </h3>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
          {branch.address || 'Tidak ada data alamat yang dicantumkan.'}
        </p>
      </div>
    </div>
  );
}

