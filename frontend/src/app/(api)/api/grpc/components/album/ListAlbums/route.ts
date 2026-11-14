import { NextRequest, NextResponse } from 'next/server';
import { AlbumServiceClient } from '@/lib/api/components/v1/album/album/album_grpc_pb';
import { ListAlbumsRequest } from '@/lib/api/components/v1/album/album/album.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const request = new ListAlbumsRequest().setSearch(body.search || '');
    const client = getGrpcClient(AlbumServiceClient);

    return new Promise<NextResponse>((resolve) => {
      client.listAlbums(request, getGrpcMetadataFromRequest(req), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
