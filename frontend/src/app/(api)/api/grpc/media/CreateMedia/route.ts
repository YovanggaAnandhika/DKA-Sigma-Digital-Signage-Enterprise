import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/generated/studio/v1/media/media_grpc_pb';
import { CreateMediaRequest } from '@/lib/api/generated/studio/v1/media/media.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/api/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new MediaServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new CreateMediaRequest();
    if (body.name) request.setName(body.name);
    if (body.original_filename) request.setOriginalFilename(body.original_filename);
    if (body.file_path) request.setFilePath(body.file_path);
    if (body.public_url) request.setPublicUrl(body.public_url);
    if (body.file_size_bytes) request.setFileSizeBytes(body.file_size_bytes);
    if (body.mime_type) request.setMimeType(body.mime_type);
    if (body.sha256_hash) request.setSha256Hash(body.sha256_hash);
    if (body.media_type) request.setMediaType(body.media_type);
    if (body.width) request.setWidth(body.width);
    if (body.height) request.setHeight(body.height);
    if (body.duration_seconds) request.setDurationSeconds(body.duration_seconds);

    return new Promise((resolve) => {
      client.createMedia(request, getGrpcMetadata(token), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
