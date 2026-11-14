import { NextRequest, NextResponse } from 'next/server';
import { TickerServiceClient } from '@/lib/api/components/v1/ticker/ticker_grpc_pb';
import { UpdateTickerRequest } from '@/lib/api/components/v1/ticker/ticker.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const request = new UpdateTickerRequest()
      .setId(body.id || '')
      .setName(body.name || '')
      .setBadge(body.badge || '')
      .setMessagesList(Array.isArray(body.messages) ? body.messages : (body.messagesList || []))
      .setSpeed(body.speed || 'medium')
      .setTheme(body.theme || 'custom')
      .setFontSize(Number(body.fontSize || body.font_size || 0))
      .setBackgroundColor(body.backgroundColor || body.background_color || '')
      .setTextColor(body.textColor || body.text_color || '')
      .setBadgeBackgroundColor(body.badgeBackgroundColor || body.badge_background_color || '')
      .setBadgeTextColor(body.badgeTextColor || body.badge_text_color || '')
      .setBorderColor(body.borderColor || body.border_color || '')
      .setBorderRadius(Number(body.borderRadius || body.border_radius || 0));

    const client = getGrpcClient(TickerServiceClient);

    return new Promise<NextResponse>((resolve) => {
      client.updateTicker(request, getGrpcMetadataFromRequest(req), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

