import { NextRequest, NextResponse } from 'next/server';
import { TickerServiceClient } from '@/lib/api/components/v1/ticker/ticker_grpc_pb';
import { CreateTickerRequest } from '@/lib/api/components/v1/ticker/ticker.common_pb';
import { getGrpcClient, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const request = new CreateTickerRequest()
      .setName(body.name || '')
      .setBadge(body.badge || '')
      .setMessagesList(Array.isArray(body.messages) ? body.messages : (body.messagesList || []))
      .setSpeed(body.speed || 'medium')
      .setTheme(body.theme || 'custom')
      .setFontSize(Number(body.fontSize || body.font_size || 16))
      .setBackgroundColor(body.backgroundColor || body.background_color || '#1e3a8a')
      .setTextColor(body.textColor || body.text_color || '#ffffff')
      .setBadgeBackgroundColor(body.badgeBackgroundColor || body.badge_background_color || '#2563eb')
      .setBadgeTextColor(body.badgeTextColor || body.badge_text_color || '#ffffff')
      .setBorderColor(body.borderColor || body.border_color || '#60a5fa')
      .setBorderRadius(Number(body.borderRadius || body.border_radius || 8));

    const client = getGrpcClient(TickerServiceClient);

    return new Promise<NextResponse>((resolve) => {
      client.createTicker(request, getGrpcMetadata(getTokenFromRequest(req)), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

