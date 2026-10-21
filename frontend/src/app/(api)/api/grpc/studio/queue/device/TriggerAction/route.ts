import { NextRequest, NextResponse } from 'next/server';
import { QueueDeviceServiceClient } from '@/lib/api/components/v1/queue/device/device_grpc_pb';
import { TriggerDeviceActionRequest } from '@/lib/api/components/v1/queue/device/device.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new QueueDeviceServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new TriggerDeviceActionRequest();

    request.setQueueDisplayId(body.queueDisplayId || body.queue_display_id || '');
    request.setDeviceUid(body.deviceUid || body.device_uid || '');
    request.setPin(Number(body.pin || 13));

    return new Promise<NextResponse>((resolve) => {
      client.triggerAction(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
