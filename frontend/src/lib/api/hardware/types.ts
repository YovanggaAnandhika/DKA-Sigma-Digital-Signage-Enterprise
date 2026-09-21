export interface Device {
  id: string;
  name: string;
  pairing_code: string;
  is_paired: boolean;
  is_online: boolean;
  ip_address: string;
  resolution: string;
  orientation: string;
  storage_free_bytes: number;
  memory_used_percent: number;
  last_heartbeat_at?: string;
  current_layout_id?: string;
  canary_group_id?: string;
  display_group_id?: string;
  schedule_id?: string;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}
