import { NextRequest, NextResponse } from 'next/server';
import { PlaylistServiceClient } from '@/lib/api/studio/v1/playlist/playlist_grpc_pb';
import { AddPlaylistItemRequest } from '@/lib/api/studio/v1/playlist/playlist.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new PlaylistServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new AddPlaylistItemRequest();
    if (body.playlist_id) request.setPlaylistId(body.playlist_id);
    if (body.media_item_id) request.setMediaItemId(body.media_item_id);
    if (body.duration_seconds !== undefined) request.setDurationSeconds(body.duration_seconds);
    if (body.transition_type) request.setTransitionType(body.transition_type);
    if (body.position !== undefined) request.setPosition(body.position);

    return new Promise<NextResponse>((resolve) => {
      client.addPlaylistItem(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
