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
    return <div>
    <PageHeader title={`${ar ? 'مرحباً،' : 'Welcome,'} ${user.name}`} description={`${user.positionCode || 'MR'} · ${user.primarySalesAssignment?.territoryName || (ar ? 'المنطقة المخصصة' : 'Assigned territory')}`}/>{state.error && <InlineAlert tone="error">{ar ? 'تعذر تحميل أحدث بيانات النظرة العامة.' : 'Unable to load the latest overview data.'}</InlineAlert>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{state.loading ? [1, 2, 3].map(i => <Skeleton key={i} className="h-28"/>) : <>
        <SectionCard title={ar ? 'التقارير المسجلة' : 'Recent submissions'}>
        <p className="text-3xl font-bold tabular-nums">{state.reports}</p>
        </SectionCard>
        <SectionCard title={ar ? 'الخطة الأسبوعية الحالية' : 'Current weekly plan'}>
        <p className="text-lg font-semibold">{state.planStatus === 'No plan' ? (ar ? 'لا توجد خطة' : 'No plan') : reportLabel(state.planStatus, ar)}</p>
        </SectionCard>
        <SectionCard title={ar ? 'المنطقة' : 'Territory'}>
        <p className="flex items-center gap-2 text-sm">
        <MapPin className="size-4 text-[var(--gold-dark)]"/>{user.primarySalesAssignment?.territoryName || (ar ? 'المنطقة المخصصة' : 'Assigned territory')}</p>
        </SectionCard>
        </>}</div>
    <SectionCard title={ar ? 'إجراءات سريعة' : 'Quick actions'} className="mt-4">
    <div className="flex flex-wrap gap-2">
    <Button onClick={() => onNavigate('submit')} leftIcon={<PlusCircle className="size-4"/>}>{ar ? 'تسجيل تقرير' : 'Submit report'}</Button>
    <Button variant="secondary" onClick={() => onNavigate('weeklyplan')} leftIcon={<CalendarDays className="size-4"/>}>{ar ? 'الخطة الأسبوعية' : 'Weekly plan'}</Button>
    <Button variant="secondary" onClick={() => onNavigate('myreports')} leftIcon={<FileText className="size-4"/>}>{ar ? 'تقاريري' : 'My reports'}</Button>
    <Button variant="secondary" onClick={() => onNavigate('mylists')} leftIcon={<ListChecks className="size-4"/>}>{ar ? 'قوائمي' : 'My lists'}</Button>
    </div>
    </SectionCard>
    </div>;
}
