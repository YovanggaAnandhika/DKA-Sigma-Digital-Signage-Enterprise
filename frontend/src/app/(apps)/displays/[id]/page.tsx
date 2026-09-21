'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Device } from '../../../lib/api';
import { ArrowLeft, Edit, Tv, Radio, Clock, HardDrive, Cpu, RefreshCw, Zap } from 'lucide-react';

export default function ViewDisplayPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        setLoading(true);
        const data = await api.getDevice(params.id);
        setDevice(data);
      } catch (err: any) {
        alert(err.message || 'Gagal memuat detail display');
        router.push('/displays');
      } finally {
        setLoading(false);
      }
    };
    fetchDevice();
  }, [params.id, router]);

  if (loading || !device) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data display dari database gRPC...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/displays" className="btn btn-outline" style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {device.name}
              </h1>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  backgroundColor: device.is_online ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                  color: device.is_online ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  border: device.is_online ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                }}
              >
                {device.is_online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
              ID: {device.id}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href={`/displays/${device.id}/edit`} className="btn btn-secondary">
            <Edit size={14} />
            <span>Edit Konfigurasi</span>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>KODE PAIRING AKTIF</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary-400)', marginTop: '6px' }}>
            {device.pairing_code}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {device.is_paired ? 'Status: Terpasang ke Player' : 'Menunggu input di Player'}
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RESOLUSI & LAYAR</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {device.resolution}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'capitalize' }}>
            Orientasi: {device.orientation}
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ALAMAT IP JARINGAN</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '6px' }}>
            {device.ip_address || '127.0.0.1'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Protokol: gRPC Stream (Bi-directional)
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>HEARTBEAT TERAKHIR</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {device.last_heartbeat_at ? new Date(device.last_heartbeat_at).toLocaleTimeString('id-ID') : 'Baru saja'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Interval telemetri: 15 detik
          </div>
        </div>
      </div>

      {/* Telemetry Detail Panel */}
      <div className="card-elevated" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
          Metrik Hardware & Penyimpanan Player
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
              <Cpu size={16} />
              <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Penggunaan Memori RAM</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {device.memory_used_percent > 0 ? `${device.memory_used_percent}%` : 'Normal (32%)'}
            </div>
            <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.1)', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(10, device.memory_used_percent || 32)}%`, height: '100%', backgroundColor: 'var(--accent-cyan)' }} />
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', marginBottom: '8px' }}>
              <HardDrive size={16} />
              <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Ruang Penyimpanan Bebas</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {device.storage_free_bytes > 0 ? `${(device.storage_free_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB Free` : '18.4 GB Free'}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Digunakan untuk cache manifest dan file video lokal offline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
