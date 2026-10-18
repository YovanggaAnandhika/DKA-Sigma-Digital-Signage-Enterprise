import { NextRequest, NextResponse } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/hardware/v1/device/device_grpc_pb';
import { IngestDeviceAnalyticsBatchRequest, AnalyticsSnapshot } from '@/lib/api/hardware/v1/device/device.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new DeviceServiceClient(getGrpcHost(), getGrpcCredentials());

    const deviceId = body.deviceId || body.device_id;
    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId diperlukan' }, { status: 400 });
    }

    const request = new IngestDeviceAnalyticsBatchRequest();
    request.setDeviceId(deviceId);
    request.setDeviceToken(body.deviceToken || body.device_token || '');

    const rawSnapshots = body.snapshots || body.snapshotsList || body.items || [];
    const snapshotsList = rawSnapshots.map((s: any) => {
      const snap = new AnalyticsSnapshot();
      snap.setId(s.id || '');
      snap.setInputOutputJson(
        typeof s.inputOutputJson === 'string'
          ? s.inputOutputJson
          : JSON.stringify(s.inputOutputJson || s.input_output || {})
      );
      snap.setAssetsStatsJson(
        typeof s.assetsStatsJson === 'string'
          ? s.assetsStatsJson
          : JSON.stringify(s.assetsStatsJson || s.assets_stats || {})
      );
      snap.setRecordedAt(s.recordedAt || s.recorded_at || new Date().toISOString());
      return snap;
    });

    request.setSnapshotsList(snapshotsList);

    return new Promise<NextResponse>((resolve) => {
      client.ingestDeviceAnalyticsBatch(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) {
          console.error('[IngestDeviceAnalyticsBatch Error]:', error.message);
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    console.error('[IngestDeviceAnalyticsBatch Route Error]:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
