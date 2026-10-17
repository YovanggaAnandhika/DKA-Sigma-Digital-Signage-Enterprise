import { DEFAULT_QUEUES, QUEUE_STORAGE_KEY } from '@/app/(dashboard)/studio/components/ticket/types';
import { DEFAULT_WEBVIEWS, WEBVIEW_STORAGE_KEY } from '@/app/(dashboard)/studio/components/webview/types';
import { DEFAULT_TICKERS, TICKER_STORAGE_KEY } from '@/app/(dashboard)/studio/components/ticker/types';
import { DEFAULT_CLOCKS, CLOCK_STORAGE_KEY } from '@/app/(dashboard)/studio/components/clock/types';
import { DEFAULT_ALBUMS, ALBUM_STORAGE_KEY } from '@/app/(dashboard)/studio/components/album/types';

export const LEGACY_UUID_MAP: Record<string, string> = {
  'q-1': 'a0000000-0000-0000-0000-000000000001',
  'q-2': 'a0000000-0000-0000-0000-000000000002',
  'wv-1': 'b0000000-0000-0000-0000-000000000001',
  'wv-2': 'b0000000-0000-0000-0000-000000000002',
  't-1': 'c0000000-0000-0000-0000-000000000001',
  't-2': 'c0000000-0000-0000-0000-000000000002',
  'cw-1': 'd0000000-0000-0000-0000-000000000001',
  'cw-2': 'd0000000-0000-0000-0000-000000000002',
  'album-1': 'e0000000-0000-0000-0000-000000000001',
};

export function isUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function ensureUuid(id: string): string {
  if (!id) return 'a0000000-0000-0000-0000-000000000001';
  if (isUuid(id)) return id;
  if (LEGACY_UUID_MAP[id]) return LEGACY_UUID_MAP[id];

  // Convert non-UUID string into a stable UUID v4 format
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const part2 = Array.from(id).map(c => c.charCodeAt(0).toString(16)).join('').padEnd(24, '0').slice(0, 24);
  return `${hex}-${part2.slice(0, 4)}-4${part2.slice(5, 8)}-8${part2.slice(9, 12)}-${part2.slice(12, 24)}`;
}

export function resolveWidgetInfo(b: any, prevBlock?: any) {
  let widgetType: 'webview' | 'ticker' | 'clock' | 'queue' | 'album' | undefined = b.widgetType;
  let widgetId: string | undefined = b.widgetId;

  const rawQueueId = b.queueId || b.queue_id;
  const rawTickerId = b.tickerId || b.ticker_id;
  const rawClockId = b.clockId || b.clock_id;
  const rawWebviewId = b.webviewId || b.webview_id;
  const rawAlbumId = b.albumId || b.album_id;

  if (!widgetType) {
    if (rawQueueId) {
      widgetType = 'queue';
      widgetId = rawQueueId;
    } else if (rawTickerId) {
      widgetType = 'ticker';
      widgetId = rawTickerId;
    } else if (rawClockId) {
      widgetType = 'clock';
      widgetId = rawClockId;
    } else if (rawWebviewId) {
      widgetType = 'webview';
      widgetId = rawWebviewId;
    } else if (rawAlbumId) {
      widgetType = 'album';
      widgetId = rawAlbumId;
    } else if (prevBlock?.widgetType) {
      widgetType = prevBlock.widgetType;
      widgetId = prevBlock.widgetId;
    }
  }

  if (!widgetType) {
    return {
      widgetType: undefined,
      widgetId: undefined,
      widgetData: undefined,
      queueId: rawQueueId || '',
      tickerId: rawTickerId || '',
      clockId: rawClockId || '',
      webviewId: rawWebviewId || '',
      albumId: rawAlbumId || '',
    };
  }

  let widgetData = prevBlock?.widgetData;
  if (!widgetData && typeof window !== 'undefined') {
    try {
      if (widgetType === 'queue') {
        const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
        const list = stored ? JSON.parse(stored) : DEFAULT_QUEUES;
        widgetData = list.find((item: any) => item.id === widgetId || ensureUuid(item.id) === widgetId) || list[0] || DEFAULT_QUEUES[0];
      } else if (widgetType === 'webview') {
        const stored = localStorage.getItem(WEBVIEW_STORAGE_KEY);
        const list = stored ? JSON.parse(stored) : DEFAULT_WEBVIEWS;
        widgetData = list.find((item: any) => item.id === widgetId || ensureUuid(item.id) === widgetId) || list[0] || DEFAULT_WEBVIEWS[0];
      } else if (widgetType === 'ticker') {
        const stored = localStorage.getItem(TICKER_STORAGE_KEY);
        const list = stored ? JSON.parse(stored) : DEFAULT_TICKERS;
        widgetData = list.find((item: any) => item.id === widgetId || ensureUuid(item.id) === widgetId) || list[0] || DEFAULT_TICKERS[0];
      } else if (widgetType === 'clock') {
        const stored = localStorage.getItem(CLOCK_STORAGE_KEY);
        const list = stored ? JSON.parse(stored) : DEFAULT_CLOCKS;
        widgetData = list.find((item: any) => item.id === widgetId || ensureUuid(item.id) === widgetId) || list[0] || DEFAULT_CLOCKS[0];
      } else if (widgetType === 'album') {
        const stored = localStorage.getItem(ALBUM_STORAGE_KEY);
        const list = stored ? JSON.parse(stored) : DEFAULT_ALBUMS;
        widgetData = list.find((item: any) => item.id === widgetId || ensureUuid(item.id) === widgetId) || list[0] || DEFAULT_ALBUMS[0];
      }
    } catch {}
  }

  return {
    widgetType,
    widgetId,
    widgetData,
    queueId: rawQueueId || (widgetType === 'queue' ? widgetId : ''),
    tickerId: rawTickerId || (widgetType === 'ticker' ? widgetId : ''),
    clockId: rawClockId || (widgetType === 'clock' ? widgetId : ''),
    webviewId: rawWebviewId || (widgetType === 'webview' ? widgetId : ''),
    albumId: rawAlbumId || (widgetType === 'album' ? widgetId : ''),
  };
}
