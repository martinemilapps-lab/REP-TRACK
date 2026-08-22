'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Representative } from '@/types';
import { Topbar } from '@/components/layout/Topbar';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ManagerDashboardView } from '@/components/manager/ManagerDashboardView';
import { ManagerAuthGate } from '@/components/manager/ManagerAuthGate';
import { useTranslation } from '@/lib/i18nContext';

export default function AdminPage() {
  const { t } = useTranslation();
  const [reps, setReps] = useState<Representative[]>([]);
  const [isManagerUnlocked, setIsManagerUnlocked] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  useEffect(() => {
    async function initAdmin() {
      try {
        const [repsRes, sessionRes] = await Promise.all([
          fetch('/api/reps'),
          fetch('/api/auth/session'),
        ]);

        const repsData = await repsRes.json();
        if (repsData.reps) {
          setReps(repsData.reps);
        }

        const sessionData = await sessionRes.json();
        if (sessionData.authenticated && sessionData.user?.role === 'MANAGER') {
          setIsManagerUnlocked(true);
        }
      } catch (err) {
        console.error('Failed to initialize admin session:', err);
      } finally {
        setTimeout(() => {
          setInitialLoading(false);
        }, 400);
      }
    }

    initAdmin();
  }, []);

  const handleManagerUnlock = () => {
    setIsManagerUnlocked(true);
    showToast(t('msg.loginSuccess'));
  };

  const handleManagerLock = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setIsManagerUnlocked(false);
    showToast(t('msg.lockedSuccess'));
  };

  if (initialLoading) {
    return <LoadingScreen message={t('app.loading')} />;
  }

  return (
    <main className="max-w-[1240px] mx-auto px-4 py-5 md:py-8 transition-all">
      <Topbar
        activeView="dashboard"
        isManagerUnlocked={isManagerUnlocked}
        onLockManager={handleManagerLock}
      />

      <div className="animate-fade-in">
        {!isManagerUnlocked ? (
          <ManagerAuthGate
            onUnlock={handleManagerUnlock}
            onError={(msg) => showToast(msg, true)}
          />
        ) : (
          <ManagerDashboardView
            reps={reps}
            onLock={handleManagerLock}
            onError={(msg) => showToast(msg, true)}
            onSuccess={(msg) => showToast(msg)}
          />
        )}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  );
}
