export interface PhotoItem {
  id: string;
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

export const DEFAULT_ALBUMS: PhotoAlbum[] = [
  {
    id: 'album-1',
    name: 'Promo Kuliner Nusantara',
    description: 'Slideshow menu andalan restoran untuk layar kasir dan display etalase.',
    transitionEffect: 'ken-burns',
    slideDurationSeconds: 4,
    createdAt: '2026-10-08',
    photos: [
      {
        id: 'p-1',
        url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop&q=80',
        title: 'Salad Buah Segar Tropis',
        promoBadge: 'SEGAR TIAP HARI',
        priceTag: 'Rp 28.000',
      },
      {
        id: 'p-2',
        url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&auto=format&fit=crop&q=80',
        title: 'Pizza Keju Mozzarella Spesial',
        promoBadge: 'DISKON 20%',
        priceTag: 'Rp 65.000',
      },
      {
        id: 'p-3',
        url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
        title: 'Nasi Goreng Wagyu Premium',
        promoBadge: 'CHEF RECOMMEND',
        priceTag: 'Rp 45.000',
      },
    ],
  },
  {
    id: 'album-2',
    name: 'Katalog Koleksi Pakaian Liburan',
    description: 'Promosi fashion dan perlengkapan liburan akhir pekan.',
    transitionEffect: 'fade',
    slideDurationSeconds: 5,
    createdAt: '2026-10-08',
    photos: [
      {
        id: 'p-4',
        url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop&q=80',
        title: 'Koleksi Busana Musim Panas',
        promoBadge: 'NEW ARRIVAL',
        priceTag: 'Mulai Rp 120.000',
      },
      {
        id: 'p-5',
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
        title: 'Aksesoris & Sepatu Kasual',
        promoBadge: 'HEBOH DISKON',
        priceTag: 'Diskon s/d 50%',
      },
    ],
  },
];
