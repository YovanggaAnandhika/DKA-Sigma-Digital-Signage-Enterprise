import { NextRequest, NextResponse } from 'next/server';
import { StreamServiceClient } from '@/lib/api/distribution/v1/stream/stream_grpc_pb';
import { UploadScreenshotRequest } from '@/lib/api/distribution/v1/stream/stream.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new StreamServiceClient(getGrpcHost(), getGrpcCredentials());

    const deviceId = body.deviceId || body.device_id;
    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId diperlukan' }, { status: 400 });
    }

    const rawImage = body.imageData || body.image_data;
    if (!rawImage) {
      return NextResponse.json({ error: 'imageData diperlukan' }, { status: 400 });
    }

    // Ubah string base64 menjadi Buffer / Uint8Array
    const cleanBase64 = typeof rawImage === 'string'
      ? rawImage.replace(/^data:image\/\w+;base64,/, '')
      : rawImage;
    const imageBuffer = Buffer.isBuffer(rawImage)
      ? rawImage
      : Buffer.from(cleanBase64, 'base64');

    const request = new UploadScreenshotRequest();
    request.setDeviceId(deviceId);
    request.setImageData(imageBuffer);
    request.setMimeType(body.mimeType || body.mime_type || 'image/jpeg');

    return new Promise<NextResponse>((resolve) => {
      client.uploadScreenshot(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) {
          console.error('[UploadScreenshot gRPC Error]:', error.message);
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    console.error('[UploadScreenshot Route Error]:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
