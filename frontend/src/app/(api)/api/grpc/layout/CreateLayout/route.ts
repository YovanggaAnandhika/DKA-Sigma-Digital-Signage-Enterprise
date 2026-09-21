import { NextRequest, NextResponse } from 'next/server';
import { LayoutServiceClient } from '@/lib/api/studio/v1/layout/layout_grpc_pb';
import { CreateLayoutRequest } from '@/lib/api/studio/v1/layout/layout.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new LayoutServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new CreateLayoutRequest();
    if(body.name) request.setName(body.name); if(body.description) request.setDescription(body.description); if(body.width) request.setWidth(body.width); if(body.height) request.setHeight(body.height); if(body.background_color) request.setBackgroundColor(body.background_color);

    return new Promise((resolve) => {
      client.createLayout(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
