'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { BUSINESS_PRODUCT_OPTIONS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18nContext';
import { SavedCustomerDetails, VisitMode } from './SavedCustomerDetails';
import { getReportingWindowStatus, isDateSubmissionOpen } from '@/lib/business/reportingWindow';

type Item = {
  id: string;
  name: string;
  coverageArea?: string;
  address?: string;
  contact?: string;
  phone?: string;
  distributedProducts?: string;
  defaultCycle?: number;
};

export function BranchForm({
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

  const [branches, setBranches] = useState<Item[]>([]);
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [branchId, setBranchId] = useState('');
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [visitType, setVisitType] = useState<VisitMode>('Single');
  const [companion, setCompanion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/lists').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ]).then(([a, b]) => {
      setBranches(a.data?.branches || []);
      setCatalog(b.products || []);
    });
  }, []);

  const products = useMemo(
    () =>
      BUSINESS_PRODUCT_OPTIONS.map((x) => ({
        ...x,
        product: catalog.find(
          (p) => p.name.toLowerCase() === x.canonicalName.toLowerCase()
        ),
      })).filter((x) => x.product),
    [catalog]
  );

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
    const rows = Object.entries(observations).map(([productId, observation]) => ({
      productId,
      observation,
    }));
    if (
      !branchId ||
      !rows.length ||
      (visitType === 'Double' && !companion.trim())
    ) {
      setError(
        l(
          'Select a branch and product, and enter a companion for a Double visit.',
          'اختر الفرع والمنتج وأدخل المرافق للزيارة المشتركة.'
        )
      );
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/reports/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          products: rows,
          visitType,
          companion,
          visitDate,
        }),
      });
      const x = await r.json();
      if (!r.ok || !x.success) throw new Error(x.message);
      onSuccess(l('Distribution Branch visit saved.', 'تم حفظ زيارة فرع التوزيع.'));
      setBranchId('');
      setObservations({});
      setVisitType('Single');
      setCompanion('');
      setError('');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Unable to save';
      setError(message);
      onError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="text-2xl font-black">
        {l('Distribution Branch Submit Visit', 'تسجيل زيارة فرع توزيع')}
      </h2>
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
        {l('Name', 'الاسم')} *
        <select
          required
          className="input mt-1 w-full"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
        >
          <option value="">{l('Select saved branch…', 'اختر فرعاً محفوظاً…')}</option>
          {branches.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </label>
      <SavedCustomerDetails
        category="branch"
        customer={branches.find((x) => x.id === branchId)}
        visitMode={visitType}
        companion={companion}
        onVisitModeChange={(value) => {
          setVisitType(value);
          if (value === 'Single') setCompanion('');
        }}
        onCompanionChange={setCompanion}
      />
      <fieldset>
        <legend className="font-bold">
          {l('Distributed Products', 'المنتجات الموزعة')}
        </legend>
        <div className="mt-3 space-y-3">
          {products.map(({ label, product }) => (
            <div
              key={product!.id}
              className="rounded-xl border border-[var(--line)] p-3"
            >
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={observations[product!.id] !== undefined}
                  onChange={(e) =>
                    setObservations((current) => {
                      const next = { ...current };
                      if (e.target.checked) next[product!.id] = '';
                      else delete next[product!.id];
                      return next;
                    })
                  }
                />
                {label}
              </label>
              {observations[product!.id] !== undefined && (
                <div className="mt-2">
                  <FormField
                    multiline
                    label={l('Notes and Observations', 'الملاحظات لكل منتج')}
                    value={observations[product!.id]}
                    onChange={(observation) =>
                      setObservations({
                        ...observations,
                        [product!.id]: observation,
                      })
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </fieldset>
      <Button type="submit" isLoading={saving} disabled={isClosed}>
        {isClosed
          ? l('Closed (Past 9:00 AM)', 'مغلق (بعد 9:00 ص)')
          : l('Submit', 'إرسال')}
      </Button>
    </form>
  );
}

