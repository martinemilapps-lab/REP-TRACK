'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';

interface ManagerAuthGateProps {
  onUnlock: () => void;
  onError: (msg: string) => void;
}

export function ManagerAuthGate({ onUnlock, onError }: ManagerAuthGateProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      onError(t('auth.passwordPlaceholder'));
      return;
    }

    setLoading(true);
    setIsLockedOut(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onUnlock();
      } else {
        if (res.status === 429) {
          setIsLockedOut(true);
          onError(t('auth.lockoutWarning'));
        } else {
          onError(data.message || t('msg.errorGeneric'));
        }
        setPassword('');
      }
    } catch {
      onError(t('msg.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-lg)] p-6 md:p-8 max-w-md mx-auto shadow-card animate-fade-in">
      {/* Branded Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative w-36 h-14 mb-3">
          <Image
            src="/logo.png"
            alt="REP TRACK"
            width={160}
            height={60}
            className="object-contain"
          />
        </div>
        <div className="w-10 h-10 rounded-full bg-[var(--gold-tint)] border border-[var(--gold-border)] flex items-center justify-center text-lg mb-2 text-[var(--gold-dark)] shadow-2xs">
          🔒
        </div>
        <h2 className="text-base md:text-lg font-extrabold text-[var(--ink)]">
          {t('auth.title')}
        </h2>
        <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-xs leading-relaxed">
          {t('auth.desc')}
        </p>
      </div>

      {isLockedOut && (
        <div className="bg-[var(--overdue-bg)] border border-[var(--overdue-border)] rounded-xl p-3 mb-4 text-xs font-bold text-[var(--overdue-color)] leading-relaxed">
          ⚠️ {t('auth.lockoutWarning')}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
            disabled={loading}
            className="w-full px-4 py-3 text-sm bg-white border border-[var(--line)] rounded-xl font-mono text-[var(--ink)] placeholder-[var(--ink-muted)] shadow-2xs transition-all"
            autoFocus
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          className="w-full"
        >
          {t('auth.unlockBtn')}
        </Button>
      </form>
    </div>
  );
}
