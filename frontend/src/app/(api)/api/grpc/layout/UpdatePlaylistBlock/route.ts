import { NextRequest, NextResponse } from 'next/server';
import { LayoutServiceClient } from '@/lib/api/studio/v1/layout/layout_grpc_pb';
import { UpdatePlaylistBlockRequest } from '@/lib/api/studio/v1/layout/layout.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new LayoutServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new UpdatePlaylistBlockRequest();
    const blockId = body.block_id || body.blockId || body.id;
    if (blockId) request.setBlockId(blockId);
    if (body.startTimeSeconds !== undefined) request.setStartTimeSeconds(body.startTimeSeconds);
    if (body.durationSeconds !== undefined) request.setDurationSeconds(body.durationSeconds);
    const transition = body.transitionType || body.transition_type;
    if (transition) request.setTransitionType(transition);
    if (body.position !== undefined) request.setOrderIndex(body.position);
    if (body.isMuted !== undefined) request.setIsMuted(body.isMuted);
    return new Promise<NextResponse>((resolve) => {
      client.updatePlaylistBlock(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
