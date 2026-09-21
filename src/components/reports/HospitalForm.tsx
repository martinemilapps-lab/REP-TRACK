'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SectionCard } from '@/components/ui/SectionCard';
import { HOSPITAL_DEPARTMENTS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18nContext';
import { SavedCustomerDetails, VisitMode } from './SavedCustomerDetails';
import { getReportingWindowStatus, isDateSubmissionOpen } from '@/lib/business/reportingWindow';

type Hospital = {
  id: string;
  name: string;
  area: string;
  hospitalTypes?: string[];
  address?: string;
  defaultCycle?: number;
};
type Product = { id: string; name: string };
type Department = { key: string; department: string; doctors: Array<{ key: string; name: string }> };
type Visit = {
  key: string;
  hospitalId: string;
  productIds: string[];
  departments: Department[];
  visitType: VisitMode;
  companion: string;
  hasOthers: boolean;
  othersDescription: string;
};

const uid = () => crypto.randomUUID();
const makeDepartment = (): Department => ({ key: uid(), department: '', doctors: [{ key: uid(), name: '' }] });
const makeVisit = (): Visit => ({
  key: uid(),
  hospitalId: '',
  productIds: [],
  departments: [makeDepartment()],
  visitType: 'Single',
  companion: '',
  hasOthers: false,
  othersDescription: '',
});

export function HospitalForm({
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
  const [reportDate, setReportDate] = useState(windowStatus.todayDate);
  const isClosed = !isDateSubmissionOpen(reportDate);
  const [visits, setVisits] = useState<Visit[]>([makeVisit()]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetch('/api/lists').then((r) => r.json()), fetch('/api/products').then((r) => r.json())])
      .then(([lists, catalog]) => {
        if (!lists.success || !catalog.success) throw new Error();
        setHospitals(lists.data.hospitals);
        setProducts(catalog.products);
      })
      .catch(() => setError(ar ? 'تعذر تحميل المستشفيات والمنتجات.' : 'Unable to load saved hospitals and products.'));
  }, [ar]);

  const change = (i: number, next: Visit) => setVisits((rows) => rows.map((row, n) => (n === i ? next : row)));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (
      visits.some(
        (v) =>
          !v.hospitalId ||
          (v.visitType === 'Double' && !v.companion.trim()) ||
          !v.departments.length ||
          v.departments.some((d) => !d.department || d.doctors.some((x) => !x.name.trim()))
      )
    ) {
      setError(
        l(
          'Select a hospital and complete visit status, department, and doctor fields.',
          'اختر المستشفى وأكمل حالة الزيارة والقسم والطبيب.'
        )
      );
      return;
    }

    if (visits.some((v) => v.hasOthers && !v.othersDescription.trim())) {
      setError(l('Please enter description for Others.', 'يرجى إدخال وصف للنشاط الآخر (أخرى).'));
      return;
    }

    if (isClosed) {
      setError(
        l(
          'Submission window closed for this date. Reports must be submitted by maximum 9:00 AM the next day (12:00 AM to 9:00 AM). The system cannot accept reporting after this time.',
          'انتهت مهلة التقديم لهذا التاريخ (الحد الأقصى 9:00 صباحاً في اليوم التالي من 12:00 ص إلى 9:00 ص). النظام لا يقبل أي تقارير بعد هذا الوقت.'
        )
      );
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/reports/hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportDate,
          visits: visits.map((v) => ({
            ...v,
            hasOthers: v.hasOthers,
            othersDescription: v.hasOthers ? v.othersDescription.trim() : '',
            departments: v.departments.map((d) => ({
              department: d.department,
              doctors: d.doctors.map((x) => x.name),
            })),
          })),
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message);
      onSuccess(l('Hospital report saved.', 'تم حفظ تقرير المستشفى.'));
      setVisits([makeVisit()]);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : l('Unable to save report.', 'تعذر حفظ التقرير.');
      setError(message);
      onError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" dir={ar ? 'rtl' : 'ltr'}>
      <h2 className="text-2xl font-black">{l('Hospital Submit Visit', 'تسجيل زيارة مستشفى')}</h2>
      {error && <InlineAlert tone="error">{error}</InlineAlert>}
      <label className="block text-sm font-semibold">
        {l('Report date', 'تاريخ التقرير')}
        <input
          required
          type="date"
          className="input mt-1"
          value={reportDate}
          min={windowStatus.minAllowedDate}
          max={windowStatus.maxAllowedDate}
          onChange={(e) => setReportDate(e.target.value)}
        />
      </label>
      {isClosed && (
        <InlineAlert tone="error">
          {l(
            'Submission window closed for this date. Reports are accepted maximum the next day at 9:00 AM. The system cannot accept reporting after this time.',
            'انتهت مهلة التقديم لهذا التاريخ (الحد الأقصى 9:00 صباحاً في اليوم التالي). النظام لا يقبل تسجيل تقارير بعد هذا الوقت.'
          )}
        </InlineAlert>
      )}
      {visits.map((visit, vi) => (
        <SectionCard
          key={visit.key}
          title={`${l('Hospital visit', 'زيارة مستشفى')} ${vi + 1}`}
          actions={
            visits.length > 1 ? (
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={() => setVisits((rows) => rows.filter((x) => x.key !== visit.key))}
              >
                {l('Remove', 'حذف')}
              </Button>
            ) : undefined
          }
        >
          <label className="text-sm font-semibold">
            {l('Hospital', 'المستشفى')} *
            <select
              required
              className="input mt-1 w-full"
              value={visit.hospitalId}
              onChange={(e) => change(vi, { ...visit, hospitalId: e.target.value })}
            >
              <option value="">{l('Select saved hospital…', 'اختر مستشفى محفوظة…')}</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} · {h.area}
                </option>
              ))}
            </select>
          </label>
          <SavedCustomerDetails
            category="hospital"
            customer={hospitals.find((h) => h.id === visit.hospitalId)}
            visitMode={visit.visitType}
            companion={visit.companion}
            onVisitModeChange={(visitType) =>
              change(vi, { ...visit, visitType, companion: visitType === 'Single' ? '' : visit.companion })
            }
            onCompanionChange={(companion) => change(vi, { ...visit, companion })}
          />
          <fieldset className="mt-4">
            <legend className="text-sm font-bold">{l('Products', 'المنتجات')}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {products.map((product) => (
                <label key={product.id} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={visit.productIds.includes(product.id)}
                    onChange={(e) =>
                      change(vi, {
                        ...visit,
                        productIds: e.target.checked
                          ? [...visit.productIds, product.id]
                          : visit.productIds.filter((id) => id !== product.id),
                      })
                    }
                  />
                  {product.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-5 space-y-3">
            <div className="flex justify-between">
              <h3 className="font-bold">{l('Departments and Doctors Visited', 'الأقسام والأطباء الذين تمت زيارتهم')}</h3>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => change(vi, { ...visit, departments: [...visit.departments, makeDepartment()] })}
              >
                {l('Add Department', 'إضافة قسم')}
              </Button>
            </div>
            {visit.departments.map((department, di) => (
              <div key={department.key} className="rounded-xl border border-[var(--line)] p-3">
                <div className="flex gap-2">
                  <select
                    required
                    aria-label={l('Department', 'القسم')}
                    className="input flex-1"
                    value={department.department}
                    onChange={(e) =>
                      change(vi, {
                        ...visit,
                        departments: visit.departments.map((d, n) =>
                          n === di ? { ...d, department: e.target.value } : d
                        ),
                      })
                    }
                  >
                    <option value="">{l('Select department…', 'اختر القسم…')}</option>
                    {HOSPITAL_DEPARTMENTS.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                  {visit.departments.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        change(vi, {
                          ...visit,
                          departments: visit.departments.filter((d) => d.key !== department.key),
                        })
                      }
                    >
                      {l('Remove', 'حذف')}
                    </Button>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  {department.doctors.map((doctor, dri) => (
                    <div key={doctor.key} className="flex gap-2">
                      <div className="flex-1">
                        <FormField
                          required
                          label={`${l('Doctor name', 'اسم الطبيب')} ${dri + 1}`}
                          value={doctor.name}
                          onChange={(name) =>
                            change(vi, {
                              ...visit,
                              departments: visit.departments.map((d, n) =>
                                n === di
                                  ? {
                                      ...d,
                                      doctors: d.doctors.map((x, m) => (m === dri ? { ...x, name } : x)),
                                    }
                                  : d
                              ),
                            })
                          }
                        />
                      </div>
                      {department.doctors.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            change(vi, {
                              ...visit,
                              departments: visit.departments.map((d, n) =>
                                n === di
                                  ? {
                                      ...d,
                                      doctors: d.doctors.filter((x) => x.key !== doctor.key),
                                    }
                                  : d
                              ),
                            })
                          }
                        >
                          {l('Remove', 'حذف')}
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      change(vi, {
                        ...visit,
                        departments: visit.departments.map((d, n) =>
                          n === di ? { ...d, doctors: [...d.doctors, { key: uid(), name: '' }] } : d
                        ),
                      })
                    }
                  >
                    {l('Add Doctor', 'إضافة طبيب')}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Area marked green: "Others" field with description */}
          <div className="mt-5 pt-4 border-t border-[var(--line)]">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-sm text-[var(--ink)]">
              <input
                type="checkbox"
                checked={visit.hasOthers}
                onChange={(e) =>
                  change(vi, {
                    ...visit,
                    hasOthers: e.target.checked,
                    othersDescription: e.target.checked ? visit.othersDescription : '',
                  })
                }
                className="size-4 rounded border-[var(--line)] text-[var(--gold)] focus:ring-[var(--gold)] cursor-pointer"
              />
              <span>{l('Others', 'أخرى')}</span>
            </label>
            {visit.hasOthers && (
              <div className="mt-3 animate-fade-in">
                <FormField
                  required
                  multiline
                  label={l('Others description', 'وصف أخرى')}
                  placeholder={l('Enter description for other activity or notes…', 'أدخل وصف النشاط الآخر أو الملاحظات…')}
                  value={visit.othersDescription}
                  onChange={(v) => change(vi, { ...visit, othersDescription: v })}
                />
              </div>
            )}
          </div>
        </SectionCard>
      ))}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => setVisits((rows) => [...rows, makeVisit()])}>
          {l('Add another visit', 'إضافة زيارة أخرى')}
        </Button>
        <Button type="submit" isLoading={saving} disabled={!hospitals.length || isClosed}>
          {isClosed ? l('Closed (Past 9:00 AM)', 'مغلق (بعد 9:00 ص)') : l('Submit', 'إرسال')}
        </Button>
      </div>
    </form>
  );
}
