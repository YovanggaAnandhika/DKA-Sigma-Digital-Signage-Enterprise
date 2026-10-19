'use client';

import React from 'react';
import { Film, CheckCircle2 } from 'lucide-react';
import { useDisplayDetail, cleanMediaTitle } from '../context/DisplayDetailContext';

export default function DisplayPlaybackDiagnostics() {
  const { device, activeAssetsList, getAssetVerdict } = useDisplayDetail();

  if (!device) return null;

  return (
    <div className="card-elevated" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={16} style={{ color: 'var(--text-secondary)' }} />
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Diagnostik Pemutaran Media
            </h2>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Status decoder, bitrate, dan performa pemutaran video aktif.
          </p>
        </div>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.6875rem',
            fontWeight: 600,
            backgroundColor: 'var(--bg-surface-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {activeAssetsList.length} Aktif
        </span>
      </div>

      {activeAssetsList.length === 0 ? (
        <div
          style={{
            padding: '24px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px dashed var(--border-subtle)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.8125rem',
          }}
        >
          <Film size={24} style={{ margin: '0 auto 6px auto', opacity: 0.5 }} />
          <div style={{ fontWeight: 600 }}>Siaga (Standby)</div>
          <p style={{ fontSize: '0.75rem', marginTop: '2px' }}>
            Tidak ada video aktif yang sedang diputar.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeAssetsList.map((asset, idx) => {
            const rawTitle = asset.media_name || asset.mediaName;
            const cleanTitle = cleanMediaTitle(rawTitle);
            const dropped = asset.dropped_frames ?? asset.droppedFrames ?? 0;
            const bitrateKbps = asset.bitrate_kbps ?? asset.bitrateKbps ?? 0;
            const isHw = asset.is_hardware_accelerated ?? asset.isHardwareAccelerated ?? true;
            const codec = asset.codec || 'H.264 / AVC';
            const resolution =
              asset.resolution ||
              (device.screenWidth ? `${device.screenWidth}x${device.screenHeight}` : '1920x1080');
            const verdict = getAssetVerdict(asset);
            const zoneLabel =
              asset.zone_name ||
              asset.zoneName ||
              (activeAssetsList.length === 1 ? 'Layar Penuh' : `Player #${idx + 1}`);

            return (
              <div
                key={`${asset.media_id || idx}-${idx}`}
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: dropped > 10 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Zone Header & Title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ flex: '1', minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {zoneLabel}
                      </span>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          color: 'var(--text-muted)',
                        }}
                      >
                        ● {asset.playback_status || 'PLAYING'}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        wordBreak: 'break-word',
                        lineHeight: 1.35,
                      }}
                      title={rawTitle}
                    >
                      {cleanTitle}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {isHw ? 'Hardware' : 'Software'}
                    </span>
                  </div>
                </div>

                {/* Profiler Metrics Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                  <div style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-surface)' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Resolusi & Codec</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {resolution}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {codec}
                    </div>
                  </div>

                  <div style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-surface)' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Bitrate</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {bitrateKbps > 0
                        ? bitrateKbps >= 1000
                          ? `${(bitrateKbps / 1000).toFixed(1)} Mbps`
                          : `${bitrateKbps} Kbps`
                        : 'N/A'}
                    </div>
                  </div>

                  <div style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-surface)' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Decoder</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {asset.decoder_name || 'Hardware MediaCodec'}
                    </div>
                  </div>

                  <div style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-surface)' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Frame Drop</div>
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: dropped > 10 ? 'var(--accent-rose)' : 'var(--text-primary)',
                        marginTop: '2px',
                      }}
                    >
                      {dropped} Drop
                      {asset.dropped_frame_rate_percent ? ` (${asset.dropped_frame_rate_percent}%)` : ''}
                    </div>
                  </div>
                </div>

                {/* Diagnostic Banner */}
                {verdict.type !== 'success' ? (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: verdict.bg,
                      border: `1px solid ${verdict.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.75rem',
                    }}
                  >
                    {verdict.icon}
                    <span style={{ fontWeight: 600, color: verdict.color }}>{verdict.title}:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{verdict.desc}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '2px' }}>
                    <CheckCircle2 size={13} style={{ opacity: 0.6 }} />
                    <span>Pemutaran stabil tanpa kendala decoder.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
