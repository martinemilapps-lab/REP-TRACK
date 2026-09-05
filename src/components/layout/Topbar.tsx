'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18nContext';
import { LogOut, User, Briefcase, Award } from 'lucide-react';

export type MRViewType = 'submit' | 'mylists' | 'myreports' | 'weeklyplan' | 'analysis';

interface TopbarProps {
  currentUser?: {
    id?: string;
    name: string;
    username: string;
    role?: 'MANAGER' | 'REPRESENTATIVE';
    positionCode?: string | null;
    systemRole?: string | null;
    hasPersonalSalesAssignment?: boolean;
    personalSalesAssignment?: { territoryName: string; titleRaw?: string } | null;
  } | null;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onLogout?: () => void;
  // Custom navigation items for manager or other workspaces
  navItems?: Array<{
    id: string;
    label: string;
    icon?: string;
    active: boolean;
    onClick: () => void;
  }>;
}

export function Topbar({
  currentUser,
  activeView,
  onViewChange,
  onLogout,
  navItems,
}: TopbarProps) {
  const { t, language, toggleLanguage } = useTranslation();

  const getPositionLabel = (code?: string | null): string => {
    switch (code) {
      case 'MR':
        return language === 'ar' ? 'مندوب دعاية طبية (MR)' : 'Medical Representative (MR)';
      case 'DM':
        return language === 'ar' ? 'مدير منطقة (DM)' : 'District Manager (DM)';
      case 'AM':
        return language === 'ar' ? 'مدير إقليمي (AM)' : 'Area Manager (AM)';
      case 'OM':
        return language === 'ar' ? 'مدير عمليات (OM)' : 'Operations Manager (OM)';
      case 'BUM':
        return language === 'ar' ? 'مدير وحدة أعمال (BUM)' : 'Business Unit Manager (BUM)';
      case 'PM':
        return language === 'ar' ? 'مدير منتج (PM)' : 'Product Manager (PM)';
      case 'MM':
        return language === 'ar' ? 'مدير تسويق (MM)' : 'Marketing Manager (MM)';
      case 'SMD':
        return language === 'ar' ? 'رئيس مجلس الإدارة التنفيذي (SMD)' : 'Senior Managing Director (SMD)';
      default:
        return code || (language === 'ar' ? 'فريق العمل' : 'Team Member');
    }
  };

  return (
    <header className="flex flex-col lg:flex-row items-center justify-between gap-4 pb-4 mb-6 border-b border-[var(--line)] bg-transparent w-full">
      {/* Brand Identity & Logo */}
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 w-full lg:w-auto">
        <Link
          href="/"
          className="flex items-center justify-center sm:justify-start shrink-0 cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <Image
            src="/logo.png"
            alt="REP TRACK - Sunny Medical Group"
            width={340}
            height={110}
            priority
            className="h-24 sm:h-20 md:h-24 lg:h-28 w-auto object-contain drop-shadow-sm"
          />
        </Link>
        <div className="flex flex-col text-center sm:text-start border-0 sm:border-s-[3px] border-[var(--gold-border)] sm:ps-4 sm:py-1">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-[var(--gold-dark)] tracking-wide uppercase">
            Sunny Medical Group
          </p>
          <p className="text-xs sm:text-sm md:text-base text-[var(--ink-soft)] font-bold mt-0.5 leading-snug">
            {currentUser?.positionCode === 'MR'
              ? (language === 'ar' ? 'بوابة المندوب الميداني والتقارير' : 'Field Representative & Reporting Portal')
              : (language === 'ar' ? 'لوحة القيادة والمتابعة الإدارية' : 'Executive & Management Workspace')}
          </p>
        </div>
      </div>

      {/* User Status, Language & Action Controls */}
      <div className="flex items-center justify-center gap-2.5 flex-wrap w-full lg:w-auto shrink-0">
        {/* User Identity Profile Card */}
        {currentUser && (
          <div className="flex items-center gap-3 bg-[var(--surface)] px-4 py-2 rounded-xl border border-[var(--line)] shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-[var(--gold-tint)] border border-[var(--gold-border)] flex items-center justify-center text-[var(--gold-dark)] font-bold text-sm">
              <User className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-start leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-[var(--ink)]">
                  {currentUser.name}
                </span>
                <span className="font-mono text-[11px] font-bold text-[var(--gold-dark)] bg-[var(--gold-tint)] px-1.5 py-0.5 rounded">
                  {currentUser.username}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[11px] font-semibold text-[var(--ink-soft)] flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-[var(--ink-muted)]" />
                  {getPositionLabel(currentUser.positionCode)}
                </span>
                {currentUser.hasPersonalSalesAssignment && currentUser.personalSalesAssignment && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 px-1.5 py-0.2 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <Award className="w-2.5 h-2.5" />
                    <span>مبيعات: {currentUser.personalSalesAssignment.territoryName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs (if passed directly) */}
        {navItems && navItems.length > 0 && (
          <nav className="flex gap-1 bg-[var(--surface)] p-1 rounded-xl border border-[var(--line)] shadow-xs flex-wrap justify-center">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  item.active
                    ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs font-extrabold'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          className="px-3.5 py-2 bg-[var(--surface)] hover:bg-[var(--gold-tint)] border border-[var(--line)] hover:border-[var(--gold)] text-[var(--ink)] text-xs sm:text-sm font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>🌐</span>
          <span className="font-mono uppercase">{language === 'ar' ? 'EN' : 'عربي'}</span>
        </button>

        {/* Logout Button */}
        {currentUser && onLogout && (
          <button
            onClick={onLogout}
            title={language === 'ar' ? 'تسجيل الخروج' : 'Log out'}
            className="px-3 py-2 bg-[var(--overdue-bg)] hover:bg-[var(--overdue-color)] text-[var(--overdue-color)] hover:text-white border border-[var(--overdue-border)] text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'ar' ? 'خروج' : 'Logout'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
