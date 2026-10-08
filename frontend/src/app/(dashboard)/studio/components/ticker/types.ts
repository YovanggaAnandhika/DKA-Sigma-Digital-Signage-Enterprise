export interface TickerConfig {
  id: string;
  name: string;
  badge: string;
  messages: string[];
  speed: 'slow' | 'normal' | 'fast';
  theme: 'blue' | 'red' | 'dark' | 'emerald' | 'amber';
  fontSize: number;
  createdAt?: string;
}

export const TICKER_STORAGE_KEY = 'dka_signage_tickers';

export const THEME_STYLES: Record<string, { bg: string; text: string; badgeBg: string; badgeText: string }> = {
  blue: { bg: '#1e3a8a', text: '#ffffff', badgeBg: '#3b82f6', badgeText: '#ffffff' },
  red: { bg: '#991b1b', text: '#ffffff', badgeBg: '#ef4444', badgeText: '#ffffff' },
  dark: { bg: '#111827', text: '#f3f4f6', badgeBg: '#374151', badgeText: '#f9fafb' },
  emerald: { bg: '#065f46', text: '#ffffff', badgeBg: '#10b981', badgeText: '#ffffff' },
  amber: { bg: '#92400e', text: '#ffffff', badgeBg: '#f59e0b', badgeText: '#000000' },
};

export const SPEED_SECONDS: Record<string, number> = {
  slow: 25,
  normal: 15,
  fast: 8,
};

export const DEFAULT_TICKERS: TickerConfig[] = [
  {
    id: 't-1',
    name: 'Pengumuman Promo Kasir & Diskon Member',
    badge: 'PROMO HARI INI',
    messages: [
      'Dapatkan diskon 20% untuk semua produk segar buah & sayur setiap hari Jumat hingga Minggu!',
      'Gunakan kartu member DKASigma Point untuk mendapatkan poin ganda di seluruh kasir.',
    ],
    speed: 'normal',
    theme: 'blue',
    fontSize: 16,
    createdAt: '2026-10-08',
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
    createdAt: '2026-10-08',
  },
];
