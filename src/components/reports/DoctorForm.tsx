'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { BUSINESS_PRODUCT_OPTIONS, PRESCRIPTION_RATE_OPTIONS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18nContext';
import { SavedCustomerDetails, VisitMode } from './SavedCustomerDetails';
import { getReportingWindowStatus, isDateSubmissionOpen } from '@/lib/business/reportingWindow';
import { CustomFieldsRenderer } from '@/components/ui/CustomFieldsRenderer';
import { Send, CheckCircle2, Users, Award, Sparkles, RefreshCw } from 'lucide-react';

type Doctor = {
  id: string;
  name: string;
  specialty?: string;
  clinicAddress?: string;
  area?: string;
  address?: string;
  classification?: string;
  defaultCycle?: number;
};

type Product = {
  id: string;
  name: string;
};

type StageKey = 'Awareness' | 'Trial' | 'Regular' | 'Loyal';

interface StageReportData {
  stages: Record<StageKey, { count: number; doctors: string[] }>;
  totalVisited: number;
}

const DEFAULT_STAGE_DATA: StageReportData = {
  stages: {
    Awareness: { count: 0, doctors: [] },
    Trial: { count: 0, doctors: [] },
    Regular: { count: 0, doctors: [] },
    Loyal: { count: 0, doctors: [] },
  },
  totalVisited: 0,
};

