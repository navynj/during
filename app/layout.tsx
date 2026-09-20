import type { Metadata } from 'next';

import { Providers } from '@/app/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'During',
  description: 'A one-line diary that assembles itself.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
