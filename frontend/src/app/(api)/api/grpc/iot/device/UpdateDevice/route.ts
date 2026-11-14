import { NextRequest, NextResponse } from 'next/server';
import { IotDeviceServiceClient } from '@/lib/api/iot/v1/device/device_grpc_pb';
import { IotPinMapping, UpdateIotDeviceRequest } from '@/lib/api/iot/v1/device/device.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const request = new UpdateIotDeviceRequest();
    request.setId(String(body.id ?? ''));
    request.setName(String(body.name ?? ''));
    request.setDeviceRole(String(body.deviceRole ?? 'COUNTER_REMOTE'));
    request.setIsActive(Boolean(body.isActive));
    for (const value of Array.isArray(body.pinMappings) ? body.pinMappings : []) {
      const mapping = new IotPinMapping();
      mapping.setPin(Number(value.pin));
      mapping.setAction(String(value.action ?? ''));
      mapping.setEnabled(Boolean(value.enabled));
      mapping.setLabel(String(value.label ?? ''));
      request.addPinMappings(mapping);
    }
    const client = getGrpcClient(IotDeviceServiceClient);
    return await new Promise<NextResponse>((resolve) => {
      client.updateDevice(request, getGrpcMetadataFromRequest(req), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
