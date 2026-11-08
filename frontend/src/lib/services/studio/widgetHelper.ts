import { getAlbum } from './album.service';
import { getLiveStream } from './livestream.service';
import { getWebview } from './webview.service';
import { getTicker } from './ticker.service';
import { getClock } from './clock.service';
import { getQueueDisplay } from './queue.service';

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
  'ls-1': 'f0000000-0000-0000-0000-000000000001',
  'ls-2': 'f0000000-0000-0000-0000-000000000002',
  'ls-3': 'f0000000-0000-0000-0000-000000000003',
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

export async function resolveWidgetInfo(b: any, prevBlock?: any) {
  let widgetType: 'webview' | 'ticker' | 'clock' | 'queue' | 'album' | 'livestream' | undefined = b.widgetType;
  let widgetId: string | undefined = b.widgetId;

  const rawQueueId = b.queueId || b.queue_id;
  const rawTickerId = b.tickerId || b.ticker_id;
  const rawClockId = b.clockId || b.clock_id;
  const rawWebviewId = b.webviewId || b.webview_id;
  const rawAlbumId = b.albumId || b.album_id;
  const rawLiveStreamId = b.liveStreamId || b.live_stream_id;

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
  } else if (rawLiveStreamId) {
    widgetType = 'livestream';
    widgetId = rawLiveStreamId;
  }

  // Ensure UUID format
  if (widgetId && !isUuid(widgetId)) {
    widgetId = ensureUuid(widgetId);
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
      liveStreamId: rawLiveStreamId || '',
    };
  }

  let widgetData = prevBlock?.widgetData;
  if (!widgetData && widgetId) {
    try {
      if (widgetType === 'album') {
        widgetData = await getAlbum(widgetId);
      } else if (widgetType === 'livestream') {
        widgetData = await getLiveStream(widgetId).catch(() => null);
      } else if (widgetType === 'webview') {
        widgetData = await getWebview(widgetId).catch(() => null);
      } else if (widgetType === 'ticker') {
        widgetData = await getTicker(widgetId).catch(() => null);
      } else if (widgetType === 'clock') {
        widgetData = await getClock(widgetId).catch(() => null);
      } else if (widgetType === 'queue') {
        widgetData = await getQueueDisplay(widgetId).catch(() => null);
      }
    } catch {
      widgetData = null;
    }
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
    liveStreamId: rawLiveStreamId || (widgetType === 'livestream' ? widgetId : ''),
  };
}
