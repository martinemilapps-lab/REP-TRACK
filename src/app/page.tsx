'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Representative, ActivityType } from '@/types';
import { Topbar, ViewType } from '@/components/layout/Topbar';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { TypePicker } from '@/components/reports/TypePicker';
import { HospitalForm } from '@/components/reports/HospitalForm';
import { PharmacyForm } from '@/components/reports/PharmacyForm';
import { DoctorForm } from '@/components/reports/DoctorForm';
import { BranchForm } from '@/components/reports/BranchForm';
import { AvailabilityForm } from '@/components/reports/AvailabilityForm';
import { MyReportsView } from '@/components/my-reports/MyReportsView';
import { ManagerDashboardView } from '@/components/manager/ManagerDashboardView';
import { ManagerAuthGate } from '@/components/manager/ManagerAuthGate';

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>('submit');
  const [reps, setReps] = useState<Representative[]>([]);
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ActivityType>('hospital');
  const [isManagerUnlocked, setIsManagerUnlocked] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  // Fetch representatives
  useEffect(() => {
    async function loadReps() {
      try {
        const res = await fetch('/api/reps');
        const data = await res.json();
        if (data.reps) {
          setReps(data.reps);
        }
      } catch (err) {
        console.error('Failed to load reps list:', err);
      }
    }
    loadReps();

    // Check manager session
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated && data.user?.role === 'MANAGER') {
          setIsManagerUnlocked(true);
        }
      } catch (err) {
        console.error('Failed to check session:', err);
      }
    }
    checkSession();
  }, []);

  const handleManagerUnlock = () => {
    setIsManagerUnlocked(true);
    showToast('تم تسجيل الدخول بنجاح ✓');
  };

  const handleManagerLock = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setIsManagerUnlocked(false);
    showToast('تم قفل لوحة المدير');
  };

  return (
    <main className="max-w-[1180px] mx-auto px-4 py-5 md:py-7">
      <Topbar
        activeView={activeView}
        onViewChange={setActiveView}
        isManagerUnlocked={isManagerUnlocked}
      />

      {/* ============ VIEW 1: SUBMIT REPORT ============ */}
      {activeView === 'submit' && (
        <div>
          {/* Identity Selection */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 mb-4 shadow-xs">
            <h2 className="text-base font-bold text-[var(--ink)] mb-1">مين اللي بيبعت؟</h2>
            <p className="text-xs text-[var(--ink-soft)] mb-3.5">
              اختار اسمك، وهيتحفظ تلقائيًا مع كل زيارة تسجلها
            </p>
            <div className="max-w-xs">
              <select
                value={selectedRep}
                onChange={(e) => setSelectedRep(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)] font-medium"
              >
                <option value="">-- اختار اسمك --</option>
                {reps.map((r) => (
                  <option key={r.id || r.name} value={r.name}>
                    {r.name} — {r.area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Activity Type Picker */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 mb-4 shadow-xs">
            <h2 className="text-base font-bold text-[var(--ink)] mb-1">نوع الزيارة</h2>
            <p className="text-xs text-[var(--ink-soft)] mb-3.5">
              اختار نوع المكان اللي زرته وسجل بياناته زي ما هي في الشيت الأصلي
            </p>
            <TypePicker selectedType={selectedType} onSelect={setSelectedType} />
          </div>

          {/* Forms */}
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

      <Toast toast={toast} />
    </main>
  );
}
