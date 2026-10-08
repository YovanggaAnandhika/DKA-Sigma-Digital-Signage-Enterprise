'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquareText, Plus, Trash2, Check, Save, RefreshCw } from 'lucide-react';
import { TICKER_STORAGE_KEY, DEFAULT_TICKERS, THEME_STYLES, SPEED_SECONDS, TickerConfig } from '../../types';

const Marquee = 'marquee' as any;

export default function EditTickerPage() {
  const params = useParams() as { id: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [badge, setBadge] = useState('PROMO HARI INI');
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [theme, setTheme] = useState<'blue' | 'red' | 'dark' | 'emerald' | 'amber'>('blue');
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TICKER_STORAGE_KEY);
      const items: TickerConfig[] = stored ? JSON.parse(stored) : DEFAULT_TICKERS;
      const found = items.find((t) => t.id === params.id);
      if (found) {
        setName(found.name);
        setBadge(found.badge);
        setMessages(found.messages || []);
        setSpeed(found.speed);
        setTheme(found.theme);
        setFontSize(found.fontSize || 16);
      } else {
        alert('Teks berjalan tidak ditemukan.');
        router.push('/studio/components/ticker');
      }
    } catch {
      router.push('/studio/components/ticker');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

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

    try {
      const stored = localStorage.getItem(TICKER_STORAGE_KEY);
      const items: TickerConfig[] = stored ? JSON.parse(stored) : DEFAULT_TICKERS;
      const updated = items.map((t) =>
        t.id === params.id
          ? {
              ...t,
              name: name.trim(),
              badge: badge.trim(),
              messages,
              speed,
              theme,
              fontSize,
            }
          : t
      );
      localStorage.setItem(TICKER_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    router.push('/studio/components/ticker');
  };

  const currentTheme = THEME_STYLES[theme] || THEME_STYLES.blue;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data Teks Berjalan...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/studio/components/ticker" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Edit Teks Berjalan: {name || params.id}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Perbarui teks pengumuman, kecepatan gulir banner marquee, tema warna, dan ukuran font.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 440px) 1fr', gap: '24px' }}>
        {/* Form Settings */}
        <form onSubmit={handleSubmit} className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Konfigurasi Banner
          </h2>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Komponen
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Banner Diskon Kasir"
              className="form-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Badge Label Promo
            </label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Contoh: FLASH SALE atau INFO PENTING"
              className="form-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Tema Warna Banner
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {(['blue', 'red', 'dark', 'emerald', 'amber'] as const).map((t) => {
                const style = THEME_STYLES[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    style={{
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: style.bg,
                      border: theme === t ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {theme === t && <Check size={16} color="#ffffff" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Kecepatan Marquee
              </label>
              <select
                value={speed}
                onChange={(e) => setSpeed(e.target.value as any)}
                className="form-select"
              >
                <option value="slow">Lambat (Halus)</option>
                <option value="normal">Sedang (Standar)</option>
                <option value="fast">Cepat</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Ukuran Teks ({fontSize}px)
              </label>
              <input
                type="range"
                min="14"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                style={{ width: '100%', marginTop: '6px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <Link href="/studio/components/ticker" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Save size={16} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>

        {/* Right: Message List & Live Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Live Preview Box */}
          <div className="card-elevated" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquareText size={16} color="var(--primary-400)" /> Pratinjau Tampilan Banner
            </h3>

            <div
              style={{
                width: '100%',
                backgroundColor: currentTheme.bg,
                color: currentTheme.text,
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                height: '52px',
              }}
            >
              <div
                style={{
                  padding: '0 16px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: currentTheme.badgeBg,
                  color: currentTheme.badgeText,
                  fontWeight: 900,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  zIndex: 2,
                }}
              >
                {badge || 'INFO'}
              </div>

              <div style={{ flex: 1, overflow: 'hidden', padding: '0 12px' }}>
                <Marquee
                  scrollamount={speed === 'fast' ? 12 : speed === 'slow' ? 4 : 7}
                  style={{ fontSize: `${fontSize}px`, fontWeight: 600, display: 'flex', alignItems: 'center' }}
                >
                  {messages.join(' ✦ ')}
                </Marquee>
              </div>
            </div>
          </div>

          {/* Add Message Form */}
          <div className="card-elevated" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Kelola Kalimat Pengumuman ({messages.length} Pesan)
            </h3>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tulis pesan pengumuman tambahan..."
                className="form-input"
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMessage(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddMessage}
                disabled={!newMessage.trim()}
                className="btn btn-secondary"
              >
                <Plus size={14} />
                <span>Tambah</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', flex: 1 }}>
                    {msg}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMessage(idx)}
                    className="btn btn-danger"
                    style={{ padding: '4px 8px' }}
                    title="Hapus Pesan"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
