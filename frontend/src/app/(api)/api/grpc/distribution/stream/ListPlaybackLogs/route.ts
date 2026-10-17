import { NextRequest, NextResponse } from 'next/server';
import { StreamServiceClient } from '@/lib/api/distribution/v1/stream/stream_grpc_pb';
import { ListPlaybackLogsRequest } from '@/lib/api/distribution/v1/stream/stream.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new StreamServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new ListPlaybackLogsRequest();
    if (body.deviceId || body.device_id) {
      request.setDeviceId(body.deviceId || body.device_id);
    }
    if (body.mediaId || body.media_id) {
      request.setMediaId(body.mediaId || body.media_id);
    }
    if (body.limit !== undefined) {
      request.setLimit(Number(body.limit));
    }
    if (body.offset !== undefined) {
      request.setOffset(Number(body.offset));
    }

    return new Promise<NextResponse>((resolve) => {
      client.listPlaybackLogs(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
