'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Download } from 'lucide-react';
import type { WeeklyPlanRecord } from '@/types';
import { buildTeamPlansUrl } from '@/lib/teamQuery';
import { useTranslation } from '@/lib/i18nContext';
import { ReportDetails, reportLabel } from '@/components/reports/ReportExplorer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { FilterBar } from '@/components/ui/FilterBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';
type Scope = 'DIRECT_REPORTS' | 'ALL_DESCENDANTS';
type TeamPlan = WeeklyPlanRecord & {
    userPosition?: string;
    positionCode?: string;
};
export function ManagerTeamPlansView({ onError }: {
    onError: (message: string) => void;
}) {
    const { language } = useTranslation();
    const ar = language === 'ar';
    const l = (en: string, arabic: string) => ar ? arabic : en;
    const [plans, setPlans] = useState<TeamPlan[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(false);
    const [scope, setScope] = useState<Scope>('ALL_DESCENDANTS'), [kinds, setKinds] = useState<string[]>([]), [week, setWeek] = useState(''), [persons, setPersons] = useState<string[]>([]), [search, setSearch] = useState(''), [selected, setSelected] = useState<TeamPlan | null>(null);
    const load = useCallback(async (signal?: AbortSignal) => { setLoading(true); setError(false); try {
        const response = await fetch(buildTeamPlansUrl(scope), {
            signal
        });
        if (!response.ok)
            throw new Error();
        const data = await response.json();
        if (!signal?.aborted)
            setPlans(data.plans || []);
    }
    catch {
        if (!signal?.aborted) {
            setError(true);
            onError(ar ? 'تعذر تحميل خطط الفريق' : 'Unable to load team plans');
        }
    }
    finally {
        if (!signal?.aborted)
            setLoading(false);
    } }, [scope, onError, ar]);
    useEffect(() => { const controller = new AbortController(); const timer = setTimeout(() => void load(controller.signal), 0); return () => { clearTimeout(timer); controller.abort(); }; }, [load]);
    const people = useMemo(() => [...new Set(plans.map(p => p.rep))].sort(), [plans]);
    const filtered = useMemo(() => plans.filter(p => {
        const matchesKind = kinds.length === 0 || 
            (kinds.includes('MANAGER') && Boolean(p.isManagerPlan)) || 
            (kinds.includes('MR') && !p.isManagerPlan);
        const matchesPerson = persons.length === 0 || persons.includes(p.rep);
        const matchesWeek = !week || (p.startDate <= week && p.endDate >= week);
        const matchesSearch = !search || `${p.rep} ${p.weekLabel} ${p.status}`.toLowerCase().includes(search.toLowerCase());
        return matchesKind && matchesPerson && matchesWeek && matchesSearch;
    }), [plans, kinds, week, persons, search]);
    return <div className="space-y-4">
    <PageHeader title={l('Team plans', 'خطط الفريق')} description={l('Read-only weekly plans from your authorized hierarchy.', 'خطط أسبوعية للقراءة فقط ضمن نطاق إشرافك المصرح به.')}/>
    <FilterBar>
    <Select label={l('Scope', 'النطاق')} value={scope} onChange={value => { setLoading(true); setPlans([]); setPersons([]); setSelected(null); setScope(value as Scope); }} options={[["ALL_DESCENDANTS", l('All descendants', 'جميع المرؤوسين')], ["DIRECT_REPORTS", l('Direct reports', 'المرؤوسون المباشرون')]]}/>
    <MultiSelectDropdown
        label={l('Plan type', 'نوع الخطة')}
        options={[
            { value: 'MR', label: l('MR plans', 'خطط المندوبين') },
            { value: 'MANAGER', label: l('Manager plans', 'خطط المديرين') }
        ]}
        selectedValues={kinds}
        onChange={setKinds}
        placeholder={l('All plans', 'كل الخطط')}
    />
    <label className="min-w-0 flex-1 text-sm">{l('Week', 'الأسبوع')}<input type="date" value={week} onChange={e => setWeek(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] px-2"/>
    </label>
    <MultiSelectDropdown
        label={l('Subordinate', 'الموظف')}
        options={people.map(name => ({ value: name, label: name }))}
        selectedValues={persons}
        onChange={setPersons}
        placeholder={l('Everyone', 'الجميع')}
    />
    </FilterBar>
    <FilterBar>
    <label className="min-w-0 flex-1 text-sm">{l('Search', 'بحث')}<input value={search} type="search" onChange={e => setSearch(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] px-3"/>
    </label>
    <Button type="button" variant="secondary" onClick={() => { setKinds([]); setWeek(''); setPersons([]); setSearch(''); }}>{l('Reset filters', 'إعادة تعيين التصفية')}</Button>
    </FilterBar>
 {error ? <InlineAlert tone="error">{l('Unable to load plans.', 'تعذر تحميل الخطط.')} <Button type="button" variant="secondary" onClick={() => void load()}>{l('Retry', 'إعادة المحاولة')}</Button>
        </InlineAlert> : loading ? <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3, 4].map(n => <Skeleton key={n} className="h-32"/>)}</div> : <>
        <p role="status" className="text-sm">{filtered.length} {l('plans', 'خطة')}</p>{!filtered.length ? <EmptyState title={l('No matching team plans', 'لا توجد خطط فريق مطابقة')} icon={<CalendarDays className="size-6"/>}/> : <div className="grid gap-3 md:grid-cols-2">{filtered.map(plan => <SectionCard key={plan.id} title={plan.rep}>
                <p className="text-xs text-[var(--ink-soft)]">{plan.userPosition || plan.positionCode || ''}</p>
                <p className="my-3 break-words text-sm">{plan.weekLabel || `${plan.startDate} – ${plan.endDate}`}</p>
                <div className="flex flex-wrap gap-2">
                <StatusBadge>{plan.isManagerPlan ? l('Manager plan', 'خطة مدير') : l('MR plan', 'خطة مندوب')}</StatusBadge>
                <StatusBadge tone={plan.status === 'Submitted' ? 'success' : 'neutral'}>{reportLabel(plan.status, ar)}</StatusBadge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => setSelected(plan)}>{l('Details', 'التفاصيل')}</Button>
                <a href={`/api/weekly-plans/${plan.id}/export`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--line)] px-3 text-sm">
                <Download className="size-4"/>{l('Export Excel', 'تصدير Excel')}</a>
                </div>
                </SectionCard>)}</div>}</>}
 <Drawer open={Boolean(selected)} title={selected?.weekLabel || l('Weekly plan', 'الخطة الأسبوعية')} onClose={() => setSelected(null)}>{selected && <ReportDetails row={{
        id: selected.id, type: 'plan', name: selected.weekLabel || '', date: selected.startDate, owner: selected.rep, position: selected.userPosition || selected.positionCode || '', status: selected.status, record: {
            ...selected
        }
    }}/>}</Drawer>
    </div>;
}
function Select({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[][];
}) {
    return <label className="min-w-0 flex-1 text-sm">{label}<select aria-label={label} value={value} onChange={e => onChange(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2">{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    </label>;
}
