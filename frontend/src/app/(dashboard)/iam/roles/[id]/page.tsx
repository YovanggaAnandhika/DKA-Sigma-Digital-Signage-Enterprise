'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Role } from '@/lib/services';
import { ArrowLeft, Edit, ShieldCheck, RefreshCw, Key } from 'lucide-react';

export default function ViewRolePage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        setLoading(true);
        const data = await api.getRole(params.id);
        setRole(data);
      } catch (err: any) {
        alert(err.message || 'Gagal memuat role');
        router.push('/roles');
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [params.id, router]);

  if (loading || !role) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data role dari database gRPC...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/roles" className="btn btn-outline" style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {role.name}
              </h1>
              <span
                style={{
                  fontFamily: 'monospace',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {role.slug}
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {role.description || 'Tidak ada deskripsi'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href={`/iam/roles/${role.id}/edit`} className="btn btn-secondary">
            <Edit size={14} />
            <span>Edit Izin Role</span>
          </Link>
        </div>
      </div>

      {/* Permissions Matrix Panel */}
      <div className="card-elevated" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Daftar Hak Akses (Permissions) Terpasang ({role.permissionsList?.length || 0})
        </h3>

        {(!role.permissionsList || role.permissionsList.length === 0) ? (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Belum ada permission dialokasikan pada role ini.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
            {role.permissionsList.map((perm: any, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Key size={14} style={{ color: 'var(--primary-400)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {typeof perm === 'string' ? perm : (perm.code || perm.name || perm.id)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
