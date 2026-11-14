export interface ScheduleEvent {
  id: string;
  scheduleId: string;
  layoutId: string;
  layoutName: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string;
  priority?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  isCurrentActive?: boolean;
}

export interface Schedule {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  eventsList: ScheduleEvent[];
}

