'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18nContext';

export type ViewType = 'submit' | 'myreports' | 'dashboard';

interface TopbarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isManagerUnlocked?: boolean;
  onLockManager?: () => void;
}

export function Topbar({
  activeView,
  onViewChange,
  isManagerUnlocked,
  onLockManager,
}: TopbarProps) {
  const { t, language, toggleLanguage } = useTranslation();

  return (
    <header className="flex items-center justify-between gap-4 flex-wrap pb-4 mb-6 border-b border-[var(--line)] bg-[var(--bg)]">
      {/* Brand Identity & Logo */}
      <div className="flex items-center gap-3">
        <div className="relative w-36 h-12 md:w-44 md:h-14 flex items-center justify-start shrink-0">
          <Image
            src="/logo.png"
            alt="REP TRACK - Sunny Medical Group"
            width={180}
            height={56}
            priority
            className="object-contain drop-shadow-2xs"
          />
        </div>
        <div className="hidden sm:block border-s border-[var(--line-strong)] ps-3">
          <p className="text-[11px] font-extrabold text-[var(--gold-dark)] tracking-wider uppercase">
            Sunny Medical Group
          </p>
          <p className="text-[10px] text-[var(--ink-soft)] font-medium">
            {t('app.subtitle')}
          </p>
        </div>
      </div>

      {/* Navigation Controls & Language Switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        <nav className="flex gap-1 bg-[var(--surface)] p-1 rounded-xl border border-[var(--line)] shadow-card">
          <button
            onClick={() => onViewChange('submit')}
            className={`px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer select-none ${
              activeView === 'submit'
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs font-extrabold'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {t('nav.submit')}
          </button>
          <button
            onClick={() => onViewChange('myreports')}
            className={`px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer select-none ${
              activeView === 'myreports'
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs font-extrabold'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {t('nav.myReports')}
          </button>
          <button
            onClick={() => onViewChange('dashboard')}
            className={`px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer select-none flex items-center gap-1.5 ${
              activeView === 'dashboard'
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs font-extrabold'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <span>{isManagerUnlocked ? '📊' : '🔒'}</span>
            <span>{t('nav.managerDashboard')}</span>
          </button>
        </nav>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          className="px-3 py-2 bg-[var(--surface)] hover:bg-[var(--gold-tint)] border border-[var(--line)] hover:border-[var(--gold)] text-[var(--ink)] text-xs font-bold rounded-xl shadow-card transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>🌐</span>
          <span className="font-mono uppercase">{language === 'ar' ? 'EN' : 'عربي'}</span>
        </button>

        {/* Fast Manager Lock Button (if manager view is unlocked) */}
        {isManagerUnlocked && onLockManager && (
          <button
            onClick={onLockManager}
            title={t('nav.lock')}
            className="px-3 py-2 bg-[var(--overdue-bg)] hover:bg-[var(--overdue-color)] text-[var(--overdue-color)] hover:text-white border border-[var(--overdue-border)] text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <span>🔒</span>
            <span className="hidden md:inline ms-1">{t('nav.lock')}</span>
          </button>
        )}
      </div>
    </header>
  );
}
