'use client';
import { useTranslation } from '@/lib/i18nContext';
import { FilterBar } from '@/components/ui/FilterBar';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { reportLabel } from '@/components/reports/ReportExplorer';
export function WeekSelector({ start, end, disabled, onChange }: {
    start: string;
    end: string;
    disabled: boolean;
    onChange: (date: string) => void;
}) {
    const { language } = useTranslation();
    const ar = language === 'ar';
    return <FilterBar>
    <label className="min-w-0 flex-1 text-sm font-semibold">{ar ? 'الأسبوع الذي يحتوي على' : 'Week containing'}<input type="date" value={start} disabled={disabled} onChange={e => { if (e.target.value)
        onChange(e.target.value); }} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] px-3"/>
    </label>
    <p className="text-sm">{start} – {end}</p>
    </FilterBar>;
}
export function PlanStatus({ existing, status }: {
    existing: boolean;
    status: string;
}) {
    const { language } = useTranslation();
    const ar = language === 'ar';
    return <div className="flex flex-wrap gap-2">
    <StatusBadge>{existing ? (ar ? 'خطة موجودة' : 'Existing plan') : (ar ? 'خطة جديدة' : 'New plan')}</StatusBadge>{existing && <StatusBadge tone="success">{reportLabel(status, ar)}</StatusBadge>}</div>;
}
export function PlanActions({ saving, disabled, onSave, onExport, onPreview }: {
    saving: boolean;
    disabled: boolean;
    onSave: () => void;
    onExport: () => void;
    onPreview: () => void;
}) {
    const { language } = useTranslation();
    const ar = language === 'ar';
    return <div className="flex flex-wrap justify-end gap-2">
    <Button type="button" variant="secondary" disabled={disabled} onClick={onPreview}>{ar ? 'معاينة' : 'Preview'}</Button>
    <Button type="button" variant="secondary" disabled={disabled} onClick={onExport}>{ar ? 'تصدير Excel' : 'Export Excel'}</Button>
    <Button type="button" disabled={disabled} isLoading={saving} onClick={onSave}>{ar ? 'حفظ الخطة' : 'Save plan'}</Button>
    </div>;
}
