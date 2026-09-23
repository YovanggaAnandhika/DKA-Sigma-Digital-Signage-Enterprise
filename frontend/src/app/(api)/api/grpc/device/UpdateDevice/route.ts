import { NextRequest, NextResponse } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/hardware/v1/device/device_grpc_pb';
import { UpdateDeviceRequest } from '@/lib/api/hardware/v1/device/device.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new DeviceServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new UpdateDeviceRequest();
    
        if(body.id) request.setId(body.id);
        if(body.name) request.setName(body.name);
        if(body.displayGroupId) request.setDisplayGroupId(body.displayGroupId);
        if(body.screen_width !== undefined) request.setScreenWidth(body.screen_width);
        if(body.screen_height !== undefined) request.setScreenHeight(body.screen_height);
        if(body.orientation !== undefined) request.setOrientation(body.orientation);
        if(body.timezone) request.setTimezone(body.timezone);
        if(body.scheduleId) request.setScheduleId(body.scheduleId);

    return new Promise<NextResponse>((resolve) => {
      client.updateDevice(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
