import { NextRequest, NextResponse } from 'next/server';
import { LayerBlockServiceClient } from '@/lib/api/studio/v1/layer/block/layer_block_grpc_pb';
import { CreateLayerBlockRequest } from '@/lib/api/studio/v1/layer/block/layer_block.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new LayerBlockServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new CreateLayerBlockRequest();
    
    if (body.layer_id || body.layerId) request.setLayerId(body.layer_id || body.layerId);
    if (body.playlistId) request.setPlaylistId(body.playlistId);
    if (body.media_item_id || body.mediaItemId) request.setMediaItemId(body.media_item_id || body.mediaItemId);
    if (body.ticker_id || body.tickerId) request.setTickerId(body.ticker_id || body.tickerId);
    if (body.clock_id || body.clockId) request.setClockId(body.clock_id || body.clockId);
    if (body.webview_id || body.webviewId) request.setWebviewId(body.webview_id || body.webviewId);
    if (body.queue_id || body.queueId) request.setQueueId(body.queue_id || body.queueId);
    if (body.album_id || body.albumId) request.setAlbumId(body.album_id || body.albumId);
    if (body.startTimeSeconds !== undefined) request.setStartTimeSeconds(body.startTimeSeconds);
    if (body.durationSeconds !== undefined) request.setDurationSeconds(body.durationSeconds);
    
    return new Promise<NextResponse>((resolve) => {
      client.createLayerBlock(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
