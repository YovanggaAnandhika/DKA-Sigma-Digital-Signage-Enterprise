export interface PhotoItem {
  id: string;
  mediaItemId?: string;
  url: string;
  title: string;
  promoBadge?: string;
  priceTag?: string;
}

export interface PhotoAlbum {
  id: string;
  name: string;
  description: string;
  transitionEffect: 'ken-burns' | 'fade' | 'slide' | 'zoom';
  slideDurationSeconds: number;
  photos: PhotoItem[];
  createdAt?: string;
}

export const ALBUM_STORAGE_KEY = 'dka_signage_photo_albums';

export const DEFAULT_ALBUMS: PhotoAlbum[] = [];