export function DoctorForm({
  selectedRep,
  onSuccess,
  onError,
}: {
  selectedRep: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const l = (e: string, a: string) => (ar ? a : e);

  const windowStatus = getReportingWindowStatus();
  const [visitDate, setVisitDate] = useState(windowStatus.todayDate);
  const isClosed = !isDateSubmissionOpen(visitDate);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [rates, setRates] = useState<Record<string, string>>({});
  const [visitType, setVisitType] = useState<VisitMode>('Single');
  const [companion, setCompanion] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // Full report state for visited doctors by prescription rate stage (Edit 5)
  const [stageReport, setStageReport] = useState<StageReportData>(DEFAULT_STAGE_DATA);
  const [loadingStages, setLoadingStages] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [sendingReport, setSendingReport] = useState(false);

  // Load lists, catalog, and prescription stages report
  const fetchStageReport = useCallback(async () => {
    try {
      setLoadingStages(true);
      const res = await fetch('/api/reports/doctor/summary');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setStageReport(json.data);
        }
      }
    } catch (e) {
      console.warn('Could not load stage summary:', e);
    } finally {
      setLoadingStages(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/lists').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ]).then(([a, b]) => {
      setDoctors(a.data?.doctors || []);
      setCatalog(b.products || []);
    });

    void fetchStageReport();
  }, [fetchStageReport]);

  const selected = doctors.find((d) => d.id === doctorId);
  const options = useMemo(
    () =>
      BUSINESS_PRODUCT_OPTIONS.map((option) => ({
        ...option,
        product: catalog.find(
          (p) => p.name.toLowerCase() === option.canonicalName.toLowerCase()
        ),
      })).filter((x) => x.product),
    [catalog]
  );

  // Send report automatically to assigned managers up to SMD
  const autoSendReportToManagers = async () => {
    try {
      setSendingReport(true);
      const res = await fetch('/api/reports/doctor/summary', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setDispatchStatus(
          ar
            ? `✓ تم تحديث تقرير المراحل وإرساله تلقائياً إلى جميع المديرين حتى مدير القطاع (SMD)`
            : `✓ Stage report updated and sent automatically to all managers up to SMD`
        );
      }
    } catch (e) {
      console.warn('Auto send report error:', e);
    } finally {
      setSendingReport(false);
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isClosed) {
      setError(
        l(
          'Submission window closed for this date. Reports must be submitted by maximum 9:00 AM the next day. The system cannot accept reporting after this time.',
          'انتهت مهلة التقديم لهذا اليوم (الحد الأقصى 9:00 صباحاً في اليوم التالي). لا يقبل النظام تقارير بعد هذا الوقت.'
        )
      );
      return;
    }

    const products = Object.entries(rates)
      .filter(([, rate]) => rate)
      .map(([productId, prescriptionRate]) => ({ productId, prescriptionRate }));

    if (!doctorId || !products.length || (visitType === 'Double' && !companion.trim())) {
      setError(
        l(
          'Select a doctor and product rate, and enter a companion for a Double visit.',
          'اختر الطبيب ومعدل المنتج وأدخل المرافق للزيارة المشتركة.'
        )
      );
      return;
    }

    setSaving(true);
    try {
      const r = await fetch('/api/reports/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          products,
          visitType,
          companion,
          visitDate,
          customFieldValues,
          notes: notes.trim() || undefined,
        }),
      });

      const x = await r.json();
      if (!r.ok || !x.success) throw new Error(x.message);

      // Successfully saved
      onSuccess(l('Doctor visit saved.', 'تم حفظ زيارة الطبيب.'));

      // Edit 5: Update the stage report automatically in real-time
      const doctorName = selected?.name || 'Doctor';
      const newStage = (products[0]?.prescriptionRate as StageKey) || 'Awareness';

      setStageReport((prev) => {
        const nextStages = {
          Awareness: { count: prev.stages.Awareness.count, doctors: [...prev.stages.Awareness.doctors] },
          Trial: { count: prev.stages.Trial.count, doctors: [...prev.stages.Trial.doctors] },
          Regular: { count: prev.stages.Regular.count, doctors: [...prev.stages.Regular.doctors] },
          Loyal: { count: prev.stages.Loyal.count, doctors: [...prev.stages.Loyal.doctors] },
        };

        // Remove doctor from any stage they were previously in
        let wasPresent = false;
        (Object.keys(nextStages) as StageKey[]).forEach((s) => {
          const idx = nextStages[s].doctors.indexOf(doctorName);
          if (idx !== -1) {
            nextStages[s].doctors.splice(idx, 1);
            nextStages[s].count = Math.max(0, nextStages[s].count - 1);
            wasPresent = true;
          }
        });

        // Add doctor to the new stage
        if (nextStages[newStage]) {
          nextStages[newStage].doctors.push(doctorName);
          nextStages[newStage].count += 1;
        }

        const totalVisited = wasPresent ? prev.totalVisited : prev.totalVisited + 1;
        return { stages: nextStages, totalVisited };
      });

      // Automatically send this updated report to assigned managers up to SMD
      void autoSendReportToManagers();

      // Reset form fields
      setDoctorId('');
      setRates({});
      setVisitType('Single');
      setCompanion('');
      setNotes('');
      setCustomFieldValues({});
      setError('');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Unable to save';
      setError(message);
      onError(message);
    } finally {
      setSaving(false);
    }
  }

  const STAGE_CONFIG: Record<
    StageKey,
    { labelEn: string; labelAr: string; color: string; badgeColor: string; bgBorder: string }
  > = {
    Awareness: {
      labelEn: 'Awareness',
      labelAr: 'الوعي (Awareness)',
      color: 'text-sky-700 dark:text-sky-300',
      badgeColor: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
      bgBorder: 'border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20',
    },
    Trial: {
      labelEn: 'Trial',
      labelAr: 'التجربة (Trial)',
      color: 'text-amber-700 dark:text-amber-300',
      badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      bgBorder: 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20',
    },
    Regular: {
      labelEn: 'Regular',
      labelAr: 'الاعتياد (Regular)',
      color: 'text-indigo-700 dark:text-indigo-300',
      badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      bgBorder: 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20',
    },
    Loyal: {
      labelEn: 'Loyal',
      labelAr: 'الولاء (Loyal)',
      color: 'text-emerald-700 dark:text-emerald-300',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      bgBorder: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20',
    },
  };

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="space-y-5">
        <h2 className="text-2xl font-black">{l('Doctor Submit Visit', 'تسجيل زيارة طبيب')}</h2>
        {error && <InlineAlert tone="error">{error}</InlineAlert>}

        <label className="block text-sm font-semibold">
          {l('Visit Date', 'تاريخ الزيارة')} *
          <input
            required
            type="date"
            className="input mt-1 w-full"
            value={visitDate}
            min={windowStatus.minAllowedDate}
            max={windowStatus.maxAllowedDate}
            onChange={(e) => setVisitDate(e.target.value)}
          />
        </label>

        {isClosed && (
          <InlineAlert tone="error">
            {l(
              'Submission window closed for this date. Reports are accepted maximum the next day at 9:00 AM. System cannot accept reporting after this time.',
              'انتهت مهلة التقديم لهذا التاريخ (الحد الأقصى 9:00 صباحاً في اليوم التالي). لا يقبل النظام تقارير بعد هذا الوقت.'
            )}
          </InlineAlert>
        )}

        <label className="block text-sm font-semibold">
          {l('Doctor Name', 'اسم الطبيب')} *
          <select
            required
            className="input mt-1 w-full"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
          >
            <option value="">{l('Select saved doctor…', 'اختر طبيباً محفوظاً…')}</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <SavedCustomerDetails
          category="doctor"
          customer={selected}
          visitMode={visitType}
          companion={companion}
          onVisitModeChange={(value) => {
            setVisitType(value);
            if (value === 'Single') setCompanion('');
          }}
          onCompanionChange={setCompanion}
        />

        <CustomFieldsRenderer
          section="doctor_visit"
          values={customFieldValues}
          onChange={setCustomFieldValues}
        />

        <fieldset>
          <legend className="font-bold">
            {l('Products Discussed and Prescription Rate', 'المنتجات ومعدل الوصف')}
          </legend>
          <div className="mt-3 space-y-3">
            {options.map(({ label, product }) => (
              <div
                key={product!.id}
                className="grid gap-2 rounded-xl border border-[var(--line)] p-3 sm:grid-cols-2"
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rates[product!.id] !== undefined}
                    onChange={(e) =>
                      setRates((current) => {
                        const next = { ...current };
                        if (e.target.checked) next[product!.id] = 'Awareness';
                        else delete next[product!.id];
                        return next;
                      })
                    }
                  />
                  {label}
                </label>
                {rates[product!.id] !== undefined && (
                  <select
                    aria-label={`${label} Prescription Rate`}
                    className="input"
                    value={rates[product!.id]}
                    onChange={(e) =>
                      setRates({ ...rates, [product!.id]: e.target.value })
                    }
                  >
                    {PRESCRIPTION_RATE_OPTIONS.map((rate) => (
                      <option key={rate.value} value={rate.value}>
                        {ar ? rate.labelAr : rate.labelEn}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        {/* Edit 1: Manual Notes Field */}
        <label className="block text-sm font-semibold">
          {l('Notes', 'ملاحظات')}
          <textarea
            className="input mt-1 w-full"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={l(
              'Write notes for this visit (optional)...',
              'اكتب ملاحظات لهذه الزيارة (اختياري)...'
            )}
          />
        </label>

        <Button type="submit" isLoading={saving} disabled={isClosed}>
          {isClosed ? l('Closed (Past 9:00 AM)', 'مغلق (بعد 9:00 ص)') : l('Submit', 'إرسال')}
        </Button>
      </form>

      {/* Edit 5: Visited Doctors Prescription Rate Stages Full Report */}
      <div className="pt-6 border-t border-[var(--line)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-[var(--gold)]" />
              <h3 className="text-lg font-black text-[var(--ink)]">
                {l(
                  'Visited Doctors by Prescription Rate Stage (Full Report)',
                  'تقرير الأطباء الذين تمت زيارتهم حسب مرحلة معدل الوصف'
                )}
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              {l(
                'Updates automatically after each visit to move doctors between stages, and automatically submits to assigned managers up to SMD.',
                'يتم التحديث تلقائياً بعد كل زيارة لنقل الأطباء بين المراحل، ويُرسل تلقائياً إلى المديرين حتى مدير القطاع (SMD).'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[var(--surface-subtle)] border border-[var(--line)] text-[var(--ink)]">
              <Users className="size-3.5 text-[var(--gold)]" />
              <span>
                {stageReport.totalVisited} {l('Visited Doctors', 'طبيب تمت زيارته')}
              </span>
            </span>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              isLoading={sendingReport}
              onClick={() => void autoSendReportToManagers()}
              leftIcon={<Send className="size-3.5" />}
            >
              {l('Send Report to Managers', 'إرسال التقرير للمديرين')}
            </Button>
          </div>
        </div>

        {dispatchStatus && (
          <InlineAlert tone="success">{dispatchStatus}</InlineAlert>
        )}

        {/* 4 Stages Breakdown Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(['Awareness', 'Trial', 'Regular', 'Loyal'] as StageKey[]).map((stageKey) => {
            const cfg = STAGE_CONFIG[stageKey];
            const data = stageReport.stages[stageKey] || { count: 0, doctors: [] };
            const pct =
              stageReport.totalVisited > 0
                ? Math.round((data.count / stageReport.totalVisited) * 100)
                : 0;

            return (
              <div
                key={stageKey}
                className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between space-y-3 ${cfg.bgBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-[var(--ink)]">
                      {ar ? cfg.labelAr : cfg.labelEn}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black border ${cfg.badgeColor}`}
                    >
                      {data.count}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-[var(--ink)] font-mono">
                      {data.count}
                    </span>
                    <span className="text-xs font-bold text-[var(--ink-soft)]">
                      ({pct}%)
                    </span>
                  </div>

                  {/* Doctor Names List */}
                  <div className="mt-3 pt-3 border-t border-[var(--line)] space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    <span className="text-[11px] font-bold text-[var(--ink-soft)] block uppercase tracking-wider">
                      {l('Doctor Names:', 'أسماء الأطباء:')}
                    </span>
                    {data.doctors.length === 0 ? (
                      <p className="text-xs text-[var(--ink-muted)] italic">
                        {l('No doctors in this stage yet', 'لا يوجد أطباء في هذه المرحلة')}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {data.doctors.map((docName, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]"
                          >
                            {docName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-[var(--ink-soft)] font-medium">
                  {data.doctors.length}{' '}
                  {l('doctors recorded', 'طبيب مسجل في هذه المرحلة')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
