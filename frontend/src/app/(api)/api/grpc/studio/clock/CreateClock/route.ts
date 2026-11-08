import { NextRequest, NextResponse } from 'next/server';
import { ClockServiceClient } from '@/lib/api/components/v1/clock/clock_grpc_pb';
import { CreateClockRequest } from '@/lib/api/components/v1/clock/clock.common_pb';
import { getGrpcClient, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const request = new CreateClockRequest()
      .setName(body.name || '')
      .setCity(body.city || 'Makassar')
      .setShowSeconds(Boolean(body.showSeconds ?? body.show_seconds ?? true))
      .setIs24Hour(Boolean(body.is24Hour ?? body.is_24_hour ?? true))
      .setTheme(body.theme || 'glass')
      .setBackgroundColor(body.backgroundColor || body.background_color || '#0f172a')
      .setTextColor(body.textColor || body.text_color || '#ffffff')
      .setSubtitleColor(body.subtitleColor || body.subtitle_color || '#94a3b8')
      .setBorderColor(body.borderColor || body.border_color || '#1e3a8a')
      .setBorderRadius(Number(body.borderRadius || body.border_radius || 12))
      .setTimeFontSize(Number(body.timeFontSize || body.time_font_size || 52))
      .setDateFontSize(Number(body.dateFontSize || body.date_font_size || 14));

    const client = getGrpcClient(ClockServiceClient);

    return new Promise<NextResponse>((resolve) => {
      client.createClock(request, getGrpcMetadata(getTokenFromRequest(req)), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

