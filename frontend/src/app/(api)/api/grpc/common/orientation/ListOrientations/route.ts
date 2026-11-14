import { NextRequest, NextResponse } from 'next/server';
import { OrientationServiceClient } from '@/lib/api/common/v1/orientation/orientation_grpc_pb';
import { ListOrientationsRequest } from '@/lib/api/common/v1/orientation/orientation.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const client = getGrpcClient(OrientationServiceClient);

    const request = new ListOrientationsRequest();

    return new Promise<NextResponse>((resolve) => {
      client.listOrientations(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
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
