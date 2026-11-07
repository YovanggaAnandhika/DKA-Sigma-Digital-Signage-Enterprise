import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DialogProvider } from '@/components/ui/ModalDialog';
import { ImpersonationProvider } from '@/context/ImpersonationContext';

export const metadata: Metadata = {
  title: 'HNDSigma | Modern Retail Digital Signage Platform',
  description: 'Enterprise Centralized Promotional Screen CMS & Player Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-theme="light">
      <body>
        <ThemeProvider>
          <DialogProvider>
            <ImpersonationProvider>
              {children}
            </ImpersonationProvider>
          </DialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
