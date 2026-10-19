import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NexusPOS — Remote Inventory & Store Operations',
  description: 'Modern universal Point of Sale and real-time inventory management web application for mobile and desktop.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NexusPOS',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full`}>
      <body className="min-h-full bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
