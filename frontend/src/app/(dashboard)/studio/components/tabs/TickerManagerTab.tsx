'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquareText, Plus, Trash2, Check, Sparkles, Sliders } from 'lucide-react';

interface TickerConfig {
  id: string;
  name: string;
  badge: string;
  messages: string[];
  speed: 'slow' | 'normal' | 'fast';
  theme: 'blue' | 'red' | 'dark' | 'emerald' | 'amber';
  fontSize: number;
}

const STORAGE_KEY = 'dka_signage_tickers';

const DEFAULT_TICKERS: TickerConfig[] = [
  {
    id: 't-1',
    name: 'Pengumuman Promo Kasir & Diskon Member',
    badge: 'PROMO HARI INI',
    messages: [
      'Dapatkan diskon 20% untuk semua produk segar buah & sayur setiap hari Jumat hingga Minggu!',
      'Gunakan kartu member DKASigma Point untuk mendapatkan poin ganda di seluruh kasir.',
      'Buka setiap hari pukul 08:00 - 22:00 WITA. Layanan antar hubungi WhatsApp 0812-3456-7890.',
    ],
    speed: 'normal',
    theme: 'blue',
    fontSize: 16,
  },
  {
    id: 't-2',
    name: 'Flash Sale Akhir Pekan',
    badge: 'FLASH SALE',
    messages: [
      'Beli 2 Gratis 1 untuk aneka minuman dingin & es krim!',
      'Hanya berlaku sampai jam 21:00 malam ini selagi persediaan masih ada!',
    ],
    speed: 'fast',
    theme: 'red',
    fontSize: 18,
  },
];

const THEME_STYLES: Record<string, { bg: string; text: string; badgeBg: string; badgeText: string }> = {
  blue: { bg: '#1e3a8a', text: '#ffffff', badgeBg: '#3b82f6', badgeText: '#ffffff' },
  red: { bg: '#991b1b', text: '#ffffff', badgeBg: '#ef4444', badgeText: '#ffffff' },
  dark: { bg: '#111827', text: '#f3f4f6', badgeBg: '#374151', badgeText: '#f9fafb' },
  emerald: { bg: '#065f46', text: '#ffffff', badgeBg: '#10b981', badgeText: '#ffffff' },
  amber: { bg: '#92400e', text: '#ffffff', badgeBg: '#f59e0b', badgeText: '#000000' },
};

const SPEED_SECONDS: Record<string, number> = {
  slow: 25,
  normal: 15,
  fast: 8,
};

export default function TickerManagerTab() {
  const [tickers, setTickers] = useState<TickerConfig[]>(DEFAULT_TICKERS);
  const [selectedId, setSelectedId] = useState<string>('t-1');
  const [newMessageInput, setNewMessageInput] = useState('');

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTickers(parsed);
          setSelectedId(parsed[0].id);
        }
      }
    } catch {}
  }, []);

  const saveTickers = (items: TickerConfig[]) => {
    setTickers(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  };

  const activeTicker = tickers.find((t) => t.id === selectedId) || tickers[0];

  const handleUpdate = (patch: Partial<TickerConfig>) => {
    const updated = tickers.map((t) => (t.id === activeTicker.id ? { ...t, ...patch } : t));
    saveTickers(updated);
  };

  const handleAddMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageInput.trim()) return;
    const updatedMsgs = [...activeTicker.messages, newMessageInput.trim()];
    handleUpdate({ messages: updatedMsgs });
    setNewMessageInput('');
  };

  const handleDeleteMessage = (index: number) => {
    if (activeTicker.messages.length <= 1) {
      alert('Minimal harus ada 1 pesan pada teks berjalan.');
      return;
    }
    const updatedMsgs = activeTicker.messages.filter((_, i) => i !== index);
    handleUpdate({ messages: updatedMsgs });
  };

  const currentTheme = THEME_STYLES[activeTicker?.theme || 'blue'];
  const fullText = activeTicker?.messages.join('  •  ') || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Komponen Teks Berjalan (Running Text / Marquee)
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Atur banner pengumuman promosi dan teks berjalan di bagian atas atau bawah tata letak layar.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '24px' }}>
        {/* Left: Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Ticker Selector */}
          <div className="card-elevated" style={{ padding: '16px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Pilih Preset Teks Berjalan
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              {tickers.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: item.id === selectedId ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${item.id === selectedId ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageSquareText size={16} style={{ color: item.id === selectedId ? 'var(--primary-400)' : 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{item.messages.length} Pesan • {item.speed}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          {activeTicker && (
            <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Pengaturan Teks & Gaya
              </h3>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Badge / Label Awalan
                </label>
                <input
                  type="text"
                  value={activeTicker.badge}
                  onChange={(e) => handleUpdate({ badge: e.target.value })}
                  className="form-input"
                  placeholder="Contoh: PROMO HARI INI"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Kecepatan Gulir
                  </label>
                  <select
                    value={activeTicker.speed}
                    onChange={(e) => handleUpdate({ speed: e.target.value as any })}
                    className="form-input"
                  >
                    <option value="slow">Lambat (25s)</option>
                    <option value="normal">Normal (15s)</option>
                    <option value="fast">Cepat (8s)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Tema Warna
                  </label>
                  <select
                    value={activeTicker.theme}
                    onChange={(e) => handleUpdate({ theme: e.target.value as any })}
                    className="form-input"
                  >
                    <option value="blue">Biru Korporat</option>
                    <option value="red">Merah Promo</option>
                    <option value="dark">Hitam Elegan</option>
                    <option value="emerald">Hijau Segar</option>
                    <option value="amber">Kuning Emas</option>
                  </select>
                </div>
              </div>

              {/* Messages list */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Daftar Pesan Bergantian
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeTicker.messages.map((msg, i) => (
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
                        onClick={() => handleDeleteMessage(i)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        title="Hapus pesan"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddMessage} style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  <input
                    type="text"
                    value={newMessageInput}
                    onChange={(e) => setNewMessageInput(e.target.value)}
                    placeholder="Tambah pesan promo baru..."
                    className="form-input"
                    style={{ flex: 1, fontSize: '0.75rem' }}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                    <Plus size={14} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Banner Preview */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pratinjau Banner Teks Berjalan
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Simulasi banner horizontal yang akan disematkan di bagian atas atau bawah layer signage Anda.
            </p>
          </div>

          {/* Banner Simulator */}
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
            {/* Prefix Badge */}
            {activeTicker.badge && (
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
                {activeTicker.badge}
              </div>
            )}

            {/* Marquee Track */}
            <div
              style={{
                flex: 1,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  paddingLeft: '100%',
                  animation: `tickerScroll ${SPEED_SECONDS[activeTicker.speed]}s linear infinite`,
                  fontSize: `${activeTicker.fontSize}px`,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                {fullText}
              </div>
            </div>
          </div>

          {/* In-Context Placement Demo Frame */}
          <div
            style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: '12px',
              padding: '20px',
              backgroundColor: 'var(--bg-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Contoh Penempatan di Layar Toko (Zona Bawah Layout):
            </div>
            <div
              style={{
                width: '100%',
                height: '180px',
                borderRadius: '8px',
                backgroundColor: '#18181b',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '12px',
              }}
            >
              <div style={{ color: '#71717a', fontSize: '0.75rem', textAlign: 'center', marginTop: '40px' }}>
                [ Video / Foto Promosi Utama ]
              </div>
              <div
                style={{
                  backgroundColor: currentTheme.bg,
                  color: currentTheme.text,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeTicker.badge && <strong>[{activeTicker.badge}] </strong>}
                {activeTicker.messages[0]}
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes tickerScroll {
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
