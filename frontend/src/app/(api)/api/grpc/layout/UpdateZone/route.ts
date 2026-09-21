import { NextRequest, NextResponse } from 'next/server';
import { LayoutServiceClient } from '@/lib/api/studio/v1/layout/layout_grpc_pb';
import { UpdateZoneRequest } from '@/lib/api/studio/v1/layout/layout.common_pb';
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
    const client = new LayoutServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new UpdateZoneRequest();
    if(body.id) request.setId(body.id); if(body.name) request.setName(body.name); if(body.x !== undefined) request.setX(body.x); if(body.y !== undefined) request.setY(body.y); if(body.width !== undefined) request.setWidth(body.width); if(body.height !== undefined) request.setHeight(body.height); if(body.z_index !== undefined) request.setZIndex(body.z_index);

    return new Promise((resolve) => {
      client.updateZone(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(normalize(response.toObject())));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
