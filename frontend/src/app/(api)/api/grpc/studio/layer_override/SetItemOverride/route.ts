import { NextRequest, NextResponse } from 'next/server';
import { LayerItemOverrideServiceClient } from '@/lib/api/studio/v1/layer/item_override/layer_item_override_grpc_pb';
import { CreateLayerItemOverrideRequest } from '@/lib/api/studio/v1/layer/item_override/layer_item_override.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(LayerItemOverrideServiceClient);
    const request = new CreateLayerItemOverrideRequest();
    
    if (body.layerPlaylistId) request.setLayerPlaylistId(body.layerPlaylistId);
    if (body.playlistItemId) request.setPlaylistItemId(body.playlistItemId);
    if (body.isMuted !== undefined) request.setIsMuted(body.isMuted);
    
    return new Promise<NextResponse>((resolve) => {
      client.createLayerItemOverride(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
