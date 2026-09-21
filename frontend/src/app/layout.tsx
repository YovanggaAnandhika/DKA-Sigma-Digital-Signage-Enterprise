import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'DKASigma | Modern Retail Digital Signage Platform',
  description: 'Enterprise Centralized Promotional Screen CMS & Player Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-theme="dark">
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
