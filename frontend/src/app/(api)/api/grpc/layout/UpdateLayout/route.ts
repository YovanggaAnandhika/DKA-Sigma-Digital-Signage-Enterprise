  import { NextRequest, NextResponse } from 'next/server';
  import { LayoutServiceClient } from '@/lib/api/studio/v1/layout/layout_grpc_pb';
  import { UpdateLayoutRequest } from '@/lib/api/studio/v1/layout/layout.common_pb';
  import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

  export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const token = getTokenFromRequest(req);
      const client = new LayoutServiceClient(getGrpcHost(), getGrpcCredentials());
      
      const request = new UpdateLayoutRequest();
      if(body.id) request.setId(body.id); if(body.name) request.setName(body.name); if(body.description !== undefined) request.setDescription(body.description); if(body.width) request.setCanvasWidth(body.width); if(body.height) request.setCanvasHeight(body.height); if(body.background_color !== undefined) request.setBackgroundColor(body.background_color);

      return new Promise<NextResponse>((resolve) => {
        client.updateLayout(request, getGrpcMetadata(token), (error: any, response: any) => {
          if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
          else resolve(NextResponse.json(response.toObject()));
        });
      });
    } catch (error) {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
