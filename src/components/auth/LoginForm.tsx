'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Lock, User, ShieldAlert, KeyRound } from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';

interface LoginFormProps {
  onSuccess: (user: any) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { t, language } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lockoutMsg, setLockoutMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter username and password');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setLockoutMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess(data.user);
      } else {
        if (res.status === 429) {
          setLockoutMsg(data.message || (language === 'ar' ? 'تم قفل الحساب مؤقتاً بسبب تكرار المحاولات الخاطئة' : 'Account temporarily locked due to repeated failed attempts'));
        } else {
          setErrorMsg(data.message || (language === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password'));
        }
        setPassword('');
      }
    } catch {
      setErrorMsg(language === 'ar' ? 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.' : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl max-w-md w-full p-6 md:p-8 shadow-card animate-fade-in">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-56 h-28 md:w-64 md:h-32 mb-2 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="REP TRACK - Sunny Medical Group"
              width={280}
              height={140}
              priority
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          <p className="text-xs sm:text-sm font-black text-[var(--gold-dark)] tracking-wider uppercase mb-1">
            Sunny Medical Group
          </p>
          <h1 className="text-xl md:text-2xl font-black text-[var(--ink)]">
            {language === 'ar' ? 'بوابة تسجيل الدخول الموحدة' : 'Unified Access Portal'}
          </h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1.5 max-w-xs leading-relaxed">
            {language === 'ar'
              ? 'أدخل بيانات حسابك للوصول إلى مساحة العمل الخاصة بموقعك الوظيفي'
              : 'Sign in to access your position-aware workspace'}
          </p>
        </div>

        {lockoutMsg && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{lockoutMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-xs font-bold text-red-500 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
              {language === 'ar' ? 'اسم المستخدم' : 'Username'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: MR1 أو DM1 أو SMD1' : 'e.g. MR1, DM1, SMD1'}
                disabled={loading}
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-[var(--line)] rounded-xl font-mono text-[var(--ink)] placeholder-[var(--ink-muted)] shadow-2xs transition-all focus:outline-none focus:border-[var(--gold)]"
                autoFocus
                autoComplete="username"
              />
              <User className="w-4 h-4 absolute left-3 top-3 text-[var(--ink-muted)] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
              {language === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={loading}
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-[var(--line)] rounded-xl font-mono text-[var(--ink)] placeholder-[var(--ink-muted)] shadow-2xs transition-all focus:outline-none focus:border-[var(--gold)]"
                autoComplete="current-password"
              />
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-[var(--ink-muted)] pointer-events-none" />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            className="w-full mt-2"
          >
            {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--line)] text-center">
          <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
            {language === 'ar'
              ? 'للحصول على كلمة المرور المؤقتة أو إعادة التعيين، يرجى التواصل مع إدارة النظام (SMD).'
              : 'For temporary credentials or account assistance, please contact executive administration (SMD).'}
          </p>
        </div>
      </div>
    </div>
  );
}
