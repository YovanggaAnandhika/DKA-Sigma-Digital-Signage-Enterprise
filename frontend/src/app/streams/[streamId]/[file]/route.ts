import { NextRequest, NextResponse } from 'next/server';
import { LiveStreamServiceClient } from '@/lib/api/components/v1/live_stream/live_stream_grpc_pb';
import { GetStreamSegmentRequest, GetLiveStreamRequest } from '@/lib/api/components/v1/live_stream/live_stream.common_pb';
import { getGrpcClient } from '@/lib/core/grpcClient';

export async function GET(
  _req: NextRequest,
  { params }: { params: { streamId: string; file: string } }
) {
  const { streamId, file } = params;

  if (!streamId || !file) {
    return new NextResponse('Stream ID and filename required', { status: 400 });
  }

  // Reuse singleton multiplexed HTTP/2 gRPC channel to prevent socket & memory leaks
  const client = getGrpcClient(LiveStreamServiceClient);

  const grpcReq = new GetStreamSegmentRequest();
  grpcReq.setStreamId(streamId);
  grpcReq.setFileName(file);

  return new Promise<Response>((resolve) => {
    client.getStreamSegment(grpcReq, (err, response) => {
      if (err || !response || !response.getSuccess()) {
        return resolve(new NextResponse(null, { status: 404 }));
      }

      const rawData = response.getData_asU8();
      const isPlaylist = file.endsWith('.m3u8');
      const contentType =
        response.getContentType() ||
        (isPlaylist ? 'application/vnd.apple.mpegurl' : 'video/MP2T');

      const cacheControl = isPlaylist
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=60, immutable';

      resolve(
        new Response(rawData as unknown as BodyInit, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': String(rawData.byteLength),
            'Cache-Control': cacheControl,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          },
        })
      );
    });
  });
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
    const streamerBase =
      process.env.HND_STREAMER_INTERNAL_URL || 'http://dka-product-sigma-streamer:8889';
    const base = streamerBase.replace(/\/$/, '');

    // WHIP Ingestion Proxy (OBS Studio / WebRTC Publishers via standard Port 80 HTTP)
    if (file === 'whip') {
      const authHeader = req.headers.get('authorization') || '';

      // Validate Bearer Token against DB truth
      const client = getGrpcClient(LiveStreamServiceClient);
      const grpcReq = new GetLiveStreamRequest();
      grpcReq.setId(streamId);

      const liveStream = await new Promise<{ requiresAuth: boolean; ingestPassword?: string } | null>((resolve) => {
        client.getLiveStream(grpcReq, (err, response) => {
          if (err || !response) return resolve(null);
          resolve(response.toObject() as any);
        });
      });

      if (liveStream?.requiresAuth && liveStream.ingestPassword) {
        const expectedToken = liveStream.ingestPassword.trim();
        const providedToken = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (!providedToken || providedToken !== expectedToken) {
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
        }
      } catch {}
    }

    if (!upstream || !upstream.ok) {
      return new NextResponse(null, { status: upstream?.status || 502 });
    }

    const sdpAnswer = await upstream.text();
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
  const streamerBase =
    process.env.HND_STREAMER_INTERNAL_URL || 'http://dka-product-sigma-streamer:8889';
  const base = streamerBase.replace(/\/$/, '');
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
  const streamerBase =
    process.env.HND_STREAMER_INTERNAL_URL || 'http://dka-product-sigma-streamer:8889';
  const base = streamerBase.replace(/\/$/, '');
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
