import { NextRequest, NextResponse } from 'next/server';
import { LayerServiceClient } from '@/lib/api/studio/v1/layer/layer/layer_grpc_pb';
import { CreateLayerRequest } from '@/lib/api/studio/v1/layer/layer/layer.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new LayerServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new CreateLayerRequest();
    
    if(body.layoutId || body.layout_id) request.setLayoutId(body.layoutId || body.layout_id);
    if(body.name) request.setName(body.name);
    if(body.x !== undefined) request.setX(body.x);
    if(body.y !== undefined) request.setY(body.y);
    if(body.width !== undefined) request.setWidth(body.width);
    if(body.height !== undefined) request.setHeight(body.height);
    if(body.zIndex !== undefined) request.setZIndex(body.zIndex);
    if(body.backgroundColor) request.setBackgroundColor(body.backgroundColor);
    if(body.opacity !== undefined) request.setOpacity(body.opacity);
    if(body.overlayColor || body.overlay_color) request.setOverlayColor(body.overlayColor || body.overlay_color);
    if(body.overlayOpacity !== undefined || body.overlay_opacity !== undefined) request.setOverlayOpacity(body.overlayOpacity ?? body.overlay_opacity);
    if(body.borderRadius !== undefined || body.border_radius !== undefined) request.setBorderRadius(body.borderRadius ?? body.border_radius);
    if(body.borderColor || body.border_color) request.setBorderColor(body.borderColor || body.border_color);
    if(body.borderWidth !== undefined || body.border_width !== undefined) request.setBorderWidth(body.borderWidth ?? body.border_width);
      
    return new Promise<NextResponse>((resolve) => {
      client.createLayer(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
