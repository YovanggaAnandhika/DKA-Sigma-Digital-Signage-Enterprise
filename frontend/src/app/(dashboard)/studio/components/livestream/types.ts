export type StreamMode = 'EXTERNAL_EMBED' | 'SERVER_HOSTED_HLS';
export type StreamSourceType = 'HLS' | 'RTSP' | 'RTMP' | 'YOUTUBE_EMBED';

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
  createdAt?: string;
  updatedAt?: string;
}

export const LIVESTREAM_STORAGE_KEY = 'hndsigma_livestreams_v1';

export const DEFAULT_LIVESTREAMS: LiveStreamConfig[] = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    name: 'Kamera CCTV Area Kasir & Lobby Utama',
    description: 'Relay terpusat 1 feed RTSP kamera IP lokal menjadi HLS untuk seluruh layar cabang.',
    streamMode: 'SERVER_HOSTED_HLS',
    sourceType: 'RTSP',
    sourceUrl: 'rtsp://192.168.1.50:554/Streaming/Channels/101',
    serverHlsEndpoint: '/streams/f0000000-0000-0000-0000-000000000001/live.m3u8',
    isRelayActive: true,
    autoReconnect: true,
    lowLatencyMode: true,
    isMuted: true,
    posterImageUrl: '',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    name: 'Siaran Langsung Promo & Event (HLS Direct)',
    description: 'Stream video HLS langsung dari CDN untuk penayangan acara peluncuran produk.',
    streamMode: 'EXTERNAL_EMBED',
    sourceType: 'HLS',
    sourceUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    serverHlsEndpoint: '',
    isRelayActive: false,
    autoReconnect: true,
    lowLatencyMode: true,
    isMuted: false,
    posterImageUrl: '',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    name: 'Townhall Korporat & Siaran Berita (YouTube Live)',
    description: 'Embed langsung siaran YouTube Live dengan pemutaran otomatis tanpa gangguan.',
    streamMode: 'EXTERNAL_EMBED',
    sourceType: 'YOUTUBE_EMBED',
    sourceUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1',
    serverHlsEndpoint: '',
    isRelayActive: false,
    autoReconnect: true,
    lowLatencyMode: false,
    isMuted: true,
    posterImageUrl: '',
  },
];

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

