import { NextRequest, NextResponse } from 'next/server';
import { LiveStreamServiceClient } from '@/lib/api/components/v1/live_stream/live_stream_grpc_pb';
import { CreateLiveStreamRequest } from '@/lib/api/components/v1/live_stream/live_stream.common_pb';
import { getGrpcClient, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const request = new CreateLiveStreamRequest()
      .setName(body.name || '')
      .setDescription(body.description || '')
      .setStreamMode(body.streamMode || 'EXTERNAL_EMBED')
      .setSourceType(body.sourceType || 'HLS')
      .setSourceUrl(body.sourceUrl || '')
      .setAutoReconnect(body.autoReconnect ?? true)
      .setLowLatencyMode(body.lowLatencyMode ?? true)
      .setIsMuted(body.isMuted ?? false)
      .setPosterImageUrl(body.posterImageUrl || '')
      .setRequiresAuth(Boolean(body.requiresAuth))
      .setIngestUsername(body.ingestUsername || '')
      .setIngestPassword(body.ingestPassword || '');

    const client = getGrpcClient(LiveStreamServiceClient);

    return new Promise<NextResponse>((resolve) => {
      client.createLiveStream(request, getGrpcMetadata(getTokenFromRequest(req)), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

