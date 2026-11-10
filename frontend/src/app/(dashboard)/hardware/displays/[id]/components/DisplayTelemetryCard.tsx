'use client';

import React from 'react';
import {
  Cpu,
  HardDrive,
  Thermometer,
  Image as ImageIcon,
  Camera,
  Eye,
} from 'lucide-react';
import { ServerCommandType } from '@/lib/services/hardware/device.service';
import { getMediaStreamUrl } from '@/lib/services/studio/media.service';
import { useDisplayDetail } from '../context/DisplayDetailContext';
import { formatIndonesianDateTime } from './formatIndonesianDateTime';

function ResourceGauge({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value?: number;
  detail?: string;
  color: string;
}) {
  const percentage = value == null ? 0 : Math.min(100, Math.max(0, value));

  return (
    <div style={{ minWidth: 0, padding: '8px 10px 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>{label}</span>
        <strong style={{ color, fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums' }}>
          {value == null ? '--' : `${percentage.toFixed(1)}%`}
        </strong>
      </div>
      <svg viewBox="0 0 180 116" role="img" aria-label={`${label}: ${value == null ? 'belum tersedia' : `${percentage.toFixed(1)} persen`}`} style={{ display: 'block', width: '100%', maxWidth: 220, height: 116, margin: '4px auto -4px' }}>
        <path d="M 18 98 A 72 72 0 0 1 162 98" fill="none" stroke="var(--border-strong)" strokeWidth="12" strokeLinecap="round" />
        <path d="M 18 98 A 72 72 0 0 1 162 98" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" pathLength="100" strokeDasharray={`${percentage} 100`} style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dasharray 500ms ease' }} />
        {[0, 50, 100].map((tick) => {
          const angle = Math.PI - (Math.PI * tick) / 100;
          return (
            <text key={tick} x={90 + Math.cos(angle) * 83} y={102 - Math.sin(angle) * 83 + 3} fill="var(--text-muted)" fontSize="9" textAnchor="middle">
              {tick}
            </text>
          );
        })}
      </svg>
      <div style={{ minHeight: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.68rem' }}>{detail || (value == null ? 'Menunggu data perangkat' : '')}</div>
    </div>
  );
}

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

  const cpuPercent = realtimeMetrics?.io?.cpu_percent ?? realtimeMetrics?.io?.cpuPercent;
  const cpuCores = realtimeMetrics?.io?.cpu_cores ?? realtimeMetrics?.io?.cpuCores;
  const ramPercent = realtimeMetrics?.io?.ram_percent ?? realtimeMetrics?.io?.ramPercent ?? telemetry?.memoryPercent;
  const ramUsedBytes = realtimeMetrics?.io?.ram_used_bytes;
  const ramTotalBytes = realtimeMetrics?.io?.ram_total_bytes;
  const storageFreeBytes = realtimeMetrics?.io?.storage_free_bytes ?? telemetry?.storageFreeBytes ?? device.storageFreeBytes;
  const batteryTemperature = realtimeMetrics?.io?.battery_temp_celsius ?? realtimeMetrics?.io?.batteryTempCelsius;
  const networkType = realtimeMetrics?.io?.network_type ?? realtimeMetrics?.io?.networkType;

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            <ResourceGauge
              label="CPU perangkat"
              value={cpuPercent}
              detail={cpuCores == null ? undefined : `${cpuCores} core`}
              color="var(--accent-cyan)"
            />
            <ResourceGauge
              label="Memori perangkat"
              value={ramPercent}
              detail={ramUsedBytes && ramTotalBytes ? `${(ramUsedBytes / (1024 ** 3)).toFixed(1)} / ${(ramTotalBytes / (1024 ** 3)).toFixed(1)} GB` : undefined}
              color="var(--accent-emerald)"
            />
          </div>

          {/* Storage & Suhu Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ padding: '4px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <HardDrive size={13} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 500 }}>Penyimpanan</span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {storageFreeBytes > 0 ? `${(storageFreeBytes / (1024 ** 3)).toFixed(1)} GB tersedia` : 'Belum tersedia'}
              </div>
            </div>

            <div style={{ padding: '4px 8px', borderLeft: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <Thermometer size={13} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 500 }}>Suhu & Jaringan</span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {batteryTemperature == null ? 'Suhu belum tersedia' : `${batteryTemperature}°C`}
                {networkType ? <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 400 }}>{networkType}</span> : null}
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
              {formatIndonesianDateTime(screenshots[0].capturedAt)}
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
