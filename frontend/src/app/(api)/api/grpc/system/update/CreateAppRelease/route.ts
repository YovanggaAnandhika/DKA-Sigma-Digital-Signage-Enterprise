import { NextRequest, NextResponse } from 'next/server';
import { AppUpdateServiceClient } from '@/lib/api/system/v1/update/update_grpc_pb';
import { CreateAppReleaseRequest } from '@/lib/api/system/v1/update/update.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(AppUpdateServiceClient);

    const request = new CreateAppReleaseRequest();
    if (body.versionCode) request.setVersionCode(body.versionCode);
    if (body.versionName) request.setVersionName(body.versionName);
    if (body.apkFileUrl) request.setApkFileUrl(body.apkFileUrl);
    if (body.fileSizeBytes) request.setFileSizeBytes(body.fileSizeBytes);
    if (body.sha256Hash) request.setSha256Hash(body.sha256Hash);
    if (body.releaseNotes) request.setReleaseNotes(body.releaseNotes);
    if (body.isForceUpdate !== undefined) request.setIsForceUpdate(body.isForceUpdate);
    if (body.minSupportedVersionCode) request.setMinSupportedVersionCode(body.minSupportedVersionCode);

    return new Promise<NextResponse>((resolve) => {
      client.createAppRelease(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
        if (error) {
          console.error('[CreateAppRelease] gRPC error:', error);
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error) {
    console.error('[CreateAppRelease] Catch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

