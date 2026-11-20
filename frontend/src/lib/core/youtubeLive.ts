export type YouTubeLiveParsed =
  | { kind: 'video'; videoId: string; baseEmbedUrl: string }
  | { kind: 'channel'; channelId: string; baseEmbedUrl: string };

const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;
const CHANNEL_ID_REGEX = /^UC[A-Za-z0-9_-]{10,}$/;

export function parseYouTubeLiveUrl(rawUrl: string): YouTubeLiveParsed | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0] || '';
    if (VIDEO_ID_REGEX.test(id)) {
      return {
        kind: 'video',
        videoId: id,
        baseEmbedUrl: `https://www.youtube.com/embed/${id}`,
      };
    }
    return null;
  }

  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') {
    return null;
  }

  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] === 'watch') {
    const id = url.searchParams.get('v') || '';
    if (VIDEO_ID_REGEX.test(id)) {
      return {
        kind: 'video',
        videoId: id,
        baseEmbedUrl: `https://www.youtube.com/embed/${id}`,
      };
    }
  }

  if ((parts[0] === 'live' || parts[0] === 'embed') && parts[1] && VIDEO_ID_REGEX.test(parts[1])) {
    return {
      kind: 'video',
      videoId: parts[1],
      baseEmbedUrl: `https://www.youtube.com/embed/${parts[1]}`,
    };
  }

  if (parts[0] === 'embed' && parts[1] === 'live_stream') {
    const channelId = url.searchParams.get('channel') || '';
    if (CHANNEL_ID_REGEX.test(channelId)) {
      return {
        kind: 'channel',
        channelId,
        baseEmbedUrl: `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(channelId)}`,
      };
    }
  }

  if (parts[0] === 'channel' && parts[1] && CHANNEL_ID_REGEX.test(parts[1])) {
    return {
      kind: 'channel',
      channelId: parts[1],
      baseEmbedUrl: `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(parts[1])}`,
    };
  }

  return null;
}

export function buildYouTubeEmbedUrl(parsed: YouTubeLiveParsed, muted: boolean): string {
  const sep = parsed.baseEmbedUrl.includes('?') ? '&' : '?';
  return `${parsed.baseEmbedUrl}${sep}autoplay=1&mute=${muted ? 1 : 0}&playsinline=1&controls=0&rel=0&modestbranding=1&enablejsapi=1`;
}
