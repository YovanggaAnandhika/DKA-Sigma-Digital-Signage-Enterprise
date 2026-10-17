import { NextRequest, NextResponse } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/hardware/v1/device/device_grpc_pb';
import { HeartbeatRequest } from '@/lib/api/hardware/v1/device/device.common_pb';
import { getGrpcHost, getGrpcCredentials } from '@/lib/core/grpcClient';
import * as grpc from '@grpc/grpc-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = new DeviceServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new HeartbeatRequest();
    if (body.deviceId) request.setDeviceId(body.deviceId);
    if (body.deviceToken) request.setDeviceToken(body.deviceToken);
    if (body.storageFreeBytes) request.setStorageFreeBytes(body.storageFreeBytes);
    if (body.storageTotalBytes) request.setStorageTotalBytes(body.storageTotalBytes);
    if (body.memoryUsagePercent) request.setMemoryUsagePercent(body.memoryUsagePercent);
    if (body.currentPlayingMediaId) request.setCurrentPlayingMediaId(body.currentPlayingMediaId);
    if (body.activeLayoutId) request.setActiveLayoutId(body.activeLayoutId);
    if (body.activeManifestHash) request.setActiveManifestHash(body.activeManifestHash);

    const metadata = new grpc.Metadata();

    return new Promise<NextResponse>((resolve) => {
      client.sendHeartbeat(request, metadata, (error: any, response: any) => {
        if (error) {
          console.error('SendHeartbeat error:', error);
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
