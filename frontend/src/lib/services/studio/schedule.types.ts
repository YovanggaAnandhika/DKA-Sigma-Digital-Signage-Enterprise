export interface ScheduleEvent {
  id: string;
  scheduleId: string;
  layoutId: string;
  layoutName: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string;
  createdAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  eventsList: ScheduleEvent[];
}

