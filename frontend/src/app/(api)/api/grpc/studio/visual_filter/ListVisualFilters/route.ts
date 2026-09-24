import { NextRequest, NextResponse } from 'next/server';
import { VisualFilterServiceClient } from '@/lib/api/studio/v1/visual_filter/visual_filter_grpc_pb';
import { ListVisualFiltersRequest } from '@/lib/api/studio/v1/visual_filter/visual_filter.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = getTokenFromRequest(req);
    const client = new VisualFilterServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new ListVisualFiltersRequest();
    
    return new Promise<NextResponse>((resolve) => {
      client.listVisualFilters(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
