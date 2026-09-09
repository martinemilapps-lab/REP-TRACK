'use client';
import { useCallback, useEffect, useState } from 'react';
import { ReportExplorer } from '@/components/reports/ReportExplorer';
import { normalizeReports, type ReportRow } from '@/lib/reportExplorer';
import { buildTeamReportsUrl } from '@/lib/teamQuery';
import { useTranslation } from '@/lib/i18nContext';
import { FilterBar } from '@/components/ui/FilterBar';
import { Button } from '@/components/ui/Button';
export function TeamReportExplorer({ initialType = '' }: {
    initialType?: string;
}) {
    const { language } = useTranslation();
    const ar = language === 'ar';
    const [scope, setScope] = useState<'DIRECT_REPORTS' | 'ALL_DESCENDANTS'>('ALL_DESCENDANTS');
    const [rows, setRows] = useState<ReportRow[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(false);
    const load = useCallback(async (signal?: AbortSignal) => { setLoading(true); setError(false); try {
        const response = await fetch(buildTeamReportsUrl(scope), {
            signal
        });
        if (!response.ok)
            throw new Error('Reports unavailable');
        const data = await response.json();
        if (!signal?.aborted)
            setRows(normalizeReports(data));
    }
    catch {
        if (!signal?.aborted)
            setError(true);
    }
    finally {
        if (!signal?.aborted)
            setLoading(false);
    } }, [scope]);
    useEffect(() => { const controller = new AbortController(); const timer = setTimeout(() => void load(controller.signal), 0); return () => { clearTimeout(timer); controller.abort(); }; }, [load]);
    return <div className="space-y-4">
    <FilterBar>
    <label className="text-sm font-semibold">{ar ? 'نطاق الفريق' : 'Team scope'}<select className="ms-2 min-h-11 rounded-lg border border-[var(--line)] px-3" value={scope} onChange={e => { setLoading(true); setRows([]); setScope(e.target.value as typeof scope); }}>
    <option value="DIRECT_REPORTS">{ar ? 'المرؤوسون المباشرون' : 'Direct reports'}</option>
    <option value="ALL_DESCENDANTS">{ar ? 'جميع المرؤوسين' : 'All descendants'}</option>
    </select>
    </label>
    <Button type="button" variant="secondary" onClick={() => window.open('/api/export/excel', '_blank', 'noopener,noreferrer')}>{ar ? 'تصدير جميع السجلات المصرح بها' : 'Export all authorized records'}</Button>
    </FilterBar>
    <ReportExplorer key={scope} rows={initialType ? rows.filter(r => r.type === initialType) : rows} loading={loading} error={error} retry={() => void load()} team initialType={initialType}/>
    </div>;
}
