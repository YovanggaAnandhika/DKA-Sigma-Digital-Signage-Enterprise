import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/generated/studio/v1/media/media_grpc_pb';
import { DeleteMediaRequest } from '@/lib/api/generated/studio/v1/media/media.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/api/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new MediaServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new DeleteMediaRequest();
    if (body.id) request.setId(body.id);

    return new Promise((resolve) => {
      client.deleteMedia(request, getGrpcMetadata(token), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
