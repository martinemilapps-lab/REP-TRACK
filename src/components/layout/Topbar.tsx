'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18nContext';
import { LogOut, User, Briefcase, Award } from 'lucide-react';
import { ReportingTimer } from '@/components/layout/ReportingTimer';

export type MRViewType = 'submit' | 'mylists' | 'myreports' | 'weeklyplan' | 'availability' | 'analysis';

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
    <header className="w-full border-b border-[var(--line)] bg-[var(--surface)]/85 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
        {/* Brand Identity & Logo */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/"
            className="flex items-center shrink-0 cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <div className="relative h-12 sm:h-16 lg:h-18 w-auto flex items-center">
              <Image
                src="/logo.png"
                alt="REP TRACK - Sunny Medical Group"
                width={300}
                height={90}
                priority
                className="h-full w-auto object-contain drop-shadow-xs"
              />
            </div>
          </Link>
          <div className="hidden sm:flex flex-col border-s-2 border-[var(--gold-border)] ps-3 sm:ps-4 py-0.5">
            <p className="text-base sm:text-lg lg:text-xl font-black text-[var(--gold-dark)] tracking-wide uppercase leading-tight">
              Sunny Medical Group
            </p>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-bold mt-0.5 leading-snug">
              {currentUser?.positionCode === 'MR'
                ? (language === 'ar' ? 'بوابة المندوب الميداني والتقارير' : 'Field Representative & Reporting Portal')
                : (language === 'ar' ? 'لوحة القيادة والمتابعة الإدارية' : 'Executive & Management Workspace')}
            </p>
          </div>
        </div>

        {/* User Status, Language & Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* User Identity Profile Card */}
          {currentUser && (
            <div className="flex items-center gap-3 bg-[var(--surface)] px-3.5 py-1.5 rounded-xl border border-[var(--line)] shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[var(--gold-tint)] border border-[var(--gold-border)] flex items-center justify-center text-[var(--gold-dark)] font-bold text-sm">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden md:flex flex-col text-start leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-[var(--ink)]">
                    {currentUser.name}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[var(--gold-dark)] bg-[var(--gold-tint)] px-1.5 py-0.5 rounded">
                    {currentUser.username}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--ink-soft)] font-semibold mt-0.5">
                  {getPositionLabel(currentUser.positionCode)}
                </span>
              </div>
            </div>
          )}

          {/* Custom Nav Items if provided */}
          {navItems && navItems.length > 0 && (
            <nav className="hidden xl:flex items-center gap-1.5 bg-[var(--surface-muted)] p-1 rounded-xl border border-[var(--line)]">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    item.active
                      ? 'bg-[var(--gold)] text-white shadow-xs font-black'
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
      </div>
    </header>
  );
}
