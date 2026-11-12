export type StreamMode = 'SERVER_HOSTED_HLS';
export type StreamSourceType = 'WHIP' | 'RTMP' | 'RTSP' | 'SRT';

export interface LiveStreamConfig {
  id: string;
  name: string;
  description: string;
  streamMode: StreamMode;
  sourceType: StreamSourceType;
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
}

export const LIVESTREAM_STORAGE_KEY = 'hndsigma_livestreams_v1';
export const DEFAULT_LIVESTREAMS: LiveStreamConfig[] = [];
