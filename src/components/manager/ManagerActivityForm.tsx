'use client';
import { useEffect,useMemo,useState } from 'react';
import type { ManagerActivityRecord } from '@/types';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { FormSection } from '@/components/ui/FormSection';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { getReportingWindowStatus, isDateSubmissionOpen } from '@/lib/business/reportingWindow';
type Option = { id: string; name: string; repId?: string; specialty?: string | null };
type Manual = {
  name: string;
  hospitalType: string;
  area: string;
  address: string;
  specialty: string;
  distributor: string;
  products: Array<{ productId: string; observation: string }>;
};
type Visit = {
  period: 'AM' | 'PM';
  entryType: 'HOSPITAL' | 'DIRECT_DOCTOR' | 'PHARMACY' | 'DISTRIBUTION_BRANCH';
  hospitalId?: string;
  doctorId?: string;
  pharmacyId?: string;
  branchId?: string;
  manualData?: Manual;
  generalComment: string;
  doctors: Array<{ doctorName: string; department: string; generalComment: string }>;
};
type Options = {
  reps: Option[];
  hospitals: Option[];
  doctors: Option[];
  pharmacies: Option[];
  branches: Option[];
  products: Option[];
};
type MrLists = {
  hospitals: Array<{ id: string; name: string }>;
  doctors: Array<{ id: string; name: string; specialty?: string | null }>;
  pharmacies: Array<{ id: string; name: string }>;
  branches: Array<{ id: string; name: string }>;
};

const blank: Options = { reps: [], hospitals: [], doctors: [], pharmacies: [], branches: [], products: [] };
const blankMrLists: MrLists = { hospitals: [], doctors: [], pharmacies: [], branches: [] };
const ACTS = ['MEETING', 'TRAINING', 'EVENT', 'SALES_REVIEW_ADMIN', 'OTHERS'] as const;

