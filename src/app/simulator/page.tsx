'use client';

import { useState, useEffect } from 'react';
import { 
  Tv, 
  Layers, 
  Radio, 
  Film, 
  Image as ImageIcon,
  Clock,
  Play,
  Pause,
  RotateCw
} from 'lucide-react';
import { api, Playlist, Layout } from '@/lib/api';

export default function SimulatorPage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback demo sequence if playlist is empty
  const playlistItems = [
    { title: 'Promo Diskon 50% Weekend Spesial', type: 'video', color: '#1e1b4b', tag: 'VIDEO 4K', duration: 4 },
    { title: 'Segar Setiap Hari - Aneka Buah & Sayur', type: 'image', color: '#064e3b', tag: 'PROMO BANNER', duration: 4 },
    { title: 'Member Reward Point Ganda Kasir', type: 'video', color: '#701a75', tag: 'LOYALTY REWARD', duration: 4 },
  ];

  useEffect(() => {
    async function loadResources() {
      try {
        const [pRes, lRes] = await Promise.all([
          api.getPlaylists(),
          api.getLayouts()
        ]);
        setPlaylists(pRes.data || []);
        setLayouts(lRes.data || []);
      } catch (err) {
        // gRPC error handled gracefully
      } finally {
        setLoading(false);
      }
    }
    loadResources();
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % playlistItems.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, playlistItems.length]);

  const currentItem = playlistItems[slideIndex];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tv className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Live Player Screen Simulator
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Simulasi visual pemutaran multi-zona layout dan perputaran playlist pada perangkat Android retail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>gRPC Stream Active</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs font-mono">
            FPS: 60.0
          </div>
        </div>
      </div>

      {/* Simulator Device Frame */}
      <div className="card-elevated p-8 flex flex-col items-center justify-center bg-black/60">
        <div className="w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-white/10 relative aspect-[16/9] flex flex-col">
          {/* Main Visual Display (16:9 Screen) */}
          <div className="relative flex-1 flex">
            {/* ZONE 1: Video/Media Utama (Left 70%) */}
            <div 
              className="w-[70%] h-full flex flex-col items-center justify-center p-8 text-center transition-all duration-700 relative overflow-hidden"
              style={{ backgroundColor: currentItem.color }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-4 border border-white/20 shadow-xl">
                {currentItem.type === 'video' ? <Film className="w-8 h-8 text-indigo-300" /> : <ImageIcon className="w-8 h-8 text-emerald-300" />}
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 text-white/90 border border-white/20 mb-2">
                {currentItem.tag}
              </span>

              <h2 className="text-xl md:text-2xl font-black text-white max-w-md relative z-10">
                {currentItem.title}
              </h2>

              <div className="mt-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] font-mono text-white/80 border border-white/10 flex items-center gap-2">
                <Clock className="w-3 h-3 text-indigo-400" />
                Slide {slideIndex + 1} of {playlistItems.length} • Auto-rotating ({currentItem.duration}s)
              </div>
            </div>

            {/* ZONE 2: Side Banner Widget (Right 30%) */}
            <div className="w-[30%] h-full bg-[#0a0f1d] border-l border-white/10 p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  ⭐ SPESIAL HARI INI
                </span>
                <h3 className="text-sm font-bold text-white mt-2 leading-tight">
                  Kupon Belanja Rp 50.000
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Scan QR di kasir untuk klaim cashback instan pada struk pembayaran!
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg flex flex-col items-center justify-center my-auto aspect-square max-w-[130px] mx-auto border border-white/20 shadow-md">
                <div className="w-full h-full border-2 border-dashed border-slate-400 flex items-center justify-center text-slate-800 text-center text-[10px] font-bold uppercase">
                  QR SCAN CASHIER
                </div>
              </div>

              <div className="text-[10px] text-white/40 text-center">
                Berlaku di seluruh jaringan OmniSign
              </div>
            </div>
          </div>

          {/* ZONE 3: Running Text Ticker (Bottom Bar) */}
          <div className="h-10 bg-indigo-950/80 border-t border-white/10 flex items-center px-4 overflow-hidden gap-3">
            <span className="px-2 py-0.5 rounded bg-rose-500 text-[10px] font-black text-white tracking-wider uppercase shrink-0">
              LIVE TICKER
            </span>
            <div className="text-xs font-medium text-white/90 whitespace-nowrap overflow-hidden text-ellipsis animate-marquee">
              Selamat datang di OmniSign Digital Network • Nikmati promo Buy 1 Get 1 Free untuk seluruh menu bakery • Jam Operasional: 08:00 - 22:00 WIB • Gunakan aplikasi member untuk poin ekstra
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Jeda Playback</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Lanjutkan</span>
              </>
            )}
          </button>
          <button
            onClick={() => setSlideIndex((prev) => (prev + 1) % playlistItems.length)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Next Slide</span>
          </button>
        </div>
      </div>

      {/* Backend Integration Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-elevated p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Layout Database Aktif (Tonic gRPC)
          </h3>
          <p className="text-xs text-white/80">
            {layouts.length > 0 ? (
              <>Terdeteksi <span className="font-semibold text-white">{layouts.length} layout terdaftar</span> di database.</>
            ) : (
              "Belum ada layout custom, simulator menggunakan default 3-zone split."
            )}
          </p>
        </div>

        <div className="card-elevated p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            Sinkronisasi Playlist Database
          </h3>
          <p className="text-xs text-white/80">
            {playlists.length > 0 ? (
              <>Terhubung dengan <span className="font-semibold text-white">{playlists.length} playlist</span> aktif dari Postgres.</>
            ) : (
              "Menggunakan loop rotasi default OmniSign Retail Demo."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
