import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REP TRACK — منصة تجميع تقارير المندوبين',
  description: 'منصة إدارة وتجميع تقارير الزيارات الميدانية والتغطية البيعية للمندوبين',
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
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
