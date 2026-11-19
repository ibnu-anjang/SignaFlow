import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SignaFlow — Digital Signage Platform',
  description: 'Platform Digital Signage Offline-First untuk Layar Kiosk Vertikal 9:16',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-neutral-950 text-neutral-100">
        {children}
      </body>
    </html>
  );
}
