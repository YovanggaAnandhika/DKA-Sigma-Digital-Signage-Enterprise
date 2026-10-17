import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/studio/v1/media/media_grpc_pb';
import { StreamMediaFileRequest, StreamMediaFileResponse } from '@/lib/api/studio/v1/media/media.common_pb';
import { getGrpcHost, getGrpcCredentials } from '@/lib/core/grpcClient';

/**
 * Serve media files via gRPC streaming with full HTTP Range Request support.
 * This enables the browser's native video buffer bar (yellow progress indicator)
 * and allows seeking without re-downloading from the beginning.
 *
 * Flow:
 *   Browser  →  GET /api/assets/video.mp4 (Range: bytes=X-Y)
 *   Next.js  →  gRPC StreamMediaFile(filename, start_byte=X, end_byte=Y)
 *   Rust     →  seeks to byte X, streams Y-X+1 bytes
 *   Next.js  →  206 Partial Content (Content-Range: bytes X-Y/Total)
 *   Browser  →  shows buffer bar, enables seeking ✅
 */



export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = decodeURIComponent(params.filename);
  const rangeHeader = req.headers.get('range');

  const client = new MediaServiceClient(getGrpcHost(), getGrpcCredentials());

  // Parse requested range (if present)
  let requestedStart = 0;
  let requestedEnd = -1; // -1 indicates "to end of file" in Rust backend
  let isRange = false;

  if (rangeHeader && rangeHeader.startsWith('bytes=')) {
    isRange = true;
    const parts = rangeHeader.replace('bytes=', '').split('-');
    requestedStart = Math.max(0, parseInt(parts[0], 10) || 0);
    if (parts[1] && parts[1].trim() !== '') {
      requestedEnd = parseInt(parts[1], 10);
    }
  }

  const dataRequest = new StreamMediaFileRequest();
  dataRequest.setFilename(filename);
  dataRequest.setStartByte(requestedStart);
  dataRequest.setEndByte(requestedEnd);

  const dataStream = client.streamMediaFile(dataRequest);

  return new Promise<Response>((resolve) => {
    let headersSent = false;
    let totalSize = 0;
    let mimeType = 'application/octet-stream';

    const readable = new ReadableStream({
      start(controller) {
        dataStream.on('data', (response: StreamMediaFileResponse) => {
          if (!headersSent) {
            headersSent = true;
            totalSize = response.getTotalSize() || 0;
            mimeType = response.getMimeType() || 'application/octet-stream';

            const effectiveEnd = requestedEnd < 0 
              ? Math.max(0, totalSize - 1)
              : Math.min(requestedEnd, totalSize - 1);
            const chunkSize = Math.max(0, effectiveEnd - requestedStart + 1);

            const headers: Record<string, string> = {
              'Content-Type': mimeType,
              'Accept-Ranges': 'bytes',
              'Cache-Control': 'public, max-age=31536000, immutable',
            };

            if (isRange) {
              headers['Content-Range'] = `bytes ${requestedStart}-${effectiveEnd}/${totalSize}`;
              headers['Content-Length'] = String(chunkSize);

              resolve(
                new Response(readable, {
                  status: 206, // Partial Content
                  headers,
                })
              );
            } else {
              headers['Content-Length'] = String(totalSize);

              resolve(
                new Response(readable, {
                  status: 200,
                  headers,
                })
              );
            }
          }

          const chunk = response.getChunkData_asU8();
          if (chunk && chunk.length > 0) {
            controller.enqueue(chunk);
          }
        });

        dataStream.on('end', () => {
          if (!headersSent) {
            headersSent = true;
            resolve(new NextResponse('File tidak ditemukan atau kosong', { status: 404 }));
          }
          try { controller.close(); } catch (_) {}
        });

        dataStream.on('error', (err: any) => {
          console.error('[gRPC Range Stream Error]:', err.message);
          if (!headersSent) {
            headersSent = true;
            resolve(new NextResponse('Gagal mengambil berkas media dari backend', { status: 500 }));
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
