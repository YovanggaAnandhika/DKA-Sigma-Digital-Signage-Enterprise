'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Device } from '@/lib/services';
import { Pagination } from '@/components/ui/Pagination';
import { Search, RefreshCw, Edit, Trash2, CheckCircle2, CircleX, Clock3, Wifi, Monitor, Network, Fingerprint } from 'lucide-react';

export default function DisplayListView() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSseConnected, setIsSseConnected] = useState(false);

  // Pairing Verification Modal state
  const [pairingModalDevice, setPairingModalDevice] = useState<Device | null>(null);
  const [inputPairingCode, setInputPairingCode] = useState('');
  const [pairingSubmitting, setPairingSubmitting] = useState(false);
  const [pairingError, setPairingError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getDevices({ search, page, limit });
      setDevices(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadData();
    let isFetching = false;
    const timer = setInterval(async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        await loadData();
      } finally {
        isFetching = false;
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Realtime Fleet Observability via Server-Sent Events (SSE)
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('dkasigma_session') : null;
      let token = '';
      if (raw) {
        try { token = JSON.parse(raw)?.token || ''; } catch (_) {}
      }
      const sseUrl = token ? `/api/stream/events?token=${encodeURIComponent(token)}` : '/api/stream/events';
      es = new EventSource(sseUrl);

      es.addEventListener('connected', () => {
        setIsSseConnected(true);
      });

      es.addEventListener('fleet_status', (event) => {
        setIsSseConnected(true);
        try {
          const payload = JSON.parse(event.data);
          if (payload?.devices?.length) {
            const statusMap = new Map<string, { isOnline: boolean; lastHeartbeatAt?: string }>(
              payload.devices.map((d: any) => [d.id, { isOnline: d.isOnline, lastHeartbeatAt: d.lastHeartbeatAt }])
            );

            setDevices((prev) =>
              prev.map((dev) => {
                const liveStatus = statusMap.get(dev.id);
                if (liveStatus && (liveStatus.isOnline !== dev.isOnline || liveStatus.lastHeartbeatAt !== dev.lastHeartbeatAt)) {
                  return {
                    ...dev,
                    isOnline: liveStatus.isOnline,
                    lastHeartbeatAt: liveStatus.lastHeartbeatAt || dev.lastHeartbeatAt,
                  };
                }
                return dev;
              })
            );
          }
        } catch (_) {}
      });

      es.onerror = () => {
        setIsSseConnected(false);
      };
    } catch (_) {}

    return () => {
      if (es) es.close();
    };
  }, []);

  const handleOpenPairingModal = (d: Device) => {
    setPairingModalDevice(d);
    setInputPairingCode('');
    setPairingError('');
  };

  const handleConfirmPairing = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pairingModalDevice) return;
    const cleanCode = inputPairingCode.trim().toUpperCase();
    if (!cleanCode) {
      setPairingError('Silakan masukkan 6-digit kode pairing fisik.');
      return;
    }
    try {
      setPairingSubmitting(true);
      setPairingError('');
      await api.pairDevice({
        deviceId: pairingModalDevice.id,
        pairingCode: cleanCode,
        deviceName: pairingModalDevice.name,
      });
      setPairingModalDevice(null);
      await loadData();
    } catch (err: any) {
      setPairingError(err.message || 'Gagal memverifikasi kode pairing fisik');
    } finally {
      setPairingSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus display player "${name}"?`)) return;
    try {
      await api.deleteDevice(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus perangkat');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Modern Floating Toolbar */}
      <div
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari berdasarkan nama perangkat atau ID..."
            style={{
              width: '100%',
              paddingLeft: '40px',
              paddingRight: '14px',
              height: '40px',
              fontSize: '0.825rem',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Live Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '9999px',
              backgroundColor: isSseConnected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-elevated)',
              border: isSseConnected ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
              color: isSseConnected ? 'var(--accent-emerald)' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isSseConnected ? 'var(--accent-emerald)' : 'var(--text-muted)',
                boxShadow: isSseConnected ? '0 0 8px var(--accent-emerald)' : 'none',
              }}
            />
            <span>{isSseConnected ? 'Real-time Stream Live' : 'Stream Disconnected'}</span>
          </div>

          <button
            onClick={loadData}
            style={{
              height: '40px',
              padding: '0 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '10px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Modern Clean Data Table Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Perangkat</th>
                <th style={{ padding: '14px 20px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID / Kode</th>
                <th style={{ padding: '14px 20px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolusi & Orientasi</th>
                <th style={{ padding: '14px 20px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alamat IP</th>
                <th style={{ padding: '14px 20px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                    {loading ? 'Memuat daftar layar...' : 'Tidak ada perangkat ditemukan.'}
                  </td>
                </tr>
              ) : (
                devices.map((d, index) => {
                  const orientationLabel =
                    String(d.orientation) === '2' || d.orientation === 'portrait' || (d.orientation as any) === 'ORIENTATION_PORTRAIT'
                      ? 'Portrait'
                      : 'Landscape';

                  const isTrulyOnline = Boolean(
                    d.isOnline &&
                    d.lastHeartbeatAt &&
                    (Date.now() - new Date(d.lastHeartbeatAt).getTime() <= 10000)
                  );

                  return (
                    <tr
                      key={d.id}
                      onClick={(event) => {
                        if (event.target instanceof Element && event.target.closest('a, button')) return;
                        router.push(`/hardware/displays/${d.id}`);
                      }}
                      style={{
                        cursor: 'pointer',
                        borderBottom: index < devices.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Nama Perangkat */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <Link href={`/hardware/displays/${d.id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 700 }}>
                            {d.name}
                          </Link>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {d.isPaired ? 'Player aktif terdaftar' : 'Menunggu aktivasi perangkat'}
                          </span>
                        </div>
                      </td>

                      {/* ID / Kode */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                          <Fingerprint size={13} style={{ color: 'var(--primary-400)', opacity: 0.8 }} />
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: d.isPaired ? 'var(--text-secondary)' : 'var(--text-muted)', letterSpacing: '0.04em' }}>
                            {!d.isPaired ? '••••••••' : d.id.substring(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Status Online/Offline Pill Badge */}
                      <td style={{ padding: '16px 20px' }}>
                        {!d.isPaired ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', backgroundColor: 'rgba(234, 179, 8, 0.12)', color: 'var(--accent-amber)', fontSize: '0.72rem', fontWeight: 700 }}>
                            <Clock3 size={12} />
                            <span>Pending Pairing</span>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              backgroundColor: isTrulyOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.08)',
                              color: isTrulyOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: isTrulyOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                                boxShadow: isTrulyOnline ? '0 0 6px var(--accent-emerald)' : 'none',
                              }}
                            />
                            <span>{isTrulyOnline ? 'Online' : 'Offline'}</span>
                          </div>
                        )}
                      </td>

                      {/* Resolusi & Orientasi */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--primary-400)' }}>
                            <Monitor size={15} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 700 }}>
                              {d.screenWidth || 1920} × {d.screenHeight || 1080}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              {orientationLabel}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Alamat IP */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--accent-cyan)' }}>
                            <Network size={15} />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: 600 }}>
                            {d.ipAddress || '127.0.0.1'}
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {!d.isPaired && (
                            <button
                              onClick={() => handleOpenPairingModal(d)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                borderRadius: '8px',
                                backgroundColor: 'var(--accent-emerald)',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Setujui dan Verifikasi Kode Layar Android"
                            >
                              <CheckCircle2 size={13} />
                              <span>Setujui</span>
                            </button>
                          )}
                          <Link
                            href={`/hardware/displays/${d.id}/edit`}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-secondary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(d.id, d.name)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              backgroundColor: 'transparent',
                              border: '1px solid transparent',
                              color: 'var(--accent-rose)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="Hapus"
                          >
                            <Trash2 size={14} />
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

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Modal Pairing */}
      {pairingModalDevice && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => !pairingSubmitting && setPairingModalDevice(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Verifikasi Kepemilikan Layar
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Layar: <b>{pairingModalDevice.name}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => !pairingSubmitting && setPairingModalDevice(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              >
                <CircleX size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPairing} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Masukkan <b>6-digit kode pairing</b> yang sedang tampil di layar TV fisik:
              </p>
              <input
                type="text"
                autoFocus
                required
                value={inputPairingCode}
                onChange={(e) => setInputPairingCode(e.target.value.toUpperCase())}
                placeholder="CONTOH: K8F2N9"
                maxLength={10}
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  letterSpacing: '0.2em',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
                disabled={pairingSubmitting}
              />
              {pairingError && (
                <div style={{ color: 'var(--accent-rose)', fontSize: '0.78rem', fontWeight: 600 }}>
                  {pairingError}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPairingModalDevice(null)}
                  style={{ padding: '7px 14px', fontSize: '0.8rem', borderRadius: '8px', backgroundColor: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                  disabled={pairingSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: '7px 16px', fontSize: '0.8rem', borderRadius: '8px', backgroundColor: 'var(--primary-600)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  disabled={pairingSubmitting || !inputPairingCode.trim()}
                >
                  {pairingSubmitting ? 'Memverifikasi...' : 'Verifikasi & Aktifkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}