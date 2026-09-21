import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/studio/v1/media/media_grpc_pb';
import { StreamMediaFileRequest, StreamMediaFileResponse } from '@/lib/api/studio/v1/media/media.common_pb';
import { getGrpcHost, getGrpcCredentials } from '@/lib/core/grpcClient';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = decodeURIComponent(params.filename);
  const client = new MediaServiceClient(getGrpcHost(), getGrpcCredentials());
  const request = new StreamMediaFileRequest();
  request.setFilename(filename);

  const stream = client.streamMediaFile(request);

  return new Promise<Response>((resolve) => {
    let headersSent = false;

    const readable = new ReadableStream({
      start(controller) {
        stream.on('data', (response: StreamMediaFileResponse) => {
          if (!headersSent) {
            headersSent = true;
            const mimeType = response.getMimeType() || 'application/octet-stream';
            const totalSize = response.getTotalSize();
            
            // Resolve the promise with the HTTP Response only on the first chunk
            resolve(new Response(readable, {
              headers: {
                'Content-Type': mimeType,
                'Content-Length': totalSize.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Accept-Ranges': 'bytes' // Note: True range requests require more logic, but this allows basic buffering
              }
            }));
          }
          
          const chunk = response.getChunkData_asU8();
          if (chunk && chunk.length > 0) {
            controller.enqueue(chunk);
          }
        });

        stream.on('end', () => {
          if (!headersSent) {
            headersSent = true;
            resolve(new NextResponse('Berkas tidak ditemukan atau kosong', { status: 404 }));
          }
          try { controller.close(); } catch (e) {}
        });

        stream.on('error', (err) => {
          console.error('[gRPC Stream Error]:', err.message);
          if (!headersSent) {
            headersSent = true;
            resolve(new NextResponse('Gagal mengambil berkas media dari backend gRPC', { status: 500 }));
          }
          try { controller.error(err); } catch (e) {}
        });
      },
      cancel() {
        stream.cancel();
      }
    });
  });
}
