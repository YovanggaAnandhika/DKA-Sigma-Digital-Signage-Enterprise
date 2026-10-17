import { NextRequest, NextResponse } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/hardware/v1/device/device_grpc_pb';
import { CheckPairingStatusRequest } from '@/lib/api/hardware/v1/device/device.common_pb';
import { getGrpcHost, getGrpcCredentials } from '@/lib/core/grpcClient';
import * as grpc from '@grpc/grpc-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = new DeviceServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new CheckPairingStatusRequest();
    if (body.pairingCode) request.setPairingCode(body.pairingCode);

    const metadata = new grpc.Metadata();

    return new Promise<NextResponse>((resolve) => {
      client.checkPairingStatus(request, metadata, (error: any, response: any) => {
        if (error) {
          console.error('CheckPairingStatus error:', error);
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
