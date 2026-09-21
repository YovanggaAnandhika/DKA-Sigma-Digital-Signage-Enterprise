import { NextRequest, NextResponse } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/hardware/v1/device/device_grpc_pb';
import { UpdateDeviceRequest } from '@/lib/api/hardware/v1/device/device.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

function normalize(obj: any): any {
  if (Array.isArray(obj)) return obj.map(normalize);
  if (obj === null || typeof obj !== 'object') return obj;
  const out: any = {};
  for (const k of Object.keys(obj)) {
    let nk: string;
    if (k.endsWith('List')) {
      // e.g. zonesList → zones, blocksList → blocks
      nk = k.slice(0, -4).replace(/[A-Z]/g, (c: string) => `_${c.toLowerCase()}`);
    } else {
      // e.g. canvasWidth → canvas_width
      nk = k.replace(/[A-Z]/g, (c: string) => `_${c.toLowerCase()}`);
    }
    out[nk] = normalize(obj[k]);
  }
  return out;
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new DeviceServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new UpdateDeviceRequest();
    
        if(body.id) request.setId(body.id);
        if(body.name) request.setName(body.name);
        if(body.display_group_id) request.setDisplayGroupId(body.display_group_id);
        if(body.screen_width !== undefined) request.setScreenWidth(body.screen_width);
        if(body.screen_height !== undefined) request.setScreenHeight(body.screen_height);
        if(body.orientation !== undefined) request.setOrientation(body.orientation);
        if(body.timezone) request.setTimezone(body.timezone);
        if(body.schedule_id) request.setScheduleId(body.schedule_id);

    return new Promise((resolve) => {
      client.updateDevice(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(normalize(response.toObject())));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
