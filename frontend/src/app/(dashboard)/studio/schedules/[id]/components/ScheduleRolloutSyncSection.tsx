'use client';

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  HardDrive,
  Monitor,
  Cpu,
  RefreshCw,
  AlertTriangle,
  Rocket,
} from 'lucide-react';
import { useScheduleDetail } from '../context/ScheduleDetailContext';

export default function ScheduleRolloutSyncSection() {
  const {
    layoutMediaItems,
    totalAssetBytes,
    formatBytes,
    assignedDevices,
    fetchScheduleData,
    syncingDevId,
    handlePushSyncToDevice,
    deviceDownloadProgress,
  } = useScheduleDetail();

  return (
    <>
      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card-elevated" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-400)' }}>
            <Layers size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Aset Media Layout
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {layoutMediaItems.length} Berkas
            </div>
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)' }}>
            <HardDrive size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Bobot Payload
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {formatBytes(totalAssetBytes)}
            </div>
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber, #f59e0b)' }}>
            <Monitor size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Target Penerima
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {assignedDevices.length} Layar Aktif
            </div>
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
            <Cpu size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Status Rollout
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '4px' }}>
              Tersinkronisasi
            </div>
          </div>
        </div>
      </div>

      {/* Target Player Delivery & Sync Progress */}
      <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Monitor size={20} style={{ color: 'var(--primary-400)' }} />
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Status Distribusi ke Layar Android
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                Status koneksi real-time, verifikasi hash manifest, dan perintah reload langsung ke player.
              </p>
            </div>
          </div>

          {assignedDevices.length > 0 && (
            <button
              type="button"
              onClick={() => fetchScheduleData()}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} />
            </button>
          )}
        </div>

        {assignedDevices.length === 0 ? (
          <div
            style={{
              padding: '24px',
              borderRadius: '10px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <AlertTriangle size={24} style={{ color: 'var(--accent-amber, #f59e0b)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                Belum Ada Layar yang Ditugaskan ke Jadwal Ini (0 Layar Aktif)
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Agar player Android mengunduh dan menayangkan konten ini, buka menu <strong>Layouts</strong> &rarr; klik tombol <strong>"Push Jadwal"</strong> pada layout dan centang perangkat Android yang dituju (misal: <code>22111317PG</code>).
              </div>
            </div>
            <Link href="/studio/layouts/data" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
              Tugaskan Layar Sekarang
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assignedDevices.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: d.isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(107, 114, 128, 0.12)',
                        color: d.isOnline ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      }}
                    >
                      <Monitor size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                          {d.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: d.isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(107, 114, 128, 0.12)',
                            color: d.isOnline ? 'var(--accent-emerald)' : 'var(--text-muted)',
                            border: `1px solid ${d.isOnline ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: d.isOnline ? 'var(--accent-emerald)' : 'var(--text-muted)' }} />
                          {d.isOnline ? 'Online (DisplayStream Terhubung)' : 'Offline'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Resolusi Layar: {d.screenWidth}×{d.screenHeight} px · IP: {d.ipAddress || 'Lokal / DHCP'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={syncingDevId === d.id}
                      onClick={() => handlePushSyncToDevice(d.id, d.name)}
                      className="btn btn-outline"
                      style={{
                        fontSize: '0.75rem',
                        padding: '6px 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--primary-400)',
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      {syncingDevId === d.id ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Mengirim Sinyal...</span>
                        </>
                      ) : (
                        <>
                          <Rocket size={13} />
                          <span>Kirim Perintah Reload ke Layar</span>
                        </>
                      )}
                    </button>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor:
                          deviceDownloadProgress[d.id] && !deviceDownloadProgress[d.id].isSync
                            ? 'rgba(59, 130, 246, 0.12)'
                            : 'rgba(16, 185, 129, 0.12)',
                        color:
                          deviceDownloadProgress[d.id] && !deviceDownloadProgress[d.id].isSync
                            ? 'var(--primary-400)'
                            : 'var(--accent-emerald)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {deviceDownloadProgress[d.id] && !deviceDownloadProgress[d.id].isSync ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          <span>Mengunduh ({deviceDownloadProgress[d.id].progressPercent}%)</span>
                        </>
                      ) : (
                        <span>Tersinkronisasi (100%)</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Progress Bar for Device Asset Download (Real-Time Synchronized) */}
                <div>
                  {deviceDownloadProgress[d.id] && !deviceDownloadProgress[d.id].isSync ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          Mengunduh: <strong>{deviceDownloadProgress[d.id].fileName || 'Aset Media'}</strong> ({deviceDownloadProgress[d.id].assetIndex}/{deviceDownloadProgress[d.id].totalAssets || layoutMediaItems.length})
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--primary-400)' }}>
                          {deviceDownloadProgress[d.id].progressPercent}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '7px', borderRadius: '4px', backgroundColor: 'var(--bg-base)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${deviceDownloadProgress[d.id].progressPercent}%`,
                            height: '100%',
                            backgroundColor: 'var(--primary-500)',
                            borderRadius: '4px',
                            transition: 'width 0.2s ease',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        Ukuran: {formatBytes(deviceDownloadProgress[d.id].downloadedBytes)} / {formatBytes(deviceDownloadProgress[d.id].totalBytes || totalAssetBytes)}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>Penyimpanan Lokal Player: {layoutMediaItems.length} / {layoutMediaItems.length} Aset Terverifikasi ({formatBytes(totalAssetBytes)})</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>100% Siap Offline-First</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-base)', overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--accent-emerald)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
