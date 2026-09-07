'use client';

import Image from 'next/image';
import { LogOut, Languages, Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';

export type ShellNavItem = { id: string; label: string; icon: ReactNode };

export function AppShell({ user, items, activeItem, onNavigate, onLogout, children }: {
  user: { name: string; username: string; positionCode?: string | null };
  items: ShellNavItem[]; activeItem: string; onNavigate: (id: string) => void; onLogout: () => void; children: ReactNode;
}) {
  const { language, toggleLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const navigation = <nav aria-label={language === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'} className="space-y-1">{items.map((item) => <button key={item.id} type="button" aria-current={activeItem === item.id ? 'page' : undefined} onClick={() => { onNavigate(item.id); setOpen(false); }} className={`app-nav-item ${activeItem === item.id ? 'app-nav-item-active' : ''}`}><span aria-hidden>{item.icon}</span><span>{item.label}</span></button>)}</nav>;
  return <div className="app-shell">
    <aside className="app-sidebar hidden lg:flex"><Image src="/logo.png" alt="REP TRACK" width={190} height={72} priority className="h-16 w-auto object-contain"/><div className="mt-7 flex-1">{navigation}</div><div className="border-t border-[var(--line)] pt-4"><p className="font-semibold text-sm truncate">{user.name}</p><p className="text-xs text-[var(--ink-soft)] font-mono">{user.positionCode} · {user.username}</p></div></aside>
    {open && <div className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
    <aside className={`app-mobile-drawer ${open ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'}`} aria-hidden={!open}><div className="flex items-center justify-between mb-6"><Image src="/logo.png" alt="REP TRACK" width={150} height={56} className="h-12 w-auto"/><Button variant="ghost" size="sm" aria-label="Close navigation" onClick={() => setOpen(false)}><X className="size-5"/></Button></div>{navigation}</aside>
    <div className="min-w-0 flex-1"><header className="app-header"><Button variant="ghost" size="sm" className="lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu className="size-5"/></Button><div className="min-w-0 flex-1"><p className="text-sm font-bold truncate">{user.name}</p><p className="text-xs text-[var(--ink-soft)]">{user.positionCode} · {user.username}</p></div><Button variant="secondary" size="sm" onClick={toggleLanguage} aria-label="Switch language"><Languages className="size-4"/><span>{language === 'ar' ? 'EN' : 'عربي'}</span></Button><Button variant="ghost" size="sm" onClick={onLogout} aria-label={language === 'ar' ? 'تسجيل الخروج' : 'Log out'}><LogOut className="size-4"/></Button></header><main className="app-content">{children}</main></div>
  </div>;
}
