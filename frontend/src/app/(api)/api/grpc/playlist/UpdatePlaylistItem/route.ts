import { NextRequest, NextResponse } from 'next/server';
import { PlaylistServiceClient } from '@/lib/api/studio/v1/playlist/playlist_grpc_pb';
import { UpdatePlaylistItemRequest } from '@/lib/api/studio/v1/playlist/playlist.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new PlaylistServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new UpdatePlaylistItemRequest();
    if (body.id) request.setId(body.id);
    if (body.duration_seconds !== undefined) request.setDurationSeconds(body.duration_seconds);
    if (body.transition_type) request.setTransitionType(body.transition_type);
    if (body.position !== undefined) request.setPosition(body.position);
    if (body.is_muted !== undefined) request.setIsMuted(body.is_muted);

    return new Promise<NextResponse>((resolve) => {
      client.updatePlaylistItem(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
