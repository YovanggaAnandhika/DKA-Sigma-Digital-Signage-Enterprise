'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, Device } from '@/lib/services';
import { Pagination } from '@/components/ui/Pagination';
import { Tv, Search, RefreshCw, Edit, Trash2, Eye, CheckCircle2 } from 'lucide-react';
import { TableDataValue, TableStatus } from '@/components/ui/TableDataValue';
import { CircleCheck, CircleX, Clock3, Fingerprint, MonitorCheck, Network } from 'lucide-react';

export default function DisplayListView() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSseConnected, setIsSseConnected] = useState(false);
  const [pairingId, setPairingId] = useState<string | null>(null);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filter & Actions Bar */}
      <div
        className="card-elevated"
        style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
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
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              backgroundColor: isSseConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              border: isSseConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: isSseConnected ? 'var(--accent-emerald)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
            title={isSseConnected ? 'Terhubung ke Real-time Stream' : 'Stream Terputus'}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isSseConnected ? 'var(--accent-emerald)' : 'var(--text-muted)',
                boxShadow: isSseConnected ? '0 0 8px var(--accent-emerald)' : 'none',
              }}
            />
            <span>{isSseConnected ? 'Live' : 'Offline'}</span>
          </div>

          <button onClick={loadData} className="btn btn-secondary" title="Segarkan data manual">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Perangkat</th>
                <th>ID / Kode</th>
                <th>Status</th>
                <th>Resolusi & Orientasi</th>
                <th>Alamat IP</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Memuat daftar layar...' : 'Tidak ada perangkat ditemukan.'}
                  </td>
                </tr>
              ) : (
                devices.map((d) => {
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
                    <tr key={d.id}>
                      <td>
                        <TableDataValue icon={Tv} detail={d.isPaired ? 'Player terdaftar' : 'Menunggu aktivasi'}>
                          <Link href={`/hardware/displays/${d.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {d.name}
                          </Link>
                        </TableDataValue>
                      </td>
                      <td>
                        <TableDataValue icon={Fingerprint} tone="violet">
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              letterSpacing: '0.04em',
                              whiteSpace: 'nowrap',
                              color: !d.isPaired ? 'var(--text-muted)' : 'inherit',
                            }}
                          >
                            {!d.isPaired ? '●●●●●●' : d.id.substring(0, 8).toUpperCase()}
                          </span>
                        </TableDataValue>
                      </td>
                      <td>
                        {!d.isPaired ? (
                          <TableStatus icon={Clock3} tone="amber">Menunggu persetujuan</TableStatus>
                        ) : (
                          <TableStatus
                            icon={isTrulyOnline ? CircleCheck : CircleX}
                            tone={isTrulyOnline ? 'emerald' : 'rose'}
                          >
                            {isTrulyOnline ? 'Online' : 'Offline'}
                          </TableStatus>
                        )}
                      </td>
                      <td>
                        <TableDataValue icon={MonitorCheck} tone="cyan" detail={orientationLabel}>
                          {d.screenWidth || 1920} × {d.screenHeight || 1080}
                        </TableDataValue>
                      </td>
                      <td>
                        <TableDataValue icon={Network} tone="cyan">
                          {d.ipAddress || '127.0.0.1'}
                        </TableDataValue>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {!d.isPaired && (
                            <button
                              onClick={() => handleOpenPairingModal(d)}
                              className="btn btn-primary"
                              title="Setujui dan Verifikasi Kode Layar Android"
                              aria-label={`Setujui dan aktifkan layar ${d.name}`}
                            >
                              <CheckCircle2 size={13} />
                            </button>
                          )}
                          <Link href={`/hardware/displays/${d.id}`} className="btn btn-outline" style={{ padding: '5px 8px' }} title="Lihat Detail">
                            <Eye size={14} />
                          </Link>
                          <Link href={`/hardware/displays/${d.id}/edit`} className="btn btn-secondary" style={{ padding: '5px 8px' }} title="Edit">
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(d.id, d.name)}
                            className="btn btn-danger"
                            style={{ padding: '5px 8px' }}
                            title="Hapus Perangkat"
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

      {/* Modal Dialog Verifikasi Kode Pairing Fisik Layar */}
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
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => !pairingSubmitting && setPairingModalDevice(null)}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--primary-400)',
                }}
              >
                <Tv size={22} />
              </div>

              <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Verifikasi Kepemilikan Layar
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                  Layar: <b>{pairingModalDevice.name}</b>
                </p>
              </div>

              <button
                type="button"
                onClick={() => !pairingSubmitting && setPairingModalDevice(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                aria-label="Tutup"
              >
                <CircleX size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPairing} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Masukkan <b>6-digit Kode Pairing</b> yang sedang tampil di layar TV fisik untuk mengikat layar ini ke korporasi Anda:
              </p>

              <div>
                <input
                  type="text"
                  autoFocus
                  required
                  value={inputPairingCode}
                  onChange={(e) => setInputPairingCode(e.target.value.toUpperCase())}
                  placeholder="CONTOH: K8F2N9"
                  maxLength={10}
                  className="form-input"
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    letterSpacing: '0.2em',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    padding: '12px',
                  }}
                  disabled={pairingSubmitting}
                />
              </div>

              {pairingError && (
                <div style={{ color: 'var(--accent-rose)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {pairingError}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPairingModalDevice(null)}
                  className="btn btn-secondary"
                  disabled={pairingSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
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
