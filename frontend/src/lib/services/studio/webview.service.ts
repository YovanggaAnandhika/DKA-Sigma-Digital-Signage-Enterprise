import { invokeApi } from '../../core/invokeApi';
import { WebViewConfig } from '../../../app/(dashboard)/studio/components/webview/types';

type WebviewProtoObject = {
  id: string;
  name: string;
  url: string;
  refreshIntervalSeconds?: number;
  refresh_interval_seconds?: number;
  zoomScale?: number;
  zoom_scale?: number;
  bypassCache?: boolean;
  bypass_cache?: boolean;
  orientation?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

function mapWebview(item: WebviewProtoObject): WebViewConfig {
  return {
    id: item.id,
    name: item.name,
    url: item.url,
    refreshIntervalSeconds: item.refreshIntervalSeconds || item.refresh_interval_seconds || 60,
    zoomScale: item.zoomScale || item.zoom_scale || 100,
    bypassCache: Boolean(item.bypassCache ?? item.bypass_cache ?? false),
    orientation: (item.orientation as 'landscape' | 'portrait') || 'landscape',
    createdAt: item.createdAt || item.created_at,
  };
}

export async function getWebviews(search = ''): Promise<WebViewConfig[]> {
  const res = await invokeApi<{ webviewsList?: WebviewProtoObject[] }>('/api/grpc/studio/webview/ListWebviews', {});
  const list = (res.webviewsList || []).map(mapWebview);
  if (!search) return list;
  const q = search.toLowerCase();
  return list.filter((w) => w.name.toLowerCase().includes(q) || w.url.toLowerCase().includes(q));
}

export async function getWebview(id: string): Promise<WebViewConfig> {
  const res = await invokeApi<WebviewProtoObject>('/api/grpc/studio/webview/GetWebview', { id });
  return mapWebview(res);
}

export async function createWebview(payload: Partial<WebViewConfig>): Promise<WebViewConfig> {
  const res = await invokeApi<WebviewProtoObject>('/api/grpc/studio/webview/CreateWebview', {
    name: payload.name,
    url: payload.url,
    refreshIntervalSeconds: payload.refreshIntervalSeconds,
    zoomScale: payload.zoomScale,
    bypassCache: payload.bypassCache,
    orientation: payload.orientation,
  });
  return mapWebview(res);
}

export async function updateWebview(id: string, payload: Partial<WebViewConfig>): Promise<WebViewConfig> {
  const res = await invokeApi<WebviewProtoObject>('/api/grpc/studio/webview/UpdateWebview', {
    id,
    name: payload.name,
    url: payload.url,
    refreshIntervalSeconds: payload.refreshIntervalSeconds,
    zoomScale: payload.zoomScale,
    bypassCache: payload.bypassCache,
    orientation: payload.orientation,
  });
  return mapWebview(res);
}

export async function deleteWebview(id: string): Promise<{ success: boolean }> {
  return invokeApi<{ success: boolean }>('/api/grpc/studio/webview/DeleteWebview', { id });
}

