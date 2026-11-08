export type StreamMode = 'EXTERNAL_EMBED' | 'SERVER_HOSTED_HLS';
export type StreamSourceType = 'HLS' | 'RTSP' | 'RTMP' | 'WHIP' | 'YOUTUBE_EMBED';

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

export function toYoutubeEmbedUrl(rawUrl: string, isMuted = true): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return 'about:blank';

  try {
    const parsed = new URL(trimmed);
    let videoId = '';

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.replace('/', '');
    } else if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0] || '';
      } else if (parsed.pathname.startsWith('/live/')) {
        videoId = parsed.pathname.split('/live/')[1]?.split('/')[0] || '';
      } else {
        videoId = parsed.searchParams.get('v') || '';
      }
    }

    if (videoId) {
      const params = new URLSearchParams({
        autoplay: '1',
        mute: isMuted ? '1' : '0',
        controls: '0',
        rel: '0',
        playsinline: '1',
        enablejsapi: '1',
        iv_load_policy: '3',
        modestbranding: '1',
        disablekb: '1',
        fs: '0',
      });
      return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
    }
  } catch {}

  return trimmed;
}

