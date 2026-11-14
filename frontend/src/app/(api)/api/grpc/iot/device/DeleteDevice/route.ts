import { NextRequest, NextResponse } from 'next/server';
import { IotDeviceServiceClient } from '@/lib/api/iot/v1/device/device_grpc_pb';
import { DeleteIotDeviceRequest } from '@/lib/api/iot/v1/device/device.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const request = new DeleteIotDeviceRequest();
    request.setId(String(body.id ?? ''));
    const client = getGrpcClient(IotDeviceServiceClient);
    return await new Promise<NextResponse>((resolve) => {
      client.deleteDevice(request, getGrpcMetadataFromRequest(req), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
