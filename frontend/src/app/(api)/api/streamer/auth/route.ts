import { NextRequest, NextResponse } from 'next/server';
import { LiveStreamServiceClient } from '@/lib/api/components/v1/live_stream/live_stream_grpc_pb';
import { GetLiveStreamRequest } from '@/lib/api/components/v1/live_stream/live_stream.common_pb';
import { getGrpcClient } from '@/lib/core/grpcClient';

interface MediaMtxAuthPayload {
  ip?: string;
  user?: string;
  password?: string;
  path?: string;
  protocol?: string;
  id?: string;
  action?: string;
  query?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: MediaMtxAuthPayload = await req.json().catch(() => ({}));
    const action = body.action || '';
    const path = body.path || '';
    const protocol = (body.protocol || '').toLowerCase();
    const user = (body.user || '').trim();
    const password = (body.password || '').trim();

    // 1. Allow non-publish actions (read, playback, metrics, api)
    if (action !== 'publish') {
      return new NextResponse(null, { status: 200 });
    }

    // 2. Allow internal normalization & loopback paths (webrtc/*, hd/*, test streams)
    if (
      path.startsWith('webrtc/') ||
      path.startsWith('hd/') ||
      path === 'cctv_test' ||
      path === 'test_source'
    ) {
      return new NextResponse(null, { status: 200 });
    }

    // 3. Extract stream ID from `live/<streamId>`
    if (!path.startsWith('live/')) {
      return new NextResponse(null, { status: 200 });
    }

    const streamId = path.replace(/^live\//, '').trim();
    if (!streamId) {
      return new NextResponse('Stream ID required', { status: 400 });
    }

    // 4. Query stream configuration from database truth via gRPC
    const client = getGrpcClient(LiveStreamServiceClient);
    const grpcReq = new GetLiveStreamRequest().setId(streamId);

    const liveStream = await new Promise<{
      requiresAuth: boolean;
      ingestUsername?: string;
      ingestPassword?: string;
      sourceType?: string;
    } | null>((resolve) => {
      client.getLiveStream(grpcReq, (err, response) => {
        if (err || !response) return resolve(null);
        resolve(response.toObject() as any);
      });
    });

    if (!liveStream) {
      // If stream is not registered in DB, deny publishing
      return new NextResponse('Stream not found', { status: 404 });
    }

    // If stream does not require authentication, permit publishing
    if (!liveStream.requiresAuth) {
      return new NextResponse(null, { status: 200 });
    }

    // 5. Enforce authentication based on protocol
    const expectedUser = (liveStream.ingestUsername || '').trim();
    const expectedPass = (liveStream.ingestPassword || '').trim();

    if (protocol === 'rtmp') {
      const userMatches = !expectedUser || user === expectedUser;
      const passMatches = !expectedPass || password === expectedPass;

      if (userMatches && passMatches && (user || password)) {
        return new NextResponse(null, { status: 200 });
      }

      return new NextResponse('Unauthorized RTMP Ingest', { status: 401 });
    }

    if (protocol === 'webrtc' || protocol === 'whip') {
      // WHIP requests pass through Next.js /streams/[streamId]/whip which already validates the Bearer token
      return new NextResponse(null, { status: 200 });
    }

    // Fallback: permit if no explicit credentials required
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse('Internal Error in Auth Webhook', { status: 500 });
  }
}

