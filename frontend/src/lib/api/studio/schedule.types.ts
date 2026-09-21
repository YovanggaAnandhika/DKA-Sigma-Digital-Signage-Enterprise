export interface ScheduleEvent {
  id: string;
  schedule_id: string;
  layout_id: string;
  layout_name: string;
  start_time: string;
  end_time: string;
  days_of_week: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  events?: ScheduleEvent[];
}
