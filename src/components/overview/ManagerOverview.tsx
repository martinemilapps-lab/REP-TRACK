'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import {
  Activity,
  CalendarDays,
  FileText,
  Users,
  ShieldCheck,
  Crown,
  MapPin,
  CheckCircle2,
  Info,
  Building2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { InlineAlert } from '@/components/ui/InlineAlert';

const TITLE_NAMES: Record<string, { en: string; ar: string }> = {
  MR: { en: 'Medical Representative', ar: 'مندوب دعاية طبية' },
  DM: { en: 'District Manager', ar: 'مدير منطقة' },
  AM: { en: 'Area Manager', ar: 'مدير إقليمي' },
  OM: { en: 'Operation Manager', ar: 'مدير عمليات' },
  BUM: { en: 'Business Unit Manager', ar: 'مدير وحدة أعمال' },
  PM: { en: 'Product Manager', ar: 'مدير منتج' },
  MM: { en: 'Marketing Manager', ar: 'مدير تسويق' },
  SMD: { en: 'Senior Managing Director', ar: 'المدير العام التنفيذي' },
};

interface ManagerOverviewProps {
  name: string;
  position?: string | null;
  directSupervisor?: {
    id: string;
    name: string;
    positionCode: string | null;
  } | null;
}

interface ScopedRep {
  id: string;
  name: string;
  area: string;
}

interface SubordinateUser {
  id: string;
  name: string;
  username: string;
  positionCode: string | null;
  role: string;
  repId: string | null;
  territoryName: string | null;
}

