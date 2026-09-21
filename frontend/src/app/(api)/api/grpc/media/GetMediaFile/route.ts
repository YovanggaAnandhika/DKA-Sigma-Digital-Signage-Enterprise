import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/studio/v1/media/media_grpc_pb';
import { GetMediaFileRequest } from '@/lib/api/studio/v1/media/media.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

function normalize(obj: any): any {
  if (Array.isArray(obj)) return obj.map(normalize);
  if (obj === null || typeof obj !== 'object') return obj;
  const out: any = {};
  for (const k of Object.keys(obj)) {
    let nk: string;
    if (k.endsWith('List')) {
      // e.g. zonesList → zones, blocksList → blocks
      nk = k.slice(0, -4).replace(/[A-Z]/g, (c: string) => `_${c.toLowerCase()}`);
    } else {
      // e.g. canvasWidth → canvas_width
      nk = k.replace(/[A-Z]/g, (c: string) => `_${c.toLowerCase()}`);
    }
    out[nk] = normalize(obj[k]);
  }
  return out;
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new MediaServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new GetMediaFileRequest();
    if (body.filename) request.setFilename(body.filename);

    return new Promise((resolve) => {
      client.getMediaFile(request, getGrpcMetadata(token), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else {
          const obj = response.toObject();
          // Convert Uint8Array to base64 for JSON serialization
          const rawData = response.getFileData_asU8();
          if (rawData) {
             let binary = '';
             for (let i = 0; i < rawData.byteLength; i++) {
               binary += String.fromCharCode(rawData[i]);
             }
             (obj as any).fileData = btoa(binary);
          }
          resolve(NextResponse.json(obj));
        }
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
