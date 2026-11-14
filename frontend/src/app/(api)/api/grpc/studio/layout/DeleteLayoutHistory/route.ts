import { NextRequest, NextResponse } from 'next/server';
import { LayoutServiceClient } from '@/lib/api/studio/v1/layout/layout_grpc_pb';
import { DeleteLayoutHistoryRequest } from '@/lib/api/studio/v1/layout/layout.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(LayoutServiceClient);

    const request = new DeleteLayoutHistoryRequest();
    if (Array.isArray(body.ids)) {
      request.setIdsList(body.ids);
    }
    request.setDeleteAll(Boolean(body.deleteAll || body.delete_all));
    if (body.layoutId || body.layout_id) {
      request.setLayoutId(body.layoutId || body.layout_id);
    }

    return new Promise<NextResponse>((resolve) => {
      client.deleteLayoutHistory(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
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
