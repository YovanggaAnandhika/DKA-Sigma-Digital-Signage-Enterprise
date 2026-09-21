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

function parseRangeHeader(
  rangeHeader: string | null,
  totalSize: number
): { start: number; end: number; isRange: boolean } {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
    return { start: 0, end: totalSize - 1, isRange: false };
  }

  const parts = rangeHeader.replace('bytes=', '').split('-');
  const start = parseInt(parts[0], 10) || 0;
  const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

  return {
    start: Math.max(0, start),
    end: Math.min(end, totalSize - 1),
    isRange: true,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = decodeURIComponent(params.filename);
  const rangeHeader = req.headers.get('range');

  const client = new MediaServiceClient(getGrpcHost(), getGrpcCredentials());

  // --- Phase 1: Get file total size via a metadata probe (0-byte range) ---
  // We first get the total_size from the first chunk's metadata
  // then resolve the correct range and stream it.

  return new Promise<Response>((resolve) => {
    // First, probe for total file size with a tiny range (first 1 byte)
    const probeRequest = new StreamMediaFileRequest();
    probeRequest.setFilename(filename);
    probeRequest.setStartByte(0);
    probeRequest.setEndByte(0);

    const probeStream = client.streamMediaFile(probeRequest);
    let totalSize = 0;
    let mimeType = 'application/octet-stream';
    let probeResolved = false;

    probeStream.on('data', (response: StreamMediaFileResponse) => {
      if (!probeResolved) {
        totalSize = response.getTotalSize() || 0;
        mimeType = response.getMimeType() || 'application/octet-stream';
        probeResolved = true;
        probeStream.cancel();
      }
    });

    probeStream.on('error', () => {
      if (!probeResolved) {
        probeResolved = true;
        resolve(new NextResponse('File tidak ditemukan', { status: 404 }));
      }
    });

    probeStream.on('end', () => {
      if (!probeResolved) {
        resolve(new NextResponse('File tidak ditemukan atau kosong', { status: 404 }));
        return;
      }

      if (totalSize === 0) {
        resolve(new NextResponse('File kosong', { status: 404 }));
        return;
      }

      // --- Phase 2: Parse Range header and stream the requested segment ---
      const { start, end, isRange } = parseRangeHeader(rangeHeader, totalSize);
      const chunkSize = end - start + 1;

      const dataRequest = new StreamMediaFileRequest();
      dataRequest.setFilename(filename);
      dataRequest.setStartByte(start);
      dataRequest.setEndByte(end);

      const dataStream = client.streamMediaFile(dataRequest);
      let headersSent = false;

      const readable = new ReadableStream({
        start(controller) {
          dataStream.on('data', (response: StreamMediaFileResponse) => {
            if (!headersSent) {
              headersSent = true;

              const headers: Record<string, string> = {
                'Content-Type': mimeType,
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=31536000, immutable',
              };

              if (isRange) {
                headers['Content-Range'] = `bytes ${start}-${end}/${totalSize}`;
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
  });
}
