'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Target, Users, CheckCircle2, Calendar, Hash, Clock, ArrowRight, Sparkles, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SectionCard } from '@/components/ui/SectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/lib/i18nContext';

type Category = 'HOSPITAL' | 'DOCTOR' | 'PHARMACY' | 'DISTRIBUTION_BRANCH';

interface Rep {
  id: string;
  name: string;
  area: string;
}

interface VisitRateRecord {
  id: string;
  repId: string;
  customerCategory: Category;
  dailyRate: number;
  workingDaysPerWeek: number;
  workingDaysPerMonth: number;
  effectiveFrom: string;
  requiredPerWeek: number;
  requiredPerMonth: number;
}

interface BumVisitRatesViewProps {
  currentUser?: {
    id: string;
    name: string;
    positionCode?: string | null;
    systemRole?: string | null;
  };
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function BumVisitRatesView({ currentUser, onSuccess, onError }: BumVisitRatesViewProps) {
  const { language } = useTranslation();
  const ar = language === 'ar';

  const [reps, setReps] = useState<Rep[]>([]);
  const [rates, setRates] = useState<VisitRateRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states matching literal details
  const [repId, setRepId] = useState('');
  const [category, setCategory] = useState<Category>('HOSPITAL');
  const [dailyRate, setDailyRate] = useState<number>(0);
  const [week, setWeek] = useState<number>(6);
  const [month, setMonth] = useState<number>(26);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const categoryLabels: Record<Category, { ar: string; en: string }> = {
    HOSPITAL: { ar: 'مستشفى', en: 'HOSPITAL' },
    DOCTOR: { ar: 'طبيب', en: 'DOCTOR' },
    PHARMACY: { ar: 'صيدلية', en: 'PHARMACY' },
    DISTRIBUTION_BRANCH: { ar: 'فرع توزيع', en: 'DISTRIBUTION_BRANCH' },
  };

  // Fetch scoped reps and existing rates
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/visit-rates');
      const data = await res.json();
      if (data.success) {
        setReps(data.reps || []);
        setRates(data.rates || []);
        if (data.reps?.length > 0 && !repId) {
          setRepId(data.reps[0].id);
        }
      } else {
        throw new Error(data.message || 'Failed to load data');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load representatives';
      setMessage(msg);
      setIsError(true);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // When repId or category changes, check if there is an existing rate and prefill
  useEffect(() => {
    if (!repId) return;
    const existing = rates.find((r) => r.repId === repId && r.customerCategory === category);
    if (existing) {
      setDailyRate(existing.dailyRate);
      setWeek(existing.workingDaysPerWeek);
      setMonth(existing.workingDaysPerMonth);
      setDate(existing.effectiveFrom);
    } else {
      // Default reset if not configured yet
      setDailyRate(0);
      setWeek(6);
      setMonth(26);
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [repId, category, rates]);

  // Selected rep's active rates for all 4 categories
  const selectedRepRates = useMemo(() => {
    if (!repId) return new Map<Category, VisitRateRecord>();
    const map = new Map<Category, VisitRateRecord>();
    rates
      .filter((r) => r.repId === repId)
      .forEach((r) => {
        map.set(r.customerCategory, r);
      });
    return map;
  }, [repId, rates]);

  // Filtered reps for overview table
  const filteredReps = useMemo(() => {
    if (!searchTerm.trim()) return reps;
    const term = searchTerm.toLowerCase();
    return reps.filter(
      (r) => r.name.toLowerCase().includes(term) || r.area.toLowerCase().includes(term),
    );
  }, [reps, searchTerm]);

  const selectedRep = reps.find((r) => r.id === repId);

  // Save rate handler
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repId) return;

    setBusy(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch('/api/visit-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repId,
          customerCategory: category,
          dailyRate,
          workingDaysPerWeek: week,
          workingDaysPerMonth: month,
          effectiveFrom: date,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Unable to save rate');
      }

      const successText = ar
        ? `تم حفظ معدل زيارات (${categoryLabels[category].ar}) بنجاح للمندوب: ${selectedRep?.name}`
        : `Visit rate for (${categoryLabels[category].en}) saved successfully for ${selectedRep?.name}`;

      setMessage(successText);
      setIsError(false);
      onSuccess?.(successText);

      // Refresh data
      const refreshRes = await fetch('/api/visit-rates');
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setRates(refreshData.rates || []);
      }
    } catch (err) {
      const errText = err instanceof Error ? err.message : 'Unable to save visit rate';
      setMessage(errText);
      setIsError(true);
      onError?.(errText);
    } finally {
      setBusy(false);
    }
  };

  const handleSelectCategoryToEdit = (cat: Category) => {
    setCategory(cat);
    const existing = rates.find((r) => r.repId === repId && r.customerCategory === cat);
    if (existing) {
      setDailyRate(existing.dailyRate);
      setWeek(existing.workingDaysPerWeek);
      setMonth(existing.workingDaysPerMonth);
      setDate(existing.effectiveFrom);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[var(--gold-tint)] text-[var(--gold-dark)] border border-[var(--gold-border)]">
              <Target className="size-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--ink)]">
                {ar ? 'معدلات الزيارة (Visits Rate)' : 'Visit Rates (Visits Rate)'}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--ink-soft)]">
                {ar
                  ? 'إدخال وتحديد معدلات الزيارات يدوياً للمندوبين الخاضعين لإشرافك مع احتساب المعدلات الأسبوعية والشهرية'
                  : 'Manually enter and configure daily visit rates for representatives under your supervision'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--line)] text-[var(--ink-soft)]">
          <Users className="size-4 text-[var(--gold-dark)]" />
          <span>
            {reps.length} {ar ? 'مندوب تحت إشرافك' : 'supervised representatives'}
          </span>
        </div>
      </div>

