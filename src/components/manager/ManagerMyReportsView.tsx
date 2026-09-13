'use client';
import { useCallback, useEffect, useState } from 'react';
import type { ManagerActivityRecord, WeeklyPlanRecord } from '@/types';
import { useTranslation } from '@/lib/i18nContext';
import { normalizeReports, type ReportRow } from '@/lib/reportExplorer';
import { ReportExplorer } from '@/components/reports/ReportExplorer';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InlineAlert } from '@/components/ui/InlineAlert';
interface ManagerMyReportsViewProps {
    currentUser?: {
        id: string;
        name: string;
        username: string;
        positionCode?: string | null;
        role?: string;
    } | null;
    onOpenPlan?: (plan: WeeklyPlanRecord) => void;
    onSuccess?: (msg: string) => void;
    onError?: (msg: string) => void;
    onEditActivity?: (activity: ManagerActivityRecord) => void;
}
export function ManagerMyReportsView({ currentUser, onOpenPlan, onSuccess, onError, onEditActivity }: ManagerMyReportsViewProps) {
    const { language } = useTranslation();
    const ar = language === 'ar';
    const [tab, setTab] = useState<'activities' | 'plans'>('activities');
    const [rows, setRows] = useState<ReportRow[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(false), [deleting, setDeleting] = useState(false), [pending, setPending] = useState<ReportRow | null>(null), [deleteError, setDeleteError] = useState(false);
    const load = useCallback(async (signal?: AbortSignal) => { setLoading(true); setError(false); try {
        const response = await fetch(tab === 'activities' ? '/api/manager/activities' : '/api/weekly-plans?personal=true', {
            signal
        });
        if (!response.ok)
            throw new Error('Reports unavailable');
        const data = await response.json();
        if (signal?.aborted)
            return;
        setRows(tab === 'activities' ? normalizeReports({
            managerActivities: data.activities
        }) : (data.plans as WeeklyPlanRecord[] || []).map(p => ({
            id: `plan:${p.id}`, type: 'plan', date: p.startDate, name: p.weekLabel || `${p.startDate} – ${p.endDate}`, owner: p.rep, position: currentUser?.positionCode || '', status: p.status, record: {
                ...p
            }
        })));
    }
    catch {
        if (!signal?.aborted)
            setError(true);
    }
    finally {
        if (!signal?.aborted)
            setLoading(false);
    } }, [tab, currentUser?.positionCode]);
    useEffect(() => { const controller = new AbortController(); const timer = setTimeout(() => void load(controller.signal), 0); return () => { clearTimeout(timer); controller.abort(); }; }, [load]);
    const remove = async () => { if (!pending || deleting)
        return; const row = pending; setPending(null); setDeleting(true); setDeleteError(false); try {
        const response = await fetch(row.type === 'plan' ? `/api/weekly-plans/${row.record.id}` : `/api/manager/activities/${row.record.id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (!response.ok || !data.success)
            throw new Error('Delete failed');
        onSuccess?.(ar ? 'تم الحذف' : 'Deleted');
        await load();
    }
    catch {
        setDeleteError(true);
        onError?.(ar ? 'تعذر الحذف' : 'Unable to delete');
    }
    finally {
        setDeleting(false);
    } };
    return <div className="space-y-4">
    <p className="text-sm">{currentUser?.name || currentUser?.username}</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label={ar ? 'نوع التقارير' : 'Report category'}>{(['activities', 'plans'] as const).map(value => <Button key={value} type="button" aria-pressed={tab === value} variant={tab === value ? 'primary' : 'secondary'} onClick={() => { setLoading(true); setRows([]); setTab(value); }}>{value === 'activities' ? (ar ? 'أنشطتي' : 'My activities') : (ar ? 'خططي الأسبوعية' : 'My weekly plans')}</Button>)}</div>{deleteError && <InlineAlert tone="error">{ar ? 'تعذر حذف السجل. يمكنك المحاولة مرة أخرى.' : 'Unable to delete the record. You can try again.'}</InlineAlert>}<ReportExplorer key={tab} rows={rows} loading={loading} error={error} retry={() => void load()} actions={row => <>{row.type === 'plan' && <>
            <Button type="button" size="sm" variant="secondary" disabled={deleting} onClick={() => onOpenPlan?.(row.record as unknown as WeeklyPlanRecord)}>{ar ? 'فتح الخطة' : 'Open plan'}</Button>
            <a className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line)] px-3 text-sm" href={`/api/weekly-plans/${row.record.id}/export`}>{ar ? 'تصدير Excel' : 'Export Excel'}</a>
            </>}{row.type !== 'plan' && <Button type="button" size="sm" variant="secondary" disabled={deleting} onClick={() => onEditActivity?.(row.record as unknown as ManagerActivityRecord)}>{ar ? 'تعديل' : 'Edit'}</Button>}<Button type="button" size="sm" variant="danger" disabled={deleting} onClick={() => setPending(row)}>{ar ? 'حذف' : 'Delete'}</Button>
        </>}/>
    <ConfirmDialog open={Boolean(pending)} title={ar ? 'حذف التقرير' : 'Delete report'} description={ar ? 'سيتم حذف هذا السجل نهائياً.' : 'This record will be permanently deleted.'} destructive onClose={() => setPending(null)} onConfirm={() => void remove()} confirmLabel={ar ? 'حذف' : 'Delete'}/>
    </div>;
}
