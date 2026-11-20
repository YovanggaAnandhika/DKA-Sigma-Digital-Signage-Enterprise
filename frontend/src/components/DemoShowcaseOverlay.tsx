'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { CheckCircle2, ChevronLeft, ChevronRight, X, Volume2, VolumeX } from 'lucide-react';
import { api } from '@/lib/services';

interface DemoShowcaseOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  id: string;
  route: string;
  selector: string;
  stepLabel: string;
  title: string;
  description: string;
}

const BASE_TOUR_STEPS: TourStep[] = [
  {
    id: 'overview',
    route: '/',
    selector: 'main h1',
    stepLabel: 'Langkah 1 dari 10 • Pusat Kendali',
    title: 'Dashboard Ringkasan HNDSignage',
    description:
      'Semua layar Android, jadwal tayang, dan status sistem terpantau real-time dari satu pusat kendali.',
  },
  {
    id: 'overview-chart',
    route: '/',
    selector: 'main .card-elevated',
    stepLabel: 'Langkah 2 dari 10 • Metrik & Grafik',
    title: 'Grafik Aktivitas & Kesehatan Armada',
    description:
      'Pantau tren konektivitas layar, metrik performa, dan status layanan backend secara langsung tanpa refresh manual.',
  },
  {
    id: 'devices',
    route: '/hardware/displays/player',
    selector: 'main table, main .card-elevated',
    stepLabel: 'Langkah 3 dari 10 • Perangkat Layar',
    title: 'Perangkat Layar Terhubung',
    description:
      'Setiap TV Android yang sudah pairing muncul di sini lengkap dengan status Online/Offline, resolusi, dan alamat IP.',
  },
  {
    id: 'iot',
    route: '/hardware/iot/devices',
    selector: 'main .card-elevated, main table',
    stepLabel: 'Langkah 4 dari 10 • Integrasi IoT',
    title: 'Tombol Antrean IoT & Audio Cerdas',
    description:
      'Tombol fisik ESP32 di meja kasir merespon di bawah 0.1 detik dengan chime melodis dan suara TTS tanpa tabrakan.',
  },
  {
    id: 'media',
    route: '/studio/media',
    selector: 'main .card-elevated, main table',
    stepLabel: 'Langkah 5 dari 10 • Pustaka Media',
    title: 'Pustaka Media Offline-First',
    description:
      'Video dan gambar diverifikasi dengan SHA-256 dan disimpan lokal di perangkat, sehingga tetap tayang mulus meski internet putus.',
  },
  {
    id: 'components',
    route: '/studio/components',
    selector: 'main .card-elevated, main table, main > div > div',
    stepLabel: 'Langkah 6 dari 10 • Komponen & Siaran Langsung',
    title: 'Siaran Langsung, Antrean, Jam & Ticker',
    description:
      'Kelola widget Siaran Langsung WebRTC/RTSP sub-detik, Antrean Kasir, Jam Digital, Running Text, WebView, dan Album Foto.',
  },
  {
    id: 'layouts',
    route: '/studio/layouts/data',
    selector: 'main table, main .card-elevated',
    stepLabel: 'Langkah 7 dari 15 • Tata Letak',
    title: 'Daftar Template Tata Letak',
    description:
      'Semua template tata letak tersimpan di sini, lengkap dengan dimensi kanvas, orientasi, jumlah layer, dan status sinkronisasi jadwal.',
  },
  {
    id: 'layout-edit-toolbar',
    route: '/studio/layouts/data',
    selector: 'main header, main button',
    stepLabel: 'Langkah 8 dari 15 • Editor: Toolbar',
    title: 'Toolbar Simpan & Fullscreen',
    description:
      'Simpan setiap perubahan tata letak dengan riwayat versi otomatis, atau aktifkan mode Fullscreen untuk ruang kerja yang lebih lega.',
  },
  {
    id: 'layout-edit-layers',
    route: '/studio/layouts/data',
    selector: 'main aside:first-of-type, main > div > div > div:first-child',
    stepLabel: 'Langkah 9 dari 15 • Editor: Layers & Konten',
    title: 'Panel Layers & Konten Layer',
    description:
      'Kelola daftar lapisan, atur urutan tumpukan, lalu masukkan video, gambar, atau widget melalui tombol tambah Media dan Komponen.',
  },
  {
    id: 'layout-edit-canvas',
    route: '/studio/layouts/data',
    selector: 'main [style*="aspect-ratio"], main > div > div > div:nth-child(2)',
    stepLabel: 'Langkah 10 dari 15 • Editor: Kanvas 16:9',
    title: 'Kanvas Workspace Multi-Zona',
    description:
      'Kanvas desain 1920 kali 1080 bebas atur dengan drag-and-drop. Setiap zona video split-screen terisolasi presisi tanpa saling menimpa.',
  },
  {
    id: 'layout-edit-properties',
    route: '/studio/layouts/data',
    selector: 'main aside:last-of-type, main > div > div > div:last-child',
    stepLabel: 'Langkah 11 dari 15 • Editor: Properti',
    title: 'Panel Properti Layer',
    description:
      'Atur koordinat Posisi X dan Y, Lebar, Tinggi, Z-Index, Preset Posisi seperti Split Kiri atau Kanan, Opacity, serta Overlay Scrim.',
  },
  {
    id: 'layout-edit-timeline',
    route: '/studio/layouts/data',
    selector: 'main > div > div:last-child',
    stepLabel: 'Langkah 12 dari 15 • Editor: Timeline',
    title: 'Timeline Editor Multi-Track',
    description:
      'Atur durasi tayang per detik antar lapisan, jalankan simulasi Play, dan sinkronkan waktu blok konten secara presisi.',
  },
  {
    id: 'schedule',
    route: '/studio/schedules/calendar',
    selector: 'a[href="/studio/layouts/data"], main .card-elevated',
    stepLabel: 'Langkah 13 dari 15 • Assign ke Layar',
    title: 'Jadwalkan & Assign ke Layar Target',
    description:
      'Pilih layout, tentukan jam tayang di kalender rundown, lalu kirim serentak ke layar atau grup layar tertentu.',
  },
  {
    id: 'ota',
    route: '/system/apk',
    selector: 'main .card-elevated, main table, main > div > div',
    stepLabel: 'Langkah 14 dari 15 • Pembaruan OTA',
    title: 'Pembaruan APK Otomatis (Silent OTA)',
    description:
      'Distribusikan pembaruan aplikasi player ke seluruh cabang secara otomatis di latar belakang tanpa teknisi datang ke toko.',
  },
  {
    id: 'display-detail',
    route: '/hardware/displays/player',
    selector: 'main .card-elevated',
    stepLabel: 'Langkah 15 dari 15 • Detail Layar',
    title: 'Smart Control Hub, Metrik & Live Screenshot',
    description:
      'Kendalikan daya layar (Wake/Sleep), Sinkron Konten, Restart, pantau CPU/RAM/Suhu real-time, serta lihat Tangkapan Layar langsung dari TV.',
  },
];

