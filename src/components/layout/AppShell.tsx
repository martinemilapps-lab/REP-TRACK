'use client';

import Image from 'next/image';
import { LogOut, Languages, Menu } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { ReportingTimer } from '@/components/layout/ReportingTimer';

export type ShellNavItem = { id: string; label: string; icon: ReactNode };

export function AppShell({ user, items, activeItem, onNavigate, onLogout, children }: {
  user: { name: string; username: string; positionCode?: string | null };
  items: ShellNavItem[]; activeItem: string; onNavigate: (id: string) => void; onLogout: () => void; children: ReactNode;
}) {
  const { language, toggleLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const navigation = (
    <nav aria-label={language === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'} className="space-y-1.5">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={activeItem === item.id ? 'page' : undefined}
          onClick={() => {
            onNavigate(item.id);
            setOpen(false);
          }}
          className={`app-nav-item cursor-pointer ${activeItem === item.id ? 'app-nav-item-active' : ''}`}
        >
          <span className="shrink-0 [&>svg]:size-4.5" aria-hidden>
            {item.icon}
          </span>
          <span className="whitespace-nowrap truncate text-start">
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="app-shell">
      {/* Desktop Persistent Sidebar */}
      <aside className="app-sidebar hidden lg:flex">
        {/* Brand Header */}
        <div className="flex flex-col items-start pb-5 border-b border-[var(--line)] mb-4">
          <div className="relative w-full h-20 lg:h-24 flex items-center justify-start">
            <Image
              src="/logo.png"
              alt="REP TRACK - Sunny Medical Group"
              width={260}
              height={95}
              priority
              className="h-full w-auto object-contain drop-shadow-xs"
            />
          </div>
          <div className="mt-2.5 ps-0.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-[var(--gold-dark)] leading-tight">
              Sunny Medical Group
            </p>
            <p className="text-xs text-[var(--ink-soft)] font-bold mt-0.5">
              REP TRACK System
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto pe-1 custom-select-scrollbar">
          {navigation}
        </div>

        {/* User Identity Footer */}
        <div className="border-t border-[var(--line)] pt-4 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--gold-tint)] border border-[var(--gold-border)] flex items-center justify-center text-[var(--gold-dark)] font-black text-sm shrink-0">
              {user.positionCode || 'MR'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-sm text-[var(--ink)] truncate">{user.name}</p>
              <p className="text-xs text-[var(--ink-soft)] font-mono font-semibold truncate">
                {user.positionCode} · {user.username}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      <Drawer
        open={open}
        title={language === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}
        onClose={() => setOpen(false)}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--line)] mb-4">
            <div className="relative h-14 w-auto flex items-center">
              <Image
                src="/logo.png"
                alt="REP TRACK"
                width={180}
                height={60}
                className="h-full w-auto object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-[var(--gold-dark)]">Sunny Medical Group</p>
              <p className="text-xs font-bold text-[var(--ink-soft)]">{user.name} ({user.positionCode})</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {navigation}
          </div>
        </div>
      </Drawer>

      {/* Main Workspace Body */}
      <div className="min-w-0 flex-1 flex flex-col min-h-screen">
        <header className="app-header">
          {/* Mobile Menu Trigger */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)] cursor-pointer flex items-center justify-center min-h-[44px] min-w-[44px]"
            aria-label={language === 'ar' ? 'فتح التنقل' : 'Open navigation'}
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          {/* User Details */}
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-base lg:text-lg font-extrabold text-[var(--ink)] truncate">
              {user.name}
            </p>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-mono font-medium">
              {user.positionCode} · {user.username}
            </p>
          </div>

          {/* Reporting Deadline Cutoff Timer */}
          <ReportingTimer />

          {/* Language Switcher Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleLanguage}
            className="h-10 px-3.5 rounded-xl font-bold"
            aria-label={language === 'ar' ? 'تغيير اللغة' : 'Switch language'}
          >
            <Languages className="size-4" />
            <span className="font-mono">{language === 'ar' ? 'EN' : 'عربي'}</span>
          </Button>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="h-10 w-10 p-0 rounded-xl text-[var(--overdue-color)] hover:bg-[var(--overdue-bg)]"
            aria-label={language === 'ar' ? 'تسجيل الخروج' : 'Log out'}
          >
            <LogOut className="size-4.5" />
          </Button>
        </header>

        <main className="app-content flex-1">{children}</main>
      </div>
    </div>
  );
}
