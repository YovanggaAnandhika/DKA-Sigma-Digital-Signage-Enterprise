export interface Layout {
  id: string;
  name: string;
  description: string;
  canvasWidth: number;
  canvasHeight: number;
  orientation: number | string;
  backgroundColor: string;
  backgroundImageUrl: string;
  layersList: Layer[];
  createdAt: string;
  updatedAt: string;
}

export interface Layer {
  id: string;
  layoutId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  blocksList: LayerPlaylist[];
  backgroundColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface LayerPlaylist {
  id: string;
  layerId: string;
  playlistId: string;
  mediaItemId: string;
  playlist?: Playlist;
  mediaItem?: MediaItem;
  startTimeSeconds: number;
  durationSeconds: number;
  transitionType: string;
  orderIndex: number;
  itemOverridesList: LayerPlaylistItemOverride[];
  isMuted?: boolean;
  volumeLevel?: number;
  createdAt: string;
}

export interface LayerPlaylistItemOverride {
  id: string;
  layerPlaylistId: string;
  playlistItemId: string;
  isMuted: boolean;
  volumeLevel?: number;
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  mediaItemId: string;
  mediaItem?: MediaItem;
  position: number;
  durationSeconds: number;
  transitionType: string;
  createdAt: string;
  isMuted: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  isShuffle: boolean;
  itemsList: PlaylistItem[];
  totalDurationSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  name: string;
  originalFilename: string;
  filePath: string;
  publicUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  sha256Hash: string;
  mediaType: number; // 1 = Image, 2 = Video, 3 = Web
  width: number;
  height: number;
  durationSeconds: number;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
}
