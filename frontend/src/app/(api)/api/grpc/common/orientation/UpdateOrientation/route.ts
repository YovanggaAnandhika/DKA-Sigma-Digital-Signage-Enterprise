import { NextRequest, NextResponse } from 'next/server';
import { OrientationServiceClient } from '@/lib/api/common/v1/orientation/orientation_grpc_pb';
import { UpdateOrientationRequest } from '@/lib/api/common/v1/orientation/orientation.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new OrientationServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new UpdateOrientationRequest();
    if (body.id) request.setId(body.id);
    if (body.name) request.setName(body.name);
    if (body.value) request.setValue(body.value);

    return new Promise<NextResponse>((resolve) => {
      client.updateOrientation(request, getGrpcMetadata(token), (error: any, response: any) => {
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
