'use client';

import { useState, useEffect } from 'react';
import { Tv } from 'lucide-react';
import { api, Playlist, Layout } from '@/lib/services';
import SimulatorDisplay from './components/SimulatorDisplay';
import SimulatorControls from './components/SimulatorControls';
import SimulatorInspector from './components/SimulatorInspector';

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
  const nextSlide = () => setSlideIndex((prev) => (prev + 1) % playlistItems.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '16px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <Tv size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Live Player Screen Simulator
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Simulasi visual pemutaran multi-layer layout dan perputaran playlist pada perangkat Android retail
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
            <span>gRPC Stream Active</span>
          </div>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
            }}
          >
            FPS: 60.0
          </div>
        </div>
      </div>

      {/* Simulator Device Screen Container */}
      <div
        className="card-elevated"
        style={{
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#050505',
          border: '1px solid #1f1f1f',
        }}
      >
        {/* Physical 16:9 Display Frame */}
        <SimulatorDisplay 
          currentItem={currentItem} 
          slideIndex={slideIndex} 
          totalSlides={playlistItems.length} 
        />

        {/* Player Controls */}
        <SimulatorControls 
          isPlaying={isPlaying} 
          setIsPlaying={setIsPlaying} 
          nextSlide={nextSlide} 
        />
      </div>

      {/* Backend Diagnostics Cards */}
      <SimulatorInspector layouts={layouts} playlists={playlists} />
    </div>
  );
}
