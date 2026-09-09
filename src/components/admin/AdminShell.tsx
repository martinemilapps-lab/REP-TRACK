'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, Languages, LayoutDashboard, LockKeyhole, LogOut, Menu, ShieldCheck, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Drawer } from '@/components/ui/Drawer'; import { Button } from '@/components/ui/Button'; import { useTranslation } from '@/lib/i18nContext';

const items = [
  { href: '/admin', en: 'Overview', ar: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/admin/users', en: 'Users', ar: 'المستخدمون', icon: Users },
  { href: '/admin/security', en: 'Security Operations', ar: 'عمليات الأمان', icon: LockKeyhole },
  { href: '/admin/audit', en: 'Audit Log', ar: 'سجل التدقيق', icon: Activity },
];
export function AdminShell({ user, children }: { user: { name: string; username: string }; children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const { language, toggleLanguage } = useTranslation(); const [open, setOpen] = useState(false);
  const nav = <nav aria-label={language === 'ar' ? 'تنقل الإدارة' : 'Admin navigation'} className="space-y-1">{items.map(({ href, en, ar, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} onClick={() => setOpen(false)} className={`app-nav-item ${pathname === href ? 'app-nav-item-active' : ''}`}><Icon className="size-4"/><span>{language === 'ar' ? ar : en}</span></Link>)}</nav>;
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/'); router.refresh(); };
  return <div className="app-shell"><aside className="app-sidebar hidden lg:flex"><Image src="/logo.png" alt="REP TRACK" width={190} height={72} priority className="h-16 w-auto object-contain"/><div className="mt-3 flex items-center gap-2 text-sm font-black text-[var(--gold-dark)]"><ShieldCheck className="size-4"/> Admin Console</div><div className="mt-5 flex-1">{nav}</div><p className="border-t border-[var(--line)] pt-4 text-sm font-semibold">{user.name}<span className="block font-mono text-xs text-[var(--ink-soft)]">{user.username}</span></p></aside><Drawer open={open} title={language === 'ar' ? 'لوحة الإدارة' : 'Admin Console'} onClose={() => setOpen(false)}>{nav}</Drawer><div className="min-w-0 flex-1"><header className="app-header"><Button variant="ghost" size="sm" className="lg:hidden" aria-label="Open admin navigation" onClick={() => setOpen(true)}><Menu className="size-5"/></Button><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{language === 'ar' ? 'إدارة النظام' : 'System Administration'}</p><p className="text-xs text-[var(--ink-soft)]">{user.name}</p></div><Button variant="secondary" size="sm" onClick={toggleLanguage}><Languages className="size-4"/>{language === 'ar' ? 'EN' : 'عربي'}</Button><Button variant="ghost" size="sm" onClick={logout} aria-label="Log out"><LogOut className="size-4"/></Button></header><main className="app-content">{children}</main></div></div>;
}
