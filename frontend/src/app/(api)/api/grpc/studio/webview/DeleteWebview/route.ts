import { NextRequest, NextResponse } from 'next/server';
import { WebviewServiceClient } from '@/lib/api/components/v1/webview/webview_grpc_pb';
import { DeleteWebviewRequest } from '@/lib/api/components/v1/webview/webview.common_pb';
import { getGrpcClient, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const request = new DeleteWebviewRequest().setId(body.id || '');
    const client = getGrpcClient(WebviewServiceClient);

    return new Promise<NextResponse>((resolve) => {
      client.deleteWebview(request, getGrpcMetadata(getTokenFromRequest(req)), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

