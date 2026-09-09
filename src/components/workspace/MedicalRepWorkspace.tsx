'use client';

import React, { useState } from 'react';
import { Representative, ActivityType, VisitEntityType } from '@/types';
import { TypePicker } from '@/components/reports/TypePicker';
import { HospitalForm } from '@/components/reports/HospitalForm';
import { PharmacyForm } from '@/components/reports/PharmacyForm';
import { DoctorForm } from '@/components/reports/DoctorForm';
import { BranchForm } from '@/components/reports/BranchForm';
import { AvailabilityForm } from '@/components/reports/AvailabilityForm';
import { EventForm } from '@/components/reports/EventForm';
import { TrainingForm } from '@/components/reports/TrainingForm';
import { SpecialTaskForm } from '@/components/reports/SpecialTaskForm';
import { MyListsView } from '@/components/my-lists/MyListsView';
import { MyReportsView } from '@/components/my-reports/MyReportsView';
import { WeeklyPlanView } from '@/components/weekly-plan/WeeklyPlanView';
import { useTranslation } from '@/lib/i18nContext';
import { MapPin, User, CheckCircle2, ClipboardList, CalendarDays, PackageSearch } from 'lucide-react';
import { RepresentativeOverview } from '@/components/overview/RepresentativeOverview';
import { SalesAnalyticsView } from '@/components/sales/SalesAnalyticsView';
import { ExportCenter } from '@/components/exports/ExportCenter';

export type MRViewType = 'overview' | 'submit' | 'mylists' | 'myreports' | 'weeklyplan' | 'analysis' | 'export';

