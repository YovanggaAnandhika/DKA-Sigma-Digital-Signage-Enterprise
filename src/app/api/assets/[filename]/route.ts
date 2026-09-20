import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../lib/api';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename);
    const result = await api.getMediaFile(filename);

    if (!result.success || !result.file_data || result.file_data.length === 0) {
      return new NextResponse('Berkas media tidak ditemukan di backend', { status: 404 });
    }

    return new Response(result.file_data, {
      headers: {
        'Content-Type': result.mime_type || 'application/octet-stream',
        'Content-Length': result.file_data.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch media file via gRPC:', error);
    return new NextResponse(error.message || 'Gagal mengambil berkas media dari backend gRPC', {
      status: 500,
    });
  }
}
