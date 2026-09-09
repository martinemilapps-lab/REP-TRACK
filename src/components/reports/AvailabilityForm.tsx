'use client';
import { useState } from 'react';
import { MONTHS_LIST, PRODUCTS_LIST } from '@/lib/constants';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { FormSection } from '@/components/ui/FormSection';
import { FormField } from '@/components/ui/FormField';
import { InlineAlert } from '@/components/ui/InlineAlert';
const empty = {
    hospital: '', area: '', product: '', month: 'Jan', annualTarget: 0, avgMonthlyTarget: 0, sales: 0, potentiality: 0, status: 'Available', notes: ''
};
export function AvailabilityForm({ onSuccess, onError }: {
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}) {
    const { language } = useTranslation();
    const ar = language === 'ar';
    const l = (en: string, arabic: string) => ar ? arabic : en;
    const [form, setForm] = useState(empty), [saving, setSaving] = useState(false), [notice, setNotice] = useState<{
        error: boolean;
        text: string;
    } | null>(null);
    const submit = async (event: React.FormEvent) => { event.preventDefault(); if (saving)
        return; if (!form.hospital.trim() || !form.product.trim())
        return; setSaving(true); setNotice(null); try {
        const response = await fetch('/api/reports/availability', {
            method: 'POST', headers: {
                'Content-Type': 'application/json'
            }, body: JSON.stringify({
                ...form, monthlySales: form.sales
            })
        });
        const data = await response.json();
        if (!response.ok || !data.success)
            throw new Error();
        const message = l('Product availability saved', 'تم حفظ توافر المنتجات');
        setNotice({
            error: false, text: message
        });
        onSuccess(message);
        setForm(empty);
    }
    catch {
        const message = l('Unable to save availability. Please try again.', 'تعذر حفظ توافر المنتجات. أعد المحاولة.');
        setNotice({
            error: true, text: message
        });
        onError(message);
    }
    finally {
        setSaving(false);
    } };
    return <form onSubmit={submit} className="space-y-4">{notice && <InlineAlert tone={notice.error ? 'error' : 'success'}>{notice.text}</InlineAlert>}<fieldset disabled={saving} className="min-w-0 space-y-4">
    <legend className="mb-4 text-xl font-semibold">{l('Product availability', 'توافر المنتجات')}</legend>
    <FormSection title={l('Availability record', 'سجل توافر المنتجات')}>
    <FormField label={l('Hospital', 'المستشفى')} value={form.hospital} required onChange={hospital => setForm({
        ...form, hospital
    })}/>
    <FormField label={l('Area', 'المنطقة')} value={form.area} onChange={area => setForm({
        ...form, area
    })}/>
    <label className="text-sm font-semibold">{l('Product', 'المنتج')}<input list="availability-products" required value={form.product} onChange={e => setForm({
        ...form, product: e.target.value
    })} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] px-3"/>
    <datalist id="availability-products">{PRODUCTS_LIST.map(product => <option key={product} value={product}/>)}</datalist>
    </label>
    <label className="text-sm font-semibold">{l('Month', 'الشهر')}<select value={form.month} onChange={e => setForm({
        ...form, month: e.target.value
    })} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] px-3">{MONTHS_LIST.map((month, index) => <option key={month} value={month}>{new Intl.DateTimeFormat(ar ? 'ar' : 'en', {
            month: 'long', timeZone: 'UTC'
        }).format(new Date(Date.UTC(2026, index, 1)))}</option>)}</select>
    </label>
    <label className="text-sm font-semibold">{l('Availability', 'التوافر')}<select value={form.status} onChange={e => setForm({
        ...form, status: e.target.value
    })} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] px-3">
    <option value="Available">{l('Available', 'متوفر')}</option>
    <option value="Not Available">{l('Not available', 'غير متوفر')}</option>
    </select>
    </label>
    <FormField label={l('Notes', 'ملاحظات')} value={form.notes} multiline onChange={notes => setForm({
        ...form, notes
    })}/>
    </FormSection>
    <details className="section-card">
    <summary className="cursor-pointer text-sm font-semibold">{l('Optional recorded figures', 'قيم مسجلة اختيارية')}</summary>
    <p className="my-3 text-xs text-[var(--ink-soft)]">{l('Values entered for this individual record.', 'قيم مدخلة لهذا السجل الفردي.')}</p>
    <div className="grid gap-4 sm:grid-cols-2">{(['annualTarget', 'avgMonthlyTarget', 'sales', 'potentiality'] as const).map((key, index) => <FormField key={key} type="number" label={(ar ? ['المستهدف السنوي', 'متوسط المستهدف الشهري', 'المبيعات المسجلة', 'الإمكانات المسجلة'] : ['Annual target', 'Average monthly target', 'Recorded sales', 'Recorded potentiality'])[index]} value={String(form[key])} onChange={value => setForm({
            ...form, [key]: Math.max(0, Number(value) || 0)
        })}/>)}</div>
    </details>
    <Button type="submit" isLoading={saving}>{l('Save availability', 'حفظ التوافر')}</Button>
    </fieldset>
    </form>;
}
