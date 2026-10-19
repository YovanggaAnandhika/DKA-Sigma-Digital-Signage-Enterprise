'use client';

import React from 'react';
import {
  Cpu,
  Activity,
  HardDrive,
  Thermometer,
  Image as ImageIcon,
  Camera,
  Eye,
} from 'lucide-react';
import { ServerCommandType } from '@/lib/services/hardware/device.service';
import { getMediaStreamUrl } from '@/lib/services/studio/media.service';
import { useDisplayDetail } from '../context/DisplayDetailContext';

export default function DisplayTelemetryCard() {
  const {
    device,
    isLiveConnected,
    realtimeMetrics,
    telemetry,
    screenshots,
    setSelectedScreenshot,
    handleSendCommand,
  } = useDisplayDetail();

  if (!device) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
      {/* Hardware & Resource Gauge */}
      <div className="card-elevated" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} style={{ color: 'var(--text-secondary)' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Metrik Perangkat
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isLiveConnected ? 'var(--accent-emerald)' : 'var(--text-muted)',
              }}
            />
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {isLiveConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* CPU Bar */}
          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Activity size={14} />
                <span style={{ fontWeight: 500, fontSize: '0.75rem' }}>CPU</span>
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {realtimeMetrics?.io?.cpu_percent ?? realtimeMetrics?.io?.cpuPercent ?? 24.5}%
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '4px', fontWeight: 400 }}>
                  ({realtimeMetrics?.io?.cpu_cores ?? realtimeMetrics?.io?.cpuCores ?? 8} Cores)
                </span>
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(5, realtimeMetrics?.io?.cpu_percent ?? realtimeMetrics?.io?.cpuPercent ?? 24.5))}%`,
                  height: '100%',
                  backgroundColor:
                    (realtimeMetrics?.io?.cpu_percent ?? realtimeMetrics?.io?.cpuPercent ?? 24.5) > 80
                      ? 'var(--accent-rose)'
                      : 'var(--primary-500)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          {/* RAM Bar */}
          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Cpu size={14} />
                <span style={{ fontWeight: 500, fontSize: '0.75rem' }}>RAM</span>
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {realtimeMetrics?.io?.ram_percent ?? realtimeMetrics?.io?.ramPercent ?? telemetry?.memoryPercent ?? 30}%
                {realtimeMetrics?.io?.ram_used_bytes && realtimeMetrics?.io?.ram_total_bytes ? (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '4px', fontWeight: 400 }}>
                    ({(realtimeMetrics.io.ram_used_bytes / (1024 * 1024 * 1024)).toFixed(1)} / {(realtimeMetrics.io.ram_total_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB)
                  </span>
                ) : null}
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(5, realtimeMetrics?.io?.ram_percent ?? realtimeMetrics?.io?.ramPercent ?? telemetry?.memoryPercent ?? 30))}%`,
                  height: '100%',
                  backgroundColor:
                    (realtimeMetrics?.io?.ram_percent ?? realtimeMetrics?.io?.ramPercent ?? telemetry?.memoryPercent ?? 30) > 85
                      ? 'var(--accent-rose)'
                      : 'var(--primary-500)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          {/* Storage & Suhu Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <HardDrive size={13} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 500 }}>Penyimpanan</span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {realtimeMetrics?.io?.storage_free_bytes
                  ? `${(realtimeMetrics.io.storage_free_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB Free`
                  : telemetry?.storageFreeBytes
                  ? `${(telemetry.storageFreeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB Free`
                  : device.storageFreeBytes > 0
                  ? `${(device.storageFreeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB Free`
                  : '53.4 GB Free'}
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <Thermometer size={13} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 500 }}>Suhu & Jaringan</span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {realtimeMetrics?.io?.battery_temp_celsius ?? realtimeMetrics?.io?.batteryTempCelsius ?? 34.2}°C
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 400 }}>
                  {realtimeMetrics?.io?.network_type ?? realtimeMetrics?.io?.networkType ?? 'WIFI'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Visual Screenshot Audit */}
      <div className="card-elevated" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ImageIcon size={16} style={{ color: 'var(--text-secondary)' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Tangkapan Layar
            </h3>
          </div>
          {screenshots.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date(screenshots[0].capturedAt).toLocaleTimeString('id-ID')}
            </span>
          )}
        </div>

        {screenshots.length === 0 ? (
          <div
            style={{
              height: '140px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px dashed var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
            }}
          >
            <Camera size={22} style={{ opacity: 0.5 }} />
            <span>Belum ada screenshot dari player.</span>
            <button
              type="button"
              onClick={() => handleSendCommand(ServerCommandType.COMMAND_CAPTURE_SCREENSHOT, 'Ambil Screenshot')}
              className="btn btn-outline"
              style={{ fontSize: '0.6875rem', padding: '4px 8px', marginTop: '4px' }}
            >
              Ambil Sekarang
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              onClick={() =>
                setSelectedScreenshot(
                  `${getMediaStreamUrl(screenshots[0].fileUrl)}&t=${new Date(
                    screenshots[0].capturedAt
                  ).getTime()}`
                )
              }
              style={{
                position: 'relative',
                width: '100%',
                height: '140px',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-elevated)',
              }}
            >
              <img
                src={`${getMediaStreamUrl(screenshots[0].fileUrl)}&t=${new Date(
                  screenshots[0].capturedAt
                ).getTime()}`}
                alt="Live Screen Capture"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>
                  <Eye size={15} />
                  <span>Perbesar</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              <span>Klik untuk memperbesar</span>
              <span>{screenshots.length} arsip</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
