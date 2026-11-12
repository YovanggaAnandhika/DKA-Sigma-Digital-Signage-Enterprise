import { NextRequest, NextResponse } from 'next/server';
import { LiveStreamServiceClient } from '@/lib/api/components/v1/live_stream/live_stream_grpc_pb';
import { GetLiveStreamRequest } from '@/lib/api/components/v1/live_stream/live_stream.common_pb';
import { getGrpcClient } from '@/lib/core/grpcClient';

const streamerHost = process.env.HND_STREAMER_INTERNAL_HOST || 'dka-product-sigma-streamer';
const streamerPort = process.env.HND_STREAMER_INTERNAL_PORT || '8889';
const streamerHlsPort = process.env.HND_STREAMER_HLS_PORT || '8888';
const getStreamerBase = (port: string) => `http://${streamerHost}:${port}`;

export async function GET(
  req: NextRequest,
  { params }: { params: { streamId: string; file: string } }
) {
  const { streamId, file } = params;

  if (!streamId || !file) {
    return new NextResponse('Stream ID and filename required', { status: 400 });
  }

  // Preserve any HLS session query parameters (e.g. ?session=uuid) required by MediaMTX
  const search = req.nextUrl.search || '';
  const fileWithQuery = search ? `${file}${search}` : file;

  // Browser HLS fallback: fetch directly from the internal streamer (no gRPC hop).
  const streamerHlsBase = getStreamerBase(streamerHlsPort);
  const isPlaylist = file.endsWith('.m3u8');
  const targetFile = file === 'live.m3u8' ? 'index.m3u8' : fileWithQuery;

  for (const prefix of ['hd/live', 'webrtc/live', 'live']) {
    try {
      const res = await fetch(`${streamerHlsBase}/${prefix}/${streamId}/${targetFile}`, {
        headers: { Authorization: 'Bearer dkasigma_pipe' },
        cache: 'no-store',
      });
      if (!res.ok) continue;
      const raw = await res.arrayBuffer();
      return new Response(raw, {
        status: 200,
        headers: {
          'Content-Type':
            res.headers.get('content-type') ||
            (isPlaylist ? 'application/vnd.apple.mpegurl' : 'video/MP2T'),
          'Content-Length': String(raw.byteLength),
          'Cache-Control': isPlaylist ? 'no-cache, no-store, must-revalidate' : 'public, max-age=60, immutable',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        },
      });
    } catch {}
  }
  return new NextResponse(null, { status: 404 });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

/**
 * WebRTC WHEP Signaling Bridge (`POST /streams/[streamId]/whep`)
 * Forwards the browser's SDP Offer over internal Docker network to `dka-product-sigma-streamer:8889/live/<streamId>/whep`
 * and returns the SDP Answer for sub-second UDP/TCP WebRTC streaming.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { streamId: string; file: string } }
) {
  const { streamId, file } = params;
  if (!streamId || (file !== 'whep' && file !== 'whip')) {
    return new NextResponse('Invalid endpoint', { status: 400 });
  }

  try {
    const sdpOffer = await req.text();
    const base = getStreamerBase(streamerPort);

    // WHIP Ingestion Proxy (OBS Studio / WebRTC Publishers via standard Port 80 HTTP)
    if (file === 'whip') {
      const authHeader = req.headers.get('authorization') || '';

      // Validate Protocol & Bearer Token against DB truth
      const client = getGrpcClient(LiveStreamServiceClient);
      const grpcReq = new GetLiveStreamRequest();
      grpcReq.setId(streamId);

      const liveStream = await new Promise<{ requiresAuth: boolean; ingestPassword?: string; sourceType?: string } | null>((resolve) => {
        client.getLiveStream(grpcReq, (err, response) => {
          if (err || !response) return resolve(null);
          resolve(response.toObject() as any);
        });
      });

      if (!liveStream) {
        return new NextResponse('Live stream not found', {
          status: 404,
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (liveStream.requiresAuth) {
        const expectedToken = (liveStream.ingestPassword || '').trim();
        const providedToken = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (!expectedToken || !providedToken || providedToken !== expectedToken) {
          return new NextResponse('Unauthorized: Invalid or missing Bearer token', {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Bearer error="invalid_token"',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/sdp' };
      if (authHeader) headers['Authorization'] = authHeader;

      const upstream = await fetch(`${base}/live/${streamId}/whip`, {
        method: 'POST',
        headers,
        body: sdpOffer,
        cache: 'no-store',
      });

      if (!upstream.ok) {
        return new NextResponse(null, { status: upstream.status });
      }

      const sdpAnswer = await upstream.text();
      const responseHeaders: Record<string, string> = {
        'Content-Type': 'application/sdp',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Location',
      };
      const loc = upstream.headers.get('location');
      if (loc) responseHeaders['Location'] = loc;

      return new Response(sdpAnswer, {
        status: 201,
        headers: responseHeaders,
      });
    }

    // WHEP Egress Proxy (Browser & Signage Screen Players via standard Port 80 HTTP)
    const mode = req.nextUrl.searchParams.get('mode');

    // Priority chain:
    // - HD mode: 1080p normalized zero-B-frame ultrafast stream (`hd/live`), falling back to direct or 720p
    // - Low-latency mode: 720p instant baseline stream (`webrtc/live`), falling back to HD or direct
    const candidates = mode === 'hd'
      ? [
          `${base}/hd/live/${streamId}/whep`,
          `${base}/live/${streamId}/whep`,
          `${base}/webrtc/live/${streamId}/whep`,
        ]
      : [
          `${base}/webrtc/live/${streamId}/whep`,
          `${base}/hd/live/${streamId}/whep`,
          `${base}/live/${streamId}/whep`,
        ];

    let upstream: Response | null = null;
    let lastError = '';
    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: sdpOffer,
          cache: 'no-store',
        });
        if (res.ok) {
          upstream = res;
          break;
        } else {
          const bodyText = await res.text().catch(() => '');
          lastError = `${url} -> ${res.status}: ${bodyText}`;
        }
      } catch (err: any) {
        lastError = `${url} -> fetch failed: ${err?.message}`;
      }
    }

    if (!upstream || !upstream.ok) {
      console.error('[WHEP Egress Error]', lastError);
      return new NextResponse(null, { status: upstream?.status || 502 });
    }

    let sdpAnswer = await upstream.text();

    // Clean unreachable private container candidates from SDP answer
    // MediaMTX advertises 127.0.0.1 and internal Docker subnet IPs (172.x.x.x)
    // which causes physical devices on local Wi-Fi to stall on dead ICE candidates.
    sdpAnswer = sdpAnswer
      .split('\n')
      .filter((line) => {
        if (!line.startsWith('a=candidate:')) return true;
        if (
          line.includes(' 127.0.0.1 ') ||
          line.includes(' 172.23.') ||
          line.includes(' 172.17.') ||
          line.includes(' 10.20.30.63 ')
        ) {
          return false;
        }
        return true;
      })
      .join('\n');

    return new Response(sdpAnswer, {
      status: 201,
      headers: {
        'Content-Type': 'application/sdp',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { streamId: string; file: string } }
) {
  const { streamId, file } = params;
  if (!streamId || (file !== 'whip' && file !== 'whep')) {
    return new NextResponse('Invalid endpoint', { status: 400 });
  }
  const base = getStreamerBase(streamerPort);
  const authHeader = req.headers.get('authorization') || '';
  const headers: Record<string, string> = {};
  if (authHeader) headers['Authorization'] = authHeader;

  const upstream = await fetch(`${base}/live/${streamId}/${file}`, {
    method: 'DELETE',
    headers,
    cache: 'no-store',
  }).catch(() => null);

  return new Response(null, {
    status: upstream?.status || 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { streamId: string; file: string } }
) {
  const { streamId, file } = params;
  if (!streamId || (file !== 'whip' && file !== 'whep')) {
    return new NextResponse('Invalid endpoint', { status: 400 });
  }
  const base = getStreamerBase(streamerPort);
  const body = await req.text();
  const upstream = await fetch(`${base}/live/${streamId}/${file}`, {
    method: 'PATCH',
    headers: { 'Content-Type': req.headers.get('content-type') || 'application/trickle-ice-sdpfrag' },
    body,
    cache: 'no-store',
  }).catch(() => null);

  return new Response(upstream ? await upstream.text() : null, {
    status: upstream?.status || 204,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