export function ManagerActivityForm({
  currentUser,
  onSuccess,
  onError,
  onSubmitted,
  initialActivity,
  onCancelEdit,
}: {
  currentUser?: { name: string; username: string; positionCode?: string | null } | null;
  onSuccess?: (x: string) => void;
  onError?: (x: string) => void;
  onSubmitted?: () => void;
  initialActivity?: ManagerActivityRecord | null;
  onCancelEdit?: () => void;
}) {
  const windowStatus = getReportingWindowStatus();
  const [options, setOptions] = useState<Options>(blank);
  const [repId, setRepId] = useState(
    initialActivity?.reportContextType === 'VACANT' ? '__VACANT__' : initialActivity?.selectedRepId || ''
  );
  const [date, setDate] = useState(initialActivity?.activityDate || windowStatus.todayDate);
  const isClosed = !isDateSubmissionOpen(date);

  // Visit Type: Single or Double
  const [visitType, setVisitType] = useState<'Single' | 'Double'>(
    initialActivity?.reportContextType === 'VACANT' ? 'Single' : (initialActivity?.visitType as 'Single' | 'Double') || 'Single'
  );
  const [accompaniedPerson, setAccompaniedPerson] = useState(initialActivity?.accompaniedPerson || '');

  // MR Lists loaded dynamically from "My Lists" (matching Weekly Plan)
  const [mrLists, setMrLists] = useState<MrLists>(blankMrLists);
  const [loadingLists, setLoadingLists] = useState(false);

  const [visits, setVisits] = useState<Visit[]>(
    (initialActivity?.visits?.map(v => ({
      ...v,
      generalComment: v.generalComment || '',
      doctors: v.doctors.map(d => ({
        doctorName: d.name,
        department: d.specialty || '',
        generalComment: d.generalComment || '',
      })),
    })) as Visit[]) || []
  );
  const [activities, setActivities] = useState<string[]>(initialActivity?.activities || []);
  const [salesDescription, setSalesDescription] = useState(initialActivity?.salesReviewDescription || '');
  const [othersDescription, setOthersDescription] = useState(initialActivity?.othersDescription || '');
  const [notes, setNotes] = useState(initialActivity?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initial load of authorized representatives & products
  useEffect(() => {
    fetch('/api/manager/activity-options')
      .then(r => r.json())
      .then(setOptions)
      .catch(() => setError('Unable to load authorized representatives'));
  }, []);

  const selectedRepName = useMemo(() => options.reps.find(r => r.id === repId)?.name, [options.reps, repId]);
  const vacant = repId === '__VACANT__';
  const isSwitchDeactivated = vacant || !repId;

  // Load "My Lists" data for the selected MR (exactly like Weekly Plan)
  useEffect(() => {
    if (!repId || repId === '__VACANT__') {
      setMrLists(blankMrLists);
      setLoadingLists(false);
      return;
    }
    setLoadingLists(true);
    const identifier = selectedRepName || repId;
    fetch(`/api/lists?rep=${encodeURIComponent(identifier)}`)
      .then(r => r.json())
      .then(res => {
        if (res.data) {
          setMrLists({
            hospitals: res.data.hospitals || [],
            doctors: res.data.doctors || [],
            pharmacies: res.data.pharmacies || [],
            branches: res.data.branches || [],
          });
        }
      })
      .catch(() => setError('Unable to load MR lists'))
      .finally(() => setLoadingLists(false));
  }, [repId, selectedRepName]);

  const add = (period: 'AM' | 'PM', entryType: Visit['entryType']) =>
    setVisits(v => [
      ...v,
      {
        period,
        entryType,
        generalComment: '',
        doctors: [],
        ...(vacant
          ? {
              manualData: {
                name: '',
                hospitalType: '',
                area: '',
                address: '',
                specialty: '',
                distributor: '',
                products: [],
              },
            }
          : {}),
      },
    ]);

  const update = (i: number, p: Partial<Visit>) =>
    setVisits(v => v.map((x, n) => (n === i ? { ...x, ...p } : x)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isClosed) {
      const m =
        'Submission window closed for this date. Reports must be submitted by maximum 9:00 AM the next day (12:00 AM to 9:00 AM). The system cannot accept reporting after this time. | انتهت مهلة التقديم لهذا اليوم (الحد الأقصى 9:00 صباحاً في اليوم التالي من 12:00 ص إلى 9:00 ص). لا يقبل النظام تقارير بعد هذا الوقت.';
      setError(m);
      onError?.(m);
      return;
    }
    if (visitType === 'Double' && !vacant && !accompaniedPerson.trim()) {
      const m = 'Companion name is required for Double visit | اسم المرافق مطلوب للزيارة المشتركة';
      setError(m);
      onError?.(m);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const body = {
        id: initialActivity?.id,
        reportContextType: vacant ? 'VACANT' : 'EMPLOYEE',
        selectedRepId: vacant ? null : repId,
        activityType: 'Visit',
        activityDate: date,
        visitType: vacant ? 'Single' : visitType,
        accompaniedPerson: !vacant && visitType === 'Double' ? accompaniedPerson.trim() : null,
        activities,
        salesReviewDescription: salesDescription,
        othersDescription,
        visits,
        productIds: [],
        notes,
      };

      const r = await fetch(
        initialActivity ? `/api/manager/activities/${initialActivity.id}` : '/api/manager/activities',
        {
          method: initialActivity ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      onSuccess?.('Manager daily report saved');
      onSubmitted?.();
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Unable to save report';
      setError(m);
      onError?.(m);
    } finally {
      setSaving(false);
    }
  }

  const manualField = (
    v: Visit,
    i: number,
    key: keyof Omit<Manual, 'products'>,
    label: string
  ) => (
    <FormField
      label={label}
      value={String(v.manualData?.[key] || '')}
      onChange={value => update(i, { manualData: { ...v.manualData!, [key]: value } })}
      required={key === 'name'}
    />
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="text-xl font-black">Manager Daily Report — AM / PM</h2>
      <p className="text-sm text-[var(--ink-soft)]">{currentUser?.name || currentUser?.username}</p>
      {error && <InlineAlert tone="error">{error}</InlineAlert>}

      <FormSection title="Report context">
        <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2 items-start">
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Supervised Medical Representative *
            <select
              required
              className="input mt-1 w-full"
              value={repId}
              onChange={e => {
                const val = e.target.value;
                setRepId(val);
                setVisits([]);
                if (val === '__VACANT__' || !val) {
                  setVisitType('Single');
                  setAccompaniedPerson('');
                }
              }}
            >
              <option value="">Select an authorized MR first</option>
              {options.reps.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
              <option value="__VACANT__">Vacant</option>
            </select>
          </label>

          {/* Visit Type Switch (Single / Double) */}
          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-[var(--ink)] mb-1">
              Visit Type{' '}
              {vacant ? (
                <span className="text-xs font-normal text-[var(--ink-soft)]">(Deactivated for Vacant)</span>
              ) : !repId ? (
                <span className="text-xs font-normal text-[var(--ink-soft)]">(Select MR first)</span>
              ) : null}
            </label>
            <div
              className={`inline-flex h-[42px] w-full rounded-xl p-1 border transition-all ${
                isSwitchDeactivated
                  ? 'opacity-40 bg-[var(--surface-subtle)] border-[var(--line)] cursor-not-allowed select-none'
                  : 'bg-[var(--surface-subtle)] border-[var(--line)]'
              }`}
              role="group"
              aria-label="Visit Type"
            >
              <button
                type="button"
                disabled={isSwitchDeactivated}
                onClick={() => {
                  setVisitType('Single');
                  setAccompaniedPerson('');
                }}
                className={`flex-1 py-1.5 px-4 text-xs font-bold rounded-lg transition-all ${
                  visitType === 'Single'
                    ? 'bg-[var(--gold)] text-[var(--gold-ink)] shadow-xs'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                } ${isSwitchDeactivated ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Single
              </button>
              <button
                type="button"
                disabled={isSwitchDeactivated}
                onClick={() => {
                  setVisitType('Double');
                  if (!accompaniedPerson && selectedRepName) {
                    setAccompaniedPerson(selectedRepName);
                  }
                }}
                className={`flex-1 py-1.5 px-4 text-xs font-bold rounded-lg transition-all ${
                  visitType === 'Double'
                    ? 'bg-[var(--gold)] text-[var(--gold-ink)] shadow-xs'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                } ${isSwitchDeactivated ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Double
              </button>
            </div>
          </div>
        </div>

        {/* Companion Name for Double Visit */}
        {visitType === 'Double' && !vacant && (
          <div className="sm:col-span-2 animate-fade-in">
            <FormField
              label="Companion Name (Double visit) *"
              placeholder="Enter name of companion (e.g. MR name or colleague)..."
              value={accompaniedPerson}
              onChange={setAccompaniedPerson}
              required
            />
          </div>
        )}

        <FormField
          label="Report date"
          type="date"
          value={date}
          onChange={setDate}
          min={windowStatus.minAllowedDate}
          max={windowStatus.maxAllowedDate}
          required
        />

        {isClosed && (
          <div className="sm:col-span-2">
            <InlineAlert tone="error">
              Submission window closed for this date. Reports are accepted maximum the next day at 9:00 AM. System
              cannot accept reporting after this time. | انتهت مهلة التقديم لهذا التاريخ (الحد الأقصى 9:00 صباحاً في اليوم التالي). لا يقبل النظام تقارير بعد هذا الوقت.
            </InlineAlert>
          </div>
        )}
      </FormSection>

      {(['AM', 'PM'] as const).map(period => (
        <FormSection key={period} title={`${period} visits`}>
          <div className="sm:col-span-2 space-y-3">
            {visits.map(
              (v, i) =>
                v.period === period && (
                  <div key={i} className="space-y-2 rounded-xl border border-[var(--line)] p-3">
                    <div className="flex justify-between items-center">
                      <b className="text-[var(--ink)]">{v.entryType.replaceAll('_', ' ')}</b>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => setVisits(x => x.filter((_, n) => n !== i))}
                      >
                        Remove
                      </Button>
                    </div>

                    {vacant ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {manualField(v, i, 'name', `${v.entryType.replaceAll('_', ' ')} name`)}
                        {v.entryType === 'HOSPITAL' && manualField(v, i, 'hospitalType', 'Hospital type')}
                        {v.entryType === 'DIRECT_DOCTOR' && manualField(v, i, 'specialty', 'Specialty')}
                        {v.entryType === 'PHARMACY' && manualField(v, i, 'distributor', 'Distributor dealt with')}
                        {manualField(v, i, 'area', 'Area')}
                        {manualField(v, i, 'address', 'Address')}
                      </div>
                    ) : (
                      <>
                        {v.entryType === 'HOSPITAL' && (
                          <select
                            required
                            className="input w-full"
                            value={v.hospitalId || ''}
                            onChange={e => update(i, { hospitalId: e.target.value })}
                          >
                            <option value="">
                              {loadingLists
                                ? 'Loading hospitals...'
                                : mrLists.hospitals.length
                                ? `Hospital from selected MR list (${mrLists.hospitals.length})`
                                : 'No hospitals found in selected MR list'}
                            </option>
                            {mrLists.hospitals.map(x => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                              </option>
                            ))}
                          </select>
                        )}
                        {v.entryType === 'DIRECT_DOCTOR' && (
                          <select
                            required
                            className="input w-full"
                            value={v.doctorId || ''}
                            onChange={e => update(i, { doctorId: e.target.value })}
                          >
                            <option value="">
                              {loadingLists
                                ? 'Loading doctors...'
                                : mrLists.doctors.length
                                ? `Doctor from selected MR list (${mrLists.doctors.length})`
                                : 'No doctors found in selected MR list'}
                            </option>
                            {mrLists.doctors.map(x => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                                {x.specialty ? ` · ${x.specialty}` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                        {v.entryType === 'PHARMACY' && (
                          <select
                            required
                            className="input w-full"
                            value={v.pharmacyId || ''}
                            onChange={e => update(i, { pharmacyId: e.target.value })}
                          >
                            <option value="">
                              {loadingLists
                                ? 'Loading pharmacies...'
                                : mrLists.pharmacies.length
                                ? `Pharmacy from selected MR list (${mrLists.pharmacies.length})`
                                : 'No pharmacies found in selected MR list'}
                            </option>
                            {mrLists.pharmacies.map(x => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                              </option>
                            ))}
                          </select>
                        )}
                        {v.entryType === 'DISTRIBUTION_BRANCH' && (
                          <select
                            required
                            className="input w-full"
                            value={v.branchId || ''}
                            onChange={e => update(i, { branchId: e.target.value })}
                          >
                            <option value="">
                              {loadingLists
                                ? 'Loading distribution branches...'
                                : mrLists.branches.length
                                ? `Distribution branch from selected MR list (${mrLists.branches.length})`
                                : 'No distribution branches found in selected MR list'}
                            </option>
                            {mrLists.branches.map(x => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    )}

                    {v.entryType === 'HOSPITAL' && (
                      <>
                        {v.doctors.map((d, j) => (
                          <div className="grid gap-2 sm:grid-cols-4" key={j}>
                            <FormField
                              label="Doctor visited (manual)"
                              value={d.doctorName}
                              onChange={value =>
                                update(i, {
                                  doctors: v.doctors.map((x, n) => (n === j ? { ...x, doctorName: value } : x)),
                                })
                              }
                              required
                            />
                            <FormField
                              label="Department"
                              value={d.department}
                              onChange={value =>
                                update(i, {
                                  doctors: v.doctors.map((x, n) => (n === j ? { ...x, department: value } : x)),
                                })
                              }
                            />
                            <FormField
                              label="Comment"
                              value={d.generalComment}
                              onChange={value =>
                                update(i, {
                                  doctors: v.doctors.map((x, n) => (n === j ? { ...x, generalComment: value } : x)),
                                })
                              }
                            />
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => update(i, { doctors: v.doctors.filter((_, n) => n !== j) })}
                            >
                              Remove doctor
                            </Button>
                          </div>
                        ))}
                        {currentUser?.positionCode !== 'BUM' && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                              update(i, {
                                doctors: [...v.doctors, { doctorName: '', department: '', generalComment: '' }],
                              })
                            }
                          >
                            Add doctor visited
                          </Button>
                        )}
                      </>
                    )}

                    {vacant && v.entryType === 'DISTRIBUTION_BRANCH' && (
                      <div className="space-y-2">
                        <b className="text-sm">Distributed products and observations</b>
                        {options.products
                          .filter(p =>
                            ['Nitrong', 'Danasetron', 'Beconeurin', 'Levosimendan Sunny'].includes(p.name)
                          )
                          .map(p => (
                            <label className="grid grid-cols-[auto_1fr] gap-2" key={p.id}>
                              <input
                                type="checkbox"
                                checked={v.manualData!.products.some(x => x.productId === p.id)}
                                onChange={e =>
                                  update(i, {
                                    manualData: {
                                      ...v.manualData!,
                                      products: e.target.checked
                                        ? [...v.manualData!.products, { productId: p.id, observation: '' }]
                                        : v.manualData!.products.filter(x => x.productId !== p.id),
                                    },
                                  })
                                }
                              />
                              <span>{p.name}</span>
                              {v.manualData!.products.some(x => x.productId === p.id) && (
                                <textarea
                                  className="input col-start-2"
                                  placeholder="Product observation"
                                  value={
                                    v.manualData!.products.find(x => x.productId === p.id)?.observation || ''
                                  }
                                  onChange={e =>
                                    update(i, {
                                      manualData: {
                                        ...v.manualData!,
                                        products: v.manualData!.products.map(x =>
                                          x.productId === p.id ? { ...x, observation: e.target.value } : x
                                        ),
                                      },
                                    })
                                  }
                                />
                              )}
                            </label>
                          ))}
                      </div>
                    )}

                    <FormField
                      label="Visit comment / notes"
                      value={v.generalComment}
                      onChange={value => update(i, { generalComment: value })}
                      multiline
                    />
                  </div>
                )
            )}

            <div className="flex flex-wrap gap-2">
              {(['HOSPITAL', 'DIRECT_DOCTOR', 'PHARMACY', 'DISTRIBUTION_BRANCH'] as const).map(t => (
                <Button
                  key={t}
                  type="button"
                  variant="secondary"
                  disabled={!repId || loadingLists}
                  onClick={() => add(period, t)}
                >
                  Add {t.replaceAll('_', ' ').toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        </FormSection>
      ))}

      <FormSection title="Activities (multiple selection)">
        <div className="sm:col-span-2 flex flex-wrap gap-3">
          {ACTS.map(a => (
            <label key={a}>
              <input
                type="checkbox"
                checked={activities.includes(a)}
                onChange={e =>
                  setActivities(x => (e.target.checked ? [...x, a] : x.filter(v => v !== a)))
                }
              />{' '}
              {a === 'SALES_REVIEW_ADMIN' ? 'Sales Review / Admin Work' : a[0] + a.slice(1).toLowerCase()}
            </label>
          ))}
        </div>
        {activities.includes('SALES_REVIEW_ADMIN') && (
          <FormField
            label="Sales Review / Admin Work description"
            value={salesDescription}
            onChange={setSalesDescription}
            required
            multiline
          />
        )}
        {activities.includes('OTHERS') && (
          <FormField
            label="Others description"
            value={othersDescription}
            onChange={setOthersDescription}
            required
            multiline
          />
        )}
        <FormField label="Comments" value={notes} onChange={setNotes} multiline />
      </FormSection>

      <div className="flex justify-end gap-2">
        {initialActivity && (
          <Button type="button" variant="secondary" onClick={onCancelEdit}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!repId || isClosed} isLoading={saving}>
          {isClosed ? 'Closed (Past 9:00 AM)' : 'Submit daily report'}
        </Button>
      </div>
    </form>
  );
}
