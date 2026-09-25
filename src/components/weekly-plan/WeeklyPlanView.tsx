'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Representative, WeeklyPlanRecord } from '@/types';
import { useTranslation } from '@/lib/i18nContext';
import { Download } from 'lucide-react';
import { downloadExcelFromUrl } from '@/lib/clientExport';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { FormSection } from '@/components/ui/FormSection';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { CustomFieldsRenderer } from '@/components/ui/CustomFieldsRenderer';

const DAYS = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
const ACTS = ['MEETING', 'TRAINING', 'EVENT', 'SALES_REVIEW_ADMIN', 'OTHERS'] as const;

type Cell = {
  hospitalIds: string[];
  branchIds: string[];
  doctorIds: string[];
  pharmacyIds: string[];
  visitType: 'Single' | 'Double';
  companion: string;
  activities: string[];
  salesReviewDescription: string;
  othersDescription: string;
  meetingDescription: string;
  trainingDescription: string;
  eventDescription: string;
};

type Plan = Record<string, { am: Cell; pm: Cell }>;

type Lists = {
  hospitals: Array<{ id: string; name: string }>;
  branches: Array<{ id: string; name: string }>;
  doctors: Array<{ id: string; name: string; specialty?: string }>;
  pharmacies: Array<{ id: string; name: string }>;
};

const cell = (): Cell => ({
  hospitalIds: [],
  branchIds: [],
  doctorIds: [],
  pharmacyIds: [],
  visitType: 'Single',
  companion: '',
  activities: [],
  salesReviewDescription: '',
  othersDescription: '',
  meetingDescription: '',
  trainingDescription: '',
  eventDescription: '',
});

const fresh = (): Plan => Object.fromEntries(DAYS.map(d => [d, { am: cell(), pm: cell() }]));

function range(date = new Date()) {
  const x = new Date(date);
  const diff = (x.getDay() + 1) % 7;
  x.setDate(x.getDate() - diff);
  const y = new Date(x);
  y.setDate(x.getDate() + 6);
  const f = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return [f(x), f(y)] as const;
}

