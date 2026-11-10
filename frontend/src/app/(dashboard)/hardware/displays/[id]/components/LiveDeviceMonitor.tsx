'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity, Clipboard, Pause, Play, Radio, Terminal } from 'lucide-react';
import { cleanMediaTitle } from '../context/DisplayDetailContext';
import { formatIndonesianDateTime } from './formatIndonesianDateTime';

type Zone = {
  zoneId?: string;
  kind?: string;
  mediaId?: string;
  mediaName?: string;
  state?: string;
  resolution?: string;
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
    heapUsedMb?: number;
    heapMaxMb?: number;
    lastCrashTimestampMs?: number;
    lastCrashSummary?: string;
    zonesList?: Zone[];
  };
  logs?: { linesList?: LogLine[] };
};

function zoneKindLabel(kind?: string): string {
  switch (kind?.toUpperCase()) {
    case 'VIDEO': return 'Video';
    case 'LIVE': return 'Siaran langsung';
    case 'IMAGE': return 'Gambar';
    case 'QUEUE': return 'Antrean';
    default: return kind || 'Konten';
  }
}

function zoneTitle(zone: Zone): string {
  if (!zone.mediaName) return zoneKindLabel(zone.kind);
  return cleanMediaTitle(zone.mediaName).replace(/[_-]+/g, ' ').replace(/\.[^.]+$/, '') || zoneKindLabel(zone.kind);
}

function zoneStatus(zone: Zone): { label: string; color: string } {
  if (zone.lastError) return { label: 'Perlu diperiksa', color: 'var(--accent-rose)' };
  switch ((zone.state || zone.playbackState || '').toUpperCase()) {
    case 'PLAYING': return { label: 'Sedang diputar', color: 'var(--accent-emerald)' };
    case 'BUFFERING': return { label: 'Sedang memuat', color: 'var(--accent-amber)' };
    case 'READY': return { label: 'Siap diputar', color: 'var(--accent-cyan)' };
    case 'PAUSED': return { label: 'Dijeda', color: 'var(--text-secondary)' };
    case 'OFFLINE': return { label: 'Siaran offline', color: 'var(--accent-amber)' };
    case 'ERROR': return { label: 'Ada kendala', color: 'var(--accent-rose)' };
    case 'ENDED': return { label: 'Selesai', color: 'var(--text-muted)' };
    case 'IDLE': return { label: 'Menunggu konten', color: 'var(--text-muted)' };
    default: return { label: 'Status belum diketahui', color: 'var(--text-muted)' };
  }
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
            <h2 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700 }}>Diagnostik Player Realtime</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Status pemutaran, memori aplikasi, dan log</p>
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
        <div role="status" style={{ padding: '12px 14px', marginBottom: 14, borderRadius: 8, background: 'var(--bg-surface-elevated)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)' }}>
          <strong style={{ display: 'block', fontSize: '0.8rem' }}>Crash terakhir tercatat</strong>
          <span style={{ display: 'block', marginTop: 4, fontSize: '0.75rem' }}>{diagnostics.lastCrashSummary || 'Player mengalami crash.'}</span>
          <time style={{ display: 'block', marginTop: 4, fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }} dateTime={new Date(diagnostics.lastCrashTimestampMs).toISOString()}>
            {formatIndonesianDateTime(diagnostics.lastCrashTimestampMs)}
          </time>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
          Memori aplikasi: <strong style={{ color: 'var(--text-primary)' }}>
            {diagnostics?.heapUsedMb != null && diagnostics.heapMaxMb != null
              ? `${diagnostics.heapUsedMb} dari ${diagnostics.heapMaxMb} MB`
              : diagnostics ? 'Belum tersedia' : 'Menunggu data'}
          </strong>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700, marginBottom: 8 }}>Yang sedang tampil</h3>
        {(diagnostics?.zonesList || []).length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Belum ada informasi konten yang sedang tampil.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {diagnostics?.zonesList?.map((zone, index) => {
              const status = zoneStatus(zone);
              return (
                <div key={`${zone.zoneId || zone.mediaId || index}`} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.68rem', marginBottom: 3 }}>
                        {zoneKindLabel(zone.kind)} · Zona {index + 1}
                      </span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.82rem', overflowWrap: 'anywhere' }}>
                        {zoneTitle(zone)}
                      </strong>
                    </div>
                    <span style={{ flexShrink: 0, color: status.color, fontSize: '0.72rem', fontWeight: 600 }}>
                      {status.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 8 }}>
                    {zone.bufferedDurationMs != null ? <span>Buffer: {(zone.bufferedDurationMs / 1000).toFixed(1)} dtk</span> : null}
                    {zone.droppedFrames ? <span>Frame terlewat: {zone.droppedFrames}</span> : null}
                    {zone.resolution ? <span>Resolusi: {zone.resolution.replace('x', ' × ')}</span> : null}
                  </div>
                  {zone.lastError ? <p style={{ color: 'var(--accent-rose)', fontSize: '0.72rem', marginTop: 8 }}>{zone.lastError}</p> : null}
                </div>
              );
            })}
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
