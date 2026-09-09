'use client';

import React, { useCallback, useState } from 'react';
import { Representative, WeeklyPlanRecord } from '@/types';
import { ManagerDashboardView } from '@/components/manager/ManagerDashboardView';
import { ManagerActivityForm } from '@/components/manager/ManagerActivityForm';
import { ManagerTeamPlansView } from '@/components/manager/ManagerTeamPlansView';
import { ManagerOverview } from '@/components/overview/ManagerOverview';
import { ManagerMyReportsView } from '@/components/manager/ManagerMyReportsView';
import { WeeklyPlanView } from '@/components/weekly-plan/WeeklyPlanView';
import { MyListsView } from '@/components/my-lists/MyListsView';
import { useTranslation } from '@/lib/i18nContext';
import {
  Download,
  Target,
  Award,
  Sparkles, ClipboardList, CalendarDays, FileText, Inbox, Users, PackageSearch, Info,
} from 'lucide-react';

export type ManagerNavType =
  | 'overview'
  | 'submit_activity'
  | 'weekly_plan'
  | 'my_reports'
  | 'team_reports'
  | 'team_plans'
  | 'team_lists'
  | 'product_analysis'
  | 'compliance'
  | 'export';

interface ManagerWorkspaceProps {
  currentUser: {
    id: string;
    name: string;
    username: string;
    positionCode?: string | null;
    systemRole?: string | null;
    hasPersonalSalesAssignment?: boolean;
    personalSalesAssignment?: {
      territoryName: string;
      titleRaw?: string;
    } | null;
  };
  reps: Representative[];
  onShowToast: (text: string, isError?: boolean) => void;
  onLogout: () => void;
  activeView?: ManagerNavType;
  onViewChange?: (view: ManagerNavType) => void;
  embedded?: boolean;
}

