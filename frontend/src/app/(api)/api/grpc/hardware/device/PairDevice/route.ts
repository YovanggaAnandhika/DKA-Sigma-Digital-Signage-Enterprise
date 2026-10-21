import { NextRequest, NextResponse } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/hardware/v1/device/device_grpc_pb';
import { PairDeviceRequest } from '@/lib/api/hardware/v1/device/device.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new DeviceServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new PairDeviceRequest();
    
    if (body.deviceId || body.device_id) request.setDeviceId(body.deviceId || body.device_id);
    if (body.pairingCode || body.pairing_code) request.setPairingCode(body.pairingCode || body.pairing_code);
    if (body.deviceName || body.device_name) request.setDeviceName(body.deviceName || body.device_name);
    if (body.storeLocation || body.store_location) request.setStoreLocation(body.storeLocation || body.store_location);
    if (body.defaultLayoutId || body.default_layout_id) request.setDefaultLayoutId(body.defaultLayoutId || body.default_layout_id);
    if (body.canaryGroupId || body.canary_group_id) request.setCanaryGroupId(body.canaryGroupId || body.canary_group_id);

    return new Promise<NextResponse>((resolve) => {
      client.pairDevice(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
