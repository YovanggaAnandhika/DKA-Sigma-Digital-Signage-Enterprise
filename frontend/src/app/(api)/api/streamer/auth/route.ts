import { NextRequest, NextResponse } from 'next/server';
import { LiveStreamServiceClient } from '@/lib/api/components/v1/live_stream/live_stream_grpc_pb';
import { GetLiveStreamRequest } from '@/lib/api/components/v1/live_stream/live_stream.common_pb';
import { getGrpcClient } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || '';
    const path = body.path || '';
    const user = (body.user || '').trim();
    const password = (body.password || '').trim();

    // 1. Allow non-publish actions and internal transcoder paths
    if (
      action !== 'publish' ||
      path.startsWith('webrtc/') ||
      path.startsWith('hd/') ||
      path === 'cctv_test' ||
      path === 'test_source'
    ) {
      return new NextResponse(null, { status: 200 });
    }

    // 2. Extract stream ID from `live/<streamId>`
    if (!path.startsWith('live/')) {
      return new NextResponse(null, { status: 200 });
    }

    const streamId = path.replace(/^live\//, '').trim();
    if (!streamId) {
      return new NextResponse(null, { status: 200 });
    }

    // 3. Query stream configuration from database truth via gRPC
    const client = getGrpcClient(LiveStreamServiceClient);
    const grpcReq = new GetLiveStreamRequest().setId(streamId);

    const liveStream = await new Promise<{
      requiresAuth: boolean;
      ingestUsername?: string;
      ingestPassword?: string;
    } | null>((resolve) => {
      client.getLiveStream(grpcReq, (err, response) => {
        if (err || !response) return resolve(null);
        resolve(response.toObject() as any);
      });
    });

    if (!liveStream) {
      return new NextResponse('Stream not found', { status: 404 });
    }

    // 4. Validate authentication only if explicitly enabled
    if (liveStream.requiresAuth) {
      const expectedUser = (liveStream.ingestUsername || '').trim();
      const expectedPass = (liveStream.ingestPassword || '').trim();

      const userMatches = !expectedUser || user === expectedUser;
      const passMatches = !expectedPass || password === expectedPass;

      if (!userMatches || !passMatches) {
        return new NextResponse('Unauthorized Ingest', { status: 401 });
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 200 });
  }
}
