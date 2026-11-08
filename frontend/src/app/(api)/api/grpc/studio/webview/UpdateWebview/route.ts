import { NextRequest, NextResponse } from 'next/server';
import { WebviewServiceClient } from '@/lib/api/components/v1/webview/webview_grpc_pb';
import { UpdateWebviewRequest } from '@/lib/api/components/v1/webview/webview.common_pb';
import { getGrpcClient, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const request = new UpdateWebviewRequest()
      .setId(body.id || '')
      .setName(body.name || '')
      .setUrl(body.url || '')
      .setRefreshIntervalSeconds(Number(body.refreshIntervalSeconds || body.refresh_interval_seconds || 0))
      .setZoomScale(Number(body.zoomScale || body.zoom_scale || 0))
      .setBypassCache(Boolean(body.bypassCache ?? body.bypass_cache ?? false))
      .setOrientation(body.orientation || '');

    const client = getGrpcClient(WebviewServiceClient);

    return new Promise<NextResponse>((resolve) => {
      client.updateWebview(request, getGrpcMetadata(getTokenFromRequest(req)), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

