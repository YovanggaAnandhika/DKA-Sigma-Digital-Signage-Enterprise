import { NextRequest, NextResponse } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/hardware/v1/device/device_grpc_pb';
import { RegisterDeviceRequest } from '@/lib/api/hardware/v1/device/device.common_pb';
import { getGrpcHost, getGrpcCredentials } from '@/lib/core/grpcClient';
import * as grpc from '@grpc/grpc-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = new DeviceServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new RegisterDeviceRequest();
    if (body.macAddress) request.setMacAddress(body.macAddress);
    if (body.appVersion) request.setAppVersion(body.appVersion);
    if (body.androidVersion) request.setAndroidVersion(body.androidVersion);
    if (body.screenWidth) request.setScreenWidth(body.screenWidth);
    if (body.screenHeight) request.setScreenHeight(body.screenHeight);
    if (body.orientation) request.setOrientation(body.orientation);
    if (body.deviceName || body.device_name || body.name) {
      request.setDeviceName(body.deviceName || body.device_name || body.name);
    }

    const metadata = new grpc.Metadata();

    return new Promise<NextResponse>((resolve) => {
      client.registerDevice(request, metadata, (error: any, response: any) => {
        if (error) {
          console.error('RegisterDevice error:', error);
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
