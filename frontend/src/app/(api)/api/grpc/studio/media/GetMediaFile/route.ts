import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/studio/v1/media/media_grpc_pb';
import { GetMediaFileRequest } from '@/lib/api/studio/v1/media/media.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new MediaServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new GetMediaFileRequest();
    if (body.filename) request.setFilename(body.filename);

    return new Promise<NextResponse>((resolve) => {
      client.getMediaFile(request, getGrpcMetadata(token), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else {
          const normalized: any = response.toObject();
          // Override fileData with base64 binary (Uint8Array → base64)
          const rawData = response.getFileData_asU8();
          if (rawData) {
             let binary = '';
             for (let i = 0; i < rawData.byteLength; i++) {
               binary += String.fromCharCode(rawData[i]);
             }
             normalized.fileData = btoa(binary);
             normalized.file_data = normalized.fileData;
          }
          resolve(NextResponse.json(normalized));
        }
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