export function ManagerOverview({ name, position, directSupervisor }: ManagerOverviewProps) {
  const { language } = useTranslation();
  const ar = language === 'ar';

  const [state, setState] = useState<{
    loading: boolean;
    error: boolean;
    reps: ScopedRep[];
    subordinateUsers: SubordinateUser[];
    reports: number;
    activities: number;
    plans: number;
  }>({
    loading: true,
    error: false,
    reps: [],
    subordinateUsers: [],
    reports: 0,
    activities: 0,
    plans: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch('/api/reports', { signal: controller.signal }),
      fetch('/api/weekly-plans?team=true&scopeMode=ALL_DESCENDANTS', { signal: controller.signal }),
    ])
      .then(async ([repRes, planRes]) => {
        if (!repRes.ok || !planRes.ok) throw new Error('Failed to load overview data');
        const reportData = await repRes.json();
        const planData = await planRes.json();

        const totalReports = [
          'hospitals',
          'pharmacies',
          'doctors',
          'branches',
          'availabilities',
          'events',
          'trainings',
          'specialTasks',
        ].reduce((acc, key) => acc + (reportData[key]?.length || 0), 0);

        setState({
          loading: false,
          error: false,
          reps: reportData.reps || [],
          subordinateUsers: reportData.subordinateUsers || [],
          reports: totalReports,
          activities: reportData.managerActivities?.length || 0,
          plans: planData.plans?.length || 0,
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState((prev) => ({ ...prev, loading: false, error: true }));
        }
      });

    return () => controller.abort();
  }, []);

  const titleMeta = position ? TITLE_NAMES[position] : null;
  const canonicalTitle = titleMeta ? (ar ? titleMeta.ar : titleMeta.en) : position || (ar ? 'مدير' : 'Manager');

  // Segregate subordinate users into subordinate managers and subordinate reps
  const subordinateManagers = state.subordinateUsers.filter(
    (u) => u.positionCode && u.positionCode !== 'MR'
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header with Canonical Title & Reporting Supervisor */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title={`${ar ? 'مرحباً،' : 'Welcome,'} ${name}`}
          description={`${position ? `${position} — ${canonicalTitle}` : (ar ? 'مدير' : 'Manager')} · ${
            ar ? 'نظرة عامة ضمن نطاق الإشراف الهيكلي المعتمد' : 'Authorized organizational hierarchy scope'
          }`}
        />

        {/* Supervisor / Leadership Status Badge */}
        {directSupervisor ? (
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--line)] shadow-2xs self-start md:self-center">
            <ShieldCheck className="size-4 text-[var(--gold)] shrink-0" />
            <div className="text-xs">
              <span className="text-[var(--ink-muted)] block sm:inline">
                {ar ? 'المشرف المباشر:' : 'Direct Supervisor:'}{' '}
              </span>
              <strong className="font-extrabold text-[var(--ink)]">{directSupervisor.name}</strong>
              {directSupervisor.positionCode && (
                <span className="ms-1.5 px-2 py-0.5 rounded text-[10px] font-black bg-[var(--gold-tint)] text-[var(--gold-dark)] border border-[var(--gold-border)]">
                  {directSupervisor.positionCode}
                </span>
              )}
            </div>
          </div>
        ) : position === 'SMD' ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold self-start md:self-center">
            <Crown className="size-4 text-emerald-600" />
            <span>{ar ? 'الإدارة التنفيذية العليا' : 'Executive Leadership Level'}</span>
          </div>
        ) : null}
      </div>

      {state.error && (
        <InlineAlert tone="error">
          {ar ? 'تعذر تحميل بيانات النظرة العامة للفريق.' : 'Unable to load hierarchy overview data.'}
        </InlineAlert>
      )}

      {/* 4 Core Metric Cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {state.loading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 sm:h-36 rounded-2xl" />)
        ) : (
          <>
            <SectionCard title={ar ? 'مندوبو الفريق المصرح بهم' : 'Authorized team reps'} className="p-5 sm:p-6">
              <Metric
                icon={<Users />}
                value={state.reps.length}
                subtitle={ar ? 'مندوب معتمد ضمن نطاقك' : 'Active reps under structural scope'}
              />
            </SectionCard>

            <SectionCard title={ar ? 'تقارير المندوبين' : 'MR reports'} className="p-5 sm:p-6">
              <Metric
                icon={<FileText />}
                value={state.reports}
                subtitle={ar ? 'إجمالي الزيارات والأنشطة' : 'Total submitted visits & activities'}
              />
            </SectionCard>

            <SectionCard title={ar ? 'أنشطة الإدارة' : 'Manager activities'} className="p-5 sm:p-6">
              <Metric
                icon={<Activity />}
                value={state.activities}
                subtitle={ar ? 'الزيارات المشتركة والفعاليات' : 'Dual visits, events, and coaching'}
              />
            </SectionCard>

            <SectionCard title={ar ? 'خطط الفريق' : 'Team plans'} className="p-5 sm:p-6">
              <Metric
                icon={<CalendarDays />}
                value={state.plans}
                subtitle={ar ? 'الخطط الأسبوعية المسجلة' : 'Submitted weekly plans'}
              />
            </SectionCard>
          </>
        )}
      </div>

      {/* Authorized Hierarchy Team Roster & Scoped Territories */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-[var(--gold-dark)]" />
            <h2 className="text-base sm:text-lg font-black text-[var(--ink)]">
              {ar ? 'فريق العمل ونطاق التغطية المعتمد' : 'Authorized Team Roster & Coverage Scope'}
            </h2>
          </div>
          <span className="text-xs font-bold text-[var(--ink-muted)]">
            {state.reps.length} {ar ? 'مندوب مسند' : 'Assigned Rep(s)'}
          </span>
        </div>

        {state.loading ? (
          <Skeleton className="h-44 rounded-2xl" />
        ) : state.reps.length > 0 ? (
          <div className="space-y-4">
            {/* If manager supervises other managers (BUM or SMD), show subordinate managers */}
            {subordinateManagers.length > 0 && (
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 shadow-xs">
                <h3 className="text-xs sm:text-sm font-extrabold text-[var(--ink)] mb-3 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[var(--gold)]" />
                  <span>{ar ? 'المديرون الخاضعون للإشراف المباشر وغير المباشر:' : 'Subordinate Managers:'}</span>
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {subordinateManagers.map((mgr) => (
                    <div
                      key={mgr.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--line)] text-xs font-bold text-[var(--ink)]"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{mgr.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[var(--gold-tint)] text-[var(--gold-dark)] border border-[var(--gold-border)]">
                        {mgr.positionCode}
                      </span>
                      {mgr.territoryName && (
                        <span className="text-[11px] text-[var(--ink-soft)] font-medium">({mgr.territoryName})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reps Roster Cards / Table */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {state.reps.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-xs hover:border-[var(--gold-border)] transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-[var(--ink)]">{rep.name}</h4>
                      <p className="text-xs text-[var(--ink-soft)] flex items-center gap-1.5 mt-1 font-medium">
                        <MapPin className="size-3.5 text-[var(--gold-dark)] shrink-0" />
                        <span className="truncate">{rep.area || (ar ? 'منطقة غير محددة' : 'Unspecified Territory')}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[var(--gold-tint)] text-[var(--gold-dark)] border border-[var(--gold-border)] shrink-0">
                      MR
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 className="size-3" />
                      <span>{ar ? 'معتمد بالهيكل' : 'Verified in Scope'}</span>
                    </span>
                    <span className="font-mono text-[10px]">{ar ? 'مندوب دعاية' : 'Medical Rep'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State: Zero Subordinates (e.g. Michael Antonyo - AM) */
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-8 text-center shadow-xs">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--gold-tint)] border border-[var(--gold-border)] flex items-center justify-center text-[var(--gold-dark)] mb-3">
              <Users className="size-6" />
            </div>
            <h3 className="text-base font-extrabold text-[var(--ink)]">
              {ar ? 'لا يوجد مندوبون مسندون لهذا المنصب حالياً' : 'No Subordinate Reps Currently Assigned'}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-md mx-auto mt-1 font-medium">
              {ar
                ? 'وفقاً للهيكل التنظيمي المعتمد في الشركة، لا توجد سجلات تابعة مباشرة لهذا الحساب في الوقت الراهن.'
                : 'According to the authorized company organizational hierarchy, this position currently operates without subordinate representatives.'}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
              <Info className="size-3.5" />
              <span>{ar ? 'الهيكل معتمد ومحدث مع قاعدة البيانات الرسمية' : 'Hierarchy Verified & Synced with Database'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ icon, value, subtitle }: { icon: React.ReactNode; value: number; subtitle?: string }) {
  return (
    <div>
      <div className="mt-3 flex items-center justify-between">
        <span className="[&>svg]:size-6 sm:[&>svg]:size-7 text-[var(--gold)] p-2.5 rounded-xl bg-[var(--gold-tint)] border border-[var(--gold-border)]">
          {icon}
        </span>
        <strong className="text-3xl sm:text-4xl lg:text-5xl tabular-nums font-black text-[var(--ink)]">
          {value}
        </strong>
      </div>
      {subtitle && <p className="text-xs text-[var(--ink-soft)] font-medium mt-2">{subtitle}</p>}
    </div>
  );
}
