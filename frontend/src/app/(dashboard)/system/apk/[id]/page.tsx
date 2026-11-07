'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Smartphone,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Monitor,
  Search,
  ExternalLink,
  Clock,
  Radio,
} from 'lucide-react';
import { system, AppReleaseDetail, DeviceReleaseStatus } from '@/lib/services';

export default function ApkReleaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [detail, setDetail] = useState<AppReleaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'updated' | 'outdated'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await system.getAppRelease(id);
      setDetail(res);
    } catch (err: any) {
      console.error('Failed to load APK release detail:', err);
      setError(err.message || 'Gagal memuat rincian rilis APK');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleToggleActive = async () => {
    if (!detail) return;
    try {
      setToggling(true);
      await system.toggleAppReleaseActive(detail.release.id, !detail.release.isActive);
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status aktif');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!detail) return;
    if (!confirm(`Hapus rilis APK v${detail.release.versionName}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await system.deleteAppRelease(detail.release.id);
      router.push('/system/apk');
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus rilis');
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDevices = (detail?.devices || []).filter((dev) => {
    const matchesFilter =
      filterTab === 'all'
        ? true
        : filterTab === 'updated'
        ? dev.isUpdated
        : !dev.isUpdated;

    const matchesSearch =
      dev.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.currentAppVersion.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const percentUpdated =
    detail && detail.totalDevices > 0
      ? Math.round((detail.updatedDevicesCount / detail.totalDevices) * 100)
      : 0;

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p style={{ margin: 0, fontWeight: 500 }}>Memuat detail rilis APK...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href="/system/apk"
            className="btn btn-outline"
            style={{ width: '42px', minWidth: '42px', height: '42px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
            aria-label="Kembali ke Daftar Rilis APK"
            title="Kembali ke Daftar Rilis APK"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Rilis APK Tidak Ditemukan</h1>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
          {error || 'Data rilis APK tidak dapat ditemukan atau telah dihapus.'}
        </div>
      </div>
    );
  }

  const { release } = detail;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Top Bar with Circular Icon Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href="/system/apk"
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
            aria-label="Kembali ke Daftar Rilis APK"
            title="Kembali ke Daftar Rilis APK"
          >
            <ArrowLeft size={18} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                flexShrink: 0,
              }}
            >
              <Smartphone size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Rilis v{release.versionName}
                </h1>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#0284c7' }}>
                  Build {release.versionCode}
                </span>
                {release.isActive ? (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Target Aktif
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'var(--hover-surface)', color: 'var(--text-muted)' }}>
                    Non-aktif
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Diterbitkan pada {new Date(release.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleToggleActive}
            disabled={toggling}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: '10px' }}
          >
            {release.isActive ? 'Nonaktifkan Rilis' : 'Set Sebagai Target Aktif'}
          </button>
          <a
            href={release.apkFileUrl}
            download={`dka-signage-v${release.versionName}.apk`}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '10px', textDecoration: 'none' }}
          >
            <Download size={16} />
            <span>Unduh APK ({formatBytes(release.fileSizeBytes)})</span>
          </a>
          <button
            onClick={handleDelete}
            className="btn btn-outline"
            style={{ width: '38px', height: '38px', padding: 0, borderRadius: '10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            title="Hapus Rilis APK"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Release Specification Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--card-shadow)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ukuran Berkas
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatBytes(release.fileSizeBytes)} ({release.fileSizeBytes.toLocaleString()} bytes)
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Kebijakan Distribusi
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: release.isForceUpdate ? '#ef4444' : '#10b981' }}>
            {release.isForceUpdate ? 'Wajib (Silent Force Update)' : 'Opsional / Fleksibel'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Versi Min. Didukung
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Build {release.minSupportedVersionCode}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Integritas Kriptografis (SHA-256)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <code
              style={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: 'var(--hover-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                wordBreak: 'break-all',
                flex: 1,
              }}
            >
              {release.sha256Hash}
            </code>
            <button
              onClick={() => handleCopyHash(release.sha256Hash)}
              className="btn btn-outline"
              style={{ padding: '6px 12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
              title="Salin Hash Lengkap"
            >
              {copiedHash === release.sha256Hash ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedHash === release.sha256Hash ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
        </div>

        {release.releaseNotes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Catatan Rilis (Changelog)
            </span>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: 'var(--hover-surface)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {release.releaseNotes}
            </div>
          </div>
        )}
      </div>

      {/* Adoption & Fleet Rollout Progress Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Status Distribusi Pembaruan Layar (Fleet Rollout)
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Memantau status versi aplikasi terpasang di seluruh perangkat Android Player
            </p>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: percentUpdated === 100 ? '#10b981' : '#0284c7' }}>
            {percentUpdated}% Terdistribusi
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '10px', borderRadius: '5px', backgroundColor: 'var(--border-subtle)', overflow: 'hidden', display: 'flex' }}>
          <div
            style={{
              width: `${percentUpdated}%`,
              height: '100%',
              backgroundColor: '#10b981',
              transition: 'width 0.4s ease',
            }}
            title={`Sudah Diperbarui: ${detail.updatedDevicesCount} Layar`}
          />
          <div
            style={{
              width: `${100 - percentUpdated}%`,
              height: '100%',
              backgroundColor: detail.outdatedDevicesCount > 0 ? '#f59e0b' : 'transparent',
              transition: 'width 0.4s ease',
            }}
            title={`Perlu Pembaruan: ${detail.outdatedDevicesCount} Layar`}
          />
        </div>

        {/* 3 Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--hover-surface)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Monitor size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Layar</span>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{detail.totalDevices} Layar</p>
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--hover-surface)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sudah Diperbarui</span>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{detail.updatedDevicesCount} Layar</p>
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--hover-surface)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Perlu Pembaruan</span>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>{detail.outdatedDevicesCount} Layar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Device Rollout Breakdown Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        {/* Table Filter Bar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setFilterTab('all')}
              className="btn btn-outline"
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: filterTab === 'all' ? 700 : 500,
                backgroundColor: filterTab === 'all' ? 'var(--hover-surface)' : 'transparent',
                borderColor: filterTab === 'all' ? 'var(--primary-500)' : 'var(--border-subtle)',
                color: filterTab === 'all' ? 'var(--primary-400)' : 'var(--text-secondary)',
              }}
            >
              Semua Layar ({detail.totalDevices})
            </button>
            <button
              onClick={() => setFilterTab('updated')}
              className="btn btn-outline"
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: filterTab === 'updated' ? 700 : 500,
                backgroundColor: filterTab === 'updated' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                borderColor: filterTab === 'updated' ? '#10b981' : 'var(--border-subtle)',
                color: filterTab === 'updated' ? '#10b981' : 'var(--text-secondary)',
              }}
            >
              Sudah Diperbarui ({detail.updatedDevicesCount})
            </button>
            <button
              onClick={() => setFilterTab('outdated')}
              className="btn btn-outline"
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: filterTab === 'outdated' ? 700 : 500,
                backgroundColor: filterTab === 'outdated' ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                borderColor: filterTab === 'outdated' ? '#f59e0b' : 'var(--border-subtle)',
                color: filterTab === 'outdated' ? '#f59e0b' : 'var(--text-secondary)',
              }}
            >
              Perlu Pembaruan ({detail.outdatedDevicesCount})
            </button>
          </div>

          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Cari layar atau cabang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Table Content */}
        {filteredDevices.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Monitor size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Tidak ada layar yang cocok dengan filter</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--hover-surface)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Nama Layar</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Cabang / Lokasi</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>IP & Koneksi</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Versi Terpasang</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Status Rilis Ini</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Terakhir Terlihat</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((dev) => (
                  <tr
                    key={dev.deviceId}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: dev.isOnline ? 'rgba(16, 185, 129, 0.12)' : 'var(--hover-surface)',
                            color: dev.isOnline ? '#10b981' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Monitor size={16} />
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{dev.deviceName}</span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                      {dev.branchName}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {dev.ipAddress || '-'}
                        </span>
                        <span style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: dev.isOnline ? '#10b981' : 'var(--text-muted)' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dev.isOnline ? '#10b981' : '#94a3b8' }} />
                          {dev.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <code
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: dev.isUpdated ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: dev.isUpdated ? '#10b981' : '#f59e0b',
                          border: `1px solid ${dev.isUpdated ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                          fontWeight: 700,
                        }}
                      >
                        {dev.currentAppVersion}
                      </code>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {dev.isUpdated ? (
                        <span
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={13} /> Telah Diperbarui
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <AlertTriangle size={13} /> Perlu Pembaruan
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {dev.lastSeenAt
                        ? new Date(dev.lastSeenAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <Link
                        href={`/hardware/displays/${dev.deviceId}`}
                        className="btn btn-outline"
                        style={{
                          width: '32px',
                          height: '32px',
                          padding: 0,
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                        }}
                        title="Buka Detail Layar"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

