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
    <header className="flex flex-col lg:flex-row items-center justify-between gap-4 pb-4 mb-6 border-b border-[var(--line)] bg-transparent w-full">
      {/* Brand Identity & Logo */}
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 w-full lg:w-auto">
        <Link
          href="/"
          className="flex items-center justify-center sm:justify-start shrink-0 cursor-pointer transition-transform hover:scale-[1.03]"
        >
          <Image
            src="/logo.png"
            alt="REP TRACK - Sunny Medical Group"
            width={340}
            height={110}
            priority
            className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto object-contain drop-shadow-sm"
          />
        </Link>
        <div className="flex flex-col text-center sm:text-start border-0 sm:border-s-[3px] border-[var(--gold-border)] sm:ps-4 sm:py-1">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-[var(--gold-dark)] tracking-wide uppercase">
            Sunny Medical Group
          </p>
          <p className="text-xs sm:text-sm md:text-base text-[var(--ink-soft)] font-bold mt-0.5 leading-snug">
            {isCurrentAdmin
              ? language === 'ar'
                ? 'لوحة تحكم الإدارة والمتابعة'
                : 'Manager Administration & Analytics Panel'
              : t('app.subtitle')}
          </p>
        </div>
      </div>

      {/* Navigation Controls & Language Switcher */}
      <div className="flex items-center justify-center gap-2.5 flex-wrap w-full lg:w-auto shrink-0">
        {!isCurrentAdmin ? (
          /* Normal User Navigation (ONLY Submit and My Reports) */
          <nav className="flex gap-1.5 bg-[var(--surface)] p-1.5 rounded-xl border border-[var(--line)] shadow-card">
            <button
              onClick={() => handleNavClick('submit')}
              className={`px-4 py-2.5 rounded-lg text-sm md:text-base font-bold transition-all duration-200 cursor-pointer select-none ${
                isSubmitActive
                  ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs font-extrabold'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {t('nav.submit')}
            </button>
            <button
              onClick={() => handleNavClick('myreports')}
              className={`px-4 py-2.5 rounded-lg text-sm md:text-base font-bold transition-all duration-200 cursor-pointer select-none ${
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
          <nav className="flex gap-2 bg-[var(--surface)] p-1.5 rounded-xl border border-[var(--line)] shadow-card">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-lg text-sm md:text-base font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer select-none flex items-center gap-1.5"
            >
              <span>🏠</span>
              <span>{language === 'ar' ? 'صفحة المندوبين' : 'Rep Portal'}</span>
            </Link>
            <div className="px-4 py-2.5 rounded-lg text-sm md:text-base font-extrabold bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs select-none flex items-center gap-2">
              <span>{isManagerUnlocked ? '📊' : '🔒'}</span>
              <span>{t('nav.managerDashboard')}</span>
            </div>
          </nav>
        )}

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          className="px-3.5 py-2.5 bg-[var(--surface)] hover:bg-[var(--gold-tint)] border border-[var(--line)] hover:border-[var(--gold)] text-[var(--ink)] text-sm font-extrabold rounded-xl shadow-card transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>🌐</span>
          <span className="font-mono uppercase">{language === 'ar' ? 'EN' : 'عربي'}</span>
        </button>

        {/* Fast Manager Lock Button (on admin page if unlocked) */}
        {isCurrentAdmin && isManagerUnlocked && onLockManager && (
          <button
            onClick={onLockManager}
            title={t('nav.lock')}
            className="px-3.5 py-2.5 bg-[var(--overdue-bg)] hover:bg-[var(--overdue-color)] text-[var(--overdue-color)] hover:text-white border border-[var(--overdue-border)] text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🔒</span>
            <span className="hidden md:inline ms-1">{t('nav.lock')}</span>
          </button>
        )}
      </div>
    </header>
  );
}
