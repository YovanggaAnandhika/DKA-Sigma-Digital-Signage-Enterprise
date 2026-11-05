'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Activity, Clock3, Cpu, Radio, RefreshCw, Wifi } from 'lucide-react';
import { getIotDeviceTelemetry, IotDeviceTelemetry } from '@/lib/services/studio/iot.service';

function formatTime(value: string) {
  if (!value) return 'Belum tersedia';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('id-ID');
}

function formatUptime(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  return `${days} hari ${hours} jam ${minutes} menit`;
}

export default function IotDeviceTelemetryPage() {
  const { id } = useParams() as { id: string };
  const [telemetry, setTelemetry] = useState<IotDeviceTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let timeout: number;
    const refresh = async () => {
      try {
        const latest = await getIotDeviceTelemetry(id);
        if (active) {
          setTelemetry(latest);
          setError('');
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Gagal memuat telemetry perangkat.');
      } finally {
        if (active) {
          setLoading(false);
          timeout = window.setTimeout(() => void refresh(), 2000);
        }
      }
    };

    void refresh();
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [id]);

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Memuat telemetry perangkat...</p>;
  }
  if (!telemetry) {
    return <p role="alert" style={{ color: 'var(--accent-rose)' }}>{error || 'Data telemetry tidak tersedia.'}</p>;
  }

  const lastSeen = new Date(telemetry.lastSeenAt).getTime();
  const online = Boolean(telemetry.lastSeenAt) && lastSeen <= Date.now() && Date.now() - lastSeen <= 60_000;
  const metrics = [
    { icon: <Wifi size={16} />, label: 'Alamat IP', value: telemetry.ipAddress || 'Belum tersedia' },
    { icon: <Radio size={16} />, label: 'Sinyal Wi-Fi', value: telemetry.hasRssi ? `${telemetry.rssi} dBm` : 'Belum tersedia' },
    { icon: <Cpu size={16} />, label: 'Firmware', value: telemetry.firmwareVersion || 'Belum diketahui' },
    { icon: <Clock3 size={16} />, label: 'Uptime', value: telemetry.hasUptime ? formatUptime(telemetry.uptimeMs) : 'Belum tersedia' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>
            Telemetri · {telemetry.deviceName || telemetry.deviceUid}
          </h1>
          <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'monospace' }}>
            {telemetry.deviceUid}
          </p>
        </div>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '6px 10px',
          borderRadius: 'var(--radius-full)',
          color: online ? 'var(--accent-emerald)' : 'var(--text-muted)',
          background: online ? 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)' : 'var(--bg-surface-elevated)',
          fontSize: '0.75rem',
          fontWeight: 700,
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor' }} />
          {online ? 'Terhubung' : 'Tidak ada telemetry terbaru'}
        </span>
      </header>

      {error && (
        <p role="alert" style={{ margin: 0, padding: '10px 12px', borderRadius: 'var(--radius-md)', color: 'var(--accent-rose)', background: 'color-mix(in srgb, var(--accent-rose) 10%, transparent)', fontSize: '0.82rem' }}>
          {error} · Menampilkan data terakhir yang diterima.
        </p>
      )}

      <section className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>Data perangkat</h2>
            <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Diperbarui oleh perangkat setiap 30 detik.
            </p>
          </div>
          <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </header>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {metrics.map((metric) => (
            <div key={metric.label} style={{ padding: '13px 14px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                {metric.icon}{metric.label}
              </div>
              <strong style={{ display: 'block', marginTop: '7px', color: 'var(--text-primary)', fontSize: '0.9rem', overflowWrap: 'anywhere' }}>
                {metric.value}
              </strong>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          Terakhir diterima: {formatTime(telemetry.lastSeenAt)}
        </p>
      </section>

      <section className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <Activity size={17} />
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Event tombol terakhir</h2>
        </div>
        {telemetry.hasLastPin ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            {[
              ['Event', telemetry.lastEvent || 'PRESS'],
              ['Pin GPIO', `GPIO ${telemetry.lastPin}`],
              ['Aksi berhasil terakhir', telemetry.lastAction || 'Belum ada aksi berhasil'],
              ['Waktu', formatTime(telemetry.lastEventAt)],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '13px 14px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{label}</span>
                <strong style={{ display: 'block', marginTop: '6px', color: 'var(--text-primary)', fontSize: '0.88rem', overflowWrap: 'anywhere' }}>{value}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, padding: '18px', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.84rem' }}>
            Belum ada event tombol yang diterima.
          </p>
        )}
      </section>

      <section className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>Riwayat telemetry dan event</h2>
          <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Data terbaru untuk audit perangkat dan grafik historis.
          </p>
        </div>
        {telemetry.historyList.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Waktu', 'Jenis', 'Data', 'Hasil aksi'].map((label) => (
                    <th key={label} style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {telemetry.historyList.slice(0, 20).map((record) => (
                  <tr key={record.id} style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{formatTime(record.recordedAt)}</td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {record.recordType === 'BUTTON' ? 'Tombol' : 'Telemetry'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {record.recordType === 'BUTTON'
                        ? `${record.event || 'Event'}${record.hasPin ? ` · GPIO ${record.pin}` : ''}`
                        : [
                            record.hasRssi ? `${record.rssi} dBm` : '',
                            record.firmwareVersion,
                            record.hasUptime ? formatUptime(record.uptimeMs) : '',
                          ].filter(Boolean).join(' · ') || 'Data tidak tersedia'}
                    </td>
                    <td style={{ padding: '10px 12px', minWidth: '180px' }}>
                      {record.action && <strong>{record.action}{record.status ? ` · ${record.status}` : ''}</strong>}
                      {record.message && <div style={{ color: 'var(--text-secondary)', marginTop: '3px' }}>{record.message}</div>}
                      {!record.action && !record.message && '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ margin: 0, padding: '18px', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.84rem' }}>
            Belum ada riwayat telemetry atau event yang diterima.
          </p>
        )}
      </section>
    </div>
  );
}
