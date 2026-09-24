import { NextRequest, NextResponse } from 'next/server';
import { ScheduleServiceClient } from '@/lib/api/studio/v1/schedule/schedule_grpc_pb';
import { UpdateScheduleRequest } from '@/lib/api/studio/v1/schedule/schedule.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new ScheduleServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new UpdateScheduleRequest();
    if(body.id) request.setId(body.id); if(body.name) request.setName(body.name); if(body.description !== undefined) request.setDescription(body.description);

    return new Promise<NextResponse>((resolve) => {
      client.updateSchedule(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
