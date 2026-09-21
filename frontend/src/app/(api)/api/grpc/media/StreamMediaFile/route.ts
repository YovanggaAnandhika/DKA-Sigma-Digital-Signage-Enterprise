import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/studio/v1/media/media_grpc_pb';
import { StreamMediaFileRequest } from '@/lib/api/studio/v1/media/media.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'filename diperlukan' }, { status: 400 });
    }

    const token = getTokenFromRequest(req);
    const client = new MediaServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new StreamMediaFileRequest();
    request.setFilename(filename);

    return new Promise<NextResponse>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      let mimeType = 'application/octet-stream';
      let totalSize = 0;

      const stream = client.streamMediaFile(request, getGrpcMetadata(token));

      stream.on('data', (response: any) => {
        // Get raw binary chunk from gRPC response
        const chunkData = response.getChunkData_asU8();
        if (chunkData && chunkData.byteLength > 0) {
          chunks.push(new Uint8Array(chunkData));
        }
        if (response.getMimeType()) {
          mimeType = response.getMimeType();
        }
        if (response.getTotalSize() > 0) {
          totalSize = response.getTotalSize();
        }
      });

      stream.on('end', () => {
        // Combine all chunks into a single buffer
        const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.byteLength;
        }

        // Return as binary HTTP response — browser can play this directly
        resolve(
          new NextResponse(combined, {
            status: 200,
            headers: {
              'Content-Type': mimeType,
              'Content-Length': String(combined.byteLength || totalSize),
              'Accept-Ranges': 'bytes',
              'Cache-Control': 'private, max-age=3600',
            },
          })
        );
      });

      stream.on('error', (err: any) => {
        console.error('StreamMediaFile error:', err.message);
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
