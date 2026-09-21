import { NextRequest, NextResponse } from 'next/server';
import { ScheduleServiceClient } from '@/lib/api/studio/v1/schedule/schedule_grpc_pb';
import { ListSchedulesRequest } from '@/lib/api/studio/v1/schedule/schedule.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new ScheduleServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new ListSchedulesRequest();
    if(body.search) request.setSearch(body.search);

    return new Promise((resolve) => {
      client.listSchedules(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
