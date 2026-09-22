import { NextRequest, NextResponse } from 'next/server';
import { LayoutServiceClient } from '@/lib/api/studio/v1/layout/layout_grpc_pb';
import { SetPlaylistItemOverrideRequest } from '@/lib/api/studio/v1/layout/layout.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new LayoutServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new SetPlaylistItemOverrideRequest();
    if (body.zone_playlist_id) request.setZonePlaylistId(body.zone_playlist_id);
    if (body.playlist_item_id) request.setPlaylistItemId(body.playlist_item_id);
    if (body.is_muted !== undefined) request.setIsMuted(body.is_muted);

    return new Promise((resolve) => {
      client.setPlaylistItemOverride(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          const obj = response.toObject();
          const override = obj.override;
          resolve(NextResponse.json({
            success: obj.success,
            override: override
              ? {
                  id: override.id,
                  zone_playlist_id: override.zonePlaylistId,
                  playlist_item_id: override.playlistItemId,
                  is_muted: override.isMuted,
                }
              : null,
          }));
        }
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
