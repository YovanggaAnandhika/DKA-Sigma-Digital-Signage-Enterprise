import { NextRequest, NextResponse } from 'next/server';
import { VisualFilterServiceClient } from '@/lib/api/studio/v1/visual_filter/visual_filter_grpc_pb';
import { CreateVisualFilterRequest } from '@/lib/api/studio/v1/visual_filter/visual_filter.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new VisualFilterServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new CreateVisualFilterRequest();
    if (body.name !== undefined) request.setName(body.name);
    if (body.brightness !== undefined) request.setBrightness(body.brightness);
    if (body.contrast !== undefined) request.setContrast(body.contrast);
    if (body.saturation !== undefined) request.setSaturation(body.saturation);
    if (body.hueRotate !== undefined) request.setHueRotate(body.hueRotate);
    if (body.blurPx !== undefined) request.setBlurPx(body.blurPx);
    
    return new Promise<NextResponse>((resolve) => {
      client.createVisualFilter(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
