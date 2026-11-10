export interface ClockWeatherConfig {
  id: string;
  name: string;
  city: string;
  timezone?: string;
  showSeconds: boolean;
  is24Hour: boolean;
  theme: 'glass' | 'dark' | 'emerald' | 'gold';
  backgroundColor?: string;
  textColor?: string;
  subtitleColor?: string;
  borderColor?: string;
  borderRadius?: number;
  timeFontSize?: number;
  dateFontSize?: number;
  createdAt?: string;
}

export const CLOCK_THEME_STYLES: Record<ClockWeatherConfig['theme'], { backgroundColor: string; textColor: string }> = {
  glass: { backgroundColor: '#1a2233', textColor: '#f8fafc' },
  dark: { backgroundColor: '#0f172a', textColor: '#f8fafc' },
  emerald: { backgroundColor: '#064e3b', textColor: '#ffffff' },
  gold: { backgroundColor: '#78350f', textColor: '#ffffff' },
};

export const CLOCK_STORAGE_KEY = 'dka_signage_clock_widgets';

export const CITY_PRESETS: Record<string, { city: string; temp: number; condition: string; humidity: number; windSpeed: number }> = {
  Makassar: { city: 'Makassar', temp: 31, condition: 'Cerah Berawan', humidity: 72, windSpeed: 14 },
  Jakarta: { city: 'Jakarta', temp: 33, condition: 'Cerah', humidity: 68, windSpeed: 12 },
  Surabaya: { city: 'Surabaya', temp: 34, condition: 'Cerah Panas', humidity: 65, windSpeed: 16 },
  Bandung: { city: 'Bandung', temp: 24, condition: 'Hujan Ringan', humidity: 85, windSpeed: 10 },
  Denpasar: { city: 'Denpasar', temp: 30, condition: 'Cerah', humidity: 75, windSpeed: 18 },
  Medan: { city: 'Medan', temp: 29, condition: 'Berawan', humidity: 80, windSpeed: 11 },
};

export const DEFAULT_CLOCKS: ClockWeatherConfig[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    name: 'Widget Jam Utama Makassar',
    city: 'Makassar',
    showSeconds: true,
    is24Hour: true,
    theme: 'glass',
    createdAt: '2026-10-08',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    name: 'Widget Jam Layar Toko Jakarta',
    city: 'Jakarta',
    showSeconds: false,
    is24Hour: true,
    theme: 'emerald',
    createdAt: '2026-10-08',
  },
];
