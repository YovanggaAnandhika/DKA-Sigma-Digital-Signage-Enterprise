'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CloudSun, Droplets, Wind, MapPin, Calendar, Sparkles } from 'lucide-react';

interface WeatherPreset {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

const CITY_PRESETS: Record<string, WeatherPreset> = {
  Makassar: { city: 'Makassar', temp: 31, condition: 'Cerah Berawan', humidity: 72, windSpeed: 14 },
  Jakarta: { city: 'Jakarta', temp: 33, condition: 'Cerah', humidity: 68, windSpeed: 12 },
  Surabaya: { city: 'Surabaya', temp: 34, condition: 'Cerah Panas', humidity: 65, windSpeed: 16 },
  Bandung: { city: 'Bandung', temp: 24, condition: 'Hujan Ringan', humidity: 85, windSpeed: 10 },
  Denpasar: { city: 'Denpasar', temp: 30, condition: 'Cerah', humidity: 75, windSpeed: 18 },
  Medan: { city: 'Medan', temp: 29, condition: 'Berawan', humidity: 80, windSpeed: 11 },
};

export default function ClockWeatherManagerTab() {
  const [selectedCity, setSelectedCity] = useState('Makassar');
  const [showSeconds, setShowSeconds] = useState(true);
  const [is24Hour, setIs24Hour] = useState(true);
  const [theme, setTheme] = useState<'glass' | 'dark' | 'emerald' | 'gold'>('glass');

  // Real-time tick
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const weather = CITY_PRESETS[selectedCity] || CITY_PRESETS['Makassar'];

  const timeString = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: !is24Hour,
  });

  const dateString = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Komponen Jam Digital & Prakiraan Cuaca
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Widget jam digital real-time dan cuaca lokal untuk menarik perhatian pengunjung di sudut layar retail.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '24px' }}>
        {/* Left: Configuration Form */}
        <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Pengaturan Widget
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Lokasi Kota Toko
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="form-input"
            >
              {Object.keys(CITY_PRESETS).map((city) => (
                <option key={city} value={city}>
                  {city} (WITA/WIB)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Gaya Desain Widget
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '6px' }}>
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

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            💡 Widget ini berjalan ringan secara lokal pada client Android tanpa membebani bandwidth jaringan internet toko.
          </div>
        </div>

        {/* Right: Live Interactive Widget Mockup */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pratinjau Widget di Layar
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Simulasi tampilan jam dan cuaca yang dapat disematkan di pojok kanan atas layar promosi.
            </p>
          </div>

          {/* Standalone Widget Card */}
          <div
            style={{
              padding: '24px 32px',
              borderRadius: '20px',
              background:
                theme === 'glass'
                  ? 'rgba(15, 23, 42, 0.75)'
                  : theme === 'dark'
                  ? '#09090b'
                  : theme === 'emerald'
                  ? '#064e3b'
                  : '#78350f',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '24px',
              color: '#ffffff',
            }}
          >
            {/* Clock Section */}
            <div>
              <div
                style={{
                  fontSize: '3.5rem',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  fontFamily: 'monospace',
                  lineHeight: 1,
                  textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}
              >
                {timeString}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.8)',
                  marginTop: '8px',
                  fontWeight: 600,
                }}
              >
                <Calendar size={14} style={{ color: '#60a5fa' }} />
                <span>{dateString}</span>
              </div>
            </div>

            {/* Weather Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                paddingLeft: '24px',
                borderLeft: '1px solid rgba(255,255,255,0.15)',
              }}
            >
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
                    <MapPin size={10} /> {weather.city}
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
