'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlaylistCreateRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/studio/components/playlists/create');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
      <span>Mengalihkan ke Buat Daftar Putar...</span>
    </div>
  );
}
