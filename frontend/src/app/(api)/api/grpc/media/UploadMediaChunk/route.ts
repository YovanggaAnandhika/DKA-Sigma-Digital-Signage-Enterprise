import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/studio/v1/media/media_grpc_pb';
import { UploadMediaChunkRequest } from '@/lib/api/studio/v1/media/media.common_pb';
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
    
    const request = new UploadMediaChunkRequest();
    if (body.uploadId) request.setUploadId(body.uploadId);
    if (body.originalFilename) request.setOriginalFilename(body.originalFilename);
    if (body.mimeType) request.setMimeType(body.mimeType);
    if (body.chunkIndex !== undefined) request.setChunkIndex(body.chunkIndex);
    if (body.totalChunks !== undefined) request.setTotalChunks(body.totalChunks);
    if (body.totalFileSizeBytes !== undefined) request.setTotalFileSize(body.totalFileSizeBytes);

    if (body.chunkData) {
      // Decode base64 from JSON back to Uint8Array
      const binaryString = atob(body.chunkData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      request.setChunkData(bytes);
    }

    return new Promise((resolve) => {
      client.uploadMediaChunk(request, getGrpcMetadata(token), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(normalize(response.toObject())));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
