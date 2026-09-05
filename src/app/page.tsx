'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Representative } from '@/types';
import { Topbar } from '@/components/layout/Topbar';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { LoginForm } from '@/components/auth/LoginForm';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { MedicalRepWorkspace, MRViewType } from '@/components/workspace/MedicalRepWorkspace';
import { ManagerWorkspace } from '@/components/workspace/ManagerWorkspace';
import { useTranslation } from '@/lib/i18nContext';
import { INITIAL_REPRESENTATIVES } from '@/lib/constants';

function HomePageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const initialView = (searchParams.get('view') as MRViewType) || 'submit';

  const [activeView, setActiveView] = useState<MRViewType>(initialView);
  const [reps, setReps] = useState<Representative[]>(INITIAL_REPRESENTATIVES);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  // Sync view from query param if changed
  useEffect(() => {
    const viewParam = searchParams.get('view') as MRViewType | null;
    if (viewParam && (viewParam === 'submit' || viewParam === 'mylists' || viewParam === 'myreports' || viewParam === 'weeklyplan' || viewParam === 'analysis')) {
      setActiveView(viewParam);
    }
  }, [searchParams]);

  // Fetch representatives and check user session on initial load
  const loadAppState = useCallback(async () => {
    try {
      const [repsRes, sessionRes] = await Promise.all([
        fetch('/api/reps'),
        fetch('/api/auth/session'),
      ]);

      if (repsRes.ok) {
        const repsData = await repsRes.json();
        if (repsData.reps && Array.isArray(repsData.reps) && repsData.reps.length > 0) {
          setReps(repsData.reps);
        }
      }

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated && sessionData.user) {
          setCurrentUser(sessionData.user);
          if (sessionData.user.mustChangePassword) {
            setMustChangePassword(true);
          }
        } else {
          setCurrentUser(null);
        }
      }
    } catch (err) {
      console.error('Failed to initialize app state:', err);
    } finally {
      setTimeout(() => {
        setInitialLoading(false);
      }, 250);
    }
  }, []);

  useEffect(() => {
    loadAppState();
  }, [loadAppState]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setMustChangePassword(false);
    showToast(t('msg.lockedSuccess'));
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    if (user.mustChangePassword) {
      setMustChangePassword(true);
    }
    showToast(t('msg.loginSuccess'));
  };

  if (initialLoading) {
    return <LoadingScreen message={t('app.loading')} />;
  }

  // ----------------------------------------------------
  // UNIFIED ENTRY POINT LOGIC (STEP 17)
  // ----------------------------------------------------
  return (
    <main className="max-w-[1280px] mx-auto px-4 py-4 md:py-6 transition-all">
      {/* Position-Aware Header */}
      <Topbar
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Mandatory First-Login Password Change Modal */}
      {currentUser && mustChangePassword && (
        <ChangePasswordModal
          username={currentUser?.username}
          onSuccess={() => {
            setMustChangePassword(false);
            showToast('تم تحديث وتأمين كلمة المرور بنجاح');
          }}
          onLogout={handleLogout}
        />
      )}

      {/* View Branching:
          1. Unauthenticated -> Show Login Form
          2. MR -> Medical Rep Workspace
          3. DM / AM / OM / BUM / PM / MM / SMD -> Manager Workspace
      */}
      {!currentUser ? (
        <LoginForm onSuccess={handleLoginSuccess} />
      ) : currentUser.positionCode === 'MR' ? (
        <MedicalRepWorkspace
          currentUser={currentUser}
          activeView={activeView}
          onViewChange={setActiveView}
          reps={reps}
          onShowToast={showToast}
        />
      ) : (
        <ManagerWorkspace
          currentUser={currentUser}
          reps={reps}
          onShowToast={showToast}
          onLogout={handleLogout}
        />
      )}

      {/* Global Notification Toast */}
      {toast && (
        <Toast
          toast={toast}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen message="جارٍ التحميل..." />}>
      <HomePageContent />
    </Suspense>
  );
}
