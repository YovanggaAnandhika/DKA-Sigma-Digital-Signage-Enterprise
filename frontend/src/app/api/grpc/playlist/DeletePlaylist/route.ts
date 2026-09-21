import { NextRequest, NextResponse } from 'next/server';
import { PlaylistServiceClient } from '@/lib/api/generated/studio/v1/playlist/playlist_grpc_pb';
import { DeletePlaylistRequest } from '@/lib/api/generated/studio/v1/playlist/playlist.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/api/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new PlaylistServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new DeletePlaylistRequest();
    if (body.id) request.setId(body.id);

    return new Promise((resolve) => {
      client.deletePlaylist(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
