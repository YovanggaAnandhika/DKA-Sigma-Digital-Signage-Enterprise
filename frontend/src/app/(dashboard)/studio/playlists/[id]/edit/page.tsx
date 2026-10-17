'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PlaylistEditRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      router.replace(`/studio/components/playlists/${params.id}/edit`);
    }
  }, [params.id, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
      <span>Mengalihkan ke Editor Susunan Item...</span>
    </div>
  );
}
