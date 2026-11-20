export type StreamMode = 'SERVER_HOSTED_HLS' | 'EXTERNAL_EMBED';
export type StreamSourceType = 'WHIP' | 'RTSP' | 'YOUTUBE' | 'HLS' | 'EMBED' | 'RTMP';

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
