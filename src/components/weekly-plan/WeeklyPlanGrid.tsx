'use client';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
export interface WeeklyPlanFormState {
    saturdayAm: string;
    saturdayPm: string;
    sundayAm: string;
    sundayPm: string;
    mondayAm: string;
    mondayPm: string;
    tuesdayAm: string;
    tuesdayPm: string;
    wednesdayAm: string;
    wednesdayPm: string;
    thursdayAm: string;
    thursdayPm: string;
    fridayAm: string;
    fridayPm: string;
}
export interface DayPlan {
    dayKey: string;
    dayNameEn: string;
    dayNameAr: string;
    amKey: keyof WeeklyPlanFormState;
    pmKey: keyof WeeklyPlanFormState;
}
interface GridProps {
    days: DayPlan[];
    value: WeeklyPlanFormState;
    disabled?: boolean;
    onChange: (key: keyof WeeklyPlanFormState, value: string) => void;
    onFocus: (key: keyof WeeklyPlanFormState) => void;
    onAdd: (day: string, shift: 'am' | 'pm') => void;
    onClear: (key: keyof WeeklyPlanFormState) => void;
    onPreset: (key: keyof WeeklyPlanFormState, text: string) => void;
    area: string;
}
export function WeeklyPlanGrid(props: GridProps) {
    return <div className="divide-y divide-[var(--line)]">{props.days.map(day => <DailyPlanRow key={day.dayKey} {...props} day={day}/>)}</div>;
}
function DailyPlanRow({ day, value, disabled, onChange, onFocus, onAdd, onClear, onPreset, area }: GridProps & {
    day: DayPlan;
}) {
    const { language } = useTranslation();
    const ar = language === 'ar';
    const name = ar ? day.dayNameAr : day.dayNameEn;
    return <fieldset disabled={disabled} className="grid min-w-0 gap-4 bg-[var(--surface)] p-4 md:grid-cols-[8rem_1fr_1fr]">
    <legend className="sr-only">{name}</legend>
    <h3 className="font-semibold">{name}</h3>{(['am', 'pm'] as const).map(shift => {
            const key = shift === 'am' ? day.amKey : day.pmKey;
            const label = ar ? (shift === 'am' ? 'صباحاً' : 'مساءً') : shift.toUpperCase();
            return <div key={shift} className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={`plan-${key}`} className="text-sm font-semibold">{label}</label>
            <div className="flex gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => onAdd(day.dayKey, shift)} leftIcon={<Plus className="size-4"/>}>{ar ? 'إضافة' : 'Add'}</Button>
            <Button type="button" size="sm" variant="ghost" disabled={!value[key]} aria-label={`${ar ? 'مسح' : 'Clear'} ${name} ${label}`} onClick={() => onClear(key)}>
            <Trash2 className="size-4"/>
            </Button>
            </div>
            </div>
            <textarea id={`plan-${key}`} aria-label={`${name} ${label}`} rows={3} value={value[key]} onFocus={() => onFocus(key)} onChange={e => onChange(key, e.target.value)} placeholder={ar ? 'تفاصيل أنشطة هذه الفترة' : 'Activities for this shift'} className="w-full resize-y rounded-lg border border-[var(--line)] p-3 text-sm focus-visible:outline-2 focus-visible:outline-[var(--focus)]"/>
            <div className="mt-2 flex flex-wrap gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => onPreset(key, 'Office working')}>{ar ? 'عمل مكتبي' : 'Office'}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onPreset(key, `${shift === 'am' ? 'Am' : 'Pm'} single visits in ${area || 'Field'}`)}>{ar ? 'زيارة فردية' : 'Single visit'}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onAdd(day.dayKey, shift)}>{ar ? 'زيارة مشتركة' : 'Double visit'}</Button>
            </div>
            </div>;
        })}</fieldset>;
}