      {message && (
        <InlineAlert tone={isError ? 'error' : 'success'}>
          {message}
        </InlineAlert>
      )}

      {/* Main Grid: Entry Form + Current MR Rates */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Form Column (matching literal details from photo) */}
        <div className="lg:col-span-7">
          <form onSubmit={save}>
            <SectionCard
              title={ar ? 'تحديد معدل الزيارة اليومي للمندوب' : 'MR daily visit rates'}
              description={
                ar
                  ? 'معدلات محددة من الإدارة مع صيغ صريحة لأيام العمل وتواريخ السريان'
                  : 'Admin/BUM-controlled rates with explicit working-day formulas and effective dates.'
              }
            >
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {/* 1. Representative */}
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                    {ar ? 'المندوب (Representative)' : 'Representative'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="input w-full font-semibold text-sm"
                    value={repId}
                    onChange={(e) => setRepId(e.target.value)}
                  >
                    <option value="">{ar ? 'اختر المندوب...' : 'Select…'}</option>
                    {reps.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} · {r.area}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Customer category */}
                <div>
                  <label className="block text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                    {ar ? 'فئة العميل' : 'Customer category'}
                  </label>
                  <select
                    className="input w-full font-semibold text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                  >
                    {(['HOSPITAL', 'DOCTOR', 'PHARMACY', 'DISTRIBUTION_BRANCH'] as Category[]).map((x) => (
                      <option key={x} value={x}>
                        {ar ? categoryLabels[x].ar : x}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Effective from */}
                <div>
                  <label className="block text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                    {ar ? 'ساري من تاريخ' : 'Effective from'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    className="input w-full font-semibold text-sm"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                {/* 4. Daily rate */}
                <div>
                  <label className="block text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                    {ar ? 'المعدل اليومي' : 'Daily rate'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    min="0"
                    required
                    type="number"
                    className="input w-full font-bold text-base text-[var(--gold-dark)]"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(Number(e.target.value))}
                  />
                </div>

                {/* 5. Working days/week */}
                <div>
                  <label className="block text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                    {ar ? 'أيام العمل / أسبوع' : 'Working days/week'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    min="1"
                    max="7"
                    required
                    type="number"
                    className="input w-full font-semibold text-sm"
                    value={week}
                    onChange={(e) => setWeek(Number(e.target.value))}
                  />
                </div>

                {/* 6. Working days/month */}
                <div>
                  <label className="block text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                    {ar ? 'أيام العمل / شهر' : 'Working days/month'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    min="1"
                    max="31"
                    required
                    type="number"
                    className="input w-full font-semibold text-sm"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Real-time Calculation Formula */}
              <div className="mt-4 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[var(--gold-dark)]" />
                  <span className="text-xs font-bold text-[var(--ink-soft)]">
                    {ar ? 'المعدل المحسوب تلقائياً:' : 'Calculated Requirements:'}
                  </span>
                </div>
                <div className="font-mono text-sm font-black text-[var(--ink)]">
                  {ar ? (
                    <>
                      المطلوب:{' '}
                      <span className="text-[var(--gold-dark)]">{dailyRate * week}</span> / أسبوع ·{' '}
                      <span className="text-[var(--gold-dark)]">{dailyRate * month}</span> / شهر
                    </>
                  ) : (
                    <>
                      Required:{' '}
                      <span className="text-[var(--gold-dark)]">{dailyRate * week}</span>/week ·{' '}
                      <span className="text-[var(--gold-dark)]">{dailyRate * month}</span>/month
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  disabled={!repId}
                  isLoading={busy}
                  className="px-6 py-2.5 bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white font-black shadow-md hover:brightness-105 transition-all"
                >
                  <CheckCircle2 className="size-4" />
                  <span>{ar ? 'حفظ المعدل' : 'Save rate'}</span>
                </Button>
              </div>
            </SectionCard>
          </form>
        </div>

        {/* Right Column: Current Categories for Selected MR */}
        <div className="lg:col-span-5 space-y-4">
          <SectionCard
            title={
              ar
                ? `المعدلات المعتمدة: ${selectedRep?.name || ''}`
                : `Assigned Rates: ${selectedRep?.name || 'Selected MR'}`
            }
            description={
              ar
                ? 'انقر على أي فئة لتعديل قيمتها وتحديثها مباشرة'
                : 'Click any category card to quickly load and edit its rate'
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 mt-2">
              {(['HOSPITAL', 'DOCTOR', 'PHARMACY', 'DISTRIBUTION_BRANCH'] as Category[]).map((cat) => {
                const current = selectedRepRates.get(cat);
                const isSelected = category === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectCategoryToEdit(cat)}
                    className={`text-start p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-[var(--gold)] bg-[var(--gold-tint)] shadow-xs ring-2 ring-[var(--gold)]/20'
                        : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-[var(--ink)]">
                        {ar ? categoryLabels[cat].ar : cat}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--ink-soft)] flex items-center gap-1">
                        <Edit3 className="size-3" />
                        <span>{ar ? 'تعديل' : 'Edit'}</span>
                      </span>
                    </div>

                    {current ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-[var(--gold-dark)]">
                            {current.dailyRate}
                          </span>
                          <span className="text-[10px] font-bold text-[var(--ink-soft)]">
                            {ar ? 'زيارة / يوم' : 'visits / day'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--ink-soft)] flex items-center justify-between">
                          <span>
                            {current.requiredPerWeek} / {ar ? 'أسبوع' : 'wk'}
                          </span>
                          <span>
                            {current.requiredPerMonth} / {ar ? 'شهر' : 'mo'}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--ink-muted)] pt-1 border-t border-[var(--line)]/50">
                          {ar ? 'ساري من:' : 'From:'} {current.effectiveFrom}
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center text-xs text-[var(--ink-soft)] italic">
                        {ar ? 'لم يتم تحديد معدل بعد' : 'Not configured yet'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Supervised Representatives Overview Table */}
      <SectionCard
        title={ar ? 'نظرة عامة على مناديب إشرافك' : 'Supervised Representatives Overview'}
        description={
          ar
            ? 'متابعة وتحديث معدلات الزيارة لجميع المناديب التابعين لوحدتك'
            : 'Track and adjust visit rates for all representatives under your supervisory scope'
        }
      >
        <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="search"
            placeholder={ar ? 'بحث بالاسم أو المنطقة...' : 'Search by name or area…'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full sm:w-72 text-xs"
          />
          <span className="text-xs font-bold text-[var(--ink-soft)] self-end sm:self-auto">
            {ar ? `عرض ${filteredReps.length} من ${reps.length} مندوب` : `Showing ${filteredReps.length} of ${reps.length} reps`}
          </span>
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--surface-hover)] border-b border-[var(--line)] text-[var(--ink-soft)]">
                <th className="p-3 text-start font-bold uppercase tracking-wider">{ar ? 'المندوب والمنطقة' : 'Representative & Area'}</th>
                <th className="p-3 text-start font-bold uppercase tracking-wider">{ar ? 'مستشفيات' : 'Hospital'}</th>
                <th className="p-3 text-start font-bold uppercase tracking-wider">{ar ? 'أطباء' : 'Doctor'}</th>
                <th className="p-3 text-start font-bold uppercase tracking-wider">{ar ? 'صيدليات' : 'Pharmacy'}</th>
                <th className="p-3 text-start font-bold uppercase tracking-wider">{ar ? 'فروع توزيع' : 'Distribution'}</th>
                <th className="p-3 text-end font-bold uppercase tracking-wider">{ar ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-[var(--surface)]">
              {filteredReps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-[var(--ink-soft)]">
                    {ar ? 'لا يوجد مناديب مطابقين للبحث' : 'No representatives match your search'}
                  </td>
                </tr>
              ) : (
                filteredReps.map((r) => {
                  const repSpecificRates = rates.filter((x) => x.repId === r.id);
                  const hospRate = repSpecificRates.find((x) => x.customerCategory === 'HOSPITAL');
                  const docRate = repSpecificRates.find((x) => x.customerCategory === 'DOCTOR');
                  const pharmRate = repSpecificRates.find((x) => x.customerCategory === 'PHARMACY');
                  const distRate = repSpecificRates.find((x) => x.customerCategory === 'DISTRIBUTION_BRANCH');
                  const isCurrent = r.id === repId;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-[var(--surface-hover)] transition-colors ${
                        isCurrent ? 'bg-[var(--gold-tint)]/40' : ''
                      }`}
                    >
                      <td className="p-3 font-semibold text-[var(--ink)]">
                        <div>{r.name}</div>
                        <div className="text-[10px] text-[var(--ink-soft)] font-normal">{r.area}</div>
                      </td>

                      <td className="p-3">
                        {hospRate ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            {hospRate.dailyRate} / {ar ? 'يوم' : 'd'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--ink-muted)]">—</span>
                        )}
                      </td>

                      <td className="p-3">
                        {docRate ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            {docRate.dailyRate} / {ar ? 'يوم' : 'd'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--ink-muted)]">—</span>
                        )}
                      </td>

                      <td className="p-3">
                        {pharmRate ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                            {pharmRate.dailyRate} / {ar ? 'يوم' : 'd'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--ink-muted)]">—</span>
                        )}
                      </td>

                      <td className="p-3">
                        {distRate ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            {distRate.dailyRate} / {ar ? 'يوم' : 'd'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--ink-muted)]">—</span>
                        )}
                      </td>

                      <td className="p-3 text-end">
                        <button
                          type="button"
                          onClick={() => {
                            setRepId(r.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all ${
                            isCurrent
                              ? 'bg-[var(--gold)] text-white border-[var(--gold)] shadow-xs'
                              : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--gold)] hover:text-[var(--gold-dark)]'
                          }`}
                        >
                          {isCurrent
                            ? (ar ? 'المحدد حالياً' : 'Selected')
                            : (ar ? 'تحديد وتعديل' : 'Set / Edit')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
