import { NextRequest, NextResponse } from 'next/server';
import { LiveStreamServiceClient } from '@/lib/api/components/v1/live_stream/live_stream_grpc_pb';
import { GetStreamSegmentRequest } from '@/lib/api/components/v1/live_stream/live_stream.common_pb';
import { getGrpcHost, getGrpcCredentials } from '@/lib/core/grpcClient';

export async function GET(
  _req: NextRequest,
  { params }: { params: { streamId: string; file: string } }
) {
  const { streamId, file } = params;

  if (!streamId || !file) {
    return new NextResponse('Stream ID and filename required', { status: 400 });
  }

  const client = new LiveStreamServiceClient(getGrpcHost(), getGrpcCredentials());

  const grpcReq = new GetStreamSegmentRequest();
  grpcReq.setStreamId(streamId);
  grpcReq.setFileName(file);

  return new Promise<Response>((resolve) => {
    client.getStreamSegment(grpcReq, (err, response) => {
      if (err || !response || !response.getSuccess()) {
        return resolve(new NextResponse('Stream segment not ready or not found', { status: 404 }));
      }

      const rawData = response.getData_asU8();
      const contentType =
        response.getContentType() ||
        (file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T');

      const isPlaylist = file.endsWith('.m3u8');
      const cacheControl = isPlaylist
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=86400, immutable';

      resolve(
        new Response(Buffer.from(rawData), {
          status: 200,
          headers: {
            'Content-Type': contentType,
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

