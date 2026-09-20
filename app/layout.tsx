import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';

import { Providers } from '@/app/providers';
import './globals.css';

// Poppins is not a variable font, so the weights the UI actually uses are
// listed explicitly; anything not here would silently synthesise.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'During',
  description: 'A one-line diary that assembles itself.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
