'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Representative, ActivityType } from '@/types';
import { Topbar, ViewType } from '@/components/layout/Topbar';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { TypePicker } from '@/components/reports/TypePicker';
import { HospitalForm } from '@/components/reports/HospitalForm';
import { PharmacyForm } from '@/components/reports/PharmacyForm';
import { DoctorForm } from '@/components/reports/DoctorForm';
import { BranchForm } from '@/components/reports/BranchForm';
import { AvailabilityForm } from '@/components/reports/AvailabilityForm';
import { MyListsView } from '@/components/my-lists/MyListsView';
import { MyReportsView } from '@/components/my-reports/MyReportsView';
import { WeeklyPlanView } from '@/components/weekly-plan/WeeklyPlanView';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { useTranslation } from '@/lib/i18nContext';
import { INITIAL_REPRESENTATIVES } from '@/lib/constants';

function HomePageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const initialView = (searchParams.get('view') as ViewType) || 'submit';

  const [activeView, setActiveView] = useState<ViewType>(initialView);
  const [reps, setReps] = useState<Representative[]>(INITIAL_REPRESENTATIVES);
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ActivityType>('hospital');
  const [isManagerUnlocked, setIsManagerUnlocked] = useState(false);
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
    const viewParam = searchParams.get('view') as ViewType | null;
    if (viewParam && (viewParam === 'submit' || viewParam === 'mylists' || viewParam === 'myreports' || viewParam === 'weeklyplan')) {
      setActiveView(viewParam);
    }
  }, [searchParams]);

  // Fetch representatives and check manager session on initial load
  useEffect(() => {
    async function initApp() {
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
          if (sessionData.authenticated && sessionData.user?.role === 'MANAGER') {
            setIsManagerUnlocked(true);
          }
        }
      } catch (err) {
        console.error('Failed to initialize app state:', err);
      } finally {
        setTimeout(() => {
          setInitialLoading(false);
        }, 350);
      }
    }

    initApp();
  }, []);

  const handleManagerLock = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setIsManagerUnlocked(false);
    showToast(t('msg.lockedSuccess'));
  };

  const repOptions: SelectOption[] = useMemo(() => {
    return reps.map((r) => ({
      value: r.name,
      label: r.name,
      sublabel: r.area,
    }));
  }, [reps]);

  if (initialLoading) {
    return <LoadingScreen message={t('app.loading')} />;
  }

  return (
    <main className="max-w-[1240px] mx-auto px-4 py-5 md:py-8 transition-all">
      <Topbar
        activeView={activeView}
        onViewChange={setActiveView}
        isManagerUnlocked={isManagerUnlocked}
        onLockManager={handleManagerLock}
      />

      {/* ============ VIEW 1: SUBMIT REPORT ============ */}
      {activeView === 'submit' && (
        <div className="animate-fade-in">
          {/* Identity Selection */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 mb-4 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">👤</span>
              <h2 className="text-base font-extrabold text-[var(--ink)]">
                {t('rep.selector.title')}
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-soft)] mb-3.5 leading-relaxed">
              {t('rep.selector.desc')}
            </p>
            <div className="max-w-xs md:max-w-sm">
              <CustomSelect
                options={repOptions}
                value={selectedRep}
                onChange={setSelectedRep}
                placeholder={t('rep.selector.placeholder')}
                searchable={true}
              />
            </div>
          </div>

          {/* Activity Type Picker */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 mb-4 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📋</span>
              <h2 className="text-base font-extrabold text-[var(--ink)]">
                {t('activity.type.title')}
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-soft)] mb-3.5 leading-relaxed">
              {t('activity.type.desc')}
            </p>
            <TypePicker selectedType={selectedType} onSelect={setSelectedType} />
          </div>

          {/* Activity Forms */}
          {selectedType === 'hospital' && (
            <HospitalForm
              selectedRep={selectedRep}
              onSuccess={(msg) => showToast(msg)}
              onError={(msg) => showToast(msg, true)}
            />
          )}

          {selectedType === 'pharmacy' && (
            <PharmacyForm
              selectedRep={selectedRep}
              onSuccess={(msg) => showToast(msg)}
              onError={(msg) => showToast(msg, true)}
            />
          )}

          {selectedType === 'doctor' && (
            <DoctorForm
              selectedRep={selectedRep}
              onSuccess={(msg) => showToast(msg)}
              onError={(msg) => showToast(msg, true)}
            />
          )}

          {selectedType === 'branch' && (
            <BranchForm
              selectedRep={selectedRep}
              onSuccess={(msg) => showToast(msg)}
              onError={(msg) => showToast(msg, true)}
            />
          )}

          {selectedType === 'availability' && (
            <AvailabilityForm
              selectedRep={selectedRep}
              onSuccess={(msg) => showToast(msg)}
              onError={(msg) => showToast(msg, true)}
            />
          )}
        </div>
      )}

      {/* ============ VIEW 2: MY LISTS (MASTER CUSTOMER LISTS) ============ */}
      {activeView === 'mylists' && (
        <MyListsView
          reps={reps}
          selectedRep={selectedRep}
          onSelectRep={setSelectedRep}
        />
      )}

      {/* ============ VIEW 3: MY REPORTS ============ */}
      {activeView === 'myreports' && (
        <MyReportsView
          reps={reps}
          selectedRep={selectedRep}
          onSelectRep={setSelectedRep}
        />
      )}

      {/* ============ VIEW 4: WEEKLY PLAN ============ */}
      {activeView === 'weeklyplan' && (
        <WeeklyPlanView
          reps={reps}
          selectedRep={selectedRep}
          onSelectRep={setSelectedRep}
          onSuccess={(msg) => showToast(msg)}
          onError={(msg) => showToast(msg, true)}
        />
      )}

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomePageContent />
    </Suspense>
  );
}