let activeNarrationToken = 0;
let activePauseTimer: number | null = null;

function stopNarration() {
  activeNarrationToken++;
  if (activePauseTimer !== null) {
    window.clearTimeout(activePauseTimer);
    activePauseTimer = null;
  }
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore speechSynthesis errors
  }
}

function pickBestIndonesianFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const idVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('id'));
  if (idVoices.length === 0) return undefined;

  const preferredKeywords = ['gadis', 'google', 'damayanti', 'siti', 'natural', 'online', 'female'];
  for (const kw of preferredKeywords) {
    const match = idVoices.find((v) => v.name.toLowerCase().includes(kw));
    if (match) return match;
  }
  return idVoices[0];
}

function speakNarration(text: string) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    stopNarration();
    const token = activeNarrationToken;

    // Split into natural phrases (commas + sentence endings) for realistic human breath pauses
    const rawParts = text.split(/([,.!?]\s+)/);
    const segments: { text: string; pauseMs: number }[] = [];
    for (let i = 0; i < rawParts.length; i += 2) {
      const phrase = rawParts[i]?.trim();
      const punct = rawParts[i + 1] || '';
      if (phrase) {
        segments.push({
          text: phrase,
          pauseMs: punct.includes(',') ? 180 : 380,
        });
      }
    }

    if (segments.length === 0) return;

    const speakSegment = (idx: number) => {
      if (token !== activeNarrationToken || idx >= segments.length) return;
      const seg = segments[idx];
      const voice = pickBestIndonesianFemaleVoice(window.speechSynthesis.getVoices());
      const utterance = new SpeechSynthesisUtterance(seg.text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.96;
      utterance.pitch = idx % 2 === 0 ? 1.12 : 1.15;
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        if (token !== activeNarrationToken) return;
        if (idx + 1 < segments.length) {
          activePauseTimer = window.setTimeout(() => {
            speakSegment(idx + 1);
          }, seg.pauseMs);
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakSegment(0);
  } catch {
    // Ignore speechSynthesis errors
  }
}

function playTourChime(isSuccess: boolean) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = isSuccess ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880.0];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(isSuccess ? 0.045 : 0.025, now + idx * 0.055 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.055 + (isSuccess ? 0.55 : 0.25));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.6);
    });

    setTimeout(() => {
      void ctx.close().catch(() => { });
    }, 900);
  } catch {
    // Ignore audio errors
  }
}

