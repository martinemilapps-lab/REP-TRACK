import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18nContext';
import { MedicalBackground } from '@/components/ui/MedicalBackground';

export const metadata: Metadata = {
  title: 'REP TRACK — Sunny Medical Group',
  description: 'منظومة تتبع وتوثيق نشاط المندوبين والتغطية البيعية — Medical Representative Activity & Sales Coverage System',
  icons: {
    icon: [
      { url: '/address_logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/address_logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/address_logo.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/address_logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="/address_logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/address_logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased font-sans relative overflow-x-hidden">
        <I18nProvider>
          <MedicalBackground />
          <div className="relative z-10">{children}</div>
        </I18nProvider>
      </body>
    </html>
  );
}