export function ManagerWorkspace({
  currentUser,
  reps,
  onShowToast,
  onLogout,
  activeView,
  onViewChange,
  embedded = false,
}: ManagerWorkspaceProps) {
  const { language } = useTranslation();
  const [internalNav, setInternalNav] = useState<ManagerNavType>('overview');
  const activeNav = activeView ?? internalNav;
  const setActiveNav = (view: ManagerNavType) => { setInternalNav(view); onViewChange?.(view); };
  const [selectedTeamRep, setSelectedTeamRep] = useState<string>('');

  const [selectedPlan, setSelectedPlan] = useState<WeeklyPlanRecord | null>(null);
  const showSuccess = useCallback((msg: string) => onShowToast(msg), [onShowToast]);
  const showError = useCallback((msg: string) => onShowToast(msg, true), [onShowToast]);

  const navItems = [
    { id: 'submit_activity', label: language === 'ar' ? 'تسجيل نشاط' : 'Submit Activity', icon: <ClipboardList className="size-4"/> },
    { id: 'weekly_plan', label: language === 'ar' ? 'خطتي الأسبوعية' : 'Weekly Plan', icon: <CalendarDays className="size-4"/> },
    { id: 'my_reports', label: language === 'ar' ? 'تقاريري الخاصة' : 'My Reports', icon: <FileText className="size-4"/> },
    { id: 'team_reports', label: language === 'ar' ? 'تقارير الفريق' : 'Received / Team Reports', icon: <Inbox className="size-4"/> },
    { id: 'team_plans', label: language === 'ar' ? 'خطط الفريق' : 'Team Plans', icon: <ClipboardList className="size-4"/> },
    { id: 'team_lists', label: language === 'ar' ? 'قوائم الفريق' : 'Team Lists', icon: <Users className="size-4"/> },
    { id: 'product_analysis', label: language === 'ar' ? 'توافر المنتجات' : 'Product Availability', icon: <PackageSearch className="size-4"/> },
    { id: 'compliance', label: language === 'ar' ? 'متابعة الالتزام' : 'Submission Compliance', icon: <Target className="size-4"/> },
    { id: 'export', label: language === 'ar' ? 'تصدير البيانات' : 'Export', icon: <Download className="size-4"/> },
  ];

  return (
    <div className="w-full animate-fade-in">
      {/* Position Header & Dual-Role Banner */}
      {!embedded && <><div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 mb-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-lg text-xs font-black bg-[var(--gold-tint)] text-[var(--gold-dark)] border border-[var(--gold-border)]">
              {currentUser.positionCode || 'MANAGER'}
            </span>
            <h1 className="text-base sm:text-lg font-black text-[var(--ink)]">
              {currentUser.name}
            </h1>
            <span className="font-mono text-xs font-bold text-[var(--ink-muted)]">
              ({currentUser.username})
            </span>
            {currentUser.hasPersonalSalesAssignment && currentUser.personalSalesAssignment && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <Award className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'مكلف بمبيعات ميدانية شخصية:' : 'Personal Sales Assignment:'} {currentUser.personalSalesAssignment.territoryName}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            {language === 'ar'
              ? 'مساحة العمل الإدارية والرقابية — الرؤية والتقارير محددة بنطاق الإشراف المعتمد'
              : 'Managerial & Executive Workspace — Scoped to your authorized organizational hierarchy'}
          </p>
        </div>

        <div className="text-xs font-bold text-[var(--ink-muted)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--gold-dark)]" />
          <span>{reps.length} {language === 'ar' ? 'مندوب متاح بالنظام' : 'Reps in System'}</span>
        </div>
      </div>

      {/* 9-Item Navigation Shell */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-1.5 mb-6 shadow-xs overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1 min-w-max">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'weekly_plan') setSelectedPlan(null);
                setActiveNav(item.id as ManagerNavType);
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                activeNav === item.id
                  ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs font-black'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div></>}

      {/* ============ NAVIGATION CONTENT ============ */}
      {activeNav === 'overview' && <ManagerOverview name={currentUser.name} position={currentUser.positionCode}/>}

      {/* 1. Submit Activity (Manager Activity Report: Visit, Event, Training, Office Working, Others) */}
      {activeNav === 'submit_activity' && (
        <div className="animate-fade-in space-y-4">
          {currentUser.hasPersonalSalesAssignment && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Info className="size-4"/>
                <span>
                  {language === 'ar'
                    ? `ملاحظة: أنت مكلف بمبيعات ميدانية لمنطقة (${currentUser.personalSalesAssignment?.territoryName}) بالإضافة لمسؤولياتك الإدارية.`
                    : `Note: You have personal sales assignment for (${currentUser.personalSalesAssignment?.territoryName}) alongside managerial duties.`}
                </span>
              </div>
            </div>
          )}

          <ManagerActivityForm
            currentUser={currentUser}
            onSuccess={showSuccess}
            onError={showError}
            onSubmitted={() => {
              setActiveNav('my_reports');
            }}
          />
        </div>
      )}

      {/* 2. Weekly Plan (Manager Personal Weekly Plan) */}
      {activeNav === 'weekly_plan' && (
        <div className="animate-fade-in">
          <WeeklyPlanView
            key={selectedPlan?.id ?? 'new-personal-plan'}
            initialPlan={selectedPlan}
            reps={reps}
            selectedRep={currentUser.name}
            isManager={true}
            isManagerPersonal={true}
            currentUser={currentUser}
            onSuccess={showSuccess}
            onError={showError}
          />
        </div>
      )}

      {/* 3. My Reports (Manager personal activities and weekly plans only) */}
      {activeNav === 'my_reports' && (
        <div className="animate-fade-in">
          <ManagerMyReportsView
            currentUser={currentUser}
            onOpenPlan={(plan) => {
              setSelectedPlan(plan);
              setActiveNav('weekly_plan');
            }}
            onSuccess={showSuccess}
            onError={showError}
          />
        </div>
      )}

      {/* 4. Received / Team Reports */}
      {activeNav === 'team_reports' && (
        <div className="animate-fade-in">
          <ManagerDashboardView
            reps={reps}
            onLock={onLogout}
            onError={showError}
            onSuccess={showSuccess}
          />
        </div>
      )}

      {activeNav === 'team_plans' && (
        <ManagerTeamPlansView onError={showError} />
      )}

      {/* 6. Team Lists */}
      {activeNav === 'team_lists' && (
        <div className="animate-fade-in">
          <MyListsView key={selectedTeamRep}
            reps={reps}
            selectedRep={selectedTeamRep}
            onSelectRep={(repName) => setSelectedTeamRep(repName)}
            readOnly={true}
          />
        </div>
      )}

      {/* 7. Product Analysis */}
      {activeNav === 'product_analysis' && (
        <ManagerDashboardView key="product-availability" reps={reps} initialTab="availability" onLock={onLogout} onError={showError} onSuccess={showSuccess}/>
      )}

      {activeNav==='compliance'&&<div className="section-card"><h2 className="font-semibold">{language==='ar'?'متابعة تقديم التقارير':'Submission tracking'}</h2><p className="mt-2 text-sm">{language==='ar'?'استعرض التقارير الفعلية من صفحة تقارير الفريق.':'Browse submitted records in Team Reports.'}</p><button type="button" className="mt-4 min-h-11 underline" onClick={()=>setActiveNav('team_reports')}>{language==='ar'?'عرض تقارير الفريق':'View Team Reports'}</button></div>}

      {/* 9. Export */}
      {activeNav === 'export' && (
        <div className="animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-8 shadow-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--gold-tint)] border border-[var(--gold-border)] flex items-center justify-center text-3xl mx-auto mb-4 text-[var(--gold-dark)]">
              <Download className="size-6"/>
            </div>
            <h2 className="text-lg font-black text-[var(--ink)] mb-2">
              {language === 'ar' ? 'تصدير تقارير وبيانات الفريق (Excel)' : 'Export Team Data & Workbooks'}
            </h2>
            <p className="text-xs text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed mb-6">
              {language === 'ar'
                ? 'تحميل ملف Excel متكامل يحتوي على كافة تقارير الزيارات، التوافر، الفعاليات، وخطط العمل الأسبوعية مصنفة حسب الشيتات الرسمية.'
                : 'Download complete consolidated Excel workbooks containing visits, availability, and weekly plans.'}
            </p>
            <a
              href="/api/export/excel"
              download
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white text-sm font-extrabold shadow-card hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'ar' ? 'تحميل شيت التقارير المجمع (.xlsx)' : 'Download Consolidated Excel (.xlsx)'}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
