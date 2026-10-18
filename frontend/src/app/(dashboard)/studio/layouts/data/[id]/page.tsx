'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function LayoutViewRedirect() {
  const params = useParams() as { id: string };
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      router.replace(`/studio/layouts/data/${params.id}/edit`);
    }
  }, [params.id, router]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
      }}
    >
      <span>Membuka Canvas Designer...</span>
    </div>
  );
}

