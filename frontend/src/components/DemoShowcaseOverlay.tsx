'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ShieldCheck,
  Radio,
  Layers,
  Cpu,
  Monitor,
  Building2,
  ArrowRight,
  CheckCircle2,
  WifiOff,
  Camera,
  Bell,
  Tv,
} from 'lucide-react';

interface DemoShowcaseOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

type StageAct = 'ignition' | 'pillars' | 'finale';

interface PillarSlide {
  id: string;
  number: string;
  tag: string;
  title: string;
  subtitle: string;
  accent: string;
  metrics: { label: string; value: string }[];
  bullets: string[];
  visualType: 'offline' | 'webrtc' | 'studio' | 'iot' | 'control' | 'enterprise';
}

const PILLARS: PillarSlide[] = [
  {
    id: 'offline-first',
    number: '01',
    tag: 'RELIABILITY',
    title: 'Offline-First & Anti Layar Hitam',
    subtitle:
      'Setiap aset media diverifikasi dengan hash SHA-256 sebelum tayang. Jadwal berikutnya diunduh diam-diam di latar belakang sehingga pergantian konten berjalan 0ms tanpa memblokir layar.',
    accent: 'var(--accent-emerald)',
    metrics: [
      { label: 'Integritas Aset', value: 'SHA-256' },
      { label: 'Transisi Jadwal', value: '0 ms' },
      { label: 'Ketahanan Offline', value: '100%' },
    ],
    bullets: [
      'Verifikasi integritas berkas di disk sebelum aktivasi manifest',
      'Pre-download jadwal mendatang tanpa mengganggu tayangan aktif',
      'Tetap memutar promosi resolusi penuh meski internet cabang terputus',
    ],
    visualType: 'offline',
  },
  {
    id: 'webrtc-live',
    number: '02',
    tag: 'LOW LATENCY STREAM',
    title: 'Siaran Langsung Sub-Detik (150–350 ms)',
    subtitle:
      'Pipeline normalisasi otomatis Zero-B-Frame & Opus mengubah siaran RTMP/SRT dari OBS Studio menjadi WebRTC UDP dan RTSP tanpa pengaturan rumit.',
    accent: 'var(--accent-cyan)',
    metrics: [
      { label: 'Latensi WebRTC', value: '150–350 ms' },
      { label: 'Transisi Status', value: '< 50 ms' },
      { label: 'Protokol', value: 'WHEP / RTSP' },
    ],
    bullets: [
      'Auto-normalisasi H.264 Baseline 0 B-Frame & audio Opus 48 kHz',
      'Pemutar adaptif dengan Two-Tier Live-Edge Sync anti-slomo',
      'Tampilan Siaran Offline glassmorphism yang rapi saat encoder standby',
    ],
    visualType: 'webrtc',
  },
  {
    id: 'studio-canvas',
    number: '03',
    tag: 'MULTI-ZONE STUDIO',
    title: 'Editor Tata Letak Multi-Zona & Timeline Presisi',
    subtitle:
      'Susun video split-screen, running text, jam digital, webview, album foto, hingga siaran langsung dalam satu kanvas bebas atur yang tersinkronisasi per detik.',
    accent: 'var(--primary-500)',
    metrics: [
      { label: 'Split-Screen', value: 'Zero-Bleed' },
      { label: 'Resolusi Kanvas', value: '4K Ready' },
      { label: 'Penjadwalan', value: 'Kalender' },
    ],
    bullets: [
      'Isolasi zona presisi sehingga video kiri dan kanan tidak saling menimpa',
      'Timeline multi-layer dengan pengaturan durasi dan prioritas jadwal',
      'Distribusi serentak ke puluhan hingga ratusan layar via Grup Layar',
    ],
    visualType: 'studio',
  },
  {
    id: 'iot-queue',
    number: '04',
    tag: 'SMART QUEUE & IOT',
    title: 'Tombol IoT ESP32 & Audio Antrean Bebas Tabrakan',
    subtitle:
      'Panggil nomor antrean dari tombol fisik nirkabel di meja kasir dengan respon di bawah 0.1 detik, lengkap dengan chime melodis dan suara TTS Bahasa Indonesia yang santun.',
    accent: 'var(--accent-amber)',
    metrics: [
      { label: 'Respon Tombol', value: '< 0.1 Detik' },
      { label: 'Audio Ducking', value: '-18 dB' },
      { label: 'Antrean Suara', value: 'FIFO Queue' },
    ],
    bullets: [
      'Volume video iklan otomatis meredup halus (60ms) saat panggilan berbunyi',
      'Antrean audio FIFO mencegah suara panggilan kasir saling bertabrakan',
      'Debounce tombol fisik mencegah panggilan ganda akibat salah tekan',
    ],
    visualType: 'iot',
  },
  {
    id: 'control-telemetry',
    number: '05',
    tag: 'REMOTE TELEMETRY',
    title: 'Smart Control Hub & Live Screenshot Nyata',
    subtitle:
      'Pantau kesehatan CPU, RAM, suhu, serta ambil tangkapan layar langsung (termasuk frame video aktif) dari kantor pusat, bahkan untuk perangkat TV Android 1 GB RAM.',
    accent: 'var(--accent-violet)',
    metrics: [
      { label: 'Minimum RAM', value: '1 GB Ready' },
      { label: 'Kendali Daya', value: 'Wake / Sleep' },
      { label: 'Audit Visual', value: 'Live Frame' },
    ],
    bullets: [
      'Live Screenshot menangkap video, live stream, ticker, dan widget sekaligus',
      'Profil adaptif otomatis untuk perangkat spesifikasi rendah hingga tinggi',
      'Kontrol jarak jauh: Sinkronisasi, Restart Player, Clear Cache, & Sleep',
    ],
    visualType: 'control',
  },
  {
    id: 'enterprise-ota',
    number: '06',
    tag: 'ENTERPRISE SCALE',
    title: 'Multi-Tenancy, Siaran Darurat & Silent OTA',
    subtitle:
      'Kelola banyak merek dan cabang dari satu pusat kendali dengan isolasi data aman, interupsi siaran darurat instan, dan pembaruan APK otomatis tanpa teknisi lapangan.',
    accent: 'var(--accent-rose)',
    metrics: [
      { label: 'Arsitektur', value: 'Multi-Tenant' },
      { label: 'Siaran Darurat', value: 'Instan' },
      { label: 'Update APK', value: 'Silent OTA' },
    ],
    bullets: [
      'Isolasi konten dan hak akses per korporasi dan cabang (RBAC)',
      'Emergency Broadcast menginterupsi seluruh layar toko dalam hitungan detik',
      'Distribusi pembaruan APK terpantau per perangkat secara otomatis',
    ],
    visualType: 'enterprise',
  },
];

