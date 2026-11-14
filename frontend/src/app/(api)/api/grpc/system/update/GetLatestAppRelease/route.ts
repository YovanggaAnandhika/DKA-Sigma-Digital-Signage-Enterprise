import { NextRequest, NextResponse } from 'next/server';
import { AppUpdateServiceClient } from '@/lib/api/system/v1/update/update_grpc_pb';
import { GetLatestReleaseRequest } from '@/lib/api/system/v1/update/update.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const client = getGrpcClient(AppUpdateServiceClient);

    const request = new GetLatestReleaseRequest();
    if (body.currentVersionCode) request.setCurrentVersionCode(body.currentVersionCode);

    return new Promise<NextResponse>((resolve) => {
      client.getLatestAppRelease(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
        if (error) {
          console.error('[GetLatestAppRelease] gRPC error:', error);
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error) {
    console.error('[GetLatestAppRelease] Catch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

