import { NextRequest, NextResponse } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/hardware/v1/device/device_grpc_pb';
import { IngestDeviceAnalyticsRequest, AnalyticsSnapshot } from '@/lib/api/hardware/v1/device/device.common_pb';
import { getGrpcClient, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

import { deviceStreamHub } from '@/lib/core/deviceStreamHub';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = getGrpcClient(DeviceServiceClient);

    const deviceId = body.deviceId || body.device_id;
    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId diperlukan' }, { status: 400 });
    }

    const request = new IngestDeviceAnalyticsRequest();
    request.setDeviceId(deviceId);
    request.setDeviceToken(body.deviceToken || body.device_token || '');

    if (body.snapshot) {
      const snap = new AnalyticsSnapshot();
      snap.setId(body.snapshot.id || '');
      snap.setInputOutputJson(
        typeof body.snapshot.inputOutputJson === 'string'
          ? body.snapshot.inputOutputJson
          : JSON.stringify(body.snapshot.inputOutputJson || body.snapshot.input_output || {})
      );
      snap.setAssetsStatsJson(
        typeof body.snapshot.assetsStatsJson === 'string'
          ? body.snapshot.assetsStatsJson
          : JSON.stringify(body.snapshot.assetsStatsJson || body.snapshot.assets_stats || {})
      );
      snap.setRecordedAt(body.snapshot.recordedAt || body.snapshot.recorded_at || new Date().toISOString());
      request.setSnapshot(snap);
    }

    return new Promise<NextResponse>((resolve) => {
      client.ingestDeviceAnalytics(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) {
          console.error('[IngestDeviceAnalytics Error]:', error.message);
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          try {
            deviceStreamHub.broadcast(deviceId, {
              type: 'ANALYTICS_UPDATE',
              deviceId,
              snapshot: body.snapshot,
            });
          } catch (_) {}
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    console.error('[IngestDeviceAnalytics Route Error]:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
