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

export const CLOCK_THEME_STYLES: Record<ClockWeatherConfig['theme'], {
  backgroundColor: string;
  textColor: string;
  subtitleColor: string;
  borderColor: string;
  locationColor: string;
  conditionColor: string;
  periodColor: string;
  dividerColor: string;
}> = {
  glass: {
    backgroundColor: '#e9eef4',
    textColor: '#0f172a',
    subtitleColor: '#526175',
    borderColor: '#d5dee9',
    locationColor: '#2563eb',
    conditionColor: '#b45309',
    periodColor: '#0284c7',
    dividerColor: 'rgba(15,23,42,0.12)',
  },
  dark: {
    backgroundColor: '#0f172a',
    textColor: '#f8fafc',
    subtitleColor: '#94a3b8',
    borderColor: '#1e3a8a',
    locationColor: '#93c5fd',
    conditionColor: '#fbbf24',
    periodColor: '#38bdf8',
    dividerColor: 'rgba(255,255,255,0.1)',
  },
  emerald: {
    backgroundColor: '#064e3b',
    textColor: '#ffffff',
    subtitleColor: '#94a3b8',
    borderColor: '#1e3a8a',
    locationColor: '#93c5fd',
    conditionColor: '#fbbf24',
    periodColor: '#38bdf8',
    dividerColor: 'rgba(255,255,255,0.1)',
  },
  gold: {
    backgroundColor: '#78350f',
    textColor: '#ffffff',
    subtitleColor: '#94a3b8',
    borderColor: '#1e3a8a',
    locationColor: '#93c5fd',
    conditionColor: '#fbbf24',
    periodColor: '#38bdf8',
    dividerColor: 'rgba(255,255,255,0.1)',
  },
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
