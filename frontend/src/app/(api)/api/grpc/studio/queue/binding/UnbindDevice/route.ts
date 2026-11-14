import { NextRequest, NextResponse } from 'next/server';
import { QueueIotBindingServiceClient } from '@/lib/api/components/v1/queue/iot_binding/iot_binding_grpc_pb';
import { UnbindIotDeviceRequest } from '@/lib/api/components/v1/queue/iot_binding/iot_binding.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const request = new UnbindIotDeviceRequest();
    request.setQueueDisplayId(String(body.queueDisplayId ?? ''));
    request.setIotDeviceId(String(body.iotDeviceId ?? ''));
    const client = getGrpcClient(QueueIotBindingServiceClient);
    return await new Promise<NextResponse>((resolve) => {
      client.unbindDevice(request, getGrpcMetadataFromRequest(req), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
