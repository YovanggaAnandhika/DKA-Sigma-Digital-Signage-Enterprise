'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Check, CloudSun, Calendar, MapPin, Droplets, Wind } from 'lucide-react';
import { CLOCK_STORAGE_KEY, DEFAULT_CLOCKS, CITY_PRESETS, ClockWeatherConfig } from '../../tabs/ClockWeatherManagerTab';

export default function CreateClockWeatherPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [city, setCity] = useState('Makassar');
  const [showSeconds, setShowSeconds] = useState(true);
  const [is24Hour, setIs24Hour] = useState(true);
  const [theme, setTheme] = useState<'glass' | 'dark' | 'emerald' | 'gold'>('glass');

  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newWidget: ClockWeatherConfig = {
      id: `cw-${Date.now()}`,
      name: name.trim(),
      city,
      showSeconds,
      is24Hour,
      theme,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      const stored = localStorage.getItem(CLOCK_STORAGE_KEY);
      const existing: ClockWeatherConfig[] = stored ? JSON.parse(stored) : DEFAULT_CLOCKS;
      const updated = [newWidget, ...existing];
      localStorage.setItem(CLOCK_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    router.push('/studio/components?tab=clock');
  };

  const weather = CITY_PRESETS[city] || CITY_PRESETS['Makassar'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/studio/components?tab=clock" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Tambah Widget Jam & Cuaca Baru
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Konfigurasikan widget penunjuk waktu presisi dan prakiraan cuaca kota untuk zona layar display.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 400px) 1fr', gap: '24px' }}>
        {/* Form Panel */}
        <form onSubmit={handleSubmit} className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Parameter Widget
          </h2>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Widget
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Jam Digital Layar Depan"
              className="form-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Pilihan Kota Toko / Lokasi
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="form-input"
            >
              {Object.keys(CITY_PRESETS).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Gaya Desain Tema
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="form-input"
            >
              <option value="glass">Glassmorphism Transparan (Rekomendasi)</option>
              <option value="dark">Hitam Minimalis Elegan</option>
              <option value="emerald">Hijau Emerald Ritel</option>
              <option value="gold">Emas Mewah (Luxury)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <span>Tampilkan Detik Berjalan</span>
              <input
                type="checkbox"
                checked={showSeconds}
                onChange={(e) => setShowSeconds(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <span>Format 24 Jam (Contoh: 14:30)</span>
              <input
                type="checkbox"
                checked={is24Hour}
                onChange={(e) => setIs24Hour(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <Link href="/studio/components?tab=clock" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Check size={16} />
              <span>Simpan Widget</span>
            </button>
          </div>
        </form>

        {/* Live Preview Panel */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pratinjau Widget Real-Time
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Tampilan langsung widget waktu presisi dan cuaca lokal.
            </p>
          </div>

          {/* Standalone Widget Card */}
          <div
            style={{
              padding: '28px 36px',
              borderRadius: '20px',
              background:
                theme === 'glass'
                  ? 'rgba(15, 23, 42, 0.85)'
                  : theme === 'dark'
                  ? '#09090b'
                  : theme === 'emerald'
                  ? '#064e3b'
                  : '#78350f',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '24px',
              color: '#ffffff',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
                {time.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: showSeconds ? '2-digit' : undefined,
                  hour12: !is24Hour,
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', marginTop: '8px', fontWeight: 600 }}>
                <Calendar size={14} style={{ color: '#60a5fa' }} />
                <span>{time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '24px' }}>
              <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <CloudSun size={40} style={{ color: '#fbbf24' }} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{weather.temp}°</span>
                  <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)' }}>C</span>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fef08a', marginTop: '4px' }}>
                  {weather.condition}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <MapPin size={10} /> {city}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Droplets size={10} /> {weather.humidity}%
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Wind size={10} /> {weather.windSpeed} km/j
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
