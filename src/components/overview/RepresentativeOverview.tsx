'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { reportLabel } from '@/components/reports/ReportExplorer';
import { CalendarDays, FileText, ListChecks, MapPin, PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Button } from '@/components/ui/Button';
import type { MRViewType } from '@/components/workspace/MedicalRepWorkspace';
export function RepresentativeOverview({ user, onNavigate }: {
    user: {
        name: string;
        positionCode?: string | null;
        primarySalesAssignment?: {
            territoryName: string;
        } | null;
    };
    onNavigate: (view: MRViewType) => void;
}) {
    const { language } = useTranslation();
    const ar = language === 'ar';
    const [state, setState] = useState<{
        loading: boolean;
        error: boolean;
        reports: number;
        planStatus: string;
    }>({
        loading: true, error: false, reports: 0, planStatus: '—'
    });
    useEffect(() => { const controller = new AbortController(); Promise.all([fetch('/api/reports', {
            signal: controller.signal
        }), fetch('/api/weekly-plans', {
            signal: controller.signal
        })]).then(async ([r, p]) => { if (!r.ok || !p.ok)
        throw new Error(); const reports = await r.json(); const plans = await p.json(); const total = ['hospitals', 'pharmacies', 'doctors', 'branches', 'availabilities', 'events', 'trainings', 'specialTasks'].reduce((n, k) => n + (reports[k]?.length || 0), 0); setState({
        loading: false, error: false, reports: total, planStatus: plans.plans?.[0]?.status || 'No plan'
    }); }).catch(() => { if (!controller.signal.aborted)
        setState(s => ({
            ...s, loading: false, error: true
        })); }); return () => controller.abort(); }, []);
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${ar ? 'مرحباً،' : 'Welcome,'} ${user.name}`}
          description={`${user.positionCode || 'MR'} · ${user.primarySalesAssignment?.territoryName || (ar ? 'المنطقة المخصصة' : 'Assigned territory')}`}
        />
        {state.error && (
          <InlineAlert tone="error">
            {ar ? 'تعذر تحميل أحدث بيانات النظرة العامة.' : 'Unable to load the latest overview data.'}
          </InlineAlert>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {state.loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
          ) : (
            <>
              <SectionCard title={ar ? 'التقارير المسجلة' : 'Recent submissions'} className="flex flex-col justify-between">
                <div className="mt-2">
                  <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--gold-dark)] tracking-tight tabular-nums">
                    {state.reports}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-medium mt-1">
                    {ar ? 'إجمالي التقارير المسجلة في النظام' : 'Total submitted visits & activities'}
                  </p>
                </div>
              </SectionCard>

              <SectionCard
                title={ar ? 'الخطة الأسبوعية الحالية' : 'Current weekly plan'}
                actions={
                  <Button size="sm" variant="secondary" onClick={() => onNavigate('myweeklyplan')} className="font-bold text-xs sm:text-sm px-3 py-1.5 rounded-lg">
                    {ar ? 'عرض' : 'View'}
                  </Button>
                }
                className="flex flex-col justify-between"
              >
                <div className="mt-2">
                  <p className="text-xl sm:text-2xl font-black text-[var(--ink)]">
                    {state.planStatus === 'No plan' ? (ar ? 'لا توجد خطة' : 'No plan') : reportLabel(state.planStatus, ar)}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-medium mt-1">
                    {ar ? 'حالة الاعتماد للأسبوع الجاري' : 'Approval status for current week'}
                  </p>
                </div>
              </SectionCard>

              <SectionCard title={ar ? 'المنطقة المخصصة' : 'Territory'} className="flex flex-col justify-between">
                <div className="mt-2">
                  <p className="flex items-center gap-2 text-lg sm:text-xl font-bold text-[var(--ink)]">
                    <MapPin className="size-5 text-[var(--gold-dark)] shrink-0" />
                    <span className="truncate">{user.primarySalesAssignment?.territoryName || (ar ? 'المنطقة المخصصة' : 'Assigned territory')}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-medium mt-1">
                    {ar ? 'النطاق الجغرافي المعتمد' : 'Authorized operating coverage'}
                  </p>
                </div>
              </SectionCard>
            </>
          )}
        </div>

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
