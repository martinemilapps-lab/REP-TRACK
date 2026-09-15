'use client';
import { useCallback, useEffect, useState } from 'react';
import { ReportExplorer } from '@/components/reports/ReportExplorer';
import { normalizeReports, type ReportRow } from '@/lib/reportExplorer';
import { SectionCard } from '@/components/ui/SectionCard';
export function MyReportsView() {
    const [rows, setRows] = useState<ReportRow[]>([]), [coverage,setCoverage]=useState<{startDate:string;endDate:string;hospital:{required:number;completed:number;percentage:number;averageAchievement:number};doctor:{required:number;completed:number;percentage:number;averageAchievement:number}}|null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(false);
    const load = useCallback(async (signal?: AbortSignal) => { setLoading(true); setError(false); try {
        const response = await fetch('/api/reports', {
            signal
        });
        if (!response.ok)
            throw new Error('Reports unavailable');
        const data = await response.json();
        const coverageResponse=await fetch('/api/coverage',{signal});if(coverageResponse.ok)setCoverage((await coverageResponse.json()).coverage);
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
    } }, []);
    useEffect(() => { const controller = new AbortController(); const timer = setTimeout(() => void load(controller.signal), 0); return () => { clearTimeout(timer); controller.abort(); }; }, [load]);
    return <div className="space-y-4">{coverage&&<SectionCard title={`Coverage · ${coverage.startDate} — ${coverage.endDate}`} description="Server-calculated from active My Lists visit cycles and eligible submitted entity visits."><div className="grid gap-3 sm:grid-cols-2"><div><b>Hospital Coverage: {coverage.hospital.percentage}%</b><p>{coverage.hospital.completed} completed / {coverage.hospital.required} required</p><p className="text-xs text-[var(--ink-soft)]">Average hospital achievement: {coverage.hospital.averageAchievement}%</p></div><div><b>Doctor Coverage: {coverage.doctor.percentage}%</b><p>{coverage.doctor.completed} completed / {coverage.doctor.required} required</p><p className="text-xs text-[var(--ink-soft)]">Average doctor achievement: {coverage.doctor.averageAchievement}%</p></div></div></SectionCard>}<ReportExplorer rows={rows} loading={loading} error={error} retry={() => void load()}/></div>;
}
