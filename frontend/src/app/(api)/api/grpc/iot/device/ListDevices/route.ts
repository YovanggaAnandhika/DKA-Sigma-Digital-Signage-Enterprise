import { NextRequest, NextResponse } from 'next/server';
import { IotDeviceServiceClient } from '@/lib/api/iot/v1/device/device_grpc_pb';
import { ListIotDevicesRequest } from '@/lib/api/iot/v1/device/device.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const client = new IotDeviceServiceClient(getGrpcHost(), getGrpcCredentials());
    return await new Promise<NextResponse>((resolve) => {
      client.listDevices(new ListIotDevicesRequest(), getGrpcMetadata(token), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
