import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/studio/v1/media/media_grpc_pb';
import { CreateMediaRequest } from '@/lib/api/studio/v1/media/media.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new MediaServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new CreateMediaRequest();
    if (body.name) request.setName(body.name);
    if (body.originalFilename) request.setOriginalFilename(body.originalFilename);
    if (body.filePath) request.setFilePath(body.filePath);
    if (body.publicUrl) request.setPublicUrl(body.publicUrl);
    if (body.fileSizeBytes) request.setFileSizeBytes(body.fileSizeBytes);
    if (body.mimeType) request.setMimeType(body.mimeType);
    if (body.sha256Hash) request.setSha256Hash(body.sha256Hash);
    if (body.mediaType) request.setMediaType(body.mediaType);
    if (body.width) request.setWidth(body.width);
    if (body.height) request.setHeight(body.height);
    if (body.durationSeconds) request.setDurationSeconds(body.durationSeconds);

    return new Promise<NextResponse>((resolve) => {
      client.createMedia(request, getGrpcMetadata(token), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
