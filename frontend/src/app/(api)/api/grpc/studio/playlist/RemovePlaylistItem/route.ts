import { NextRequest, NextResponse } from 'next/server';
import { PlaylistItemServiceClient } from '@/lib/api/studio/v1/playlist/item/playlist_item_grpc_pb';
import { RemovePlaylistItemRequest } from '@/lib/api/studio/v1/playlist/item/playlist_item.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new PlaylistItemServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new RemovePlaylistItemRequest();
    if (body.id) request.setId(body.id);

    return new Promise<NextResponse>((resolve) => {
      client.removePlaylistItem(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
