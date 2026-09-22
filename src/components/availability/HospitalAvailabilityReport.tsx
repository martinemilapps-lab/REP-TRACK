'use client';

import React, { useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';

export type AvailabilityRecord = {
  id: string;
  repId: string;
  rep: string;
  hospital: string;
  hospitalId: string;
  area?: string;
  hospitalType?: string;
  product: string;
  productId: string;
  productCode?: string;
  month: string;
  isAvailable: boolean;
  status: 'Available' | 'Not Available';
  notes?: string | null;
  submittedAt?: string;
};

export function HospitalAvailabilityReport({
  records,
  loading = false,
}: {
  records: AvailabilityRecord[];
  loading?: boolean;
}) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const l = (en: string, a: string) => (ar ? a : en);

  const [search, setSearch] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [collapsedHospitals, setCollapsedHospitals] = useState<Record<string, boolean>>({});

  // Unique filters
  const uniqueHospitals = useMemo(() => {
    return [...new Set(records.map((r) => r.hospital).filter(Boolean))].sort();
  }, [records]);

  const uniqueMonths = useMemo(() => {
    return [...new Set(records.map((r) => r.month).filter(Boolean))].sort().reverse();
  }, [records]);

  // Set default month to latest month available if not chosen
  React.useEffect(() => {
    if (selectedMonth === 'ALL' && uniqueMonths.length > 0) {
      setSelectedMonth(uniqueMonths[0]);
    }
  }, [uniqueMonths, selectedMonth]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchHospital = selectedHospital === 'ALL' || r.hospital === selectedHospital;
      const matchMonth = selectedMonth === 'ALL' || r.month === selectedMonth;
      const matchSearch =
        !search.trim() ||
        r.hospital.toLowerCase().includes(search.toLowerCase()) ||
        r.product.toLowerCase().includes(search.toLowerCase()) ||
        (r.area && r.area.toLowerCase().includes(search.toLowerCase()));

      return matchHospital && matchMonth && matchSearch;
    });
  }, [records, selectedHospital, selectedMonth, search]);

  // Group by Hospital
  const hospitalGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        hospitalName: string;
        area: string;
        hospitalType?: string;
        months: Set<string>;
        availableProducts: { name: string; code?: string; notes?: string | null }[];
        unavailableProducts: { name: string; code?: string; notes?: string | null }[];
        notes: string[];
      }
    >();

    // Sort by latest submitted
    filteredRecords.forEach((r) => {
      if (!map.has(r.hospital)) {
        map.set(r.hospital, {
          hospitalName: r.hospital,
          area: r.area || '—',
          hospitalType: r.hospitalType,
          months: new Set(),
          availableProducts: [],
          unavailableProducts: [],
          notes: [],
        });
      }
      const entry = map.get(r.hospital)!;
      entry.months.add(r.month);
      if (r.notes && !entry.notes.includes(r.notes)) {
        entry.notes.push(r.notes);
      }

      const isAvail = r.status === 'Available' || r.isAvailable;
      const targetList = isAvail ? entry.availableProducts : entry.unavailableProducts;

      // Avoid duplicate product entries in the same hospital group if multiple months selected
      if (!targetList.some((p) => p.name === r.product)) {
        targetList.push({
          name: r.product,
          code: r.productCode,
          notes: r.notes,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.hospitalName.localeCompare(b.hospitalName)
    );
  }, [filteredRecords]);

  // Overall KPIs
  const overallStats = useMemo(() => {
    let totalAvail = 0;
    let totalUnavail = 0;

    hospitalGroups.forEach((h) => {
      totalAvail += h.availableProducts.length;
      totalUnavail += h.unavailableProducts.length;
    });

    const totalMonitored = totalAvail + totalUnavail;
    const rate = totalMonitored > 0 ? Math.round((totalAvail / totalMonitored) * 100) : 0;

    return {
      hospitalsCount: hospitalGroups.length,
      totalAvail,
      totalUnavail,
      totalMonitored,
      rate,
    };
  }, [hospitalGroups]);

  const toggleCollapse = (hospital: string) => {
    setCollapsedHospitals((prev) => ({
      ...prev,
      [hospital]: !prev[hospital],
    }));
  };

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 md:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Building2 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                {l('Report 1', 'التقرير الأول')}
              </span>
              <h3 className="text-lg md:text-xl font-black text-[var(--ink)]">
                {l('Hospital Product Availability Breakdown', 'تقرير توافر المنتجات في كل مستشفى')}
              </h3>
            </div>
            <p className="text-xs md:text-sm text-[var(--ink-soft)]">
              {l(
                'Full detailed list showing names of Available and Not Available products in each hospital.',
                'تقرير تفصيلي شامل يوضح بالاسم المنتجات المتوفرة وغير المتوفرة في كل مستشفى.'
              )}
            </p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="size-3.5" />
            {l('Available Names', 'أسماء المتوفر')}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-50 px-2.5 py-1 font-bold text-red-800 dark:bg-red-950/40 dark:text-red-300">
            <XCircle className="size-3.5" />
            {l('Not Available Names', 'أسماء غير المتوفر')}
          </span>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-center">
          <p className="text-xs text-[var(--ink-soft)] font-medium">
            {l('Hospitals Monitored', 'المستشفيات المسجلة')}
          </p>
          <p className="text-xl md:text-2xl font-black text-[var(--ink)] mt-1">
            {overallStats.hospitalsCount}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-center">
          <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            {l('Available Products', 'منتجات متوفرة')}
          </p>
          <p className="text-xl md:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
            {overallStats.totalAvail}
          </p>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-50/50 dark:bg-red-950/20 p-3 text-center">
          <p className="text-xs text-red-800 dark:text-red-300 font-medium">
            {l('Not Available (Stockout)', 'غير متوفرة (عجز)')}
          </p>
          <p className="text-xl md:text-2xl font-black text-red-700 dark:text-red-400 mt-1">
            {overallStats.totalUnavail}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--gold)]/30 bg-[var(--gold-soft)]/20 p-3 text-center">
          <p className="text-xs text-[var(--gold-dark)] dark:text-[var(--gold)] font-medium">
            {l('Availability Rate', 'نسبة التوافر')}
          </p>
          <p className="text-xl md:text-2xl font-black text-[var(--ink)] mt-1">
            {overallStats.rate}%
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-[var(--surface-subtle)] p-3 rounded-xl border border-[var(--line)]">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[var(--ink-soft)]" />
          <input
            type="text"
            className="input ps-9 w-full text-xs md:text-sm"
            placeholder={l(
              'Search hospital, product or territory…',
              'ابحث بالمستشفى أو المنتج أو المنطقة…'
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hospital Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Building2 className="size-3.5 text-[var(--ink-soft)]" />
            <select
              className="input py-1 px-2 text-xs"
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
            >
              <option value="ALL">{l('All Hospitals', 'كل المستشفيات')}</option>
              {uniqueHospitals.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="size-3.5 text-[var(--ink-soft)]" />
            <select
              className="input py-1 px-2 text-xs"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="ALL">{l('All Months', 'كل الشهور')}</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hospital Breakdown Cards */}
      {loading ? (
        <div className="p-8 text-center text-sm text-[var(--ink-soft)]">
          <p>{l('Loading hospital availability report…', 'جارٍ تحميل تقرير توافر المستشفيات…')}</p>
        </div>
      ) : hospitalGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-soft)]">
          <Package className="size-8 mx-auto text-[var(--ink-soft)] mb-2 opacity-50" />
          <p className="font-semibold">
            {l('No availability records match your criteria.', 'لا توجد سجلات توافر تطابق خيارات البحث.')}
          </p>
          <p className="text-xs mt-1">
            {l(
              'Try changing your filters or submit a new availability snapshot above.',
              'يرجى تجربة تعديل الفلاتر أو تسجيل تقرير توافر جديد بالأعلى.'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {hospitalGroups.map((group) => {
            const total = group.availableProducts.length + group.unavailableProducts.length;
            const rate = total > 0 ? Math.round((group.availableProducts.length / total) * 100) : 0;
            const isCollapsed = Boolean(collapsedHospitals[group.hospitalName]);

            return (
              <div
                key={group.hospitalName}
                className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] transition-all hover:border-[var(--line-strong)] shadow-xs"
              >
                {/* Hospital Header Bar */}
                <div
                  onClick={() => toggleCollapse(group.hospitalName)}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 md:p-4 cursor-pointer bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border-b border-[var(--line)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--surface-subtle)] text-[var(--gold)]">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm md:text-base text-[var(--ink)]">
                          {group.hospitalName}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--surface-subtle)] text-[var(--ink-soft)]">
                          {group.area}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                        {l('Periods reported:', 'الفترات المسجلة:')}{' '}
                        {Array.from(group.months).join(', ') || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Availability Stat Pill & Toggle */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--ink-soft)]">
                        {group.availableProducts.length} / {total} {l('Available', 'متوفر')}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          rate >= 80
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : rate >= 50
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {rate}%
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label="Toggle details"
                      className="p-1 rounded-md text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronUp className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Hospital Details (Collapsible) */}
                {!isCollapsed && (
                  <div className="p-4 space-y-4">
                    {/* Progress Bar */}
                    <div className="w-full bg-[var(--surface-subtle)] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          rate >= 80
                            ? 'bg-emerald-500'
                            : rate >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>

                    {/* Available and Not Available Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Section 1: Available Products Names */}
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                          <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-emerald-800 dark:text-emerald-300">
                            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                            <span>
                              {l('Available Products', 'المنتجات المتوفرة')} ({group.availableProducts.length})
                            </span>
                          </div>
                        </div>

                        {group.availableProducts.length === 0 ? (
                          <p className="text-xs text-[var(--ink-soft)] italic py-2">
                            {l('No available products recorded in this hospital.', 'لا توجد منتجات متوفرة مسجلة في هذا المستشفى.')}
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {group.availableProducts.map((p, idx) => (
                              <div
                                key={`${group.hospitalName}-avail-${p.name}-${idx}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-100/70 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-100 dark:border-emerald-600/40 px-2.5 py-1 text-xs font-semibold shadow-2xs"
                              >
                                <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-300 shrink-0" />
                                <span>{p.name}</span>
                                {p.code && (
                                  <span className="text-[10px] opacity-75">({p.code})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section 2: Not Available Products Names */}
                      <div className="rounded-xl border border-red-500/20 bg-red-50/20 dark:bg-red-950/10 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
                          <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-red-800 dark:text-red-300">
                            <XCircle className="size-4 text-red-600 dark:text-red-400" />
                            <span>
                              {l('Not Available Products', 'المنتجات غير المتوفرة')} ({group.unavailableProducts.length})
                            </span>
                          </div>
                        </div>

                        {group.unavailableProducts.length === 0 ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 py-2">
                            <Sparkles className="size-4" />
                            <span>
                              {l('All monitored products are fully available!', 'جميع المنتجات المقررة متوفرة بالكامل!')}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {group.unavailableProducts.map((p, idx) => (
                              <div
                                key={`${group.hospitalName}-unavail-${p.name}-${idx}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-100/70 text-red-950 dark:bg-red-900/50 dark:text-red-100 dark:border-red-600/40 px-2.5 py-1 text-xs font-semibold shadow-2xs"
                              >
                                <XCircle className="size-3 text-red-600 dark:text-red-300 shrink-0" />
                                <span>{p.name}</span>
                                {p.code && (
                                  <span className="text-[10px] opacity-75">({p.code})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes if present */}
                    {group.notes.length > 0 && (
                      <div className="rounded-lg bg-[var(--surface-subtle)] p-2.5 text-xs text-[var(--ink-soft)] border border-[var(--line)]">
                        <span className="font-bold text-[var(--ink)]">
                          {l('Notes:', 'الملاحظات:')}{' '}
                        </span>
                        {group.notes.join(' · ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
