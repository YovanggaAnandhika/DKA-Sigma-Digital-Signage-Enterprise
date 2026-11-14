import { NextRequest, NextResponse } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/hardware/v1/device/device_grpc_pb';
import { DeleteDeviceRequest } from '@/lib/api/hardware/v1/device/device.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(DeviceServiceClient);
    
    const request = new DeleteDeviceRequest();
    if(body.id) request.setId(body.id);

    return new Promise<NextResponse>((resolve) => {
      client.deleteDevice(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
