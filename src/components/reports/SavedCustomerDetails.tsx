'use client';

import { FormField } from '@/components/ui/FormField';
import { useTranslation } from '@/lib/i18nContext';

export type VisitMode = 'Single' | 'Double';
type SavedCustomer = Record<string, unknown> & { id: string; name: string; defaultCycle?: number };

const LABELS: Record<string, [string, string]> = {
  hospitalTypes: ['Hospital type', 'نوع المستشفى'], area: ['Area', 'المنطقة'], coverageArea: ['Coverage area', 'منطقة التغطية'],
  address: ['Address', 'العنوان'], specialty: ['Specialty', 'التخصص'], clinicAddress: ['Clinic address', 'عنوان العيادة'], classification: ['Classification', 'التصنيف'],
  distributors: ['Distributor dealt with', 'الموزع المتعامل معه'], distributorOther: ['Other distributor', 'موزع آخر'], contact: ['Contact', 'جهة الاتصال'], phone: ['Phone', 'الهاتف'], distributedProducts: ['Distributed products', 'المنتجات الموزعة'],
};
const FIELDS = { hospital: ['hospitalTypes', 'area', 'address'], doctor: ['specialty', 'clinicAddress', 'area', 'address', 'classification'], pharmacy: ['area', 'address', 'distributors', 'distributorOther'], branch: ['coverageArea'] } as const;
const show = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string' && (value.trim().startsWith('[') || value.trim().startsWith('{'))) {
    try {
      const parsed = JSON.parse(value.trim());
      if (Array.isArray(parsed)) {
        return parsed.map((item) => (typeof item === 'object' && item !== null ? (item.name || item.title || JSON.stringify(item)) : String(item))).join(', ');
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
      }
    } catch {}
  }
  return String(value);
};

export function SavedCustomerDetails({ category, customer, visitMode, companion, onVisitModeChange, onCompanionChange }: { category: keyof typeof FIELDS; customer?: SavedCustomer; visitMode: VisitMode; companion: string; onVisitModeChange: (value: VisitMode) => void; onCompanionChange: (value: string) => void }) {
  const { language } = useTranslation(); const ar = language === 'ar'; const l = (en: string, arabic: string) => ar ? arabic : en;
  if (!customer) return null;
  return <div className="mt-4 space-y-4 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-4">
    <p className="text-sm font-bold">{l('Pre-registered customer data', 'بيانات العميل المسجلة مسبقاً')}</p>
    <dl className="grid gap-3 sm:grid-cols-2">{FIELDS[category].map(key => <div key={key}><dt className="text-xs text-[var(--ink-soft)]">{LABELS[key][ar ? 1 : 0]}</dt><dd className="break-words font-medium">{show(customer[key])}</dd></div>)}<div><dt className="text-xs text-[var(--ink-soft)]">{l('Visit cycle (days)', 'دورة الزيارة (أيام)')}</dt><dd><select className="input mt-1 w-full" value={String(customer.defaultCycle ?? 7)} disabled aria-label={l('Visit cycle (days)', 'دورة الزيارة (أيام)')}>{[7, 10, 14, 30].map(value => <option key={value} value={value}>{value}</option>)}</select></dd></div></dl>
    <fieldset><legend className="text-sm font-semibold">{l('Visit status', 'حالة الزيارة')} *</legend><div className="mt-2 flex gap-5">{(['Single', 'Double'] as const).map(mode => <label key={mode} className="flex items-center gap-2"><input required type="radio" name={`visit-mode-${customer.id}`} checked={visitMode === mode} onChange={() => onVisitModeChange(mode)}/>{mode}</label>)}</div></fieldset>
    {visitMode === 'Double' && <FormField required label={l('Companion', 'الشخص المرافق')} value={companion} onChange={onCompanionChange}/>} 
  </div>;
}
