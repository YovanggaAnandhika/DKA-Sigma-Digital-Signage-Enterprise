import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/studio/v1/media/media_grpc_pb';
import { CancelUploadRequest } from '@/lib/api/studio/v1/media/media.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new MediaServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new CancelUploadRequest();
    if (body.uploadId) request.setUploadId(body.uploadId);

    return new Promise<NextResponse>((resolve) => {
      client.cancelUpload(request, getGrpcMetadata(token), (error, response) => {
        if (error) {
           console.error("[CancelUpload] gRPC error:", error);
           resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        }
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    console.error("[CancelUpload] Catch error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
