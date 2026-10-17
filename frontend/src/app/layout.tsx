import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DialogProvider } from '@/components/ui/ModalDialog';

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
          <DialogProvider>
            {children}
          </DialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
