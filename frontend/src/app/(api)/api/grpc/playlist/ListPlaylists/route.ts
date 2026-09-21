import { NextRequest, NextResponse } from 'next/server';
import { PlaylistServiceClient } from '@/lib/api/generated/studio/v1/playlist/playlist_grpc_pb';
import { ListPlaylistsRequest } from '@/lib/api/generated/studio/v1/playlist/playlist.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/api/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new PlaylistServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new ListPlaylistsRequest();
    if (body.search) request.setSearch(body.search);
    if (body.pagination) {
      const pag = new (require('@/lib/api/generated/common/v1/types_pb').PaginationRequest)();
      if (body.pagination.page) pag.setPage(body.pagination.page);
      if (body.pagination.limit) pag.setLimit(body.pagination.limit);
      request.setPagination(pag);
    }

    return new Promise((resolve) => {
      client.listPlaylists(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
