'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Check, CloudSun, Calendar, MapPin, Droplets, Wind, Save, RefreshCw } from 'lucide-react';
import { CLOCK_STORAGE_KEY, DEFAULT_CLOCKS, CITY_PRESETS, ClockWeatherConfig } from '../../types';

export default function EditClockWeatherPage() {
  const params = useParams() as { id: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [city, setCity] = useState('Makassar');
  const [showSeconds, setShowSeconds] = useState(true);
  const [is24Hour, setIs24Hour] = useState(true);
  const [theme, setTheme] = useState<'glass' | 'dark' | 'emerald' | 'gold'>('glass');
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CLOCK_STORAGE_KEY);
      const items: ClockWeatherConfig[] = stored ? JSON.parse(stored) : DEFAULT_CLOCKS;
      const found = items.find((c) => c.id === params.id);
      if (found) {
        setName(found.name);
        setCity(found.city);
        setShowSeconds(found.showSeconds);
        setIs24Hour(found.is24Hour);
        setTheme(found.theme);
      } else {
        alert('Widget jam & cuaca tidak ditemukan.');
        router.push('/studio/components/clock');
      }
    } catch {
      router.push('/studio/components/clock');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const stored = localStorage.getItem(CLOCK_STORAGE_KEY);
      const items: ClockWeatherConfig[] = stored ? JSON.parse(stored) : DEFAULT_CLOCKS;
      const updated = items.map((c) =>
        c.id === params.id
          ? {
              ...c,
              name: name.trim(),
              city,
              showSeconds,
              is24Hour,
              theme,
            }
          : c
      );
      localStorage.setItem(CLOCK_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    router.push('/studio/components/clock');
  };

  const weather = CITY_PRESETS[city] || CITY_PRESETS['Makassar'];

  const hours = is24Hour
    ? String(time.getHours()).padStart(2, '0')
    : String(time.getHours() % 12 || 12).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  const ampm = time.getHours() >= 12 ? 'PM' : 'AM';

  const formattedDate = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data Widget Jam...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/studio/components/clock" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Edit Widget Jam & Cuaca: {name || params.id}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Sesuaikan kota referensi cuaca, format jam 12/24, tampilan jarum detik, dan tema visual widget.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 440px) 1fr', gap: '24px' }}>
        {/* Form Settings */}
        <form onSubmit={handleSubmit} className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Pengaturan Widget
          </h2>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Widget
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Jam Kasir Utama"
              className="form-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Pilihan Kota
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="form-select"
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
              Tema Tampilan
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {(['glass', 'dark', 'emerald', 'gold'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`btn ${theme === t ? 'btn-primary' : 'btn-outline'}`}
                  style={{ textTransform: 'capitalize', fontSize: '0.75rem', padding: '8px 4px' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                Format 24 Jam
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {is24Hour ? 'Gunakan 14:00 (24 Jam)' : 'Gunakan 02:00 PM (12 Jam)'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={is24Hour}
              onChange={(e) => setIs24Hour(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                Tampilkan Angka Detik (:SS)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Detik berjalan secara real-time
              </div>
            </div>
            <input
              type="checkbox"
              checked={showSeconds}
              onChange={(e) => setShowSeconds(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <Link href="/studio/components/clock" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Save size={16} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>

        {/* Live Widget Preview */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#38bdf8" /> Pratinjau Tampilan Jam Real-Time
          </h2>

          <div
            style={{
              flex: 1,
              minHeight: '380px',
              backgroundColor: '#020617',
              borderRadius: '16px',
              border: '2px solid rgba(255,255,255,0.08)',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '440px',
                borderRadius: '24px',
                padding: '28px',
                background:
                  theme === 'glass'
                    ? 'rgba(30, 41, 59, 0.7)'
                    : theme === 'emerald'
                    ? 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'
                    : theme === 'gold'
                    ? 'linear-gradient(135deg, #78350f 0%, #451a03 100%)'
                    : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(12px)',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 700, color: '#93c5fd' }}>
                  <MapPin size={16} />
                  <span>{weather.city}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#fbbf24', fontWeight: 600 }}>
                  <CloudSun size={18} />
                  <span>{weather.condition}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '3.75rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {hours}:{minutes}
                </span>
                {showSeconds && (
                  <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#94a3b8' }}>
                    :{seconds}
                  </span>
                )}
                {!is24Hour && (
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', marginLeft: '4px' }}>
                    {ampm}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '20px' }}>
                <Calendar size={14} color="#94a3b8" />
                <span>{formattedDate}</span>
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                  {weather.temp}°C
                </div>
                <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Droplets size={12} color="#38bdf8" />
                    <span>{weather.humidity}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Wind size={12} color="#34d399" />
                    <span>{weather.windSpeed} km/h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
