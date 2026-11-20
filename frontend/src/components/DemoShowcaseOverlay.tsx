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
    stepLabel: 'Langkah 1 dari 22 • Pusat Kendali',
    title: 'Selamat Datang di HNDSignage',
    description:
      'Satu pusat kendali cerdas untuk mengelola ratusan layar promosi di seluruh cabang Anda secara langsung, rapi, dan penuh kendali.',
  },
  {
    id: 'overview-chart',
    route: '/',
    selector: 'main .card-elevated',
    stepLabel: 'Langkah 2 dari 22 • Performa Armada',
    title: 'Pantau Kesehatan Layar Seketika',
    description:
      'Lihat grafik aktivitas dan status seluruh layar toko secara langsung, memastikan setiap promosi selalu tampil prima di hadapan pelanggan.',
  },
  {
    id: 'devices',
    route: '/hardware/displays/player',
    selector: 'main table, main .card-elevated',
    stepLabel: 'Langkah 3 dari 22 • Daftar Layar',
    title: 'Semua TV Cabang Terhubung Rapi',
    description:
      'Pantau setiap layar yang terpasang di toko, lengkap dengan status aktif, ukuran layar, dan lokasi masing-masing dalam satu daftar.',
  },
  {
    id: 'iot',
    route: '/hardware/iot/devices',
    selector: 'main .card-elevated, main table',
    stepLabel: 'Langkah 4 dari 22 • Tombol Kasir Pintar',
    title: 'Panggil Antrean Sekali Tekan',
    description:
      'Cukup tekan tombol nirkabel di meja kasir, layar langsung memanggil pelanggan berikutnya dengan suara yang jernih dan santun.',
  },
  {
    id: 'media',
    route: '/studio/media',
    selector: 'main .card-elevated, main table',
    stepLabel: 'Langkah 5 dari 22 • Pustaka Media',
    title: 'Simpan & Putar Tanpa Takut Mati Internet',
    description:
      'Unggah video dan gambar promosi Anda sekali saja. Konten tersimpan aman di layar toko sehingga tetap berputar mulus meski internet terputus.',
  },
  {
    id: 'components',
    route: '/studio/components',
    selector: 'main .card-elevated, main table, main > div > div',
    stepLabel: 'Langkah 6 dari 22 • Elemen Interaktif',
    title: 'Lengkapi Layar dengan Beragam Fitur',
    description:
      'Tambahkan daftar putar, nomor antrean, halaman web, galeri foto, teks berjalan, jam cuaca, hingga siaran langsung sesuai kebutuhan bisnis Anda.',
  },
  {
    id: 'comp-playlists',
    route: '/studio/playlists',
    selector: 'main table, main .card-elevated, main > div > div',
    stepLabel: 'Langkah 7 dari 22 • Daftar Putar',
    title: 'Susun Urutan Iklan Otomatis',
    description:
      'Gabungkan beberapa video dan gambar promo favorit menjadi satu rangkaian tayangan yang berganti otomatis sepanjang hari.',
  },
  {
    id: 'comp-queue',
    route: '/studio/components/queue',
    selector: 'main table, main .card-elevated, main > div > div',
    stepLabel: 'Langkah 8 dari 22 • Sistem Antrean',
    title: 'Ruang Tunggu Lebih Tertib & Nyaman',
    description:
      'Tampilkan nomor antrean dengan suara panggilan Bahasa Indonesia yang lembut, sambil mengecilkan suara iklan secara halus saat panggilan berbunyi.',
  },
  {
    id: 'comp-webview',
    route: '/studio/components/webview',
    selector: 'main table, main .card-elevated, main > div > div',
    stepLabel: 'Langkah 9 dari 22 • Tampilan Web',
    title: 'Tampilkan Menu Digital & Situs Bisnis',
    description:
      'Sematkan katalog online, papan informasi, atau halaman web perusahaan langsung ke layar TV toko tanpa perlu perangkat tambahan.',
  },
  {
    id: 'comp-album',
    route: '/studio/components/album',
    selector: 'main table, main .card-elevated, main > div > div',
    stepLabel: 'Langkah 10 dari 22 • Album Foto',
    title: 'Galeri Promo & Katalog Produk Memikat',
    description:
      'Pamerkan foto produk unggulan lengkap dengan label diskon dan harga spesial dalam transisi visual yang memanjakan mata.',
  },
  {
    id: 'comp-ticker',
    route: '/studio/components/ticker',
    selector: 'main table, main .card-elevated, main > div > div',
    stepLabel: 'Langkah 11 dari 22 • Teks Berjalan',
    title: 'Sampaikan Info Kilat di Layar',
    description:
      'Tampilkan pengumuman promo hari ini, ucapan selamat datang, atau info penting lainnya dengan teks berjalan yang mudah dibaca.',
  },
  {
    id: 'comp-clock',
    route: '/studio/components/clock',
    selector: 'main table, main .card-elevated, main > div > div',
    stepLabel: 'Langkah 12 dari 22 • Jam & Cuaca',
    title: 'Informasi Waktu & Cuaca Real-Time',
    description:
      'Hadirkan penunjuk waktu dan prakiraan cuaca kota setempat yang selalu akurat dengan tampilan modern dan elegan.',
  },
  {
    id: 'comp-livestream',
    route: '/studio/components/livestream',
    selector: 'main table, main .card-elevated, main > div > div',
    stepLabel: 'Langkah 13 dari 22 • Siaran Langsung',
    title: 'Siaran Langsung Seketika Tanpa Jeda',
    description:
      'Pancarkan acara live, sambutan pimpinan, atau liputan langsung ke seluruh layar cabang dengan gambar tajam dan hampir tanpa jeda.',
  },
  {
    id: 'layouts',
    route: '/studio/layouts/data',
    selector: 'main table, main .card-elevated',
    stepLabel: 'Langkah 14 dari 22 • Tata Letak',
    title: 'Koleksi Desain Layar Siap Pakai',
    description:
      'Kelola seluruh rancangan tampilan TV Anda di sini, siap digunakan ulang atau disesuaikan kapan saja untuk berbagai kampanye.',
  },
  {
    id: 'layout-edit-toolbar',
    route: '/studio/layouts/data',
    selector: 'main header, main button',
    stepLabel: 'Langkah 15 dari 22 • Editor: Simpan & Layar Penuh',
    title: 'Simpan Sekali Klik, Kerja Lebih Lega',
    description:
      'Simpan setiap ide kreatif Anda dengan aman, atau perluas area desain ke layar penuh untuk kenyamanan merancang.',
  },
  {
    id: 'layout-edit-layers',
    route: '/studio/layouts/data',
    selector: 'main aside:first-of-type, main > div > div > div:first-child',
    stepLabel: 'Langkah 16 dari 22 • Editor: Lapisan Konten',
    title: 'Atur Lapisan & Isi Konten',
    description:
      'Pilih bagian layar yang ingin diisi, lalu masukkan video, gambar, atau elemen interaktif hanya dengan beberapa klik mudah.',
  },
  {
    id: 'layout-edit-canvas',
    route: '/studio/layouts/data',
    selector: 'main [style*="aspect-ratio"], main > div > div > div:nth-child(2)',
    stepLabel: 'Langkah 17 dari 22 • Editor: Kanvas Desain',
    title: 'Kanvas Bebas Atur Layar Belah',
    description:
      'Geser dan atur dua video bersebelahan, teks berjalan, serta jam dalam satu layar dengan hasil presisi persis seperti yang tampil di TV.',
  },
  {
    id: 'layout-edit-properties',
    route: '/studio/layouts/data',
    selector: 'main aside:last-of-type, main > div > div > div:last-child',
    stepLabel: 'Langkah 18 dari 22 • Editor: Pengaturan Posisi',
    title: 'Presisi Posisi & Efek Visual Instan',
    description:
      'Gunakan tombol cepat untuk membagi layar kiri-kanan, mengatur transparansi, hingga memperhalus tampilan agar selalu selaras.',
  },
  {
    id: 'layout-edit-timeline',
    route: '/studio/layouts/data',
    selector: 'main > div > div:last-child',
    stepLabel: 'Langkah 19 dari 22 • Editor: Linimasa Tayang',
    title: 'Atur Durasi & Simulasi Langsung',
    description:
      'Tentukan berapa lama setiap promosi muncul dan putar simulasinya langsung di sini sebelum ditayangkan ke pelanggan.',
  },
  {
    id: 'schedule',
    route: '/studio/schedules/calendar',
    selector: 'main form, a[href="/studio/layouts/data"], main .card-elevated',
    stepLabel: 'Langkah 20 dari 22 • Kirim ke Layar',
    title: 'Jadwalkan & Kirim ke Seluruh Cabang',
    description:
      'Pilih tanggal dan jam tayang promo pagi, siang, atau malam, lalu kirim serentak ke layar pilihan Anda dalam hitungan detik.',
  },
  {
    id: 'ota',
    route: '/system/apk',
    selector: 'main .card-elevated, main table, main > div > div',
    stepLabel: 'Langkah 21 dari 22 • Pembaruan Otomatis',
    title: 'Perbarui Sistem Tanpa Teknisi Lapangan',
    description:
      'Kirim pembaruan aplikasi ke seluruh TV cabang secara otomatis di malam hari, hemat biaya operasional tanpa perlu kunjungan teknisi.',
  },
  {
    id: 'display-detail',
    route: '/hardware/displays/player',
    selector: 'main .card-elevated',
    stepLabel: 'Langkah 22 dari 22 • Kendali Layar',
    title: 'Kendalikan & Intip Layar dari Meja Anda',
    description:
      'Matikan atau nyalakan layar dari jarak jauh, pantau kondisi perangkat, dan lihat tangkapan layar langsung yang sedang ditonton pelanggan.',
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
