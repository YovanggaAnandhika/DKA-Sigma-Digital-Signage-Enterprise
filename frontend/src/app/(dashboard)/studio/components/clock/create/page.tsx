'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Check, CloudSun, Calendar, MapPin, Droplets, Wind } from 'lucide-react';
import { CITY_PRESETS, CLOCK_THEME_STYLES, ClockWeatherConfig, getClockTimezone } from '../types';
import { createClock } from '@/lib/services/studio/clock.service';
import { modal } from '@/components/ui/ModalDialog';

export default function CreateClockWeatherPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [city, setCity] = useState('Makassar');
  const [showSeconds, setShowSeconds] = useState(true);
  const [is24Hour, setIs24Hour] = useState(true);
  const [theme, setTheme] = useState<'glass' | 'dark' | 'emerald' | 'gold'>('glass');
  const [textColor, setTextColor] = useState(CLOCK_THEME_STYLES.glass.textColor);
  const [timeFontSize, setTimeFontSize] = useState(48);

  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await createClock({
        name: name.trim(),
        city,
        showSeconds,
        is24Hour,
        theme,
        textColor,
        timeFontSize,
      });

      router.push('/studio/components/clock');
    } catch (err: any) {
      await modal.alert({
        title: 'Gagal Menyimpan',
        message: err?.message || 'Terjadi kesalahan saat menyimpan widget jam ke database.',
        variant: 'danger',
      });
      setSubmitting(false);
    }
  };

  const weather = CITY_PRESETS[city] || CITY_PRESETS['Makassar'];
  const timeZone = getClockTimezone(city);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/studio/components/clock" className="btn btn-outline" style={{ padding: '8px' }}>
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
              onChange={(e) => {
                const nextTheme = e.target.value as ClockWeatherConfig['theme'];
                setTheme(nextTheme);
                setTextColor(CLOCK_THEME_STYLES[nextTheme].textColor);
              }}
              className="form-input"
            >
              <option value="glass">Glassmorphism Transparan</option>
              <option value="dark">Hitam Minimalis</option>
              <option value="emerald">Hijau Emerald</option>
              <option value="gold">Emas Mewah</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span>Ukuran Teks Jam</span>
              <span>{timeFontSize} px</span>
            </label>
            <input
              type="range"
              min="24"
              max="96"
              step="2"
              value={timeFontSize}
              onChange={(e) => setTimeFontSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <span>Warna Teks Jam</span>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              aria-label="Warna teks jam"
              style={{ width: '42px', height: '32px', padding: '2px', border: '1px solid var(--border-subtle)', borderRadius: '6px', background: 'transparent' }}
            />
          </label>

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
              background: CLOCK_THEME_STYLES[theme].backgroundColor,
              backdropFilter: 'blur(16px)',
              border: `1px solid ${CLOCK_THEME_STYLES[theme].borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '24px',
              color: textColor,
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div>
              <div style={{ fontSize: `${timeFontSize * 0.7}px`, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
                {time.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: showSeconds ? '2-digit' : undefined,
                  hour12: !is24Hour,
                  timeZone,
                }).replace(/\./g, ':')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: CLOCK_THEME_STYLES[theme].subtitleColor, marginTop: '8px', fontWeight: 600 }}>
                <Calendar size={14} style={{ color: CLOCK_THEME_STYLES[theme].locationColor }} />
                <span>{time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone })}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderLeft: `1px solid ${CLOCK_THEME_STYLES[theme].borderColor}`, paddingLeft: '24px' }}>
              <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: CLOCK_THEME_STYLES[theme].dividerColor }}>
                <CloudSun size={40} style={{ color: CLOCK_THEME_STYLES[theme].conditionColor }} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{weather.temp}°</span>
                  <span style={{ fontSize: '1rem', color: CLOCK_THEME_STYLES[theme].subtitleColor }}>C</span>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: CLOCK_THEME_STYLES[theme].conditionColor, marginTop: '4px' }}>
                  {weather.condition}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.6875rem', color: CLOCK_THEME_STYLES[theme].subtitleColor, marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <MapPin size={10} /> {city}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Droplets size={10} /> {weather.humidity}%
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Wind size={10} /> {weather.windSpeed} km/h
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
