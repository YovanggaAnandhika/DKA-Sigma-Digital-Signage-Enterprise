import { NextRequest, NextResponse } from 'next/server';
import { ScheduleServiceClient } from '@/lib/api/studio/v1/schedule/schedule_grpc_pb';
import { AddScheduleEventRequest } from '@/lib/api/studio/v1/schedule/schedule.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new ScheduleServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new AddScheduleEventRequest();
    if (body.schedule_id) request.setScheduleId(body.schedule_id);
    if (body.layout_id) request.setLayoutId(body.layout_id);
    if (body.start_time) request.setStartTime(body.start_time);
    if (body.end_time) request.setEndTime(body.end_time);
    if (body.days_of_week) request.setDaysOfWeek(body.days_of_week);

    return new Promise((resolve) => {
      client.addScheduleEvent(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
