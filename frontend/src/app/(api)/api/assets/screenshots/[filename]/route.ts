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

  const dataRequest = new StreamMediaFileRequest();
  dataRequest.setFilename(filename);
  dataRequest.setStartByte(0);
  dataRequest.setEndByte(-1);

  const dataStream = client.streamMediaFile(dataRequest);

  return new Promise<Response>((resolve) => {
    let headersSent = false;
    let totalSize = 0;
    let mimeType = 'image/jpeg';

    const readable = new ReadableStream({
      start(controller) {
        dataStream.on('data', (response: StreamMediaFileResponse) => {
          if (!headersSent) {
            headersSent = true;
            totalSize = response.getTotalSize() || 0;
            mimeType = response.getMimeType() || 'image/jpeg';

            resolve(
              new Response(readable, {
                status: 200,
                headers: {
                  'Content-Type': mimeType,
                  'Content-Length': String(totalSize),
                  'Cache-Control': 'public, max-age=3600',
                },
              })
            );
          }

          const chunk = response.getChunkData_asU8();
          if (chunk && chunk.length > 0) {
            controller.enqueue(chunk);
          }
        });

        dataStream.on('end', () => {
          if (!headersSent) {
            headersSent = true;
            resolve(new NextResponse('File screenshot tidak ditemukan', { status: 404 }));
          }
          try { controller.close(); } catch (_) {}
        });

        dataStream.on('error', (err: any) => {
          console.error('[Screenshot Stream Error]:', err.message);
          if (!headersSent) {
            headersSent = true;
            resolve(new NextResponse('Gagal mengambil screenshot dari backend', { status: 500 }));
          }
          try { controller.error(err); } catch (_) {}
        });
      },
      cancel() {
        dataStream.cancel();
      },
    });
  });
}
