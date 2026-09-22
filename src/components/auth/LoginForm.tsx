'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { User, ShieldAlert, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';
import type { UserSessionPayload } from '@/lib/auth';

interface LoginFormProps {
  onSuccess: (user: UserSessionPayload) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { language } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lockoutMsg, setLockoutMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl w-full max-w-md sm:max-w-lg lg:max-w-xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-xl animate-fade-in">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 lg:w-44 lg:h-44 mb-3 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="REP TRACK - Sunny Medical Group"
              width={200}
              height={200}
              priority
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          <p className="text-xs sm:text-sm lg:text-base font-black text-[var(--gold-dark)] tracking-wider uppercase mb-1">
            Sunny Medical Group
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--ink)] tracking-tight">
            {language === 'ar' ? 'بوابة تسجيل الدخول الموحدة' : 'Unified Access Portal'}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-[var(--ink-soft)] mt-2 max-w-sm sm:max-w-md leading-relaxed">
            {language === 'ar'
              ? 'أدخل بيانات حسابك للوصول إلى مساحة العمل الخاصة بموقعك الوظيفي'
              : 'Sign in to access your position-aware workspace'}
          </p>
        </div>

        {lockoutMsg && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 sm:p-4 mb-5 text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>{lockoutMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 sm:p-4 mb-5 text-xs sm:text-sm font-bold text-red-500 flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-[var(--ink)] mb-2">
              {language === 'ar' ? 'اسم المستخدم' : 'Username'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={language === 'ar' ? 'اسم المستخدم' : 'Username'}
                disabled={loading}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 text-base bg-white dark:bg-zinc-900 border border-[var(--line)] rounded-2xl text-[var(--ink)] placeholder:text-[var(--ink-muted)] shadow-xs transition-all focus:outline-none focus:border-[var(--gold)] focus:ring-4 focus:ring-[var(--gold)]/15"
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[var(--ink)] mb-2">
              {language === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
                disabled={loading}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 pe-12 sm:pe-14 text-base bg-white dark:bg-zinc-900 border border-[var(--line)] rounded-2xl text-[var(--ink)] placeholder:text-[var(--ink-muted)] shadow-xs transition-all focus:outline-none focus:border-[var(--gold)] focus:ring-4 focus:ring-[var(--gold)]/15"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute end-3.5 sm:end-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full mt-2 py-3.5 sm:py-4 text-base sm:text-lg font-black rounded-2xl shadow-gold hover:shadow-lg transition-all"
          >
            {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
