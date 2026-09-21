import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/generated/studio/v1/media/media_grpc_pb';
import { ListMediaRequest } from '@/lib/api/generated/studio/v1/media/media.common_pb';
import { PaginationRequest } from '@/lib/api/generated/common/v1/types_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/api/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    
    const client = new MediaServiceClient(getGrpcHost(), getGrpcCredentials());
    const metadata = getGrpcMetadata(token);

    const request = new ListMediaRequest();
    
    if (body.pagination) {
      const pag = new PaginationRequest();
      if (body.pagination.page) pag.setPage(body.pagination.page);
      if (body.pagination.limit) pag.setLimit(body.pagination.limit);
      request.setPagination(pag);
    }
    
    if (body.search) {
      request.setSearch(body.search);
    }

    return new Promise((resolve) => {
      client.listMedia(request, metadata, (error, response) => {
        if (error) {
          console.error('[gRPC Error ListMedia]', error);
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    console.error('[API Error ListMedia]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
