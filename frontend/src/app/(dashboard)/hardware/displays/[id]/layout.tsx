'use client';

import { useParams } from 'next/navigation';
import { DisplayDetailProvider } from './context/DisplayDetailContext';
import DisplayDetailNavigation from './components/DisplayDetailNavigation';

export default function DisplayDetailLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams() as { id: string };

  return (
    <DisplayDetailProvider deviceId={id}>
      <DisplayDetailNavigation />
      {children}
    </DisplayDetailProvider>
  );
}
