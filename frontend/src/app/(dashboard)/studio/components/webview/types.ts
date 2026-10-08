export interface WebViewConfig {
  id: string;
  name: string;
  url: string;
  refreshIntervalSeconds: number;
  zoomScale: number;
  bypassCache: boolean;
  orientation: 'landscape' | 'portrait';
  createdAt?: string;
}

export const WEBVIEW_STORAGE_KEY = 'dka_signage_webviews';

export const DEFAULT_WEBVIEWS: WebViewConfig[] = [
  {
    id: 'wv-1',
    name: 'Katalog Menu & Promo Kafe',
    url: 'https://en.wikipedia.org/wiki/Digital_signage',
    refreshIntervalSeconds: 60,
    zoomScale: 100,
    bypassCache: true,
    orientation: 'landscape',
    createdAt: '2026-10-08',
  },
  {
    id: 'wv-2',
    name: 'Live Dashboard Indikator Penjualan Toko',
    url: 'https://worldtimeapi.org',
    refreshIntervalSeconds: 30,
    zoomScale: 110,
    bypassCache: false,
    orientation: 'landscape',
    createdAt: '2026-10-08',
  },
];
