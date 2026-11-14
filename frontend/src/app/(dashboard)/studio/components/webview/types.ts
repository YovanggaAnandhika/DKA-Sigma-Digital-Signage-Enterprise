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
