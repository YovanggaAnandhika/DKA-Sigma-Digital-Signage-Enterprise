import { NextRequest, NextResponse } from 'next/server';
import { ManifestServiceClient } from '@/lib/api/distribution/v1/manifest/manifest_grpc_pb';
import { AssignLayoutToDeviceRequest } from '@/lib/api/distribution/v1/manifest/manifest.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new ManifestServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new AssignLayoutToDeviceRequest();

    if (body.deviceId || body.device_id) {
      request.setDeviceId(body.deviceId || body.device_id);
    }
    if (body.layoutId || body.layout_id) {
      request.setLayoutId(body.layoutId || body.layout_id);
    }
    if (body.isActive !== undefined || body.is_active !== undefined) {
      request.setIsActive(Boolean(body.isActive ?? body.is_active));
    }

    return new Promise<NextResponse>((resolve) => {
      client.assignLayoutToDevice(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