function playKeynoteTone(type: 'ignition' | 'step' | 'finale') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const freqs =
      type === 'ignition'
        ? [261.63, 329.63, 392.0, 523.25]
        : type === 'finale'
          ? [329.63, 440.0, 523.25, 659.25]
          : [523.25, 659.25];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(type === 'step' ? 0.035 : 0.045, now + idx * 0.045 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + (type === 'step' ? 0.32 : 0.95));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 1.0);
    });

    setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 1200);
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
}

function PillarVisual({ slide }: { slide: PillarSlide }) {
  return (
    <div
      className="card-elevated"
      style={{
        position: 'relative',
        borderRadius: '20px',
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        padding: '24px',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        boxShadow: 'var(--card-shadow-hover)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${slide.accent} 0%, transparent 70%)`,
          opacity: 0.18,
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: slide.accent,
            textTransform: 'uppercase',
          }}
        >
          {slide.tag}
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
          }}
        >
          HNDSIGNAGE // {slide.number}
        </span>
      </div>

      <div style={{ position: 'relative', zIndex: 1, margin: '20px 0' }}>
        {slide.visualType === 'offline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                <WifiOff size={16} style={{ color: 'var(--accent-amber)' }} />
                Simulasi Jaringan Terputus
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>Playback Tetap Aktif</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                <ShieldCheck size={16} style={{ color: 'var(--accent-emerald)' }} />
                SHA-256 Disk Cache Terverifikasi
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>0 ms Switch</span>
            </div>
          </div>
        )}

        {slide.visualType === 'webrtc' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>INGEST</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>OBS / SRT</div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--accent-cyan)' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PLAYBACK</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>WebRTC 150ms</div>
              </div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Auto-Normalisasi: <strong style={{ color: 'var(--text-primary)' }}>H.264 0 B-Frame + Opus 48 kHz</strong>
            </div>
          </div>
        )}

        {slide.visualType === 'studio' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '96px 34px', gap: '8px', padding: '10px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ borderRadius: '8px', background: 'rgba(59, 130, 246, 0.14)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary-500)' }}>
              Zona Video Kiri
            </div>
            <div style={{ borderRadius: '8px', background: 'rgba(16, 185, 129, 0.14)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
              Zona Video Kanan
            </div>
            <div style={{ gridColumn: '1 / -1', borderRadius: '6px', background: 'var(--primary-600)', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.72rem', fontWeight: 600, color: '#fff' }}>
              Running Text Promo &bull; Jam Digital &bull; Antrean
            </div>
          </div>
        )}

        {slide.visualType === 'iot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Cpu size={17} style={{ color: 'var(--accent-amber)' }} />
                ESP32 Queue Button
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-amber)' }}>&lt; 0.1s Trigger</span>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              &ldquo;Nomor antrean <strong style={{ color: 'var(--text-primary)' }}>B-05</strong>, silakan menuju Loket 2&rdquo;
            </div>
          </div>
        )}

        {slide.visualType === 'control' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.28)' }}>
              <Camera size={18} style={{ color: 'var(--accent-violet)', marginBottom: '8px' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Live Screenshot</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Video + Widget Nyata</div>
            </div>
            <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
              <Monitor size={18} style={{ color: 'var(--primary-500)', marginBottom: '8px' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Wake / Sleep</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Kendali Daya Jarak Jauh</div>
            </div>
          </div>
        )}

        {slide.visualType === 'enterprise' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.28)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Bell size={16} style={{ color: 'var(--accent-rose)' }} />
                Siaran Darurat Seketika
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-rose)' }}>All Screens</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Building2 size={16} style={{ color: 'var(--primary-500)' }} />
                Multi-Tenancy &amp; Silent OTA
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-500)' }}>Enterprise</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', position: 'relative', zIndex: 1 }}>
        {slide.metrics.map((m) => (
          <div
            key={m.label}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DemoShowcaseOverlay({ isOpen, onClose }: DemoShowcaseOverlayProps) {
  const [act, setAct] = useState<StageAct>('ignition');
  const [slideIndex, setSlideIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!isOpen) return;
    setAct('ignition');
    setSlideIndex(0);
    setAutoPlay(false);
    if (soundEnabledRef.current) {
      playKeynoteTone('ignition');
    }
    const timer = window.setTimeout(() => {
      setAct((prev) => (prev === 'ignition' ? 'pillars' : prev));
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const goNext = useCallback(() => {
    if (act === 'ignition') {
      setAct('pillars');
      if (soundEnabledRef.current) playKeynoteTone('step');
      return;
    }
    if (act === 'pillars') {
      if (slideIndex < PILLARS.length - 1) {
        setSlideIndex((i) => i + 1);
        if (soundEnabledRef.current) playKeynoteTone('step');
      } else {
        setAct('finale');
        setAutoPlay(false);
        if (soundEnabledRef.current) playKeynoteTone('finale');
      }
      return;
    }
    onClose();
  }, [act, slideIndex, onClose]);

  const goPrev = useCallback(() => {
    if (act === 'finale') {
      setAct('pillars');
      setSlideIndex(PILLARS.length - 1);
      if (soundEnabledRef.current) playKeynoteTone('step');
      return;
    }
    if (act === 'pillars' && slideIndex > 0) {
      setSlideIndex((i) => i - 1);
      if (soundEnabledRef.current) playKeynoteTone('step');
    }
  }, [act, slideIndex]);

  useEffect(() => {
    if (!isOpen || !autoPlay || act !== 'pillars') return;
    const interval = window.setInterval(() => {
      goNext();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isOpen, autoPlay, act, goNext]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, goNext, goPrev, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const currentSlide = PILLARS[slideIndex];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="HNDSignage Grand Launch Showcase"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 32px',
        overflow: 'hidden',
      }}
    >
      {/* Atmospheric HDR Stage Glow */}
      <div
        aria-hidden="true"
        className="demo-spotlight-bg"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.22), transparent 45%), radial-gradient(circle at 80% 75%, rgba(6, 182, 212, 0.16), transparent 45%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top HUD */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
            }}
          >
            <Tv size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>HNDSignage</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Product Launch Showcase
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {act === 'pillars' && (
            <button
              type="button"
              onClick={() => setAutoPlay((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '9999px',
                border: '1px solid var(--border-subtle)',
                background: autoPlay ? 'rgba(37, 99, 235, 0.16)' : 'var(--bg-surface-elevated)',
                color: autoPlay ? 'var(--primary-500)' : 'var(--text-primary)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {autoPlay ? <Pause size={13} /> : <Play size={13} />}
              <span>{autoPlay ? 'Auto-Play Aktif' : 'Auto-Play'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            aria-label={soundEnabled ? 'Matikan suara efek' : 'Nyalakan suara efek'}
            title={soundEnabled ? 'Matikan suara efek' : 'Nyalakan suara efek'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Demo Mode"
            title="Tutup (Esc)"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Main Stage */}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '1160px', width: '100%', margin: '0 auto' }}>
        {act === 'ignition' && (
          <div className="demo-slide-enter" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '760px' }}>
            <div style={{ position: 'relative', width: '96px', height: '96px', display: 'grid', placeItems: 'center' }}>
              <div
                className="demo-pulse-ring"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid rgba(56, 189, 248, 0.5)',
                }}
              />
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 12px 40px rgba(37, 99, 235, 0.55)',
                }}
              >
                <Radio size={34} color="#fff" />
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.18em', color: '#38bdf8', textTransform: 'uppercase' }}>
              Enterprise Digital Signage Platform
            </div>

            <h1
              className="demo-shimmer-text"
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 4rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.08,
                margin: 0,
              }}
            >
              HNDSignage
            </h1>

            <p style={{ fontSize: '1.08rem', color: 'var(--text-secondary)', maxWidth: '580px', lineHeight: 1.6, margin: 0 }}>
              Satu platform terpadu untuk visual promosi multi-zona, siaran langsung sub-detik, dan sistem antrean IoT skala enterprise.
            </p>

            <button
              type="button"
              onClick={() => setAct('pillars')}
              style={{
                marginTop: '8px',
                padding: '10px 22px',
                borderRadius: '9999px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Mulai Presentasi</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {act === 'pillars' && (
          <div
            key={currentSlide.id}
            className="demo-slide-enter"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '40px',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: currentSlide.accent,
                  }}
                >
                  KEUNGGULAN {currentSlide.number} / 0{PILLARS.length}
                </span>
              </div>

              <h2 style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, margin: 0, color: 'var(--text-primary)' }}>
                {currentSlide.title}
              </h2>

              <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                {currentSlide.subtitle}
              </p>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                {currentSlide.bullets.map((b) => (
                  <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    <CheckCircle2 size={17} style={{ color: currentSlide.accent, flexShrink: 0, marginTop: '2px' }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <PillarVisual slide={currentSlide} />
          </div>
        )}

        {act === 'finale' && (
          <div className="demo-slide-enter" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '680px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.16)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                display: 'grid',
                placeItems: 'center',
                color: '#10b981',
              }}
            >
              <CheckCircle2 size={34} />
            </div>

            <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.16em', color: '#10b981', textTransform: 'uppercase' }}>
              System Ready to Perform
            </div>

            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>
              Siap Mengudara di Setiap Layar
            </h2>

            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Seluruh layanan CMS gRPC, Streaming Relay, Android Player, dan IoT Queue Engine siap didemonstrasikan secara langsung.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary"
                style={{ padding: '12px 26px', borderRadius: '9999px', fontSize: '0.92rem', fontWeight: 700 }}
              >
                <span>Masuk ke Dashboard Operasional</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSlideIndex(0);
                  setAct('pillars');
                }}
                style={{
                  padding: '12px 20px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ulangi Presentasi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          Navigasi: &larr; / &rarr; / Spasi &bull; Esc untuk keluar
        </div>

        {act === 'pillars' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {PILLARS.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Ke slide ${idx + 1}: ${p.title}`}
                onClick={() => setSlideIndex(idx)}
                style={{
                  width: idx === slideIndex ? '26px' : '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: idx === slideIndex ? currentSlide.accent : 'var(--border-strong)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={goPrev}
            disabled={act === 'ignition' || (act === 'pillars' && slideIndex === 0)}
            aria-label="Sebelumnya"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              display: 'grid',
              placeItems: 'center',
              cursor: act === 'ignition' || (act === 'pillars' && slideIndex === 0) ? 'not-allowed' : 'pointer',
              opacity: act === 'ignition' || (act === 'pillars' && slideIndex === 0) ? 0.35 : 1,
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Berikutnya"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'var(--primary-600)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
