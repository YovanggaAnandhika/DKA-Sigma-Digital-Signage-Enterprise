'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PlaylistDetailRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      router.replace(`/studio/components/playlists/${params.id}`);
    }
  }, [params.id, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
      <span>Mengalihkan ke Detail Daftar Putar...</span>
    </div>
  );
}
