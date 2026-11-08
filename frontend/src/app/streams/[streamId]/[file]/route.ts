import { NextRequest, NextResponse } from 'next/server';
import { LiveStreamServiceClient } from '@/lib/api/components/v1/live_stream/live_stream_grpc_pb';
import { GetStreamSegmentRequest } from '@/lib/api/components/v1/live_stream/live_stream.common_pb';
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
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
