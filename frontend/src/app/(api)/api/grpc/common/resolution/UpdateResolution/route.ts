import { NextRequest, NextResponse } from 'next/server';
import { ResolutionServiceClient } from '@/lib/api/common/v1/resolution/resolution_grpc_pb';
import { UpdateResolutionRequest } from '@/lib/api/common/v1/resolution/resolution.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new ResolutionServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new UpdateResolutionRequest();
    if (body.id) request.setId(body.id);
    if (body.name) request.setName(body.name);
    if (body.width) request.setWidth(Number(body.width));
    if (body.height) request.setHeight(Number(body.height));
    if (body.aspectRatio || body.aspect_ratio) request.setAspectRatio(body.aspectRatio || body.aspect_ratio);

    return new Promise<NextResponse>((resolve) => {
      client.updateResolution(request, getGrpcMetadata(token), (error: any, response: any) => {
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
