import { NextRequest, NextResponse } from 'next/server';
import { PlaylistServiceClient } from '@/lib/api/studio/v1/playlist/playlist_grpc_pb';
import { CreatePlaylistRequest } from '@/lib/api/studio/v1/playlist/playlist.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new PlaylistServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new CreatePlaylistRequest();
    if (body.name) request.setName(body.name);
    if (body.description !== undefined) request.setDescription(body.description);
    if (body.isShuffle !== undefined) request.setIsShuffle(body.isShuffle);

    return new Promise<NextResponse>((resolve) => {
      client.createPlaylist(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
