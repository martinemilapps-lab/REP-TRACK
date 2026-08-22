'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { MyReportsView } from '@/components/my-reports/MyReportsView';
import { ManagerDashboardView } from '@/components/manager/ManagerDashboardView';
import { ManagerAuthGate } from '@/components/manager/ManagerAuthGate';
import { useTranslation } from '@/lib/i18nContext';

export default function Home() {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<ViewType>('submit');
  const [reps, setReps] = useState<Representative[]>([]);
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

  // Fetch representatives and check manager session on initial load
  useEffect(() => {
    async function initApp() {
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
        console.error('Failed to initialize app state:', err);
      } finally {
        // Guarantee branded loading presentation
        setTimeout(() => {
          setInitialLoading(false);
        }, 500);
      }
    }

    initApp();
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
            <div className="max-w-xs">
              <select
                value={selectedRep}
                onChange={(e) => setSelectedRep(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] shadow-2xs transition-all"
              >
                <option value="">{t('rep.selector.placeholder')}</option>
                {reps.map((r) => (
                  <option key={r.id || r.name} value={r.name}>
                    {r.name} — {r.area}
                  </option>
                ))}
              </select>
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

      {/* ============ VIEW 2: MY REPORTS ============ */}
      {activeView === 'myreports' && (
        <MyReportsView
          reps={reps}
          selectedRep={selectedRep}
          onSelectRep={setSelectedRep}
        />
      )}

      {/* ============ VIEW 3: MANAGER DASHBOARD ============ */}
      {activeView === 'dashboard' && (
        <div>
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
      )}

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  );
}
