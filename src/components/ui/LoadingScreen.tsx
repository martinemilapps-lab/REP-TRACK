'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18nContext';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg)] px-4 transition-all duration-300">
      {/* Background Subtle Radial Sunburst Glow */}
      <div className="absolute w-96 h-96 rounded-full bg-radial from-[rgba(229,152,25,0.12)] via-[rgba(245,166,35,0.04)] to-transparent blur-2xl pointer-events-none" />

      {/* Main Logo & Loader Unit */}
      <div className="relative flex flex-col items-center z-10">
        <div className="relative w-64 h-32 md:w-80 md:h-40 flex items-center justify-center animate-pulse-subtle">
          <Image
            src="/logo.png"
            alt="REP TRACK"
            width={320}
            height={160}
            priority
            className="object-contain drop-shadow-xs"
          />
        </div>

        {/* Elegant Gold Progress Indicator */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="w-36 h-1 bg-[var(--line)] rounded-full overflow-hidden relative">
            <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] rounded-full animate-[pulseSubtle_1.5s_ease-in-out_infinite]" />
          </div>
          <p className="text-xs font-bold text-[var(--ink-soft)] tracking-wider">
            {message || t('app.loading')}
          </p>
        </div>
      </div>
    </div>
  );
}
