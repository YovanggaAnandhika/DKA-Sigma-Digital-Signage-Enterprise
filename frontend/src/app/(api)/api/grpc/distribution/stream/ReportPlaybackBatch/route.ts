import { NextRequest, NextResponse } from 'next/server';
import { StreamServiceClient } from '@/lib/api/distribution/v1/stream/stream_grpc_pb';
import { ReportPlaybackBatchRequest, PlaybackLogItem } from '@/lib/api/distribution/v1/stream/stream.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new StreamServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new ReportPlaybackBatchRequest();
    if (body.deviceId || body.device_id) {
      request.setDeviceId(body.deviceId || body.device_id);
    }
    if (body.deviceToken || body.device_token) {
      request.setDeviceToken(body.deviceToken || body.device_token);
    }

    if (Array.isArray(body.items)) {
      const itemsList = body.items.map((item: any) => {
        const logItem = new PlaybackLogItem();
        if (item.mediaId || item.media_id) logItem.setMediaId(item.mediaId || item.media_id);
        if (item.layoutId || item.layout_id) logItem.setLayoutId(item.layoutId || item.layout_id);
        if (item.startedAt || item.started_at) logItem.setStartedAt(Number(item.startedAt || item.started_at));
        if (item.durationSeconds || item.duration_seconds) logItem.setDurationSeconds(Number(item.durationSeconds || item.duration_seconds));
        if (item.isCompleted !== undefined || item.is_completed !== undefined) {
          logItem.setIsCompleted(Boolean(item.isCompleted ?? item.is_completed));
        }
        return logItem;
      });
      request.setItemsList(itemsList);
    }

    return new Promise<NextResponse>((resolve) => {
      client.reportPlaybackBatch(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
