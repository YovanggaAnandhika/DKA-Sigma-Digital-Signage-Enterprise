import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/studio/v1/media/media_grpc_pb';
import { CancelUploadRequest } from '@/lib/api/studio/v1/media/media.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(MediaServiceClient);
    
    const request = new CancelUploadRequest();
    if (body.uploadId) request.setUploadId(body.uploadId);

    return new Promise<NextResponse>((resolve) => {
      client.cancelUpload(request, getGrpcMetadataFromRequest(req), (error, response) => {
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
