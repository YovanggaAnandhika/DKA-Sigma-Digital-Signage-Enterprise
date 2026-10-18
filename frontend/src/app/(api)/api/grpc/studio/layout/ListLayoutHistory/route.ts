import { NextRequest, NextResponse } from 'next/server';
import { LayoutServiceClient } from '@/lib/api/studio/v1/layout/layout_grpc_pb';
import { ListLayoutHistoryRequest } from '@/lib/api/studio/v1/layout/layout.common_pb';
import { PaginationRequest } from '@/lib/api/common/v1/types_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new LayoutServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new ListLayoutHistoryRequest();
    if (body.layout_id || body.layoutId) {
      request.setLayoutId(body.layout_id || body.layoutId);
    }
    if (body.search) {
      request.setSearch(body.search);
    }

    const pagination = new PaginationRequest();
    pagination.setPage(Number(body.page) || 1);
    pagination.setLimit(Number(body.limit) || 20);
    request.setPagination(pagination);

    return new Promise<NextResponse>((resolve) => {
      client.listLayoutHistory(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