interface MedicalRepWorkspaceProps {
  currentUser: {
    id: string;
    name: string;
    username: string;
    repId?: string | null;
    positionCode?: string | null;
    primarySalesAssignment?: {
      territoryName: string;
      titleRaw?: string;
    } | null;
  };
  activeView: MRViewType;
  onViewChange: (view: MRViewType) => void;
  reps: Representative[];
  onShowToast: (text: string, isError?: boolean) => void;
  embedded?: boolean;
}
export function MedicalRepWorkspace({
  currentUser,
  activeView,
  onViewChange,
  reps,
  onShowToast,
  embedded = false,
}: MedicalRepWorkspaceProps) {
  const { t, language } = useTranslation();
  const [selectedType, setSelectedType] = useState<ActivityType>('hospital');
  const [visitSubtype, setVisitSubtype] = useState<VisitEntityType>('hospital');

  const repName = currentUser.name;
  const territory = currentUser.primarySalesAssignment?.territoryName || (language === 'ar' ? 'المنطقة المخصصة' : 'Assigned Territory');

  return (
    <div className="w-full animate-fade-in">
      {/* Sub-header: Server-Authoritative Identity Pill (No dropdown) */}
      {!embedded && <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--gold-tint)] border border-[var(--gold-border)] flex items-center justify-center text-[var(--gold-dark)] font-black text-base">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-extrabold text-[var(--ink)]">
                {repName}
              </h2>
              <span className="font-mono text-xs font-bold text-[var(--gold-dark)] bg-[var(--gold-tint)] px-2 py-0.5 rounded-md">
                {currentUser.username}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{language === 'ar' ? 'حساب معتمد' : 'Verified Rep'}</span>
              </span>
            </div>
            <p className="text-xs text-[var(--ink-soft)] font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
              <span>{territory}</span>
            </p>
          </div>
        </div>

        {/* Workspace Views Navigation Pills */}
        <nav className="flex gap-1.5 bg-[var(--surface-muted)] p-1 rounded-xl border border-[var(--line)] flex-wrap justify-center">
          <button
            onClick={() => onViewChange('submit')}
            className={`px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeView === 'submit'
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs font-extrabold'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {t('nav.submit')}
          </button>
          <button
            onClick={() => onViewChange('mylists')}
            className={`px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'mylists'
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs font-extrabold'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <ClipboardList className="size-4"/>
            <span>{t('nav.myLists')}</span>
          </button>
          <button
            onClick={() => onViewChange('myreports')}
            className={`px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeView === 'myreports'
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs font-extrabold'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {t('nav.myReports')}
          </button>
          <button
            onClick={() => onViewChange('weeklyplan')}
            className={`px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'weeklyplan'
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs font-extrabold'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <CalendarDays className="size-4"/>
            <span>{t('nav.weeklyPlan')}</span>
          </button>
          <button
            onClick={() => onViewChange('analysis')}
            className={`px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'analysis'
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs font-extrabold'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <PackageSearch className="size-4"/>
            <span>{language === 'ar' ? 'تحليل المنتجات' : 'Product Analysis'}</span>
          </button>
        </nav>
      </div>}

      {/* ============ VIEW 1: SUBMIT REPORT ============ */}
      {activeView === 'overview' && <RepresentativeOverview user={currentUser} onNavigate={onViewChange}/>}
      {activeView === 'submit' && (
        <div className="animate-fade-in">
          {/* Activity Type Picker */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 mb-4 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="size-5"/>
              <h2 className="text-base font-extrabold text-[var(--ink)]">
                {t('activity.type.title')}
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-soft)] mb-3.5 leading-relaxed">
              {t('activity.type.desc')}
            </p>
            <TypePicker
              selectedType={selectedType}
              onSelect={setSelectedType}
              visitSubtype={visitSubtype}
              onSelectVisitSubtype={setVisitSubtype}
            />
          </div>

          {/* Forms */}
          {(selectedType === 'hospital' || (selectedType === 'visit' && visitSubtype === 'hospital')) && (
            <HospitalForm
              selectedRep={repName}
              onSuccess={(msg) => onShowToast(msg)}
              onError={(msg) => onShowToast(msg, true)}
            />
          )}

          {(selectedType === 'pharmacy' || (selectedType === 'visit' && visitSubtype === 'pharmacy')) && (
            <PharmacyForm
              selectedRep={repName}
              onSuccess={(msg) => onShowToast(msg)}
              onError={(msg) => onShowToast(msg, true)}
            />
          )}

          {(selectedType === 'doctor' || (selectedType === 'visit' && visitSubtype === 'doctor')) && (
            <DoctorForm
              selectedRep={repName}
              onSuccess={(msg) => onShowToast(msg)}
              onError={(msg) => onShowToast(msg, true)}
            />
          )}

          {(selectedType === 'branch' || (selectedType === 'visit' && visitSubtype === 'branch')) && (
            <BranchForm
              selectedRep={repName}
              onSuccess={(msg) => onShowToast(msg)}
              onError={(msg) => onShowToast(msg, true)}
            />
          )}

          {selectedType === 'event' && (
            <EventForm
              selectedRep={repName}
              onSuccess={(msg) => onShowToast(msg)}
              onError={(msg) => onShowToast(msg, true)}
            />
          )}

          {selectedType === 'training' && (
            <TrainingForm
              selectedRep={repName}
              onSuccess={(msg) => onShowToast(msg)}
              onError={(msg) => onShowToast(msg, true)}
            />
          )}

          {selectedType === 'special_task' && (
            <SpecialTaskForm
              selectedRep={repName}
              onSuccess={(msg) => onShowToast(msg)}
              onError={(msg) => onShowToast(msg, true)}
            />
          )}

          {(selectedType === 'availability' || selectedType === 'product_analysis') && (
            <AvailabilityForm
              onSuccess={(msg) => onShowToast(msg)}
              onError={(msg) => onShowToast(msg, true)}
            />
          )}
        </div>
      )}

      {/* ============ VIEW 2: MY LISTS ============ */}
      {activeView === 'mylists' && (
        <div className="animate-fade-in">
          <MyListsView
            reps={reps}
            selectedRep={repName}
          />
        </div>
      )}

      {/* ============ VIEW 3: MY REPORTS ============ */}
      {activeView === 'myreports' && (
        <div className="animate-fade-in">
          <MyReportsView />
        </div>
      )}

      {/* ============ VIEW 4: WEEKLY PLAN ============ */}
      {activeView === 'weeklyplan' && (
        <div className="animate-fade-in">
          <WeeklyPlanView
            reps={reps}
            selectedRep={repName}
            onSuccess={(msg) => onShowToast(msg)}
            onError={(msg) => onShowToast(msg, true)}
          />
        </div>
      )}

      {/* ============ VIEW 5: PRODUCT ANALYSIS ============ */}
      {activeView === 'analysis' && (
        <div className="animate-fade-in space-y-6">
          <SalesAnalyticsView />
          <div className="border-t border-[var(--line)] pt-6"><h2 className="mb-3 text-lg font-black">{language==='ar'?'تسجيل التوافر':'Availability entry'}</h2>
          <AvailabilityForm
            onSuccess={(msg) => onShowToast(msg)}
            onError={(msg) => onShowToast(msg, true)}
          />
          </div>
        </div>
      )}
      {activeView === 'export' && <ExportCenter reps={reps}/>}
    </div>
  );
}
