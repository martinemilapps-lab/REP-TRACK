'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18nContext';

export type ViewType = 'submit' | 'myreports';

interface TopbarProps {
  activeView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  isAdminPage?: boolean;
  isManagerUnlocked?: boolean;
  onLockManager?: () => void;
}

export function Topbar({
  activeView,
  onViewChange,
  isAdminPage,
  isManagerUnlocked,
  onLockManager,
}: TopbarProps) {
  const { t, language, toggleLanguage } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const isCurrentAdmin = isAdminPage || pathname === '/admin';
  const isSubmitActive = activeView === 'submit' || (pathname === '/' && !activeView);
  const isMyReportsActive = activeView === 'myreports';

  const handleNavClick = (view: ViewType) => {
    if (pathname !== '/') {
      router.push(`/?view=${view}`);
    } else if (onViewChange) {
      onViewChange(view);
    }
  };

  return (
    <header className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 mb-4 sm:mb-6 border-b-0 sm:border-b sm:border-[var(--line)] bg-transparent sm:bg-[var(--bg)] w-full">
      {/* Brand Identity & Logo */}
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-4 w-full sm:w-auto">
        <Link
          href="/"
          className="flex items-center justify-center sm:justify-start shrink-0 cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <Image
            src="/logo.png"
            alt="REP TRACK - Sunny Medical Group"
            width={260}
            height={85}
            priority
            className="h-16 sm:h-18 md:h-20 w-auto object-contain drop-shadow-xs"
          />
        </Link>
        <div className="hidden sm:block border-s-2 border-[var(--line-strong)] ps-3.5 py-1">
          <p className="text-xs md:text-sm font-extrabold text-[var(--gold-dark)] tracking-wider uppercase">
            Sunny Medical Group
          </p>
          <p className="text-[11px] md:text-xs text-[var(--ink-soft)] font-semibold mt-0.5">
            {isCurrentAdmin
              ? language === 'ar'
                ? 'لوحة تحكم الإدارة'
                : 'Manager Administration Panel'
              : t('app.subtitle')}
          </p>
        </div>
      </div>

      {/* Navigation Controls & Language Switcher */}
      <div className="flex items-center justify-center gap-2 flex-wrap w-full sm:w-auto">
        {!isCurrentAdmin ? (
          /* Normal User Navigation (ONLY Submit and My Reports) */
          <nav className="flex gap-1 bg-[var(--surface)] p-1 rounded-xl border border-[var(--line)] shadow-card">
            <button
              onClick={() => handleNavClick('submit')}
              className={`px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer select-none ${
                isSubmitActive
                  ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs font-extrabold'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {t('nav.submit')}
            </button>
            <button
              onClick={() => handleNavClick('myreports')}
              className={`px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer select-none ${
                isMyReportsActive
                  ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs font-extrabold'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {t('nav.myReports')}
            </button>
          </nav>
        ) : (
          /* Admin Page Navigation */
          <nav className="flex gap-1.5 bg-[var(--surface)] p-1 rounded-xl border border-[var(--line)] shadow-card">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer select-none flex items-center gap-1"
            >
              <span>🏠</span>
              <span>{language === 'ar' ? 'صفحة المندوبين' : 'Rep Portal'}</span>
            </Link>
            <div className="px-3.5 py-2 rounded-lg text-xs md:text-sm font-extrabold bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs select-none flex items-center gap-1.5">
              <span>{isManagerUnlocked ? '📊' : '🔒'}</span>
              <span>{t('nav.managerDashboard')}</span>
            </div>
          </nav>
        )}

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          className="px-3 py-2 bg-[var(--surface)] hover:bg-[var(--gold-tint)] border border-[var(--line)] hover:border-[var(--gold)] text-[var(--ink)] text-xs font-bold rounded-xl shadow-card transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>🌐</span>
          <span className="font-mono uppercase">{language === 'ar' ? 'EN' : 'عربي'}</span>
        </button>

        {/* Fast Manager Lock Button (on admin page if unlocked) */}
        {isCurrentAdmin && isManagerUnlocked && onLockManager && (
          <button
            onClick={onLockManager}
            title={t('nav.lock')}
            className="px-3 py-2 bg-[var(--overdue-bg)] hover:bg-[var(--overdue-color)] text-[var(--overdue-color)] hover:text-white border border-[var(--overdue-border)] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <span>🔒</span>
            <span className="hidden md:inline ms-1">{t('nav.lock')}</span>
          </button>
        )}
      </div>
    </header>
  );
}
