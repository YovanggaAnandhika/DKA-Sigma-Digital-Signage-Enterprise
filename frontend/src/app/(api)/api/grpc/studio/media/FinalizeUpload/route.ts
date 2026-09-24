import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/studio/v1/media/media_grpc_pb';
import { FinalizeUploadRequest } from '@/lib/api/studio/v1/media/media.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new MediaServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new FinalizeUploadRequest();
    if (body.uploadId) request.setUploadId(body.uploadId);
    if (body.originalFilename) request.setOriginalFilename(body.originalFilename);

    return new Promise<NextResponse>((resolve) => {
      client.finalizeUpload(request, getGrpcMetadata(token), (error, response) => {
        if (error) {
           console.error("[FinalizeUpload] gRPC error:", error);
           resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        }
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    console.error("[FinalizeUpload] Catch error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
