import { NextRequest, NextResponse } from 'next/server';
import { ResolutionServiceClient } from '@/lib/api/common/v1/resolution/resolution_grpc_pb';
import { ListResolutionsRequest } from '@/lib/api/common/v1/resolution/resolution.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const client = new ResolutionServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new ListResolutionsRequest();

    return new Promise<NextResponse>((resolve) => {
      client.listResolutions(request, getGrpcMetadata(token), (error: any, response: any) => {
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
