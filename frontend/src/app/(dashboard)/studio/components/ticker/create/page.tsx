'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquareText, Plus, Trash2, Check } from 'lucide-react';
import { TICKER_STORAGE_KEY, DEFAULT_TICKERS, THEME_STYLES, SPEED_SECONDS, TickerConfig } from '../../tabs/TickerManagerTab';

export default function CreateTickerPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [badge, setBadge] = useState('PROMO HARI INI');
  const [messages, setMessages] = useState<string[]>([
    'Selamat datang di toko kami! Dapatkan penawaran menarik setiap hari.',
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [theme, setTheme] = useState<'blue' | 'red' | 'dark' | 'emerald' | 'amber'>('blue');
  const [fontSize, setFontSize] = useState(16);

  const handleAddMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessages([...messages, newMessage.trim()]);
    setNewMessage('');
  };

  const handleRemoveMessage = (index: number) => {
    if (messages.length <= 1) {
      alert('Minimal harus ada 1 pesan teks.');
      return;
    }
    setMessages(messages.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newTicker: TickerConfig = {
      id: `t-${Date.now()}`,
      name: name.trim(),
      badge: badge.trim(),
      messages,
      speed,
      theme,
      fontSize,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      const stored = localStorage.getItem(TICKER_STORAGE_KEY);
      const existing: TickerConfig[] = stored ? JSON.parse(stored) : DEFAULT_TICKERS;
      const updated = [newTicker, ...existing];
      localStorage.setItem(TICKER_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    router.push('/studio/components?tab=ticker');
  };

  const currentTheme = THEME_STYLES[theme];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/studio/components?tab=ticker" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Tambah Teks Berjalan Baru
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Atur pesan promosi berjalan (Running Text Marquee), kecepatan animasi, dan skema warna ritel.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '24px' }}>
        {/* Form Panel */}
        <form onSubmit={handleSubmit} className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Parameter Teks Berjalan
          </h2>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Komponen
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pengumuman Jam Operasional Toko"
              className="form-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Badge Awalan (Prefix)
            </label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Contoh: PROMO HARI INI"
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Kecepatan Animasi
              </label>
              <select
                value={speed}
                onChange={(e) => setSpeed(e.target.value as any)}
                className="form-input"
              >
                <option value="slow">Lambat (25s)</option>
                <option value="normal">Normal (15s)</option>
                <option value="fast">Cepat (8s)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Tema Warna
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="form-input"
              >
                <option value="blue">Biru Korporat</option>
                <option value="red">Merah Promo</option>
                <option value="dark">Hitam Elegan</option>
                <option value="emerald">Hijau Ritel</option>
                <option value="amber">Kuning Emas</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Ukuran Font (Pixel)
            </label>
            <input
              type="number"
              min={12}
              max={28}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="form-input"
            />
          </div>

          {/* Messages list */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Pesan Teks Promosi ({messages.length})
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: 'var(--text-primary)', flex: 1 }}>{msg}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMessage(i)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tulis pesan tambahan..."
                className="form-input"
                style={{ flex: 1, fontSize: '0.75rem' }}
              />
              <button
                type="button"
                onClick={handleAddMessage}
                className="btn btn-secondary"
                style={{ padding: '6px 12px' }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <Link href="/studio/components?tab=ticker" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Check size={16} />
              <span>Simpan Komponen</span>
            </button>
          </div>
        </form>

        {/* Live Preview Panel */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pratinjau Animasi Teks Berjalan
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Banner bergerak otomatis sesuai kecepatan dan warna yang dipilih.
            </p>
          </div>

          {/* Banner container */}
          <div
            style={{
              width: '100%',
              backgroundColor: currentTheme.bg,
              color: currentTheme.text,
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              position: 'relative',
              height: '56px',
            }}
          >
            {badge && (
              <div
                style={{
                  backgroundColor: currentTheme.badgeBg,
                  color: currentTheme.badgeText,
                  padding: '0 16px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  zIndex: 2,
                  boxShadow: '4px 0 12px rgba(0,0,0,0.25)',
                }}
              >
                {badge}
              </div>
            )}

            <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative' }}>
              <div
                style={{
                  display: 'inline-block',
                  paddingLeft: '100%',
                  animation: `createTickerScroll ${SPEED_SECONDS[speed]}s linear infinite`,
                  fontSize: `${fontSize}px`,
                  fontWeight: 600,
                }}
              >
                {messages.join('   •   ')}
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes createTickerScroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-100%);
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
