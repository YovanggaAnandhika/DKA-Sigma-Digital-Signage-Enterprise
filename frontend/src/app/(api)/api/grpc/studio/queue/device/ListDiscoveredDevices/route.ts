import { NextRequest, NextResponse } from 'next/server';
import { QueueDeviceServiceClient } from '@/lib/api/components/v1/queue/device/device_grpc_pb';
import { ListDiscoveredDevicesRequest } from '@/lib/api/components/v1/queue/device/device.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const client = new QueueDeviceServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new ListDiscoveredDevicesRequest();

    return new Promise<NextResponse>((resolve) => {
      client.listDiscoveredDevices(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
