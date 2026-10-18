import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for synthesized queue voice announcements
const ttsCache = new Map<string, { buffer: ArrayBuffer; timestamp: number }>();
const MAX_CACHE_ENTRIES = 200;

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text') || '';
  if (!text.trim()) {
    return new NextResponse('Text parameter is required', { status: 400 });
  }

  const cleanText = text.trim().slice(0, 300);
  const cacheKey = cleanText.toLowerCase();

  const cached = ttsCache.get(cacheKey);
  if (cached) {
    return new NextResponse(cached.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-TTS-Cache': 'HIT',
      },
    });
  }

  try {
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=id&client=tw-ob`;
    const response = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      return new NextResponse('TTS upstream error', { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();

    if (ttsCache.size >= MAX_CACHE_ENTRIES) {
      const firstKey = ttsCache.keys().next().value;
      if (firstKey) ttsCache.delete(firstKey);
    }
    ttsCache.set(cacheKey, { buffer: arrayBuffer, timestamp: Date.now() });

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-TTS-Cache': 'MISS',
      },
    });
  } catch (error: any) {
    console.error('Error fetching TTS audio:', error);
    return new NextResponse('Failed to synthesize speech', { status: 500 });
  }
}
