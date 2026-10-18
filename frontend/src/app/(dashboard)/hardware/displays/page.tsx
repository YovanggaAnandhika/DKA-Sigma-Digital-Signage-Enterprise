'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, Device } from '@/lib/services';
import { Pagination } from '@/components/ui/Pagination';
import { Tv, Search, RefreshCw, Edit, Trash2, Eye, CheckCircle2 } from 'lucide-react';

export default function DisplaysPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSseConnected, setIsSseConnected] = useState(false);
  const [pairingId, setPairingId] = useState<string | null>(null);

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

  const handleAccept = async (d: Device) => {
    if (!d.pairingCode) {
      alert('Perangkat tidak memiliki kode pairing yang valid');
      return;
    }
    if (!confirm(`Setujui dan aktifkan layar "${d.name}" (Kode: ${d.pairingCode})?`)) return;
    try {
      setPairingId(d.id);
      await api.pairDevice({
        pairingCode: d.pairingCode,
        deviceName: d.name,
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyetujui pairing perangkat');
    } finally {
      setPairingId(null);
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '16px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <Tv size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Layar Retail (Player Fleet)
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Pusat registrasi dan pairing perangkat Android display player secara terpusat.
            </p>
          </div>
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
            title={isSseConnected ? 'Terhubung ke Real-time SSE Stream (Pembaruan status otomatis tanpa refresh)' : 'SSE Offline'}
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
            <span>{isSseConnected ? 'Live Stream SSE' : 'Offline'}</span>
          </div>

          <button onClick={loadData} className="btn btn-secondary" title="Segarkan data manual">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-elevated" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari berdasarkan nama perangkat atau kode pairing..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Perangkat</th>
                <th>Kode Pairing</th>
                <th>Grup Layar</th>
                <th>Status</th>
                <th>Resolusi & Orientasi</th>
                <th>Alamat IP</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Memuat daftar layar...' : 'Tidak ada perangkat ditemukan.'}
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link href={`/hardware/displays/${d.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {d.name}
                      </Link>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {d.pairingCode}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {d.displayGroupId ? 'Tergabung' : '-'}
                    </td>
                    <td>
                      {!d.isPaired ? (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            backgroundColor: 'rgba(245, 158, 11, 0.12)',
                            color: 'var(--accent-amber)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}
                        >
                          MENUNGGU PERSETUJUAN
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            backgroundColor: d.isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                            color: d.isOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                            border: d.isOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                          }}
                        >
                          {d.isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      )}
                    </td>
                    <td>
                      {d.screenWidth + "x" + d.screenHeight} ({d.orientation})
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{d.ipAddress || '127.0.0.1'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {!d.isPaired && (
                          <button
                            onClick={() => handleAccept(d)}
                            disabled={pairingId === d.id}
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                            title="Setujui dan Aktifkan Layar Android"
                          >
                            <CheckCircle2 size={13} />
                            <span>{pairingId === d.id ? 'Memproses...' : 'Setujui'}</span>
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
                ))
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
    </div>
  );
}
