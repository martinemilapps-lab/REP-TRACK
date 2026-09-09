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
import { ManagerWorkspace, ManagerNavType } from '@/components/workspace/ManagerWorkspace';
import { AppShell, ShellNavItem } from '@/components/layout/AppShell';
import { BarChart3, ClipboardList, FileText, CalendarDays, ListChecks, PackageSearch, Download, LayoutDashboard, Activity, Users, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';
import type { UserSessionPayload } from '@/lib/auth';

function HomePageContent() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get('view');
  const initialView = (requestedView === 'admin' ? 'overview' : requestedView as MRViewType) || 'overview';

  const [activeView, setActiveView] = useState<MRViewType>(initialView);
  const [managerView, setManagerView] = useState<ManagerNavType>(requestedView === 'admin' ? 'admin' : 'overview');
  const [reps, setReps] = useState<Representative[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSessionPayload | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

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
    const timer = window.setTimeout(loadAppState, 0);
    return () => window.clearTimeout(timer);
  }, [loadAppState]);

  useEffect(() => {
    if (!currentUser || currentUser.mustChangePassword) return;
    fetch('/api/reps').then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.reps) setReps(data.reps);
    }).catch(() => undefined);
  }, [currentUser]);

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

  const handleLoginSuccess = (user: UserSessionPayload) => {
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
  const mrItems: ShellNavItem[] = [
    { id:'overview', label: language === 'ar' ? 'نظرة عامة' : 'Overview', icon:<LayoutDashboard className="size-4"/> },
    { id:'submit', label: language === 'ar' ? 'تسجيل تقرير' : 'Submit Report', icon:<ClipboardList className="size-4"/> },
    { id:'myreports', label: language === 'ar' ? 'تقاريري' : 'My Reports', icon:<FileText className="size-4"/> },
    { id:'weeklyplan', label: language === 'ar' ? 'الخطة الأسبوعية' : 'Weekly Plan', icon:<CalendarDays className="size-4"/> },
    { id:'mylists', label: language === 'ar' ? 'قوائمي' : 'My Lists', icon:<ListChecks className="size-4"/> },
    { id:'analysis', label: language === 'ar' ? 'توافر المنتجات' : 'Product Availability', icon:<PackageSearch className="size-4"/> },
    { id:'export', label:language==='ar'?'تصدير':'Export', icon:<Download className="size-4"/> },
  ];
  const managerItems: ShellNavItem[] = [
    { id:'overview', label: language === 'ar' ? 'نظرة عامة' : 'Overview', icon:<LayoutDashboard className="size-4"/> },
    { id:'team_reports', label: language === 'ar' ? 'تقارير الفريق' : 'Team Reports', icon:<Users className="size-4"/> },
    { id:'submit_activity', label:language==='ar'?'تسجيل نشاط':'Submit Activity', icon:<Activity className="size-4"/> },
    { id:'my_reports', label:language==='ar'?'تقاريري':'My Reports', icon:<FileText className="size-4"/> },
    { id:'weekly_plan', label:language==='ar'?'خطتي الأسبوعية':'My Weekly Plan', icon:<CalendarDays className="size-4"/> },
    { id:'team_plans', label:language==='ar'?'خطط الفريق':'Team Plans', icon:<ClipboardList className="size-4"/> },
    { id:'team_lists', label:language==='ar'?'قوائم الفريق':'Team Lists', icon:<Users className="size-4"/> },
    { id:'product_analysis', label:language==='ar'?'توافر المنتجات':'Product Availability', icon:<BarChart3 className="size-4"/> },
    { id:'export', label:language==='ar'?'تصدير':'Export', icon:<Download className="size-4"/> },
    ...(currentUser?.systemRole === 'ADMIN' ? [{ id:'admin', label:language==='ar'?'الإدارة':'Admin', icon:<ShieldCheck className="size-4"/> }] : []),
  ];

  return (
    <main>

      {/* Mandatory First-Login Password Change Modal */}
      {currentUser && mustChangePassword && (
        <ChangePasswordModal
          username={currentUser?.username}
          onSuccess={() => {
            setMustChangePassword(false);
            showToast(language==='ar'?'تم تحديث وتأمين كلمة المرور بنجاح':'Password updated successfully');
          }}
          onLogout={handleLogout}
        />
      )}

      {/* View Branching:
          1. Unauthenticated -> Show Login Form
          2. MR -> Medical Rep Workspace
          3. DM / AM / OM / BUM / PM / MM / SMD -> Manager Workspace
      */}
      {!currentUser ? <><Topbar/><LoginForm onSuccess={handleLoginSuccess} /></> : (
        <AppShell user={currentUser} items={currentUser.positionCode === 'MR' ? mrItems : managerItems} activeItem={currentUser.positionCode === 'MR' ? activeView : managerView} onNavigate={(id) => { if (currentUser.positionCode === 'MR') setActiveView(id as MRViewType); else setManagerView(id as ManagerNavType); }} onLogout={handleLogout}>
        {currentUser.positionCode === 'MR' ? <MedicalRepWorkspace
          currentUser={currentUser}
          activeView={activeView}
          onViewChange={setActiveView}
          reps={reps}
          onShowToast={showToast}
          embedded
        /> : <ManagerWorkspace
          currentUser={currentUser}
          reps={reps}
          onShowToast={showToast}
          onLogout={handleLogout}
          activeView={managerView}
          onViewChange={setManagerView}
          embedded
        />}
        </AppShell>
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
