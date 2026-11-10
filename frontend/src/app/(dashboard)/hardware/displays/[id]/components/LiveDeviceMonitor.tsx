'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity, Clipboard, Pause, Play, Radio, Terminal } from 'lucide-react';
import { formatIndonesianDateTime } from './formatIndonesianDateTime';

type Zone = {
  zoneId?: string;
  kind?: string;
  mediaId?: string;
  mediaName?: string;
  state?: string;
  transport?: string;
  codec?: string;
  resolution?: string;
  bitrateKbps?: number;
  droppedFrames?: number;
  lastError?: string;
  bufferedDurationMs?: number;
  playbackState?: string;
};

type LogLine = {
  timestampMs?: number;
  level?: string;
  tag?: string;
  message?: string;
};

type DiagnosticsEvent = {
  diagnostics?: {
    timestampMs?: number;
    cpuPercent?: number;
    memoryPercent?: number;
    heapUsedMb?: number;
    heapMaxMb?: number;
    temperatureC?: number;
    lastCrashTimestampMs?: number;
    lastCrashSummary?: string;
    zonesList?: Zone[];
  };
  logs?: { linesList?: LogLine[] };
};

type Sample = { timestampMs: number; cpu: number; memory: number };

function Speedometer({ label, value, color }: { label: string; value?: number; color: string }) {
  const percentage = value == null ? 0 : Math.min(100, Math.max(0, value));
  return (
    <div style={{ minWidth: 0, padding: '14px 16px 10px', borderRadius: 10, background: 'var(--bg-surface-elevated)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
        <span>{label}</span>
        <span aria-label={value == null ? `${label} belum tersedia` : `${label} ${percentage.toFixed(1)} persen`} style={{ color, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums' }}>
          {value == null ? '--' : `${percentage.toFixed(1)}%`}
        </span>
      </div>
      <svg viewBox="0 0 180 122" role="img" aria-label={`${label}: ${percentage.toFixed(1)} persen`} style={{ display: 'block', width: '100%', maxWidth: 280, height: 146, margin: '4px auto -4px' }}>
        <path d="M 18 102 A 72 72 0 0 1 162 102" fill="none" stroke="var(--border-strong)" strokeWidth="13" strokeLinecap="round" />
        <path
          d="M 18 102 A 72 72 0 0 1 162 102"
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${percentage} 100`}
          style={{ filter: `drop-shadow(0 0 5px ${color})`, transition: 'stroke-dasharray 500ms ease' }}
        />
        {[0, 50, 100].map((tick) => {
          const angle = Math.PI - (Math.PI * tick) / 100;
          const x1 = 90 + Math.cos(angle) * 55;
          const y1 = 102 - Math.sin(angle) * 55;
          const x2 = 90 + Math.cos(angle) * 63;
          const y2 = 102 - Math.sin(angle) * 63;
          const tx = 90 + Math.cos(angle) * 83;
          const ty = 102 - Math.sin(angle) * 83 + 4;
          return (
            <g key={tick}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-muted)" strokeWidth="1.5" />
              <text x={tx} y={ty} fill="var(--text-muted)" fontSize="9" textAnchor="middle">{tick}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: -4 }}>0–100%</div>
    </div>
  );
}

function PerformanceChart({ samples }: { samples: Sample[] }) {
  const left = 42;
  const right = 624;
  const top = 14;
  const bottom = 164;
  const x = (index: number) => samples.length < 2 ? (left + right) / 2 : left + (index * (right - left)) / (samples.length - 1);
  const y = (value: number) => bottom - (Math.min(100, Math.max(0, value)) / 100) * (bottom - top);
  const path = (key: 'cpu' | 'memory') => samples.map((sample, index) =>
    `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(sample[key])}`
  ).join(' ');
  const latest = samples[samples.length - 1];

  return (
    <div style={{ padding: '12px 12px 10px', borderRadius: 10, background: 'var(--bg-surface-elevated)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '0 0 8px 34px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
        <span><i style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: 'var(--accent-cyan)', marginRight: 6 }} />CPU</span>
        <span><i style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: 'var(--accent-emerald)', marginRight: 6 }} />RAM</span>
      </div>
      <svg viewBox="0 0 640 180" role="img" aria-label="Grafik tren CPU dan RAM 60 sampel terakhir" style={{ display: 'block', width: '100%', height: 'auto', minHeight: 150 }}>
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line x1={left} y1={y(tick)} x2={right} y2={y(tick)} stroke="var(--border-subtle)" strokeDasharray="4 5" />
            <text x={left - 8} y={y(tick) + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end">{tick}%</text>
          </g>
        ))}
        {samples.length > 1 && [0, Math.floor((samples.length - 1) / 2), samples.length - 1].map((index) => (
          <line key={`v-${index}`} x1={x(index)} y1={top} x2={x(index)} y2={bottom} stroke="var(--border-subtle)" strokeDasharray="2 6" />
        ))}
        {samples.length > 1 ? (
          <>
            <path d={path('memory')} fill="none" stroke="var(--accent-emerald)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <path d={path('cpu')} fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {latest && (['memory', 'cpu'] as const).map((key) => (
              <circle key={key} cx={x(samples.length - 1)} cy={y(latest[key])} r="4" fill={`var(--accent-${key === 'cpu' ? 'cyan' : 'emerald'})`} stroke="var(--bg-surface-elevated)" strokeWidth="2">
                <title>{`${key === 'cpu' ? 'CPU' : 'RAM'} ${latest[key].toFixed(1)}% · ${formatIndonesianDateTime(latest.timestampMs)}`}</title>
              </circle>
            ))}
          </>
        ) : (
          <text x="333" y="95" textAnchor="middle" fill="var(--text-muted)" fontSize="12">Menunggu sampel berikutnya…</text>
        )}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', padding: '2px 4px 0 34px', color: 'var(--text-muted)', fontSize: '0.68rem', fontVariantNumeric: 'tabular-nums' }}>
        <span>{samples[0] ? formatIndonesianDateTime(samples[0].timestampMs) : '--'}</span>
        <span>{latest ? formatIndonesianDateTime(latest.timestampMs) : '--'}</span>
      </div>
      <p style={{ margin: '8px 0 0 34px', color: 'var(--text-muted)', fontSize: '0.68rem' }}>
        {samples.length} sampel · pembaruan setiap 2 detik
      </p>
    </div>
  );
}

function sessionToken(): string {
  try {
    return JSON.parse(localStorage.getItem('dkasigma_session') || '{}').token || '';
  } catch {
    return '';
  }
}

export default function LiveDeviceMonitor({ deviceId }: { deviceId: string }) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsEvent['diagnostics']>();
  const [lastDiagnosticsReceivedAt, setLastDiagnosticsReceivedAt] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [samples, setSamples] = useState<Sample[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [level, setLevel] = useState('ALL');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setConnected(false);

    const readStream = async () => {
      while (active) {
        try {
          setError('');
          const token = sessionToken();
          const response = await fetch(
            `/api/grpc/distribution/stream/WatchDeviceDiagnostics?deviceId=${encodeURIComponent(deviceId)}`,
            {
              headers: token ? { authorization: `Bearer ${token}` } : {},
              signal: controller.signal,
            }
          );
          if (!response.ok || !response.body) {
            throw new Error(`HTTP ${response.status}`);
          }
          setConnected(true);
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (active) {
            const { done, value } = await reader.read();
            buffer += decoder.decode(value, { stream: !done });
            let boundary = buffer.indexOf('\n\n');
            while (boundary >= 0) {
              const record = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);
              const eventName = record.match(/^event:\s*(.+)$/m)?.[1];
              const data = record.split(/\r?\n/).find((line) => line.startsWith('data:'))?.slice(5).trim();
              if (eventName === 'error') throw new Error('Stream diagnostik terputus');
              if (data) {
                const event = JSON.parse(data) as DiagnosticsEvent;
                if (event.diagnostics) {
                  setDiagnostics(event.diagnostics);
                  setLastDiagnosticsReceivedAt(Date.now());
                  setSamples((previous) => [
                    ...previous,
                    {
                      timestampMs: event.diagnostics?.timestampMs || Date.now(),
                      cpu: event.diagnostics?.cpuPercent || 0,
                      memory: event.diagnostics?.memoryPercent || 0,
                    },
                  ].slice(-60));
                }
                const newLogs = event.logs?.linesList || [];
                if (!pausedRef.current && newLogs.length) {
                  setLogs((previous) => [...previous, ...newLogs].slice(-500));
                }
              }
              boundary = buffer.indexOf('\n\n');
            }
            if (done) break;
          }
          if (active) throw new Error('Stream berakhir');
        } catch (cause) {
          if (!active) break;
          setConnected(false);
          setError(cause instanceof Error ? cause.message : 'Koneksi diagnostik gagal');
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    };

    void readStream();
    return () => {
      active = false;
      controller.abort();
    };
  }, [deviceId]);

  useEffect(() => {
    const container = logContainerRef.current;
    if (!paused && container) container.scrollTop = container.scrollHeight;
  }, [logs, paused]);

  const filteredLogs = level === 'ALL' ? logs : logs.filter((line) => line.level === level);
  const playerStale = lastDiagnosticsReceivedAt > 0 && nowMs - lastDiagnosticsReceivedAt > 10_000;
  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(filteredLogs.map((line) =>
        `${line.timestampMs ? formatIndonesianDateTime(line.timestampMs) : '-'} ${line.level || ''} ${line.tag || ''}: ${line.message || ''}`
      ).join('\n'));
      setError('');
    } catch {
      setError('Tidak dapat menyalin log dari browser ini');
    }
  };

  return (
    <section className="card-elevated" style={{ padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={17} style={{ color: 'var(--primary-500)' }} />
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700 }}>Monitor Perangkat Realtime</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>CPU, memori, status zona, dan log proses aplikasi</p>
          </div>
        </div>
        <span style={{ color: playerStale ? 'var(--accent-amber)' : connected ? 'var(--accent-emerald)' : 'var(--text-muted)', fontSize: '0.75rem' }}>
          {playerStale ? '● Player tidak merespons' : connected ? '● Live' : '○ Menghubungkan'}
          <span style={{ display: 'block', marginTop: 4, textAlign: 'right', fontSize: '0.65rem', fontVariantNumeric: 'tabular-nums' }}>
            {diagnostics?.timestampMs ? formatIndonesianDateTime(diagnostics.timestampMs) : 'Menunggu data'}
          </span>
        </span>
      </header>

      {playerStale ? (
        <div role="status" style={{ padding: '10px 12px', marginBottom: 14, borderRadius: 8, background: 'var(--bg-surface-elevated)', border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)', fontSize: '0.76rem' }}>
          Diagnostik player tidak diperbarui lebih dari 10 detik. Perangkat mungkin crash atau kehilangan koneksi.
        </div>
      ) : null}

      {diagnostics?.lastCrashTimestampMs ? (
        <div role="alert" style={{ padding: '12px 14px', marginBottom: 14, borderRadius: 8, background: 'var(--bg-surface-elevated)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)' }}>
          <strong style={{ display: 'block', fontSize: '0.8rem' }}>Crash aplikasi terdeteksi</strong>
          <span style={{ display: 'block', marginTop: 4, fontSize: '0.75rem' }}>{diagnostics.lastCrashSummary || 'Player mengalami crash.'}</span>
          <time style={{ display: 'block', marginTop: 4, fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }} dateTime={new Date(diagnostics.lastCrashTimestampMs).toISOString()}>
            {formatIndonesianDateTime(diagnostics.lastCrashTimestampMs)}
          </time>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Speedometer label="CPU proses" value={diagnostics?.cpuPercent} color="var(--accent-cyan)" />
        <Speedometer label="RAM perangkat" value={diagnostics?.memoryPercent} color="var(--accent-emerald)" />
        <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
          <div>Heap aplikasi</div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {diagnostics ? `${diagnostics.heapUsedMb || 0} / ${diagnostics.heapMaxMb || 0} MB` : '--'}
          </strong>
          <div style={{ marginTop: 6 }}>Suhu baterai: {diagnostics?.temperatureC ? `${diagnostics.temperatureC.toFixed(1)}°C` : '--'}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700, marginBottom: 8 }}>Tren Performa</h3>
        <PerformanceChart samples={samples} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700, marginBottom: 8 }}>Konten & Status Zona</h3>
        {(diagnostics?.zonesList || []).length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Menunggu data zona dari player.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {diagnostics?.zonesList?.map((zone, index) => (
              <div key={`${zone.zoneId || zone.mediaId || index}`} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>{zone.mediaName || zone.kind || 'Zona'}</strong>
                  <span style={{ color: zone.lastError ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontSize: '0.72rem' }}>
                    {zone.state || 'UNKNOWN'}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 4, lineHeight: 1.6 }}>
                  {[zone.kind, zone.transport, zone.resolution, zone.codec, zone.bitrateKbps ? `${zone.bitrateKbps} Kbps` : ''].filter(Boolean).join(' · ')}
                  {zone.droppedFrames ? ` · ${zone.droppedFrames} frame drop` : ''}
                  {zone.bufferedDurationMs != null ? ` · Buffer ${(zone.bufferedDurationMs / 1000).toFixed(2)} dtk` : ''}
                  {zone.playbackState ? ` · ExoPlayer ${zone.playbackState}` : ''}
                </div>
                {zone.lastError && <p style={{ color: 'var(--accent-rose)', fontSize: '0.72rem', marginTop: 4 }}>{zone.lastError}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700 }}>
            <Terminal size={15} /> Logcat aplikasi
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select aria-label="Filter level log" value={level} onChange={(event) => setLevel(event.target.value)} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 6px' }}>
              {['ALL', 'V', 'D', 'I', 'W', 'E', 'F'].map((option) => <option key={option}>{option}</option>)}
            </select>
            <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Lanjutkan log' : 'Jeda log'} title={paused ? 'Lanjutkan' : 'Jeda'} style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 5 }}>
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button type="button" onClick={copyLogs} aria-label="Salin log" title="Salin log" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 5 }}>
              <Clipboard size={14} />
            </button>
          </div>
        </div>
        <div ref={logContainerRef} style={{ height: 220, overflow: 'auto', padding: 10, borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: '0.7rem' }}>
          {filteredLogs.length ? filteredLogs.map((line, index) => (
            <div key={`${line.timestampMs}-${index}`} style={{ color: line.level === 'E' || line.level === 'F' ? 'var(--accent-rose)' : line.level === 'W' ? 'var(--accent-amber)' : 'var(--text-secondary)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {line.timestampMs ? formatIndonesianDateTime(line.timestampMs) : '-'} {line.level} {line.tag}: {line.message}
            </div>
          )) : <span style={{ color: 'var(--text-muted)' }}>Belum ada log; log hanya dikirim saat monitor ini aktif.</span>}
        </div>
      </div>

      {error && <p role="status" style={{ color: 'var(--accent-amber)', fontSize: '0.75rem', marginTop: 8 }}><Radio size={13} style={{ verticalAlign: 'middle' }} /> {error}</p>}
    </section>
  );
}
