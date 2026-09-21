import { NextRequest, NextResponse } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/generated/hardware/v1/device/device_grpc_pb';
import { PairDeviceRequest } from '@/lib/api/generated/hardware/v1/device/device.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/api/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new DeviceServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new PairDeviceRequest();
    
        if(body.pairing_code) request.setPairingCode(body.pairing_code);
        if(body.name) request.setName(body.name);
        if(body.display_group_id) request.setDisplayGroupId(body.display_group_id);
      

    return new Promise((resolve) => {
      client.pairDevice(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
