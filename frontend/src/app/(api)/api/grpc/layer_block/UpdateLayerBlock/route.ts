import { NextRequest, NextResponse } from 'next/server';
import { LayerBlockServiceClient } from '@/lib/api/studio/v1/layer/block/layer_block_grpc_pb';
import { UpdateLayerBlockRequest } from '@/lib/api/studio/v1/layer/block/layer_block.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new LayerBlockServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new UpdateLayerBlockRequest();
    
    if (body.id) request.setId(body.id);
    if (body.startTimeSeconds !== undefined) request.setStartTimeSeconds(body.startTimeSeconds);
    if (body.durationSeconds !== undefined) request.setDurationSeconds(body.durationSeconds);
    if (body.transitionId !== undefined) request.setTransitionId(body.transitionId);
    if (body.orderIndex !== undefined) request.setOrderIndex(body.orderIndex);
    if (body.isMuted !== undefined) request.setIsMuted(body.isMuted);
    if (body.volumeLevel !== undefined) request.setVolumeLevel(body.volumeLevel);
    
    return new Promise<NextResponse>((resolve) => {
      client.updateLayerBlock(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
