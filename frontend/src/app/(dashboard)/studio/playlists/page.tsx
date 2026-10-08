'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlaylistManagerTab from '../components/tabs/PlaylistManagerTab';

export default function PlaylistsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/studio/components?tab=playlist');
  }, [router]);

  return <PlaylistManagerTab />;
}
