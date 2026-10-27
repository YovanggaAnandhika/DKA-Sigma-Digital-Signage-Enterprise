import { NextRequest, NextResponse } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/hardware/v1/device/device_grpc_pb';
import { GetDeviceAnalyticsHistoryRequest } from '@/lib/api/hardware/v1/device/device.common_pb';
import { getGrpcClient, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = getGrpcClient(DeviceServiceClient);

    const deviceId = body.deviceId || body.device_id;
    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId diperlukan' }, { status: 400 });
    }

    const request = new GetDeviceAnalyticsHistoryRequest();
    request.setDeviceId(deviceId);
    request.setTimeRange(body.timeRange || body.time_range || '1h');
    if (body.limit) {
      request.setLimit(Number(body.limit));
    }

    return new Promise<NextResponse>((resolve) => {
      client.getDeviceAnalyticsHistory(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) {
          console.error('[GetDeviceAnalyticsHistory Error]:', error.message);
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    console.error('[GetDeviceAnalyticsHistory Route Error]:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
