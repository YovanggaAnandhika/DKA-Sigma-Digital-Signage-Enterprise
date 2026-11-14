import { NextRequest, NextResponse } from 'next/server';
import { MediaServiceClient } from '@/lib/api/studio/v1/media/media_grpc_pb';
import { GetMediaRequest } from '@/lib/api/studio/v1/media/media.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[GetMedia] Request body:", body);
    const client = getGrpcClient(MediaServiceClient);
    
    const request = new GetMediaRequest();
    if (body.id) request.setId(body.id);

    return new Promise<NextResponse>((resolve) => {
      client.getMedia(request, getGrpcMetadataFromRequest(req), (error, response) => {
        if (error) {
           console.error("[GetMedia] gRPC error:", error);
           resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        }
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    console.error("[GetMedia] Catch error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
