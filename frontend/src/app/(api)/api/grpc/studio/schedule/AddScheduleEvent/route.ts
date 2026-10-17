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
    if (body.scheduleId || body.schedule_id) request.setScheduleId(body.scheduleId || body.schedule_id);
    if (body.layout_id || body.layoutId) request.setLayoutId(body.layout_id || body.layoutId);
    if (body.startTime || body.start_time) request.setStartTime(body.startTime || body.start_time);
    if (body.end_time || body.endTime) request.setEndTime(body.end_time || body.endTime);
    if (body.days_of_week || body.daysOfWeek) request.setDaysOfWeek(body.days_of_week || body.daysOfWeek);
    if (body.priority !== undefined) request.setPriority(Number(body.priority));
    if (body.startDate || body.start_date) request.setStartDate(body.startDate || body.start_date);
    if (body.endDate || body.end_date) request.setEndDate(body.endDate || body.end_date);

    return new Promise<NextResponse>((resolve) => {
      client.addScheduleEvent(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
