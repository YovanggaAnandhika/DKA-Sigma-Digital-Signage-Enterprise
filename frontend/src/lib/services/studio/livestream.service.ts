import { invokeApi } from '../../core/invokeApi';
import {
  LiveStreamConfig,
  DEFAULT_LIVESTREAMS,
  LIVESTREAM_STORAGE_KEY,
  StreamMode,
  StreamSourceType,
} from '../../../app/(dashboard)/studio/components/livestream/types';

type LiveStreamProtoObject = {
  id: string;
  corporationId?: string;
  name: string;
  description: string;
  streamMode: string;
  sourceType: string;
  sourceUrl: string;
  serverHlsEndpoint: string;
  isRelayActive: boolean;
  autoReconnect: boolean;
  lowLatencyMode: boolean;
  isMuted: boolean;
  posterImageUrl: string;
  requiresAuth?: boolean;
  ingestUsername?: string;
  ingestPassword?: string;
  createdAt?: string;
  updatedAt?: string;
};

function mapLiveStream(item: LiveStreamProtoObject): LiveStreamConfig {
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    streamMode: (item.streamMode as StreamMode) || 'EXTERNAL_EMBED',
    sourceType: (item.sourceType as StreamSourceType) || 'HLS',
    sourceUrl: item.sourceUrl || '',
    serverHlsEndpoint: item.serverHlsEndpoint || '',
    isRelayActive: Boolean(item.isRelayActive),
    autoReconnect: item.autoReconnect ?? true,
    lowLatencyMode: item.lowLatencyMode ?? true,
    isMuted: Boolean(item.isMuted),
    posterImageUrl: item.posterImageUrl || '',
    requiresAuth: Boolean(item.requiresAuth),
    ingestUsername: item.ingestUsername || '',
    ingestPassword: item.ingestPassword || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function getLocalStreams(): LiveStreamConfig[] {
  if (typeof window === 'undefined') return DEFAULT_LIVESTREAMS;
  try {
    const raw = localStorage.getItem(LIVESTREAM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(LIVESTREAM_STORAGE_KEY, JSON.stringify(DEFAULT_LIVESTREAMS));
  } catch {}
  return DEFAULT_LIVESTREAMS;
}

function saveLocalStreams(items: LiveStreamConfig[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LIVESTREAM_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export async function getLiveStreams(search = ''): Promise<LiveStreamConfig[]> {
  try {
    const res = await invokeApi<{ itemsList?: LiveStreamProtoObject[] }>(
      '/api/grpc/components/live_stream/ListLiveStreams',
      { search }
    );
    if (res.itemsList && res.itemsList.length > 0) {
      const mapped = res.itemsList.map(mapLiveStream);
      saveLocalStreams(mapped);
      return mapped;
    }
  } catch {}

  const local = getLocalStreams();
  if (!search.trim()) return local;
  const q = search.toLowerCase();
  return local.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.sourceUrl.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
  );
}

export async function getLiveStream(id: string): Promise<LiveStreamConfig> {
  try {
    const res = await invokeApi<LiveStreamProtoObject>(
      '/api/grpc/components/live_stream/GetLiveStream',
      { id }
    );
    if (res && res.id) return mapLiveStream(res);
  } catch {}

  const local = getLocalStreams();
  const found = local.find((s) => s.id === id);
  if (!found) throw new Error('Konfigurasi Live Stream tidak ditemukan');
  return found;
}

export async function createLiveStream(
  payload: Omit<LiveStreamConfig, 'id' | 'serverHlsEndpoint' | 'isRelayActive'>
): Promise<LiveStreamConfig> {
  try {
    const res = await invokeApi<LiveStreamProtoObject>(
      '/api/grpc/components/live_stream/CreateLiveStream',
      payload
    );
    if (res && res.id) {
      const created = mapLiveStream(res);
      const local = getLocalStreams();
      saveLocalStreams([created, ...local.filter((i) => i.id !== created.id)]);
      return created;
    }
  } catch {}

  const id = crypto.randomUUID ? crypto.randomUUID() : `f0000000-0000-4000-8000-${Date.now().toString().slice(-12).padStart(12, '0')}`;
  const created: LiveStreamConfig = {
    ...payload,
    id,
    serverHlsEndpoint: payload.streamMode === 'SERVER_HOSTED_HLS' ? `/streams/${id}/live.m3u8` : '',
    isRelayActive: payload.streamMode === 'SERVER_HOSTED_HLS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const local = getLocalStreams();
  saveLocalStreams([created, ...local]);
  return created;
}

export async function updateLiveStream(payload: LiveStreamConfig): Promise<LiveStreamConfig> {
  try {
    const res = await invokeApi<LiveStreamProtoObject>(
      '/api/grpc/components/live_stream/UpdateLiveStream',
      payload
    );
    if (res && res.id) {
      const updated = mapLiveStream(res);
      const local = getLocalStreams();
      saveLocalStreams(local.map((i) => (i.id === updated.id ? updated : i)));
      return updated;
    }
  } catch {}

  const updated: LiveStreamConfig = {
    ...payload,
    serverHlsEndpoint:
      payload.streamMode === 'SERVER_HOSTED_HLS'
        ? `/streams/${payload.id}/live.m3u8`
        : '',
    updatedAt: new Date().toISOString(),
  };
  const local = getLocalStreams();
  saveLocalStreams(local.map((i) => (i.id === updated.id ? updated : i)));
  return updated;
}

export async function deleteLiveStream(id: string): Promise<void> {
  try {
    await invokeApi('/api/grpc/components/live_stream/DeleteLiveStream', { id });
  } catch {}
  const local = getLocalStreams();
  saveLocalStreams(local.filter((i) => i.id !== id));
}

export async function toggleLiveStreamRelay(id: string, isRelayActive: boolean): Promise<LiveStreamConfig> {
  try {
    const res = await invokeApi<LiveStreamProtoObject>(
      '/api/grpc/components/live_stream/ToggleRelayHost',
      { id, isRelayActive }
    );
    if (res && res.id) {
      const updated = mapLiveStream(res);
      const local = getLocalStreams();
      saveLocalStreams(local.map((i) => (i.id === updated.id ? updated : i)));
      return updated;
    }
  } catch {}

  const local = getLocalStreams();
  const target = local.find((i) => i.id === id);
  if (!target) throw new Error('Stream tidak ditemukan');
  const updated: LiveStreamConfig = {
    ...target,
    isRelayActive,
    serverHlsEndpoint:
      target.streamMode === 'SERVER_HOSTED_HLS'
        ? `/streams/${id}/live.m3u8`
        : target.serverHlsEndpoint,
  };
  saveLocalStreams(local.map((i) => (i.id === id ? updated : i)));
  return updated;
}

