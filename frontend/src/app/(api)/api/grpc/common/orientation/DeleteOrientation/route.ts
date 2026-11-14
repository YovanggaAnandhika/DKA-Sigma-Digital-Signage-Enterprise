import { NextRequest, NextResponse } from 'next/server';
import { OrientationServiceClient } from '@/lib/api/common/v1/orientation/orientation_grpc_pb';
import { DeleteOrientationRequest } from '@/lib/api/common/v1/orientation/orientation.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(OrientationServiceClient);

    const request = new DeleteOrientationRequest();
    if (body.id) request.setId(body.id);

    return new Promise<NextResponse>((resolve) => {
      client.deleteOrientation(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
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
