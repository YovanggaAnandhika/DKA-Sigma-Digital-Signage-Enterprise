'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlaylistsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/studio/components/playlists');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
      <span>Mengalihkan ke Komponen Daftar Putar...</span>
    </div>
  );
}
