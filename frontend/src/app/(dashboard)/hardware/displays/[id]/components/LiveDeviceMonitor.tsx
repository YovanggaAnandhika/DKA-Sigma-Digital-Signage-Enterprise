'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity, Clipboard, Pause, Play, Radio, Terminal } from 'lucide-react';

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
    zonesList?: Zone[];
  };
  logs?: { linesList?: LogLine[] };
};

type Sample = { cpu: number; memory: number };

function Sparkline({ values, label }: { values: number[]; label: string }) {
  const points = values.map((value, index) => {
    const x = values.length < 2 ? 60 : (index * 120) / (values.length - 1);
    return `${x},${58 - (Math.min(100, Math.max(0, value)) * 0.52)}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 120 60" role="img" aria-label={`${label} 60 sampel terakhir`} style={{ width: '100%', height: 54 }}>
      <polyline points={points} fill="none" stroke="var(--primary-500)" strokeWidth="2" />
    </svg>
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
  const [samples, setSamples] = useState<Sample[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [level, setLevel] = useState('ALL');
  const logEndRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

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
                  setSamples((previous) => [
                    ...previous,
                    {
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
    if (!paused) logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, paused]);

  const filteredLogs = level === 'ALL' ? logs : logs.filter((line) => line.level === level);
  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(filteredLogs.map((line) =>
        `${new Date(line.timestampMs || 0).toLocaleTimeString()} ${line.level || ''} ${line.tag || ''}: ${line.message || ''}`
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
        <span style={{ color: connected ? 'var(--accent-emerald)' : 'var(--text-muted)', fontSize: '0.75rem' }}>
          {connected ? '● Live' : '○ Menghubungkan'}
        </span>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        {([
          ['CPU proses', diagnostics?.cpuPercent, samples.map((sample) => sample.cpu)],
          ['RAM perangkat', diagnostics?.memoryPercent, samples.map((sample) => sample.memory)],
        ] as const).map(([label, value, history]) => (
          <div key={label} style={{ padding: 12, borderRadius: 8, background: 'var(--bg-surface-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              <span>{label}</span>
              <strong style={{ color: 'var(--text-primary)' }}>{value == null ? '--' : `${value.toFixed(1)}%`}</strong>
            </div>
            <Sparkline values={history} label={label} />
          </div>
        ))}
        <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
          <div>Heap aplikasi</div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {diagnostics ? `${diagnostics.heapUsedMb || 0} / ${diagnostics.heapMaxMb || 0} MB` : '--'}
          </strong>
          <div style={{ marginTop: 6 }}>Suhu baterai: {diagnostics?.temperatureC ? `${diagnostics.temperatureC.toFixed(1)}°C` : '--'}</div>
        </div>
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
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 4 }}>
                  {[zone.kind, zone.transport, zone.resolution, zone.codec, zone.bitrateKbps ? `${zone.bitrateKbps} Kbps` : ''].filter(Boolean).join(' · ')}
                  {zone.droppedFrames ? ` · ${zone.droppedFrames} frame drop` : ''}
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
        <div style={{ height: 220, overflow: 'auto', padding: 10, borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: '0.7rem' }}>
          {filteredLogs.length ? filteredLogs.map((line, index) => (
            <div key={`${line.timestampMs}-${index}`} style={{ color: line.level === 'E' || line.level === 'F' ? 'var(--accent-rose)' : line.level === 'W' ? 'var(--accent-amber)' : 'var(--text-secondary)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {new Date(line.timestampMs || 0).toLocaleTimeString()} {line.level} {line.tag}: {line.message}
            </div>
          )) : <span style={{ color: 'var(--text-muted)' }}>Belum ada log; log hanya dikirim saat monitor ini aktif.</span>}
          <div ref={logEndRef} />
        </div>
      </div>

      {error && <p role="status" style={{ color: 'var(--accent-amber)', fontSize: '0.75rem', marginTop: 8 }}><Radio size={13} style={{ verticalAlign: 'middle' }} /> {error}</p>}
    </section>
  );
}
