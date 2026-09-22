'use client';

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Building2,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';
import { AvailabilityRecord } from './HospitalAvailabilityReport';

const MONTH_NAMES_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

type MonthTransition = 'NONE' | 'BECAME_AVAILABLE' | 'BECAME_UNAVAILABLE';

type MatrixRow = {
  key: string;
  hospital: string;
  area: string;
  product: string;
  productCode?: string;
  monthsData: Record<
    number, // 1 to 12
    {
      status: 'Available' | 'Not Available';
      transition: MonthTransition;
    } | null
  >;
  totalBecameAvailable: number;
  totalBecameUnavailable: number;
  hasChanges: boolean;
};

export function MonthlyAvailabilityComparisonReport({
  records,
  loading = false,
}: {
  records: AvailabilityRecord[];
  loading?: boolean;
}) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const l = (en: string, a: string) => (ar ? a : en);

  // Available years from records
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    records.forEach((r) => {
      if (r.month && r.month.includes('-')) {
        const y = r.month.split('-')[0];
        if (y) years.add(y);
      }
    });
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear);
    return Array.from(years).sort().reverse();
  }, [records]);

  const [selectedYear, setSelectedYear] = useState<string>(
    availableYears[0] || new Date().getFullYear().toString()
  );
  const [selectedHospital, setSelectedHospital] = useState<string>('ALL');
  const [transitionFilter, setTransitionFilter] = useState<
    'ALL' | 'CHANGED_ONLY' | 'BECAME_AVAILABLE' | 'BECAME_UNAVAILABLE'
  >('ALL');
  const [search, setSearch] = useState('');

  // Unique hospitals for filter
  const uniqueHospitals = useMemo(() => {
    return [...new Set(records.map((r) => r.hospital).filter(Boolean))].sort();
  }, [records]);

  // Compute 12-month matrix rows
  const matrixRows = useMemo(() => {
    // Filter records for the selected year
    const yearRecords = records.filter(
      (r) => r.month && r.month.startsWith(`${selectedYear}-`)
    );

    // Group by hospital + product
    const grouped = new Map<
      string,
      {
        hospital: string;
        area: string;
        product: string;
        productCode?: string;
        rawMonths: Map<number, 'Available' | 'Not Available'>;
      }
    >();

    yearRecords.forEach((r) => {
      const parts = r.month.split('-');
      const monthNum = parseInt(parts[1], 10);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return;

      const groupKey = `${r.hospital}:::${r.product}`;
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          hospital: r.hospital,
          area: r.area || '—',
          product: r.product,
          productCode: r.productCode,
          rawMonths: new Map(),
        });
      }

      const entry = grouped.get(groupKey)!;
      const status: 'Available' | 'Not Available' =
        r.status === 'Available' || r.isAvailable ? 'Available' : 'Not Available';
      entry.rawMonths.set(monthNum, status);
    });

    const rows: MatrixRow[] = [];

    grouped.forEach((entry, key) => {
      const monthsData: MatrixRow['monthsData'] = {};
      let totalBecameAvailable = 0;
      let totalBecameUnavailable = 0;

      let prevStatus: 'Available' | 'Not Available' | null = null;

      for (let m = 1; m <= 12; m++) {
        const currentStatus = entry.rawMonths.get(m);
        if (currentStatus) {
          let transition: MonthTransition = 'NONE';
          if (prevStatus && prevStatus !== currentStatus) {
            if (prevStatus === 'Not Available' && currentStatus === 'Available') {
              transition = 'BECAME_AVAILABLE';
              totalBecameAvailable++;
            } else if (prevStatus === 'Available' && currentStatus === 'Not Available') {
              transition = 'BECAME_UNAVAILABLE';
              totalBecameUnavailable++;
            }
          }
          monthsData[m] = {
            status: currentStatus,
            transition,
          };
          prevStatus = currentStatus;
        } else {
          monthsData[m] = null;
        }
      }

      const hasChanges = totalBecameAvailable > 0 || totalBecameUnavailable > 0;

      rows.push({
        key,
        hospital: entry.hospital,
        area: entry.area,
        product: entry.product,
        productCode: entry.productCode,
        monthsData,
        totalBecameAvailable,
        totalBecameUnavailable,
        hasChanges,
      });
    });

    // Sort by hospital then product
    return rows.sort((a, b) => {
      const cmpHosp = a.hospital.localeCompare(b.hospital);
      if (cmpHosp !== 0) return cmpHosp;
      return a.product.localeCompare(b.product);
    });
  }, [records, selectedYear]);

  // Filter rows based on user criteria
  const filteredRows = useMemo(() => {
    return matrixRows.filter((row) => {
      const matchHospital = selectedHospital === 'ALL' || row.hospital === selectedHospital;
      const matchSearch =
        !search.trim() ||
        row.hospital.toLowerCase().includes(search.toLowerCase()) ||
        row.product.toLowerCase().includes(search.toLowerCase()) ||
        row.area.toLowerCase().includes(search.toLowerCase());

      let matchTransition = true;
      if (transitionFilter === 'CHANGED_ONLY') {
        matchTransition = row.hasChanges;
      } else if (transitionFilter === 'BECAME_AVAILABLE') {
        matchTransition = row.totalBecameAvailable > 0;
      } else if (transitionFilter === 'BECAME_UNAVAILABLE') {
        matchTransition = row.totalBecameUnavailable > 0;
      }

      return matchHospital && matchSearch && matchTransition;
    });
  }, [matrixRows, selectedHospital, search, transitionFilter]);

  // Overall KPIs
  const kpis = useMemo(() => {
    let restockEvents = 0;
    let stockoutEvents = 0;
    let changedRowsCount = 0;

    matrixRows.forEach((r) => {
      restockEvents += r.totalBecameAvailable;
      stockoutEvents += r.totalBecameUnavailable;
      if (r.hasChanges) changedRowsCount++;
    });

    return {
      totalMonitored: matrixRows.length,
      restockEvents,
      stockoutEvents,
      changedRowsCount,
    };
  }, [matrixRows]);

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] p-4 md:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <ArrowUpDown className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                {l('Report 2', 'التقرير الثاني')}
              </span>
              <h3 className="text-lg md:text-xl font-black text-[var(--ink)]">
                {l(
                  '12-Month Availability Changes & Comparison',
                  'تقرير مقارنة تغيرات التوافر على مدار 12 شهراً'
                )}
              </h3>
            </div>
            <p className="text-xs md:text-sm text-[var(--ink-soft)]">
              {l(
                'Tracks month-over-month transitions for each product in every hospital (Became Available vs Became Unavailable).',
                'يرصد بدقة التغيرات الشهرية لكل منتج في كل مستشفى (التحول إلى متوفر أو التحول إلى غير متوفر).'
              )}
            </p>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-[var(--ink-soft)]" />
          <span className="text-xs font-bold text-[var(--ink-soft)]">{l('Year:', 'السنة:')}</span>
          <select
            className="input py-1 px-3 text-xs md:text-sm font-bold"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-center">
          <p className="text-xs text-[var(--ink-soft)] font-medium">
            {l('Product-Hospital Pairs', 'أزواج المستشفيات والمنتجات')}
          </p>
          <p className="text-xl md:text-2xl font-black text-[var(--ink)] mt-1">
            {kpis.totalMonitored}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-800 dark:text-emerald-300">
            <ArrowUpRight className="size-3.5" />
            <p className="text-xs font-semibold">
              {l('Became Available (Restocked)', 'تحول لمتوفر (توفير)')}
            </p>
          </div>
          <p className="text-xl md:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
            {kpis.restockEvents}
          </p>
        </div>

        <div className="rounded-xl border border-red-500/30 bg-red-50/50 dark:bg-red-950/20 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-red-800 dark:text-red-300">
            <ArrowDownRight className="size-3.5" />
            <p className="text-xs font-semibold">
              {l('Became Unavailable (Stockout)', 'تحول لغير متوفر (عجز)')}
            </p>
          </div>
          <p className="text-xl md:text-2xl font-black text-red-700 dark:text-red-400 mt-1">
            {kpis.stockoutEvents}
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-center">
          <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
            {l('Products with Status Changes', 'منتجات طرأ عليها تغير')}
          </p>
          <p className="text-xl md:text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
            {kpis.changedRowsCount}
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
              'Search hospital or product name…',
              'ابحث بالمستشفى أو اسم المنتج…'
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

          {/* Transition Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="size-3.5 text-[var(--ink-soft)]" />
            <select
              className="input py-1 px-2 text-xs"
              value={transitionFilter}
              onChange={(e) =>
                setTransitionFilter(
                  e.target.value as 'ALL' | 'CHANGED_ONLY' | 'BECAME_AVAILABLE' | 'BECAME_UNAVAILABLE'
                )
              }
            >
              <option value="ALL">{l('All Products', 'جميع المنتجات')}</option>
              <option value="CHANGED_ONLY">
                {l('Status Changes Only (▲/▼)', 'المنتجات التي تغيرت فقط (▲/▼)')}
              </option>
              <option value="BECAME_AVAILABLE">
                {l('Became Available (▲ Restocked)', 'تحول لمتوفر (▲ توفير)')}
              </option>
              <option value="BECAME_UNAVAILABLE">
                {l('Became Unavailable (▼ Stockout)', 'تحول لغير متوفر (▼ عجز)')}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--line)]">
        <span className="font-bold text-[var(--ink)]">{l('Legend:', 'الدليل:')}</span>
        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-500/30">
            ▲ {l('Became Available', 'أصبح متوفراً')}
          </span>
          <span className="text-[10px] text-[var(--ink-soft)]">
            ({l('Not Available ➔ Available', 'من غير متوفر إلى متوفر')})
          </span>
        </span>

        <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 font-bold">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60 border border-red-500/30">
            ▼ {l('Became Unavailable', 'أصبح غير متوفر')}
          </span>
          <span className="text-[10px] text-[var(--ink-soft)]">
            ({l('Available ➔ Not Available', 'من متوفر إلى غير متوفر')})
          </span>
        </span>

        <span className="inline-flex items-center gap-1 text-[var(--ink-soft)]">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--line)]">
            ✓
          </span>
          <span>{l('Available', 'متوفر')}</span>
        </span>

        <span className="inline-flex items-center gap-1 text-[var(--ink-soft)]">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--line)]">
            ✕
          </span>
          <span>{l('Not Available', 'غير متوفر')}</span>
        </span>

        <span className="inline-flex items-center gap-1 text-[var(--ink-soft)]">
          <span>—</span>
          <span>{l('No data', 'لا توجد بيانات')}</span>
        </span>
      </div>

      {/* 12-Month Matrix Table */}
      {loading ? (
        <div className="p-8 text-center text-sm text-[var(--ink-soft)]">
          <p>{l('Loading 12-month comparison report…', 'جارٍ تحميل تقرير مقارنة الـ 12 شهراً…')}</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-soft)]">
          <Calendar className="size-8 mx-auto text-[var(--ink-soft)] mb-2 opacity-50" />
          <p className="font-semibold">
            {l(
              'No availability records for the selected year and filters.',
              'لا توجد سجلات توافر للسنة والفلاتر المحددة.'
            )}
          </p>
          <p className="text-xs mt-1">
            {l(
              'Select another year or reset your filters.',
              'اختر سنة أخرى أو قم بإعادة تعيين خيارات التصفية.'
            )}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
          <table className="w-full text-xs md:text-sm text-start border-collapse">
            <thead className="bg-[var(--surface-subtle)] sticky top-0 border-b border-[var(--line)] z-10">
              <tr>
                <th className="p-3 text-start font-bold min-w-[160px]">
                  {l('Hospital', 'المستشفى')}
                </th>
                <th className="p-3 text-start font-bold min-w-[140px]">
                  {l('Product', 'المنتج')}
                </th>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <th
                    key={`header-month-${m}`}
                    className="p-2 text-center font-bold min-w-[65px] border-s border-[var(--line)]/50"
                  >
                    <div>{ar ? MONTH_NAMES_AR[m - 1] : MONTH_NAMES_EN[m - 1]}</div>
                    <div className="text-[10px] font-normal text-[var(--ink-soft)]">
                      {String(m).padStart(2, '0')}
                    </div>
                  </th>
                ))}
                <th className="p-3 text-center font-bold min-w-[120px] border-s border-[var(--line)]">
                  {l('Annual Changes', 'تغيرات السنة')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.key}
                  className={`border-b border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors ${
                    row.hasChanges ? 'bg-[var(--surface-card)]' : ''
                  }`}
                >
                  {/* Hospital & Area */}
                  <td className="p-3">
                    <p className="font-bold text-[var(--ink)]">{row.hospital}</p>
                    <p className="text-[11px] text-[var(--ink-soft)]">{row.area}</p>
                  </td>

                  {/* Product & Code */}
                  <td className="p-3">
                    <p className="font-semibold text-[var(--ink)]">{row.product}</p>
                    {row.productCode && (
                      <p className="text-[10px] text-[var(--ink-soft)]">{row.productCode}</p>
                    )}
                  </td>

                  {/* 12 Months Cells */}
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const data = row.monthsData[m];
                    if (!data) {
                      return (
                        <td
                          key={`${row.key}-m-${m}`}
                          className="p-2 text-center text-[var(--ink-soft)] border-s border-[var(--line)]/50"
                        >
                          —
                        </td>
                      );
                    }

                    const isAvail = data.status === 'Available';

                    if (data.transition === 'BECAME_AVAILABLE') {
                      return (
                        <td
                          key={`${row.key}-m-${m}`}
                          className="p-1.5 text-center border-s border-[var(--line)]/50 bg-emerald-500/10 dark:bg-emerald-950/40"
                          title={l(
                            `Month ${m}: Product BECAME AVAILABLE in this hospital!`,
                            `شهر ${m}: أصبح المنتج متوفراً في هذا المستشفى!`
                          )}
                        >
                          <div className="inline-flex flex-col items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100 px-1.5 py-0.5 font-bold shadow-2xs">
                            <span className="text-[10px] leading-tight flex items-center gap-0.5">
                              ▲ {l('New', 'توفير')}
                            </span>
                            <span className="text-xs">✓</span>
                          </div>
                        </td>
                      );
                    }

                    if (data.transition === 'BECAME_UNAVAILABLE') {
                      return (
                        <td
                          key={`${row.key}-m-${m}`}
                          className="p-1.5 text-center border-s border-[var(--line)]/50 bg-red-500/10 dark:bg-red-950/40"
                          title={l(
                            `Month ${m}: Product BECAME UNAVAILABLE in this hospital!`,
                            `شهر ${m}: أصبح المنتج غير متوفر في هذا المستشفى!`
                          )}
                        >
                          <div className="inline-flex flex-col items-center justify-center rounded-md border border-red-500/40 bg-red-100 text-red-900 dark:bg-red-900/60 dark:text-red-100 px-1.5 py-0.5 font-bold shadow-2xs">
                            <span className="text-[10px] leading-tight flex items-center gap-0.5">
                              ▼ {l('Loss', 'عجز')}
                            </span>
                            <span className="text-xs">✕</span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${row.key}-m-${m}`}
                        className="p-2 text-center border-s border-[var(--line)]/50"
                      >
                        <span
                          className={`inline-flex size-6 items-center justify-center rounded-md text-xs font-bold ${
                            isAvail
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                          }`}
                        >
                          {isAvail ? '✓' : '✕'}
                        </span>
                      </td>
                    );
                  })}

                  {/* Annual Changes Summary */}
                  <td className="p-3 text-center border-s border-[var(--line)]">
                    {row.totalBecameAvailable === 0 && row.totalBecameUnavailable === 0 ? (
                      <span className="text-[11px] text-[var(--ink-soft)]">
                        {l('Stable', 'مستقر')}
                      </span>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        {row.totalBecameAvailable > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                            <ArrowUpRight className="size-3" />
                            <span>
                              +{row.totalBecameAvailable} {l('Restocked', 'توفير')}
                            </span>
                          </span>
                        )}
                        {row.totalBecameUnavailable > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-300 bg-red-100/70 dark:bg-red-950/50 px-1.5 py-0.5 rounded">
                            <ArrowDownRight className="size-3" />
                            <span>
                              -{row.totalBecameUnavailable} {l('Stockout', 'عجز')}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
