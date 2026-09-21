import { NextRequest, NextResponse } from 'next/server';
import { LayoutServiceClient } from '@/lib/api/studio/v1/layout/layout_grpc_pb';
import { ListLayoutsRequest } from '@/lib/api/studio/v1/layout/layout.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

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
    zones: (l.zonesList || []).map((z: any) => ({
      id: z.id,
      layout_id: z.layoutId,
      name: z.name,
      x: z.x ?? 0,
      y: z.y ?? 0,
      width: z.width ?? 200,
      height: z.height ?? 200,
      z_index: z.zIndex ?? 1,
      background_color: z.backgroundColor || '',
      blocks: (z.blocksList || []),
    })),
    created_at: l.createdAt || '',
    updated_at: l.updatedAt || '',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new LayoutServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new ListLayoutsRequest();
    if(body.search) request.setSearch(body.search);

    return new Promise((resolve) => {
      client.listLayouts(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else {
          const obj = response.toObject();
          resolve(NextResponse.json({
            itemsList: (obj.itemsList || []).map(mapLayout),
            pagination: obj.pagination,
          }));
        }
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
