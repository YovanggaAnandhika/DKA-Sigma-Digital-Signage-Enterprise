import { NextRequest, NextResponse } from 'next/server';
import { LayerBlockServiceClient } from '@/lib/api/studio/v1/layer/block/layer_block_grpc_pb';
import { DeleteLayerBlockRequest } from '@/lib/api/studio/v1/layer/block/layer_block.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new LayerBlockServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new DeleteLayerBlockRequest();
    if (body.id) request.setId(body.id);
    
    return new Promise<NextResponse>((resolve) => {
      client.deleteLayerBlock(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
