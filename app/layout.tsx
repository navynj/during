import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';

import { Providers } from '@/app/providers';
import './globals.css';

// Poppins is not a variable font, so every weight is listed explicitly;
// anything not here would be synthesised by the browser rather than fail
// visibly. 700 stays declared for the rare real bold — an unused @font-face
// is never downloaded, so keeping it available costs nothing.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
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
