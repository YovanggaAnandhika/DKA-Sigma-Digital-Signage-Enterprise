import { NextRequest, NextResponse } from 'next/server';
import { ResolutionServiceClient } from '@/lib/api/common/v1/resolution/resolution_grpc_pb';
import { GetResolutionRequest } from '@/lib/api/common/v1/resolution/resolution.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(ResolutionServiceClient);

    const request = new GetResolutionRequest();
    if (body.id) request.setId(body.id);

    return new Promise<NextResponse>((resolve) => {
      client.getResolution(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
