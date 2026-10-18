import { NextRequest, NextResponse } from 'next/server';
import { WebviewServiceClient } from '@/lib/api/studio/v1/webview/webview_grpc_pb';
import { ListWebviewsRequest } from '@/lib/api/studio/v1/webview/webview.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const client = new WebviewServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new ListWebviewsRequest();

    return new Promise<NextResponse>((resolve) => {
      client.listWebviews(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
