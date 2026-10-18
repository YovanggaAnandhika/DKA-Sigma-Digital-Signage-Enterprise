import { NextRequest, NextResponse } from 'next/server';
import { LayoutServiceClient } from '@/lib/api/studio/v1/layout/layout_grpc_pb';
import { GetLayoutRequest } from '@/lib/api/studio/v1/layout/layout.common_pb';
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
    const client = new LayoutServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new GetLayoutRequest();
    if (body.id) request.setId(body.id);

    return new Promise<NextResponse>((resolve) => {
      client.getLayout(request, getGrpcMetadata(token), async (error: any, response: any) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          const layoutObj = response.toObject();
          if (layoutObj?.layersList) {
            const meta = getGrpcMetadata(token);
            await Promise.all(
              layoutObj.layersList.flatMap((layer: any) =>
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
          resolve(NextResponse.json(layoutObj));
        }
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
