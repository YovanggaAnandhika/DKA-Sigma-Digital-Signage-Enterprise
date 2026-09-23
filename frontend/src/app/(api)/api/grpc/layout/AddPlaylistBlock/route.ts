import { NextRequest, NextResponse } from 'next/server';
import { LayoutServiceClient } from '@/lib/api/studio/v1/layout/layout_grpc_pb';
import { AddPlaylistBlockRequest } from '@/lib/api/studio/v1/layout/layout.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new LayoutServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new AddPlaylistBlockRequest();
    if (body.zone_id) request.setZoneId(body.zone_id);
    if (body.playlist_id) request.setPlaylistId(body.playlist_id);
    if (body.start_time_seconds !== undefined) request.setStartTimeSeconds(body.start_time_seconds);
    if (body.duration_seconds !== undefined) request.setDurationSeconds(body.duration_seconds);
    return new Promise<NextResponse>((resolve) => {
      client.addPlaylistBlock(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
