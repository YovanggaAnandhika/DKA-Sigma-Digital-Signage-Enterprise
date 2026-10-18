import { NextRequest, NextResponse } from 'next/server';
import { ManifestServiceClient } from '@/lib/api/distribution/v1/manifest/manifest_grpc_pb';
import { GetActiveManifestRequest } from '@/lib/api/distribution/v1/manifest/manifest.common_pb';
import { QueueServiceClient } from '@/lib/api/studio/v1/queue/queue_grpc_pb';
import { GetQueueDisplayRequest } from '@/lib/api/studio/v1/queue/queue.common_pb';
import { TickerServiceClient } from '@/lib/api/studio/v1/ticker/ticker_grpc_pb';
import { GetTickerRequest } from '@/lib/api/studio/v1/ticker/ticker.common_pb';
import { ClockServiceClient } from '@/lib/api/studio/v1/clock/clock_grpc_pb';
import { GetClockRequest } from '@/lib/api/studio/v1/clock/clock.common_pb';
import { WebviewServiceClient } from '@/lib/api/studio/v1/webview/webview_grpc_pb';
import { GetWebviewRequest } from '@/lib/api/studio/v1/webview/webview.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';
import * as grpc from '@grpc/grpc-js';

async function fetchWidgetData(block: any, metadata: grpc.Metadata): Promise<any> {
  const host = getGrpcHost();
  const creds = getGrpcCredentials();

  if (block.queueId) {
    return new Promise((resolve) => {
      const client = new QueueServiceClient(host, creds);
      const req = new GetQueueDisplayRequest();
      req.setId(block.queueId);
      client.getQueueDisplay(req, metadata, (err: any, res: any) => {
        if (err || !res) resolve(null);
        else resolve(res.toObject());
      });
    });
  }

  if (block.tickerId) {
    return new Promise((resolve) => {
      const client = new TickerServiceClient(host, creds);
      const req = new GetTickerRequest();
      req.setId(block.tickerId);
      client.getTicker(req, metadata, (err: any, res: any) => {
        if (err || !res) resolve(null);
        else resolve(res.toObject());
      });
    });
  }

  if (block.clockId) {
    return new Promise((resolve) => {
      const client = new ClockServiceClient(host, creds);
      const req = new GetClockRequest();
      req.setId(block.clockId);
      client.getClock(req, metadata, (err: any, res: any) => {
        if (err || !res) resolve(null);
        else resolve(res.toObject());
      });
    });
  }

  if (block.webviewId) {
    return new Promise((resolve) => {
      const client = new WebviewServiceClient(host, creds);
      const req = new GetWebviewRequest();
      req.setId(block.webviewId);
      client.getWebview(req, metadata, (err: any, res: any) => {
        if (err || !res) resolve(null);
        else resolve(res.toObject());
      });
    });
  }

  return null;
}

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
      client.getActiveManifest(request, getGrpcMetadata(token), async (error: any, response: any) => {
        if (error) {
          const status = error.code === grpc.status.NOT_FOUND ? 404 : error.code === grpc.status.UNAUTHENTICATED ? 401 : 500;
          resolve(NextResponse.json({ error: error.message, code: error.code }, { status }));
        } else {
          const manifestObj = response.toObject();
          if (manifestObj?.manifest?.layout?.layersList) {
            const meta = getGrpcMetadata(token);
            await Promise.all(
              manifestObj.manifest.layout.layersList.flatMap((layer: any) =>
                (layer.blocksList || []).map(async (block: any) => {
                  const widgetData = await fetchWidgetData(block, meta);
                  if (widgetData) {
                    block.widgetData = widgetData;
                    block.widgetDataJson = JSON.stringify(widgetData);
                  }
                })
              )
            );
          }
          resolve(NextResponse.json(manifestObj));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

