import { NextRequest, NextResponse } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/hardware/v1/device/device_grpc_pb';
import { PairDeviceRequest } from '@/lib/api/hardware/v1/device/device.common_pb';
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
    
    const request = new PairDeviceRequest();
    
        if(body.pairing_code) request.setPairingCode(body.pairing_code);
        if(body.device_name) request.setDeviceName(body.device_name);
        if(body.default_layout_id) request.setDefaultLayoutId(body.default_layout_id);
        if(body.canary_group_id) request.setCanaryGroupId(body.canary_group_id);

    return new Promise((resolve) => {
      client.pairDevice(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(normalize(response.toObject())));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
