import { NextRequest, NextResponse } from 'next/server';
import { LayoutServiceClient } from '@/lib/api/generated/studio/v1/layout/layout_grpc_pb';
import { AddZoneRequest } from '@/lib/api/generated/studio/v1/layout/layout.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/api/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new LayoutServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new AddZoneRequest();
    if(body.layout_id) request.setLayoutId(body.layout_id); if(body.name) request.setName(body.name); if(body.x !== undefined) request.setX(body.x); if(body.y !== undefined) request.setY(body.y); if(body.width !== undefined) request.setWidth(body.width); if(body.height !== undefined) request.setHeight(body.height); if(body.z_index !== undefined) request.setZIndex(body.z_index);

    return new Promise((resolve) => {
      client.addZone(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
