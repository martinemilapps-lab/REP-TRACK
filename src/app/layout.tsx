import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18nContext';

export const metadata: Metadata = {
  title: 'REP TRACK — Sunny Medical Group',
  description: 'منظومة تتبع وتوثيق نشاط المندوبين والتغطية البيعية — Medical Representative Activity & Sales Coverage System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased font-sans">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
