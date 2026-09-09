'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { Activity, CalendarDays, FileText, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { InlineAlert } from '@/components/ui/InlineAlert';
export function ManagerOverview({ name, position }: {
    name: string;
    position?: string | null;
}) {
    const { language } = useTranslation();
    const ar = language === 'ar';
    const [s, setS] = useState({
        loading: true, error: false, reps: 0, reports: 0, activities: 0, plans: 0
    });
    useEffect(() => { const c = new AbortController(); Promise.all([fetch('/api/reports', {
            signal: c.signal
        }), fetch('/api/weekly-plans?team=true&scopeMode=ALL_DESCENDANTS', {
            signal: c.signal
        })]).then(async ([r, p]) => { if (!r.ok || !p.ok)
        throw new Error(); const a = await r.json(), b = await p.json(); const reports = ['hospitals', 'pharmacies', 'doctors', 'branches', 'availabilities', 'events', 'trainings', 'specialTasks'].reduce((n, k) => n + (a[k]?.length || 0), 0); setS({
        loading: false, error: false, reps: a.reps?.length || 0, reports, activities: a.managerActivities?.length || 0, plans: b.plans?.length || 0
    }); }).catch(() => { if (!c.signal.aborted)
        setS(x => ({
            ...x, loading: false, error: true
        })); }); return () => c.abort(); }, []);
    return <div>
    <PageHeader title={`${ar ? 'مرحباً،' : 'Welcome,'} ${name}`} description={`${position || (ar ? 'مدير' : 'Manager')} · ${ar ? 'نظرة عامة ضمن نطاق الإشراف' : 'Authorized hierarchy overview'}`}/>{s.error && <InlineAlert tone="error">{ar ? 'تعذر تحميل نظرة عامة للفريق.' : 'Unable to load the hierarchy overview.'}</InlineAlert>}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{s.loading ? [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28"/>) : <>
        <SectionCard title={ar ? 'أعضاء الفريق' : 'Team members'}>
        <Metric icon={<Users />} value={s.reps}/>
        </SectionCard>
        <SectionCard title={ar ? 'تقارير المندوبين' : 'MR reports'}>
        <Metric icon={<FileText />} value={s.reports}/>
        </SectionCard>
        <SectionCard title={ar ? 'أنشطة المديرين' : 'Manager activities'}>
        <Metric icon={<Activity />} value={s.activities}/>
        </SectionCard>
        <SectionCard title={ar ? 'خطط الفريق' : 'Team plans'}>
        <Metric icon={<CalendarDays />} value={s.plans}/>
        </SectionCard>
        </>}</div>
    </div>;
}
function Metric({ icon, value }: {
    icon: React.ReactNode;
    value: number;
}) {
    return <div className="mt-3 flex items-center justify-between text-[var(--gold-dark)]">
    <span className="[&>svg]:size-5">{icon}</span>
    <strong className="text-3xl tabular-nums text-[var(--ink)]">{value}</strong>
    </div>;
}
