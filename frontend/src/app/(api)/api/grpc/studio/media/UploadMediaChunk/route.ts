import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/studio/v1/media/media_grpc_pb';
import { UploadMediaChunkRequest } from '@/lib/api/studio/v1/media/media.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new MediaServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new UploadMediaChunkRequest();
    if (body.uploadId) request.setUploadId(body.uploadId);
    if (body.originalFilename) request.setOriginalFilename(body.originalFilename);
    if (body.mimeType) request.setMimeType(body.mimeType);
    if (body.chunkIndex !== undefined) request.setChunkIndex(body.chunkIndex);
    if (body.totalChunks !== undefined) request.setTotalChunks(body.totalChunks);
    if (body.totalFileSizeBytes !== undefined) request.setTotalFileSize(body.totalFileSizeBytes);
    if (body.chunkOffset !== undefined) request.setChunkOffset(body.chunkOffset);

    if (body.chunkData) {
      const buf = Buffer.from(body.chunkData, 'base64');
      request.setChunkData(buf);
    }

    return new Promise<NextResponse>((resolve) => {
      client.uploadMediaChunk(request, getGrpcMetadata(token), (error, response) => {
        if (error) {
           console.error("[UploadMediaChunk] gRPC error:", error);
           resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        }
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    console.error("[UploadMediaChunk] Catch error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
