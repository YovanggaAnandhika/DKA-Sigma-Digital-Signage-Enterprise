import { invokeApi } from '../../core/invokeApi';
import {
  LiveStreamConfig,
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

export async function getLiveStreams(search = ''): Promise<LiveStreamConfig[]> {
  const res = await invokeApi<{ itemsList?: LiveStreamProtoObject[] }>(
    '/api/grpc/components/live_stream/ListLiveStreams',
    { search }
  );
  const list = (res.itemsList || []).map(mapLiveStream);
  if (!search.trim()) return list;
  const q = search.toLowerCase();
  return list.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.sourceUrl.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
  );
}

export async function getLiveStream(id: string): Promise<LiveStreamConfig> {
  const res = await invokeApi<LiveStreamProtoObject>(
    '/api/grpc/components/live_stream/GetLiveStream',
    { id }
  );
  if (!res || !res.id) throw new Error('Konfigurasi Live Stream tidak ditemukan');
  return mapLiveStream(res);
}

export async function createLiveStream(
  payload: Omit<LiveStreamConfig, 'id' | 'serverHlsEndpoint' | 'isRelayActive'>
): Promise<LiveStreamConfig> {
  const res = await invokeApi<LiveStreamProtoObject>(
    '/api/grpc/components/live_stream/CreateLiveStream',
    payload
  );
  if (!res || !res.id) throw new Error('Gagal membuat Live Stream');
  return mapLiveStream(res);
}

export async function updateLiveStream(payload: LiveStreamConfig): Promise<LiveStreamConfig> {
  const res = await invokeApi<LiveStreamProtoObject>(
    '/api/grpc/components/live_stream/UpdateLiveStream',
    payload
  );
  if (!res || !res.id) throw new Error('Gagal memperbarui Live Stream');
  return mapLiveStream(res);
}

export async function deleteLiveStream(id: string): Promise<void> {
  await invokeApi('/api/grpc/components/live_stream/DeleteLiveStream', { id });
}

export async function toggleLiveStreamRelay(id: string, isRelayActive: boolean): Promise<LiveStreamConfig> {
  const res = await invokeApi<LiveStreamProtoObject>(
    '/api/grpc/components/live_stream/ToggleRelayHost',
    { id, isRelayActive }
  );
  if (!res || !res.id) throw new Error('Gagal mengubah status relay host');
  return mapLiveStream(res);
}
