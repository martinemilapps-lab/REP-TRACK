'use client';
import { useCallback, useEffect, useState } from 'react';
import { ReportExplorer } from '@/components/reports/ReportExplorer';
import { normalizeReports, type ReportRow } from '@/lib/reportExplorer';
export function MyReportsView() {
    const [rows, setRows] = useState<ReportRow[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(false);
    const load = useCallback(async (signal?: AbortSignal) => { setLoading(true); setError(false); try {
        const response = await fetch('/api/reports', {
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
    } }, []);
    useEffect(() => { const controller = new AbortController(); const timer = setTimeout(() => void load(controller.signal), 0); return () => { clearTimeout(timer); controller.abort(); }; }, [load]);
    return <ReportExplorer rows={rows} loading={loading} error={error} retry={() => void load()}/>;
}
