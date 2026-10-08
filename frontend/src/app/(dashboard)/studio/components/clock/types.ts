export interface ClockWeatherConfig {
  id: string;
  name: string;
  city: string;
  showSeconds: boolean;
  is24Hour: boolean;
  theme: 'glass' | 'dark' | 'emerald' | 'gold';
  createdAt?: string;
}

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
    id: 'cw-1',
    name: 'Widget Jam Utama Makassar',
    city: 'Makassar',
    showSeconds: true,
    is24Hour: true,
    theme: 'glass',
    createdAt: '2026-10-08',
  },
  {
    id: 'cw-2',
    name: 'Widget Jam Layar Toko Jakarta',
    city: 'Jakarta',
    showSeconds: false,
    is24Hour: true,
    theme: 'emerald',
    createdAt: '2026-10-08',
  },
];