export function WeeklyPlanView({
  reps = [],
  selectedRep,
  isManagerPersonal,
  initialPlan,
  onSuccess,
  onError,
  onPlanSaved,
}: {
  reps?: Representative[];
  selectedRep?: string;
  isManager?: boolean;
  isManagerPersonal?: boolean;
  currentUser?: { id: string; name: string; username: string } | null;
  initialPlan?: WeeklyPlanRecord | null;
  onSuccess?: (x: string) => void;
  onError?: (x: string) => void;
  onPlanSaved?: (plan: WeeklyPlanRecord) => void;
}) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const l = (en: string, arabic: string) => (ar ? arabic : en);

  const [startDate, setStartDate] = useState(initialPlan?.startDate || range()[0]);
  const [endDate, setEndDate] = useState(initialPlan?.endDate || range()[1]);
  const [repId, setRepId] = useState(
    initialPlan?.selectedRepId || (!isManagerPersonal ? reps.find(r => r.name === selectedRep)?.id || '' : '')
  );

  const [plan, setPlan] = useState<Plan>(() => {
    try {
      const raw = initialPlan?.structuredPlan
        ? typeof initialPlan.structuredPlan === 'string'
          ? JSON.parse(initialPlan.structuredPlan)
          : initialPlan.structuredPlan
        : null;
      if (raw && typeof raw === 'object') {
        const f = fresh();
        for (const d of DAYS) {
          if (raw[d]) {
            f[d] = {
              am: { ...cell(), ...(raw[d].am || {}) },
              pm: { ...cell(), ...(raw[d].pm || {}) },
            };
          }
        }
        return f;
      }
      return fresh();
    } catch {
      return fresh();
    }
  });

  const [lists, setLists] = useState<Lists>({ hospitals: [], branches: [], doctors: [], pharmacies: [] });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (startDate) params.set('weekStart', startDate);
      if (repId) params.set('repId', repId);
      params.set('team', isManagerPersonal ? 'true' : 'false');
      await downloadExcelFromUrl(
        `/api/exports/weekly-plans?${params.toString()}`,
        `REP_TRACK_Weekly_Plan_${startDate || new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (e) {
      console.error('Export failed', e);
      setError(ar ? 'فشل تصدير الخطة الأسبوعية' : 'Failed to export weekly plan');
    } finally {
      setExporting(false);
    }
  };

  const repName = useMemo(() => reps.find(r => r.id === repId)?.name, [reps, repId]);

  useEffect(() => {
    const q = isManagerPersonal && repName ? `?rep=${encodeURIComponent(repName)}` : '';
    fetch('/api/lists' + q)
      .then(r => r.json())
      .then(x => setLists(x.data || { hospitals: [], branches: [], doctors: [], pharmacies: [] }))
      .catch(() => setError(l('Unable to load My Lists', 'تعذر تحميل القوائم')));
  }, [isManagerPersonal, repName, l]);

  const change = (day: string, period: 'am' | 'pm', patch: Partial<Cell>) =>
    setPlan(p => ({ ...p, [day]: { ...p[day], [period]: { ...p[day][period], ...patch } } }));

  const select = (values: HTMLOptionsCollection) =>
    Array.from(values)
      .filter(x => x.selected)
      .map(x => x.value);

  function formatCellToReadable(c: Cell, l: Lists): string {
    const parts: string[] = [];
    if (c.visitType) {
      const vt = c.visitType === 'Double' ? `Double visit (Companion: ${c.companion || '—'})` : 'Single visit';
      parts.push(`Visit Type: ${vt}`);
    }
    if (c.hospitalIds?.length) {
      const names = c.hospitalIds.map(id => l.hospitals.find(h => h.id === id)?.name || id);
      parts.push(`Hospitals: ${names.join(', ')}`);
    }
    if (c.branchIds?.length) {
      const names = c.branchIds.map(id => l.branches.find(b => b.id === id)?.name || id);
      parts.push(`Branches: ${names.join(', ')}`);
    }
    if (c.doctorIds?.length) {
      const names = c.doctorIds.map(id => l.doctors.find(d => d.id === id)?.name || id);
      parts.push(`Doctors: ${names.join(', ')}`);
    }
    if (c.pharmacyIds?.length) {
      const names = c.pharmacyIds.map(id => l.pharmacies.find(p => p.id === id)?.name || id);
      parts.push(`Pharmacies: ${names.join(', ')}`);
    }
    if (c.activities?.length) {
      const acts = c.activities.map(a =>
        a === 'SALES_REVIEW_ADMIN' ? 'Sales Review / Admin Work' : a === 'OTHERS' ? 'Others' : a
      );
      parts.push(`Activities: ${acts.join(', ')}`);
    }
    if (c.salesReviewDescription) parts.push(`Sales Review Note: ${c.salesReviewDescription}`);
    if (c.othersDescription) parts.push(`Others Note: ${c.othersDescription}`);
    if (c.meetingDescription) parts.push(`Meeting Note: ${c.meetingDescription}`);
    if (c.trainingDescription) parts.push(`Training Note: ${c.trainingDescription}`);
    if (c.eventDescription) parts.push(`Event Note: ${c.eventDescription}`);
    return parts.join(' · ') || '—';
  }

  async function save() {
    setError('');

    // Pre-flight validation
    for (const day of DAYS) {
      for (const period of ['am', 'pm'] as const) {
        const c = plan[day][period];
        const periodLabel = `${day[0].toUpperCase() + day.slice(1)} ${period.toUpperCase()}`;

        if (c.visitType === 'Double' && !c.companion.trim()) {
          const msg = l(
            `Companion name is required for ${periodLabel} Double visit`,
            `اسم المرافق مطلوب لزيارة ${periodLabel} المشتركة`
          );
          setError(msg);
          onError?.(msg);
          return;
        }
        if (c.activities.includes('TRAINING') && !c.trainingDescription.trim()) {
          const msg = l(
            `Training description is required for ${periodLabel}`,
            `وصف التدريب مطلوب لـ ${periodLabel}`
          );
          setError(msg);
          onError?.(msg);
          return;
        }
        if (c.activities.includes('EVENT') && !c.eventDescription.trim()) {
          const msg = l(
            `Event description is required for ${periodLabel}`,
            `وصف الفعالية مطلوب لـ ${periodLabel}`
          );
          setError(msg);
          onError?.(msg);
          return;
        }
        if (c.activities.includes('SALES_REVIEW_ADMIN') && !c.salesReviewDescription.trim()) {
          const msg = l(
            `Sales Review / Admin Work description is required for ${periodLabel}`,
            `وصف مراجعة المبيعات / عمل إداري مطلوب لـ ${periodLabel}`
          );
          setError(msg);
          onError?.(msg);
          return;
        }
        if (c.activities.includes('OTHERS') && !c.othersDescription.trim()) {
          const msg = l(
            `Others description is required for ${periodLabel}`,
            `وصف أخرى مطلوب لـ ${periodLabel}`
          );
          setError(msg);
          onError?.(msg);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const legacy = Object.fromEntries(
        DAYS.flatMap(d => [
          [`${d}Am`, formatCellToReadable(plan[d].am, lists)],
          [`${d}Pm`, formatCellToReadable(plan[d].pm, lists)],
        ])
      );
      const body = {
        rep: repName || selectedRep,
        repId: repId || undefined,
        isManagerPersonal: Boolean(isManagerPersonal),
        selectedRepId: repId || undefined,
        startDate,
        endDate,
        structuredPlan: plan,
        status: 'Submitted',
        ...legacy,
      };
      const r = await fetch('/api/weekly-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const x = await r.json();
      if (!r.ok) throw new Error(x.message || 'Unable to save plan');
      onSuccess?.(l('Weekly AM/PM plan saved successfully ✓', 'تم حفظ الخطة الأسبوعية بنجاح ✓'));
      onPlanSaved?.(x.plan);
    } catch (e) {
      const m = e instanceof Error ? e.message : l('Unable to save plan', 'تعذر حفظ الخطة الأسبوعية');
      setError(m);
      onError?.(m);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5" dir={ar ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface)] p-5 rounded-2xl border border-[var(--line)] shadow-xs">
        <div>
          <h2 className="text-xl font-black text-[var(--ink)]">
            {l('Weekly Plan — Structured AM / PM', 'الخطة الأسبوعية — تنظيم صباحي / مسائي')}
          </h2>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5">
            {l(
              'Set your AM and PM field targets, visit types, companion details, and specific activities for each day.',
              'حدد مستهدفاتك الميدانية الصباحية والمسائية، ونوع الزيارة، وتفاصيل المرافق، والأنشطة المحددة لكل يوم.'
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleExportExcel}
          isLoading={exporting}
          leftIcon={<Download className="size-4" />}
        >
          {l('Export Excel (.xlsx)', 'تصدير إكسيل (.xlsx)')}
        </Button>
      </div>

      {error && <InlineAlert tone="error">{error}</InlineAlert>}

      <FormSection title={l('Plan Context', 'سياق الخطة')}>
        {isManagerPersonal && (
          <label className="sm:col-span-2 block text-sm font-semibold">
            {l('Supervised Medical Representative', 'المندوب الطبي الخاضع للإشراف')} *
            <select
              required
              className="input mt-1 w-full"
              value={repId}
              onChange={e => {
                setRepId(e.target.value);
                setPlan(fresh());
              }}
            >
              <option value="">{l('Select authorized MR...', 'اختر مندوباً معتمداً...')}</option>
              {reps.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <FormField
          label={l('Week start', 'بداية الأسبوع')}
          type="date"
          value={startDate}
          onChange={v => {
            setStartDate(v);
            const d = new Date(v + 'T12:00:00');
            d.setDate(d.getDate() + 6);
            setEndDate(d.toISOString().slice(0, 10));
          }}
          required
        />
        <FormField
          label={l('Week end', 'نهاية الأسبوع')}
          type="date"
          value={endDate}
          onChange={setEndDate}
          required
        />
      </FormSection>

      <CustomFieldsRenderer
        section="weekly_plan"
        values={customFieldValues}
        onChange={setCustomFieldValues}
      />

      {DAYS.map(day => (
        <FormSection
          key={day}
          title={l(
            day[0].toUpperCase() + day.slice(1),
            day === 'saturday'
              ? 'السبت'
              : day === 'sunday'
              ? 'الأحد'
              : day === 'monday'
              ? 'الاثنين'
              : day === 'tuesday'
              ? 'الثلاثاء'
              : day === 'wednesday'
              ? 'الأربعاء'
              : day === 'thursday'
              ? 'الخميس'
              : 'الجمعة'
          )}
        >
          {(['am', 'pm'] as const).map(period => {
            const c = plan[day][period];
            const isAm = period === 'am';

            return (
              <div
                key={period}
                className="space-y-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm uppercase text-[var(--ink)]">
                      {isAm ? l('AM — Morning', 'صباحاً (AM)') : l('PM — Afternoon', 'مساءً (PM)')}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[var(--surface-subtle)] text-[var(--ink-soft)] border border-[var(--line)]">
                    {c.visitType === 'Double' ? l('Double visit', 'زيارة مشتركة') : l('Single visit', 'زيارة فردية')}
                  </span>
                </div>

                {/* 1. Visit Type Selection (Single or Double visit, with companion name if Double) */}
                <div className="space-y-2 rounded-lg bg-[var(--surface-subtle)] p-3 border border-[var(--line)]">
                  <fieldset>
                    <legend className="text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                      {l('Visit Type', 'نوع الزيارة (Visit Type)')} *
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-5">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[var(--ink)]">
                        <input
                          type="radio"
                          name={`visit-type-${day}-${period}`}
                          value="Single"
                          checked={c.visitType !== 'Double'}
                          onChange={() => change(day, period, { visitType: 'Single', companion: '' })}
                          className="accent-[var(--gold)]"
                        />
                        {l('Single visit', 'زيارة فردية (Single visit)')}
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[var(--ink)]">
                        <input
                          type="radio"
                          name={`visit-type-${day}-${period}`}
                          value="Double"
                          checked={c.visitType === 'Double'}
                          onChange={() => change(day, period, { visitType: 'Double' })}
                          className="accent-[var(--gold)]"
                        />
                        {l('Double visit', 'زيارة مشتركة (Double visit)')}
                      </label>
                    </div>
                  </fieldset>

                  {c.visitType === 'Double' && (
                    <div className="pt-2 animate-fade-in">
                      <FormField
                        label={l('Companion Name', 'اسم المرافق')}
                        placeholder={l('Enter name of companion...', 'أدخل اسم الشخص المرافق...')}
                        value={c.companion}
                        onChange={v => change(day, period, { companion: v })}
                        required
                      />
                    </div>
                  )}
                </div>

                {/* 2. Customer Entities (AM: Hospitals & Branches; PM: Doctors & Pharmacies) */}
                {isAm ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-[var(--ink)]">
                      {l('Hospitals', 'المستشفيات')}
                      <select
                        multiple
                        className="input mt-1 min-h-24 w-full"
                        value={c.hospitalIds}
                        onChange={e => change(day, period, { hospitalIds: select(e.currentTarget.options) })}
                      >
                        {lists.hospitals.map(x => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold text-[var(--ink)]">
                      {l('Distribution Branches', 'فروع التوزيع')}
                      <select
                        multiple
                        className="input mt-1 min-h-24 w-full"
                        value={c.branchIds}
                        onChange={e => change(day, period, { branchIds: select(e.currentTarget.options) })}
                      >
                        {lists.branches.map(x => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-[var(--ink)]">
                      {l('Doctors', 'الأطباء')}
                      <select
                        multiple
                        className="input mt-1 min-h-24 w-full"
                        value={c.doctorIds}
                        onChange={e => change(day, period, { doctorIds: select(e.currentTarget.options) })}
                      >
                        {lists.doctors.map(x => (
                          <option key={x.id} value={x.id}>
                            {x.name} {x.specialty ? `· ${x.specialty}` : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold text-[var(--ink)]">
                      {l('Pharmacies', 'الصيدليات')}
                      <select
                        multiple
                        className="input mt-1 min-h-24 w-full"
                        value={c.pharmacyIds}
                        onChange={e => change(day, period, { pharmacyIds: select(e.currentTarget.options) })}
                      >
                        {lists.pharmacies.map(x => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {/* 3. Activities Checkboxes */}
                <fieldset className="pt-1">
                  <legend className="text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                    {l('Activities', 'الأنشطة')}
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {ACTS.map(a => (
                      <label className="flex items-center gap-2 text-sm cursor-pointer text-[var(--ink)] font-medium" key={a}>
                        <input
                          type="checkbox"
                          checked={c.activities.includes(a)}
                          onChange={e =>
                            change(day, period, {
                              activities: e.target.checked
                                ? [...c.activities, a]
                                : c.activities.filter(x => x !== a),
                            })
                          }
                          className="accent-[var(--gold)]"
                        />
                        {a === 'SALES_REVIEW_ADMIN'
                          ? l('Sales Review / Admin Work', 'مراجعة المبيعات / عمل إداري')
                          : a === 'MEETING'
                          ? l('Weekly Meeting', 'اجتماع أسبوعي')
                          : a === 'TRAINING'
                          ? l('Training', 'تدريب')
                          : a === 'EVENT'
                          ? l('Event', 'فعالية')
                          : l('Others', 'أخرى')}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* 4. Conditional Description Fields for Activities */}

                {c.activities.includes('TRAINING') && (
                  <div className="animate-fade-in">
                    <FormField
                      label={l('Training description', 'وصف التدريب')}
                      placeholder={l('Describe the training...', 'أدخل تفاصيل التدريب...')}
                      value={c.trainingDescription}
                      onChange={v => change(day, period, { trainingDescription: v })}
                      required
                    />
                  </div>
                )}

                {c.activities.includes('EVENT') && (
                  <div className="animate-fade-in">
                    <FormField
                      label={l('Event description', 'وصف الفعالية')}
                      placeholder={l('Describe the event...', 'أدخل تفاصيل الفعالية...')}
                      value={c.eventDescription}
                      onChange={v => change(day, period, { eventDescription: v })}
                      required
                    />
                  </div>
                )}

                {c.activities.includes('SALES_REVIEW_ADMIN') && (
                  <div className="animate-fade-in">
                    <FormField
                      label={l('Sales Review / Admin Work description', 'وصف مراجعة المبيعات / عمل إداري')}
                      placeholder={l('Describe administrative / sales review work...', 'أدخل تفاصيل العمل الإداري أو مراجعة المبيعات...')}
                      value={c.salesReviewDescription}
                      onChange={v => change(day, period, { salesReviewDescription: v })}
                      required
                    />
                  </div>
                )}

                {c.activities.includes('OTHERS') && (
                  <div className="animate-fade-in">
                    <FormField
                      label={l('Others description', 'وصف أخرى')}
                      placeholder={l('Describe other activities...', 'أدخل تفاصيل الأنشطة الأخرى...')}
                      value={c.othersDescription}
                      onChange={v => change(day, period, { othersDescription: v })}
                      required
                    />
                  </div>
                )}
              </div>
            );
          })}
        </FormSection>
      ))}

      <div className="flex justify-end pt-2">
        <Button
          onClick={() => void save()}
          disabled={Boolean(isManagerPersonal && !repId)}
          isLoading={saving}
          size="lg"
        >
          {l('Save / Submit Plan', 'حفظ / إرسال الخطة الأسبوعية')}
        </Button>
      </div>
    </div>
  );
}
