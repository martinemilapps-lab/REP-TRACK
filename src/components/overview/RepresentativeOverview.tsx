'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { reportLabel } from '@/components/reports/ReportExplorer';
import {
  CalendarDays,
  FileText,
  ListChecks,
  MapPin,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Button } from '@/components/ui/Button';
import type { MRViewType } from '@/components/workspace/MedicalRepWorkspace';

interface RepresentativeOverviewProps {
  user: {
    name: string;
    positionCode?: string | null;
    primarySalesAssignment?: {
      territoryName: string;
    } | null;
    directSupervisor?: {
      id: string;
      name: string;
      positionCode: string | null;
    } | null;
  };
  onNavigate: (view: MRViewType) => void;
}

export function RepresentativeOverview({ user, onNavigate }: RepresentativeOverviewProps) {
  const { language } = useTranslation();
  const ar = language === 'ar';

  const [state, setState] = useState<{
    loading: boolean;
    error: boolean;
    reports: number;
    planStatus: string;
  }>({
    loading: true,
    error: false,
    reports: 0,
    planStatus: '—',
  });

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch('/api/reports', { signal: controller.signal }),
      fetch('/api/weekly-plans', { signal: controller.signal }),
    ])
      .then(async ([repRes, planRes]) => {
        if (!repRes.ok || !planRes.ok) throw new Error('Failed to load overview');
        const reports = await repRes.json();
        const plans = await planRes.json();
        const total = [
          'hospitals',
          'pharmacies',
          'doctors',
          'branches',
          'availabilities',
          'events',
          'trainings',
          'specialTasks',
        ].reduce((acc, key) => acc + (reports[key]?.length || 0), 0);

        setState({
          loading: false,
          error: false,
          reports: total,
          planStatus: plans.plans?.[0]?.status || 'No plan',
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState((s) => ({ ...s, loading: false, error: true }));
        }
      });

    return () => controller.abort();
  }, []);

  const territoryName =
    user.primarySalesAssignment?.territoryName || (ar ? 'المنطقة المخصصة' : 'Assigned Territory');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header with Direct Supervisor Badge */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title={`${ar ? 'مرحباً،' : 'Welcome,'} ${user.name}`}
          description={`${user.positionCode || 'MR'} — ${
            ar ? 'مندوب دعاية طبية' : 'Medical Representative'
          } · ${territoryName}`}
        />

        {user.directSupervisor && (
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--line)] shadow-2xs self-start md:self-center">
            <ShieldCheck className="size-4 text-[var(--gold)] shrink-0" />
            <div className="text-xs">
              <span className="text-[var(--ink-muted)] block sm:inline">
                {ar ? 'المشرف المباشر:' : 'Direct Supervisor:'}{' '}
              </span>
              <strong className="font-extrabold text-[var(--ink)]">{user.directSupervisor.name}</strong>
              {user.directSupervisor.positionCode && (
                <span className="ms-1.5 px-2 py-0.5 rounded text-[10px] font-black bg-[var(--gold-tint)] text-[var(--gold-dark)] border border-[var(--gold-border)]">
                  {user.directSupervisor.positionCode}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {state.error && (
        <InlineAlert tone="error">
          {ar ? 'تعذر تحميل أحدث بيانات النظرة العامة.' : 'Unable to load the latest overview data.'}
        </InlineAlert>
      )}

      {/* 4 Core Summary Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {state.loading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
        ) : (
          <>
            {/* Card 1: Submissions */}
            <SectionCard
              title={ar ? 'التقارير المسجلة' : 'Recent submissions'}
              className="flex flex-col justify-between p-5"
            >
              <div className="mt-2">
                <p className="text-4xl sm:text-5xl font-black text-[var(--gold-dark)] tracking-tight tabular-nums">
                  {state.reports}
                </p>
                <p className="text-xs text-[var(--ink-soft)] font-medium mt-1">
                  {ar ? 'إجمالي تقارير الزيارات والأنشطة' : 'Total submitted visits & activities'}
                </p>
              </div>
            </SectionCard>

            {/* Card 2: Weekly Plan */}
            <SectionCard
              title={ar ? 'الخطة الأسبوعية' : 'Weekly plan'}
              actions={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onNavigate('myweeklyplan')}
                  className="font-bold text-xs px-2.5 py-1 rounded-lg"
                >
                  {ar ? 'عرض' : 'View'}
                </Button>
              }
              className="flex flex-col justify-between p-5"
            >
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-black text-[var(--ink)] truncate">
                  {state.planStatus === 'No plan'
                    ? ar
                      ? 'لا توجد خطة'
                      : 'No plan'
                    : reportLabel(state.planStatus, ar)}
                </p>
                <p className="text-xs text-[var(--ink-soft)] font-medium mt-1">
                  {ar ? 'حالة الاعتماد للأسبوع الجاري' : 'Approval status for current week'}
                </p>
              </div>
            </SectionCard>

            {/* Card 3: Territory */}
            <SectionCard
              title={ar ? 'المنطقة المخصصة' : 'Territory'}
              className="flex flex-col justify-between p-5"
            >
              <div className="mt-2">
                <p className="flex items-center gap-1.5 text-base sm:text-lg font-bold text-[var(--ink)]">
                  <MapPin className="size-4 text-[var(--gold-dark)] shrink-0" />
                  <span className="truncate">{territoryName}</span>
                </p>
                <p className="text-xs text-[var(--ink-soft)] font-medium mt-1">
                  {ar ? 'النطاق الجغرافي المعتمد' : 'Authorized operating coverage'}
                </p>
              </div>
            </SectionCard>

            {/* Card 4: Direct Supervisor / Reporting Line */}
            <SectionCard
              title={ar ? 'المشرف المباشر' : 'Direct supervisor'}
              className="flex flex-col justify-between p-5"
            >
              <div className="mt-2">
                {user.directSupervisor ? (
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm sm:text-base font-extrabold text-[var(--ink)] truncate">
                        {user.directSupervisor.name}
                      </p>
                      {user.directSupervisor.positionCode && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[var(--gold-tint)] text-[var(--gold-dark)] border border-[var(--gold-border)]">
                          {user.directSupervisor.positionCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--ink-soft)] font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                      <span>{ar ? 'المسؤول الإداري المباشر' : 'Direct line supervisor'}</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm sm:text-base font-extrabold text-[var(--ink)]">
                      {ar ? 'الإدارة التنفيذية' : 'Executive Management'}
                    </p>
                    <p className="text-xs text-[var(--ink-soft)] font-medium mt-1">
                      {ar ? 'الإشراف المركزي المباشر' : 'Central executive oversight'}
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>
          </>
        )}
      </div>

      {/* Quick Actions Bar */}
      <SectionCard title={ar ? 'إجراءات سريعة' : 'Quick actions'} className="mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3">
          <Button
            onClick={() => onNavigate('submit')}
            leftIcon={<PlusCircle className="size-5" />}
            className="py-3 px-4 sm:px-5 text-sm sm:text-base font-extrabold rounded-xl shadow-xs"
          >
            {ar ? 'تسجيل تقرير' : 'Submit report'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate('weeklyplan')}
            leftIcon={<CalendarDays className="size-5" />}
            className="py-3 px-4 sm:px-5 text-sm sm:text-base font-bold rounded-xl"
          >
            {ar ? 'تسجيل خطة' : 'New plan'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate('myweeklyplan')}
            leftIcon={<CalendarDays className="size-5" />}
            className="py-3 px-4 sm:px-5 text-sm sm:text-base font-bold rounded-xl"
          >
            {ar ? 'خطتي الأسبوعية' : 'My weekly plan'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate('myreports')}
            leftIcon={<FileText className="size-5" />}
            className="py-3 px-4 sm:px-5 text-sm sm:text-base font-bold rounded-xl"
          >
            {ar ? 'تقاريري' : 'My reports'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate('mylists')}
            leftIcon={<ListChecks className="size-5" />}
            className="py-3 px-4 sm:px-5 text-sm sm:text-base font-bold rounded-xl"
          >
            {ar ? 'قوائمي' : 'My lists'}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
