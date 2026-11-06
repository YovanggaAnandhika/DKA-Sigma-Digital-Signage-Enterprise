import { invokeApi } from '../../core/invokeApi';
import { PhotoAlbum, PhotoItem } from '../../../app/(dashboard)/studio/components/album/types';

type AlbumPhotoResponse = {
  id: string;
  mediaItemId: string;
  caption: string;
  priceTag: string;
  mediaItem?: {
    name: string;
    publicUrl: string;
  };
};

type AlbumResponse = {
  id: string;
  name: string;
  description: string;
  transitionEffect: string;
  slideDurationSeconds: number;
  photosList?: AlbumPhotoResponse[];
};

function mapAlbum(album: AlbumResponse): PhotoAlbum {
  const photos: PhotoItem[] = (album.photosList || []).map((photo) => ({
    id: photo.id,
    mediaItemId: photo.mediaItemId,
    url: photo.mediaItem?.publicUrl || '',
    title: photo.mediaItem?.name || photo.mediaItemId,
    promoBadge: photo.caption || undefined,
    priceTag: photo.priceTag || undefined,
  }));
  return {
    id: album.id,
    name: album.name,
    description: album.description,
    transitionEffect: album.transitionEffect as PhotoAlbum['transitionEffect'],
    slideDurationSeconds: album.slideDurationSeconds,
    photos,
  };
}

function toRequestPhotos(photos: PhotoItem[]) {
  return photos.map((photo) => {
    if (!photo.mediaItemId) throw new Error(`Foto "${photo.title}" tidak memiliki media item yang valid.`);
    return {
      mediaItemId: photo.mediaItemId,
      promoBadge: photo.promoBadge,
      priceTag: photo.priceTag,
    };
  });
}

export async function getAlbums(search = ''): Promise<PhotoAlbum[]> {
  const response = await invokeApi<{ itemsList?: AlbumResponse[] }>('/api/grpc/components/album/ListAlbums', { search });
  return (response.itemsList || []).map(mapAlbum);
}

export async function getAlbum(id: string): Promise<PhotoAlbum> {
  const response = await invokeApi<AlbumResponse>('/api/grpc/components/album/GetAlbum', { id });
  return mapAlbum(response);
}

export async function createAlbum(album: Omit<PhotoAlbum, 'id'>): Promise<PhotoAlbum> {
  const response = await invokeApi<AlbumResponse>('/api/grpc/components/album/CreateAlbum', {
    ...album,
    photos: toRequestPhotos(album.photos),
  });
  return mapAlbum(response);
}

export async function updateAlbum(album: PhotoAlbum): Promise<PhotoAlbum> {
  const response = await invokeApi<AlbumResponse>('/api/grpc/components/album/UpdateAlbum', {
    ...album,
    photos: toRequestPhotos(album.photos),
  });
  return mapAlbum(response);
}

export async function deleteAlbum(id: string): Promise<void> {
  await invokeApi('/api/grpc/components/album/DeleteAlbum', { id });
}
