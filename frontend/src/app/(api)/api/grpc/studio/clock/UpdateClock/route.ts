import { NextRequest, NextResponse } from 'next/server';
import { ClockServiceClient } from '@/lib/api/components/v1/clock/clock_grpc_pb';
import { UpdateClockRequest } from '@/lib/api/components/v1/clock/clock.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const request = new UpdateClockRequest()
      .setId(body.id || '')
      .setName(body.name || '')
      .setCity(body.city || '')
      .setShowSeconds(Boolean(body.showSeconds ?? body.show_seconds ?? true))
      .setIs24Hour(Boolean(body.is24Hour ?? body.is_24_hour ?? true))
      .setTheme(body.theme || '')
      .setBackgroundColor(body.backgroundColor || body.background_color || '')
      .setTextColor(body.textColor || body.text_color || '')
      .setSubtitleColor(body.subtitleColor || body.subtitle_color || '')
      .setBorderColor(body.borderColor || body.border_color || '')
      .setBorderRadius(Number(body.borderRadius || body.border_radius || 0))
      .setTimeFontSize(Number(body.timeFontSize || body.time_font_size || 0))
      .setDateFontSize(Number(body.dateFontSize || body.date_font_size || 0));

    const client = getGrpcClient(ClockServiceClient);

    return new Promise<NextResponse>((resolve) => {
      client.updateClock(request, getGrpcMetadataFromRequest(req), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

