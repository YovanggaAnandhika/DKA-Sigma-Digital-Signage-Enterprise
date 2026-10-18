import { NextRequest, NextResponse } from 'next/server';
import { ManifestServiceClient } from '@/lib/api/distribution/v1/manifest/manifest_grpc_pb';
import { GetActiveManifestRequest } from '@/lib/api/distribution/v1/manifest/manifest.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new ManifestServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new GetActiveManifestRequest();

    if (body.deviceId || body.device_id) {
      request.setDeviceId(body.deviceId || body.device_id);
    }
    if (body.deviceToken || body.device_token) {
      request.setDeviceToken(body.deviceToken || body.device_token);
    }
    if (body.clientCurrentHash || body.client_current_hash) {
      request.setClientCurrentHash(body.clientCurrentHash || body.client_current_hash);
    }

    return new Promise<NextResponse>((resolve) => {
      client.getActiveManifest(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) {
          const status = error.code === grpc.status.NOT_FOUND ? 404 : error.code === grpc.status.UNAUTHENTICATED ? 401 : 500;
          resolve(NextResponse.json({ error: error.message, code: error.code }, { status }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
