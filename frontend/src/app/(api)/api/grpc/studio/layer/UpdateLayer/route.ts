import { NextRequest, NextResponse } from 'next/server';
import { LayerServiceClient } from '@/lib/api/studio/v1/layer/layer/layer_grpc_pb';
import { UpdateLayerRequest } from '@/lib/api/studio/v1/layer/layer/layer.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new LayerServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new UpdateLayerRequest();
    
    if(body.id) request.setId(body.id);
    if(body.name) request.setName(body.name);
    if(body.x !== undefined) request.setX(body.x);
    if(body.y !== undefined) request.setY(body.y);
    if(body.width !== undefined) request.setWidth(body.width);
    if(body.height !== undefined) request.setHeight(body.height);
    if(body.zIndex !== undefined) request.setZIndex(body.zIndex);
    if(body.backgroundColor) request.setBackgroundColor(body.backgroundColor);
      
    return new Promise<NextResponse>((resolve) => {
      client.updateLayer(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
