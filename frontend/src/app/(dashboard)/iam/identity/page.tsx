'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Building,
  Store,
  ArrowRightLeft,
  ShieldAlert,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Monitor,
  Eye,
  Check,
} from 'lucide-react';
import {
  api,
  Corporation,
  Branch,
  ImpersonatedCorporation,
} from '@/lib/services';
import { getStoredSession, UserSession } from '@/lib/auth';
import { useImpersonation } from '@/context/ImpersonationContext';
import { modal } from '@/components/ui/ModalDialog';

export default function IdentityPage() {
  const [activeTab, setActiveTab] = useState<'corporations' | 'branches'>('corporations');
  const [session, setSession] = useState<UserSession | null>(null);
  const { impersonatedCorp, startImpersonation, stopImpersonation } = useImpersonation();

  // Corporations state
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [corpSearch, setCorpSearch] = useState('');
  const [loadingCorps, setLoadingCorps] = useState(true);

  // Branches state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchSearch, setBranchSearch] = useState('');
  const [selectedCorpFilter, setSelectedCorpFilter] = useState<string>('');
  const [loadingBranches, setLoadingBranches] = useState(true);

  useEffect(() => {
    setSession(getStoredSession());
  }, []);

  // Load Corporations
  const loadCorporations = useCallback(async () => {
    try {
      setLoadingCorps(true);
      const res = await api.getCorporations({ search: corpSearch });
      setCorporations(res.data);
    } catch (err: any) {
      console.error('Failed to load corporations:', err);
    } finally {
      setLoadingCorps(false);
    }
  }, [corpSearch]);

  // Load Branches
  const loadBranches = useCallback(async () => {
    try {
      setLoadingBranches(true);
      const res = await api.getBranches({
        corporationId: selectedCorpFilter || undefined,
        search: branchSearch,
      });
      setBranches(res.data);
    } catch (err: any) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  }, [selectedCorpFilter, branchSearch]);

  useEffect(() => {
    loadCorporations();
  }, [loadCorporations]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  // Handle Impersonation
  const handleStartImpersonation = (corp: Corporation) => {
    startImpersonation({
      id: corp.id,
      name: corp.name,
      slug: corp.slug,
    });
    modal.alert({
      title: 'Mode Impersonasi Aktif',
      message: `Anda sekarang mengelola korporasi "${corp.name}" (${corp.slug}). Seluruh data layout, device, dan antrian dibatasi pada korporasi ini.`,
      variant: 'success',
    });
  };

  const handleStopImpersonation = () => {
    stopImpersonation();
    modal.alert({
      title: 'Impersonasi Dihentikan',
      message: 'Anda telah kembali ke korporasi default master administrator.',
      variant: 'info',
    });
  };

  // Delete Corporation
  const handleDeleteCorp = async (corp: Corporation) => {
    if (corp.slug === 'default-corp') {
      alert('Korporasi default utama tidak dapat dihapus.');
      return;
    }
    const confirmed = await modal.confirm({
      title: 'Hapus Korporasi?',
      message: `Apakah Anda yakin ingin menghapus korporasi "${corp.name}"? Semua cabang, layar, dan data terkait akan terhapus secara permanen.`,
      variant: 'danger',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
    });
    if (!confirmed) return;

    try {
      await api.deleteCorporation(corp.id);
      loadCorporations();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus korporasi');
    }
  };

  // Delete Branch
  const handleDeleteBranch = async (branch: Branch) => {
    const confirmed = await modal.confirm({
      title: 'Hapus Cabang?',
      message: `Hapus cabang "${branch.name}" (${branch.code})?`,
      variant: 'danger',
      confirmText: 'Hapus',
      cancelText: 'Batal',
    });
    if (!confirmed) return;

    try {
      await api.deleteBranch(branch.id);
      loadBranches();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus cabang');
    }
  };

  // Helper formatting active until
  const formatActiveUntil = (dateStr?: string) => {
    if (!dateStr) return { label: 'Aktif Permanen', status: 'active' };
    try {
      const dt = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.ceil((dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const formatted = dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

      if (diffDays < 0) {
        return { label: `Expired (${formatted})`, status: 'expired' };
      } else if (diffDays <= 14) {
        return { label: `${diffDays} hari lagi (${formatted})`, status: 'warning' };
      } else {
        return { label: `s/d ${formatted}`, status: 'active' };
      }
    } catch {
      return { label: dateStr, status: 'active' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Identitas Organisasi & Cabang
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Multi-tenancy isolation, masa aktif lisensi, kuota layar & cabang, dan impersonasi korporasi.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              if (activeTab === 'corporations') loadCorporations();
              else loadBranches();
            }}
            className="btn btn-secondary"
            title="Segarkan data"
          >
            <RefreshCw size={14} className={(loadingCorps || loadingBranches) ? 'animate-spin' : ''} />
          </button>

          {activeTab === 'corporations' ? (
            <Link href="/iam/identity/corporations/create" className="btn btn-primary">
              <Plus size={16} />
              <span>Tambah Perusahaan</span>
            </Link>
          ) : (
            <Link href="/iam/identity/branches/create" className="btn btn-primary">
              <Plus size={16} />
              <span>Tambah Cabang</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '2px',
        }}
      >
        <button
          onClick={() => setActiveTab('corporations')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            fontWeight: 700,
            fontSize: '0.875rem',
            border: 'none',
            background: activeTab === 'corporations' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'corporations' ? 'var(--primary-400)' : 'var(--text-muted)',
            borderBottom: activeTab === 'corporations' ? '2px solid var(--primary-500)' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Building size={16} />
          <span>Perusahaan ({corporations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            fontWeight: 700,
            fontSize: '0.875rem',
            border: 'none',
            background: activeTab === 'branches' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'branches' ? 'var(--primary-400)' : 'var(--text-muted)',
            borderBottom: activeTab === 'branches' ? '2px solid var(--primary-500)' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Store size={16} />
          <span>Cabang ({branches.length})</span>
        </button>
      </div>

      {/* TAB 1: CORPORATIONS */}
      {activeTab === 'corporations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter Bar */}
          <div className="card-elevated" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={corpSearch}
                onChange={(e) => setCorpSearch(e.target.value)}
                placeholder="Cari perusahaan berdasarkan nama atau slug..."
                className="form-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="card-elevated" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '220px' }}>Perusahaan</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '150px' }}>Masa Aktif</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '200px' }}>Kuota Layar / Cabang</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '110px' }}>Tier</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '110px' }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right', minWidth: '250px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loadingCorps ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Memuat daftar perusahaan...
                    </td>
                  </tr>
                ) : corporations.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Tidak ada perusahaan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  corporations.map((corp) => {
                    const activeInfo = formatActiveUntil(corp.activeUntil);
                    const isOwnCorp =
                      corp.slug === 'default-corp' ||
                      corp.id === '00000000-0000-0000-0000-000000000001' ||
                      (session && (session as any).corporationId === corp.id);
                    const isCurrentImpersonated = !isOwnCorp && impersonatedCorp?.id === corp.id;

                    return (
                      <tr
                        key={corp.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: isCurrentImpersonated ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                backgroundColor: isCurrentImpersonated ? 'rgba(245, 158, 11, 0.2)' : 'rgba(37, 99, 235, 0.12)',
                                color: isCurrentImpersonated ? '#d97706' : 'var(--primary-400)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                flexShrink: 0,
                              }}
                            >
                              {corp.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <Link
                                href={`/iam/identity/corporations/${corp.id}`}
                                style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}
                                className="hover:underline"
                              >
                                {corp.name}
                              </Link>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{corp.slug}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor:
                                activeInfo.status === 'expired'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : activeInfo.status === 'warning'
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(16, 185, 129, 0.15)',
                              color:
                                activeInfo.status === 'expired'
                                  ? 'var(--accent-rose)'
                                  : activeInfo.status === 'warning'
                                  ? '#d97706'
                                  : 'var(--accent-emerald)',
                            }}
                          >
                            {activeInfo.label}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
                              <Monitor size={15} style={{ opacity: 0.7, color: 'var(--primary-400)' }} />
                              <b>{corp.maxScreens}</b> Layar
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
                              <Store size={15} style={{ opacity: 0.7, color: 'var(--accent-emerald)' }} />
                              <b>{corp.maxBranches}</b> Cabang
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
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
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          {corp.isActive ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontSize: '0.8125rem', fontWeight: 600 }}>
                              <CheckCircle2 size={15} /> Aktif
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)', fontSize: '0.8125rem', fontWeight: 600 }}>
                              <XCircle size={15} /> Nonaktif
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {/* Impersonation Button (Icon Only, hidden for own corporation) */}
                            {!isOwnCorp && (
                              isCurrentImpersonated ? (
                                <button
                                  onClick={handleStopImpersonation}
                                  className="btn btn-secondary"
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    padding: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '8px',
                                    color: '#d97706',
                                    borderColor: 'rgba(245, 158, 11, 0.5)',
                                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                  }}
                                  title={`Sedang mengimpersonasi ${corp.name}. Klik untuk berhenti.`}
                                  aria-label="Hentikan Impersonasi"
                                >
                                  <Check size={15} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStartImpersonation(corp)}
                                  className="btn btn-secondary"
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    padding: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '8px',
                                    color: 'var(--primary-400)',
                                    borderColor: 'rgba(59, 130, 246, 0.3)',
                                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                                  }}
                                  title={`Impersonasi ${corp.name}`}
                                  aria-label={`Impersonasi ${corp.name}`}
                                >
                                  <ArrowRightLeft size={15} />
                                </button>
                              )
                            )}

                            {/* View Detail Link */}
                            <Link
                              href={`/iam/identity/corporations/${corp.id}`}
                              className="btn btn-secondary"
                              style={{
                                width: '32px',
                                height: '32px',
                                padding: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                              }}
                              title="Lihat Detail Perusahaan"
                              aria-label="Lihat Detail Perusahaan"
                            >
                              <Eye size={15} />
                            </Link>

                            {/* Edit Page Link */}
                            <Link
                              href={`/iam/identity/corporations/${corp.id}/edit`}
                              className="btn btn-secondary"
                              style={{
                                width: '32px',
                                height: '32px',
                                padding: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                              }}
                              title="Edit Perusahaan"
                              aria-label="Edit Perusahaan"
                            >
                              <Edit size={15} />
                            </Link>

                            {/* Delete Button */}
                            {!isOwnCorp && (
                              <button
                                onClick={() => handleDeleteCorp(corp)}
                                className="btn btn-secondary"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  padding: 0,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '8px',
                                  color: 'var(--accent-rose)',
                                }}
                                title="Hapus Perusahaan"
                                aria-label="Hapus Perusahaan"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BRANCHES */}
      {activeTab === 'branches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter Bar */}
          <div className="card-elevated" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ width: '260px' }}>
              <select
                value={selectedCorpFilter}
                onChange={(e) => setSelectedCorpFilter(e.target.value)}
                className="form-input"
                style={{ height: '40px' }}
              >
                <option value="">Semua Perusahaan</option>
                {corporations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.slug})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                placeholder="Cari cabang berdasarkan nama atau kode..."
                className="form-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="card-elevated" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '130px' }}>Kode Cabang</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '200px' }}>Nama Cabang</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '180px' }}>Perusahaan Induk</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '200px' }}>Alamat</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '110px' }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right', minWidth: '150px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loadingBranches ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Memuat daftar cabang...
                    </td>
                  </tr>
                ) : branches.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Tidak ada cabang yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  branches.map((b) => {
                    const parentCorp = corporations.find((c) => c.id === b.corporationId);

                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {b.code}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                          <Link
                            href={`/iam/identity/branches/${b.id}`}
                            style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                            className="hover:underline"
                          >
                            {b.name}
                          </Link>
                        </td>

                        <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                          {parentCorp ? parentCorp.name : b.corporationId.slice(0, 8)}
                        </td>

                        <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          {b.address || '-'}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          {b.isActive ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontSize: '0.8125rem', fontWeight: 600 }}>
                              <CheckCircle2 size={15} /> Aktif
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)', fontSize: '0.8125rem', fontWeight: 600 }}>
                              <XCircle size={15} /> Nonaktif
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Link
                              href={`/iam/identity/branches/${b.id}`}
                              className="btn btn-secondary"
                              style={{
                                width: '32px',
                                height: '32px',
                                padding: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                              }}
                              title="Lihat Detail Cabang"
                              aria-label="Lihat Detail Cabang"
                            >
                              <Eye size={15} />
                            </Link>

                            <Link
                              href={`/iam/identity/branches/${b.id}/edit`}
                              className="btn btn-secondary"
                              style={{
                                width: '32px',
                                height: '32px',
                                padding: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                              }}
                              title="Edit Cabang"
                              aria-label="Edit Cabang"
                            >
                              <Edit size={15} />
                            </Link>

                            <button
                              onClick={() => handleDeleteBranch(b)}
                              className="btn btn-secondary"
                              style={{
                                width: '32px',
                                height: '32px',
                                padding: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                                color: 'var(--accent-rose)',
                              }}
                              title="Hapus Cabang"
                              aria-label="Hapus Cabang"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
