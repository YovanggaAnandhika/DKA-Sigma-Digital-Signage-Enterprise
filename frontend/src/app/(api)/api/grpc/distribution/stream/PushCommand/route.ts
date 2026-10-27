import { NextRequest, NextResponse } from 'next/server';
import { StreamServiceClient } from '@/lib/api/distribution/v1/stream/stream_grpc_pb';
import { PushCommandRequest, ServerCommandType } from '@/lib/api/distribution/v1/stream/stream.common_pb';
import { getGrpcClient, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = getGrpcClient(StreamServiceClient);
    const request = new PushCommandRequest();

    if (body.deviceId || body.device_id) {
      request.setDeviceId(body.deviceId || body.device_id);
    }

    if (body.commandType !== undefined || body.command_type !== undefined) {
      const cmdType = Number(body.commandType ?? body.command_type);
      request.setCommandType(cmdType as ServerCommandType);
    }

    if (body.payloadJson || body.payload_json) {
      request.setPayloadJson(body.payloadJson || body.payload_json);
    }

    return new Promise<NextResponse>((resolve) => {
      client.pushCommand(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
