import { NextRequest, NextResponse } from 'next/server';
import { PlaylistServiceClient } from '@/lib/api/studio/v1/playlist/playlist/playlist_grpc_pb';
import { GetPlaylistRequest } from '@/lib/api/studio/v1/playlist/playlist/playlist.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(PlaylistServiceClient);
    
    const request = new GetPlaylistRequest();
    if (body.id) request.setId(body.id);

    return new Promise<NextResponse>((resolve) => {
      client.getPlaylist(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
