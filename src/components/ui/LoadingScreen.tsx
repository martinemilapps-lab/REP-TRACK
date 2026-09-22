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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg)] px-4 overflow-hidden select-none transition-all duration-300">
      {/* Background Subtle Radial Sunburst Glow */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-radial from-[rgba(229,152,25,0.12)] via-[rgba(245,166,35,0.04)] to-transparent blur-2xl pointer-events-none" />

      {/* Main Logo & Loader Unit */}
      <div className="relative flex flex-col items-center z-10 max-w-xs sm:max-w-sm w-full">
        {/* Strictly bounded logo container that matches logo square proportions */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 flex items-center justify-center animate-pulse-subtle shrink-0">
          <Image
            src="/logo.png"
            alt="REP TRACK"
            width={208}
            height={208}
            priority
            className="w-full h-full object-contain pointer-events-none select-none"
          />
        </div>

        {/* Dedicated, Non-Overlapping Gold Progress Indicator */}
        <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3.5 w-full px-4">
          <div className="w-36 sm:w-44 h-1.5 bg-[var(--line)] rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] rounded-full animate-loading-bar" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-[var(--ink-soft)] tracking-wider text-center">
            {message || t('app.loading')}
          </p>
        </div>
      </div>
    </div>
  );
}
