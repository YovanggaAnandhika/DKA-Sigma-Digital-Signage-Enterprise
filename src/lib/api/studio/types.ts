export interface Layout {
  id: string;
  name: string;
  description?: string;
  canvas_width: number;
  canvas_height: number;
  orientation: string;
  background_color?: string;
  background_image_url?: string;
  zones: Zone[];
  created_at?: string;
  updated_at?: string;
}

export interface Zone {
  id: string;
  layout_id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z_index: number;
  blocks: ZonePlaylist[];
  background_color?: string;
}

export interface ZonePlaylist {
  id: string;
  zone_id: string;
  playlist_id: string;
  playlist?: Playlist;
  start_time_seconds: number;
  duration_seconds: number;
  transition_type: string;
  order_index: number;
  item_overrides?: ZonePlaylistItemOverride[];
}

export interface ZonePlaylistItemOverride {
  id: string;
  zone_playlist_id: string;
  playlist_item_id: string;
  is_muted: boolean;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  media_item_id: string;
  media_name?: string;
  media_type?: string;
  duration_seconds: number;
  order_index: number;
  transition_type: string;
  is_muted?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  is_shuffle: boolean;
  items: PlaylistItem[];
  total_duration_seconds?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  original_filename: string;
  file_path: string;
  public_url: string;
  file_size_bytes: number;
  mime_type: string;
  sha256_hash: string;
  media_type: number; // 1 = Image, 2 = Video, 3 = Web
  width: number;
  height: number;
  duration_seconds: number;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
}
