import { NextRequest, NextResponse } from 'next/server';
import { StreamServiceClient } from '@/lib/api/distribution/v1/stream/stream_grpc_pb';
import { ListDeviceScreenshotsRequest } from '@/lib/api/distribution/v1/stream/stream.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(StreamServiceClient);

    const request = new ListDeviceScreenshotsRequest();
    if (body.deviceId || body.device_id) {
      request.setDeviceId(body.deviceId || body.device_id);
    }
    if (body.limit !== undefined) {
      request.setLimit(Number(body.limit));
    }

    return new Promise<NextResponse>((resolve) => {
      client.listDeviceScreenshots(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
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