export function DemoShowcaseOverlay({ isOpen, onClose }: DemoShowcaseOverlayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [stepIndex, setStepIndex] = useState(0);
  const [isSuccessFinale, setIsSuccessFinale] = useState(false);
  const [firstDeviceId, setFirstDeviceId] = useState<string | null>(null);
  const [firstLayoutId, setFirstLayoutId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundRef = useRef(soundEnabled);

  useEffect(() => {
    soundRef.current = soundEnabled;
    if (!soundEnabled) {
      stopNarration();
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!isOpen) {
      stopNarration();
      return;
    }
    setStepIndex(0);
    setIsSuccessFinale(false);
    setTargetRect(null);
    Promise.all([
      api.getDevices({ limit: 1 }).catch(() => ({ data: [] })),
      api.getLayouts({ limit: 1 }).catch(() => ({ data: [] })),
    ]).then(([devRes, layRes]) => {
      const firstDev = devRes.data?.[0];
      const firstLay = layRes.data?.[0];
      if (firstDev?.id) setFirstDeviceId(firstDev.id);
      if (firstLay?.id) setFirstLayoutId(firstLay.id);
    });
    return () => stopNarration();
  }, [isOpen]);

  const steps = React.useMemo(() => {
    return BASE_TOUR_STEPS.map((s) => {
      if (s.id === 'display-detail' && firstDeviceId) {
        return { ...s, route: `/hardware/displays/${firstDeviceId}/overview` };
      }
      if (s.id.startsWith('layout-edit-') && firstLayoutId) {
        return { ...s, route: `/studio/layouts/data/${firstLayoutId}/edit` };
      }
      if (s.id === 'schedule' && firstLayoutId) {
        return {
          ...s,
          route: `/studio/schedules/assign/${firstLayoutId}`,
          selector: 'main form, main .card-elevated',
        };
      }
      return s;
    });
  }, [firstDeviceId, firstLayoutId]);

  const currentStep = steps[stepIndex];

  // Speak narration for the current step (cancelling any previous unfinished TTS)
  useEffect(() => {
    if (!isOpen) return;
    if (!soundEnabled) {
      stopNarration();
      return;
    }
    if (isSuccessFinale) {
      speakNarration('Simulasi selesai. Seluruh alur HNDSignage siap tayang di seluruh layar.');
    } else if (currentStep) {
      speakNarration(`${currentStep.title}. ${currentStep.description}`);
    }
  }, [isOpen, isSuccessFinale, currentStep, soundEnabled]);

  // Simulated media upload progress bar when on the media step
  useEffect(() => {
    if (!isOpen || isSuccessFinale || currentStep?.id !== 'media') {
      setUploadProgress(0);
      return;
    }
    setUploadProgress(12);
    const interval = window.setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) return 100;
        return Math.min(100, prev + 14);
      });
    }, 260);
    return () => window.clearInterval(interval);
  }, [isOpen, isSuccessFinale, currentStep?.id]);

  // Navigate to the step's route when stepIndex changes
  useEffect(() => {
    if (!isOpen || isSuccessFinale || !currentStep) return;
    const normalized = pathname?.replace(/\/$/, '') || '/';
    const targetRoute = currentStep.route === '/' ? '/' : currentStep.route.replace(/\/$/, '');
    if (normalized !== targetRoute) {
      router.push(currentStep.route);
    }
  }, [isOpen, isSuccessFinale, currentStep, pathname, router]);

  // Measure target element rect on the current page
  const updateRect = useCallback(() => {
    if (!isOpen || isSuccessFinale || !currentStep) return;
    const selectors = currentStep.selector.split(',').map((s) => s.trim());
    let found: Element | null = null;
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          found = el;
          break;
        }
      }
    }

    if (found) {
      const r = found.getBoundingClientRect();
      const pad = 8;
      setTargetRect({
        top: Math.max(8, r.top - pad),
        left: Math.max(8, r.left - pad),
        width: Math.min(window.innerWidth - 16, r.width + pad * 2),
        height: Math.min(window.innerHeight - 16, r.height + pad * 2),
      });
    } else {
      setTargetRect(null);
    }
  }, [isOpen, isSuccessFinale, currentStep]);

  useEffect(() => {
    if (!isOpen || isSuccessFinale) return;
    updateRect();
    const t1 = window.setTimeout(updateRect, 180);
    const t2 = window.setTimeout(updateRect, 450);
    const t3 = window.setTimeout(updateRect, 900);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isOpen, isSuccessFinale, stepIndex, pathname, updateRect]);

  const handleNext = useCallback(() => {
    if (isSuccessFinale) {
      onClose();
      return;
    }
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      if (soundRef.current) playTourChime(false);
    } else {
      setIsSuccessFinale(true);
      if (soundRef.current) playTourChime(true);
    }
  }, [isSuccessFinale, stepIndex, steps.length, onClose]);

  const handlePrev = useCallback(() => {
    if (isSuccessFinale) {
      setIsSuccessFinale(false);
      setStepIndex(steps.length - 1);
      return;
    }
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      if (soundRef.current) playTourChime(false);
    }
  }, [isSuccessFinale, stepIndex, steps.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Compute smart non-overlapping callout position around the rectangular spotlight
  const calloutPos = targetRect && !isSuccessFinale
    ? (() => {
      const cardW = Math.min(380, window.innerWidth - 32);
      const cardH = 240;
      let top = Math.min(Math.max(20, targetRect.top), window.innerHeight - cardH - 20);
      let left = Math.min(Math.max(20, targetRect.left), window.innerWidth - cardW - 20);

      if (targetRect.top + targetRect.height + 16 + cardH < window.innerHeight) {
        top = targetRect.top + targetRect.height + 16;
      } else if (targetRect.top - 16 - cardH > 16) {
        top = targetRect.top - 16 - cardH;
      } else if (targetRect.left - 16 - cardW > 16) {
        left = targetRect.left - 16 - cardW;
      } else if (targetRect.left + targetRect.width + 16 + cardW < window.innerWidth) {
        left = targetRect.left + targetRect.width + 16;
      } else {
        top = window.innerHeight - cardH - 24;
      }

      return { top, left };
    })()
    : null;

  const calloutTop: number | string = calloutPos ? calloutPos.top : '50%';
  const calloutLeft: number | string = calloutPos ? calloutPos.left : '50%';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tur Interaktif HNDSignage"
      onClick={handleNext}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        cursor: 'pointer',
        backgroundColor: targetRect && !isSuccessFinale ? 'transparent' : 'rgba(5, 8, 18, 0.65)',
        backdropFilter: targetRect && !isSuccessFinale ? 'none' : 'blur(4px)',
      }}
    >
      {/* Rectangular Rounded Spotlight Cutout */}
      {targetRect && !isSuccessFinale && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: '14px',
            border: '2px solid var(--primary-500)',
            boxShadow: '0 0 0 9999px rgba(5, 8, 18, 0.62), 0 0 24px rgba(37, 99, 235, 0.45)',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Top-Right Controls */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '18px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 3,
        }}
      >
        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          aria-label={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '9999px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Tur"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '9999px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Tutorial Callout Card */}
      {!isSuccessFinale && currentStep && (
        <div
          key={currentStep.id}
          onClick={(e) => e.stopPropagation()}
          className="demo-slide-enter"
          style={{
            position: 'fixed',
            top: calloutTop,
            left: calloutLeft,
            transform: targetRect ? 'none' : 'translate(-50%, -50%)',
            width: 'min(380px, calc(100vw - 32px))',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: 'var(--card-shadow-hover)',
            zIndex: 2,
            cursor: 'default',
            transition: 'top 0.35s cubic-bezier(0.16, 1, 0.3, 1), left 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-500)', letterSpacing: '0.03em' }}>
            {currentStep.stepLabel}
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '6px 0 8px', color: 'var(--text-primary)' }}>
            {currentStep.title}
          </h3>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
            {currentStep.description}
          </p>

          {currentStep.id === 'media' && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 600, marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-primary)' }}>promo_display_4k.mp4</span>
                <span style={{ color: uploadProgress >= 100 ? 'var(--accent-emerald)' : 'var(--primary-500)' }}>
                  {uploadProgress >= 100 ? 'SHA-256 Terverifikasi' : `${uploadProgress}%`}
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '9999px', backgroundColor: 'var(--border-subtle)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    backgroundColor: uploadProgress >= 100 ? 'var(--accent-emerald)' : 'var(--primary-500)',
                    transition: 'width 0.25s ease, background-color 0.25s ease',
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Klik di mana saja untuk lanjut
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handlePrev}
                disabled={stepIndex === 0}
                aria-label="Langkah sebelumnya"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: stepIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: stepIndex === 0 ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Langkah berikutnya"
                style={{
                  height: '32px',
                  padding: '0 14px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'var(--primary-600)',
                  color: '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <span>{stepIndex === steps.length - 1 ? 'Selesai' : 'Lanjut'}</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Finale Celebration */}
      {isSuccessFinale && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="demo-slide-enter"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(440px, calc(100vw - 32px))',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '22px',
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: 'var(--card-shadow-hover)',
            cursor: 'default',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ position: 'relative', width: '72px', height: '72px', display: 'grid', placeItems: 'center' }}>
            <div
              className="demo-pulse-ring"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid var(--accent-emerald)',
              }}
            />
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.14)',
                color: 'var(--accent-emerald)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Siap Tayang di Seluruh Layar
          </h3>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Dari perangkat terhubung, pustaka media offline-first, tata letak multi-zona, hingga jadwal ke layar — seluruh alur HNDSignage siap digunakan.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ marginTop: '6px', padding: '10px 24px', borderRadius: '9999px', fontSize: '0.88rem', fontWeight: 700 }}
          >
            Mulai Demo Langsung
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
