import { NextRequest, NextResponse } from 'next/server';
import { AppUpdateServiceClient } from '@/lib/api/system/v1/update/update_grpc_pb';
import { CheckDeviceAppUpdateRequest } from '@/lib/api/system/v1/update/update.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(AppUpdateServiceClient);

    const request = new CheckDeviceAppUpdateRequest();
    if (body.deviceId) request.setDeviceId(body.deviceId);
    if (body.currentVersionCode) request.setCurrentVersionCode(body.currentVersionCode);
    if (body.currentVersionName) request.setCurrentVersionName(body.currentVersionName);

    return new Promise<NextResponse>((resolve) => {
      client.checkDeviceAppUpdate(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
        if (error) {
          console.error('[CheckDeviceAppUpdate] gRPC error:', error);
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error) {
    console.error('[CheckDeviceAppUpdate] Catch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

