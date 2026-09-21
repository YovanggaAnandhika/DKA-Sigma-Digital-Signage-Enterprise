import { NextRequest, NextResponse } from 'next/server';
import { LayoutServiceClient } from '@/lib/api/studio/v1/layout/layout_grpc_pb';
import { GetLayoutRequest } from '@/lib/api/studio/v1/layout/layout.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

function mapBlock(b: any) {
  return {
    id: b.id,
    zone_id: b.zoneId,
    playlist_id: b.playlistId || '',
    media_item_id: b.mediaItemId || '',
    playlist: b.playlist,
    media_item: b.mediaItem,
    start_time_seconds: b.startTimeSeconds ?? 0,
    duration_seconds: b.durationSeconds ?? 0,
    transition_type: b.transitionType || '',
    order_index: b.orderIndex ?? 0,
    item_overrides: (b.itemOverridesList || []).map((o: any) => ({
      id: o.id,
      zone_playlist_id: o.zonePlaylistId,
      playlist_item_id: o.playlistItemId,
      is_muted: o.isMuted,
    })),
  };
}

function mapZone(z: any) {
  return {
    id: z.id,
    layout_id: z.layoutId,
    name: z.name,
    x: z.x ?? 0,
    y: z.y ?? 0,
    width: z.width ?? 200,
    height: z.height ?? 200,
    z_index: z.zIndex ?? 1,
    background_color: z.backgroundColor || '',
    blocks: (z.blocksList || []).map(mapBlock),
  };
}

function mapLayout(l: any) {
  return {
    id: l.id,
    name: l.name,
    description: l.description || '',
    canvas_width: l.canvasWidth ?? 1920,
    canvas_height: l.canvasHeight ?? 1080,
    orientation: l.orientation,
    background_color: l.backgroundColor || '',
    background_image_url: l.backgroundImageUrl || '',
    zones: (l.zonesList || []).map(mapZone),
    created_at: l.createdAt || '',
    updated_at: l.updatedAt || '',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new LayoutServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new GetLayoutRequest();
    if(body.id) request.setId(body.id);

    return new Promise((resolve) => {
      client.getLayout(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(mapLayout(response.toObject())));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
