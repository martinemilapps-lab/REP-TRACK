'use client';

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  CalendarDays,
  PackageSearch,
  ListChecks,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  Filter,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';
import type { Representative } from '@/types';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SectionCard } from '@/components/ui/SectionCard';
import { downloadExcelFromUrl } from '@/lib/clientExport';

type Props = {
  manager?: boolean;
  reps: Representative[];
};

const today = () => new Date().toISOString().slice(0, 10);
const saturday = () => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 1) % 7));
  return d.toISOString().slice(0, 10);
};

export function ExportCenter({ manager = false, reps = [] }: Props) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const l = (en: string, a: string) => (ar ? a : en);

  const [scope, setScope] = useState<'ALL_DESCENDANTS' | 'DIRECT_REPORTS'>('ALL_DESCENDANTS');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekStart, setWeekStart] = useState(saturday());
  const [month, setMonth] = useState(today().slice(0, 7));
  const [reportType, setReportType] = useState('all');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [complianceType, setComplianceType] = useState<'DAILY_REPORT' | 'WEEKLY_PLAN'>('DAILY_REPORT');
  const [repId, setRepId] = useState('');

  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string>('');

  async function handleDownload(key: string, url: string, defaultName: string) {
    setBusy(key);
    setError('');
    setDownloadSuccess('');
    try {
      const filename = await downloadExcelFromUrl(url, defaultName);
      setDownloadSuccess(
        ar
          ? `تم تحميل ملف الإكسل بنجاح: ${filename}`
          : `Excel workbook downloaded successfully: ${filename}`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy('');
    }
  }

  const sq = manager ? `scopeMode=${scope}` : '';

  // Report cards configuration
  const reportCards = [
    {
      key: 'coverage',
      icon: <TrendingUp className="size-5 text-emerald-600" />,
      title: l('Average, Coverage & Visits Frequency', 'متوسط وتغطية وتكرار الزيارات'),
      desc: l(
        'Full customer-by-name report across Hospitals, Doctors, Pharmacies, and Branches with Cycle Days, Target Expected, Actual Conducted, Daily Average, Coverage %, and Visits Frequency Status (🟢/🔴/🟡).',
        'تقرير العملاء التفصيلي بأسماء المستشفيات والأطباء والصيدليات وفروع التوزيع مع دورات الزيارة ومعدل التغطية وتكرار الزيارات الأخضر والأحمر والأصفر.'
      ),
      url: `/api/exports/coverage?period=${period}&date=${endDate || today()}${repId ? `&repId=${repId}` : ''}`,
      filename: `تقرير_تغطية_وتكرار_الزيارات_${period}_${today()}.xlsx`,
    },
    {
      key: 'availability',
      icon: <PackageSearch className="size-5 text-purple-600" />,
      title: l('Product Availability (2 Full Reports)', 'توافر المنتجات (التقريرين الكاملين)'),
      desc: l(
        'Comprehensive Hospital Breakdown (Available vs Not Available products) and 12-Month Availability Changes Matrix across all facilities.',
        'تقرير تفصيلي بتوافر المنتجات لكل مستشفى، متضمناً المنتجات المتوفرة وغير المتوفرة ومصفوفة مقارنة التغيرات على مدار 12 شهراً.'
      ),
      url: `/api/exports/reports?owner=${manager ? 'team' : 'my'}&${sq}&type=availability&month=${month}${repId ? `&repId=${repId}` : ''}`,
      filename: `تقرير_توافر_المنتجات_الشامل_${month}.xlsx`,
    },
    {
      key: 'reports',
      icon: <FileSpreadsheet className="size-5 text-blue-600" />,
      title: l(manager ? 'Team Daily Reports' : 'My Daily Reports', manager ? 'تقارير الفريق اليومية' : 'تقاريري اليومية'),
      desc: l(
        'Operational field visit records with tailored columns for Hospitals, Doctors, Pharmacies, Distribution Branches, Events, Training, and Tasks.',
        'سجلات الزيارات الميدانية بجميع التفاصيل الكاملة للمستشفيات، الأطباء، الصيدليات، فروع التوزيع، الفعاليات، والتدريب.'
      ),
      url: `/api/exports/reports?owner=${manager ? 'team' : 'my'}&${sq}&type=${reportType}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}${repId ? `&repId=${repId}` : ''}`,
      filename: `تقارير_الأنشطة_الميدانية_${reportType}_${today()}.xlsx`,
    },
    {
      key: 'plans',
      icon: <CalendarDays className="size-5 text-amber-600" />,
      title: l(manager ? 'Team Weekly Plans' : 'My Weekly Plans', manager ? 'الخطط الأسبوعية للفريق' : 'خططي الأسبوعية'),
      desc: l(
        'Weekly itinerary plans with AM/PM shifts, Single/Double visit types with companion, customer names, and meeting/training/event descriptions.',
        'الخطط الأسبوعية للفترتين الصباحية والمسائية مع نوع الزيارة (فردية / مشتركة مع المرافق)، وأسماء العملاء، وملاحظات الاجتماعات والفعاليات.'
      ),
      url: `/api/exports/weekly-plans?team=${manager}&${sq}&weekStart=${weekStart}${repId ? `&repId=${repId}` : ''}`,
      filename: `الخطط_الأسبوعية_${weekStart}.xlsx`,
    },
    {
      key: 'lists',
      icon: <ListChecks className="size-5 text-teal-600" />,
      title: l(manager ? 'Customer Master Lists' : 'My Lists', manager ? 'قوائم عملاء الفريق' : 'قوائمي المعتمدة'),
      desc: l(
        'Master lists covering all 4 categories (Hospitals, Doctors, Pharmacies, Distribution Branches) with specialties, cycles, addresses, and distributors.',
        'قوائم العملاء الأربعة (مستشفيات، أطباء، صيدليات، فروع التوزيع) مع دورات الزيارة والعناوين وجهات الاتصال والموزعين.'
      ),
      url: `/api/exports/lists${repId ? `?repId=${repId}` : ''}`,
      filename: `قوائم_العملاء_${today()}.xlsx`,
      disabled: manager && !repId,
      disabledReason: l('Select a specific representative above', 'اختر مندوباً محدداً من القائمة بالأعلى أولاً'),
    },
    ...(manager
      ? [
          {
            key: 'manager',
            icon: <FileSpreadsheet className="size-5 text-indigo-600" />,
            title: l('Manager Field Activities', 'تقارير أنشطة المديرين'),
            desc: l(
              'Supervisory double-visit records, morning and afternoon hospital/clinic inspections, comments, and field evaluations.',
              'سجلات الزيارات الإشرافية الميدانية للمدير متضمنة تفاصيل الفترتين الصباحية والمسائية والتقييمات الميدانية.'
            ),
            url: `/api/exports/reports?owner=my&type=managerActivity${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`,
            filename: `أنشطة_المديرين_الميدانية_${today()}.xlsx`,
          },
          {
            key: 'compliance',
            icon: <ShieldCheck className="size-5 text-rose-600" />,
            title: l('Submission Compliance Report', 'تقرير الالتزام بالتقديم'),
            desc: l(
              'Tracking expected vs actual submissions for Daily Reports and Weekly Plans across the organizational hierarchy.',
              'متابعة نسب التزام الموظفين بتقديم التقارير اليومية والخطط الأسبوعية في مواعيدها المحددة وفق الهيكل الإداري.'
            ),
            url: `/api/exports/compliance?type=${complianceType}&${sq}&${complianceType === 'DAILY_REPORT' ? `date=${startDate || today()}` : `weekStart=${weekStart}`}`,
            filename: `تقرير_الالتزام_${complianceType}_${today()}.xlsx`,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6" dir={ar ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[var(--gold-tint)] text-[var(--gold-dark)] border border-[var(--gold-border)]">
              <Download className="size-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--ink)]">
                {l('Data Export & Excel Center', 'مركز تصدير البيانات وملفات Excel')}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-0.5">
                {l(
                  'Extract and download comprehensive official Excel (.xlsx) workbooks for reports, plans, lists, availability, and coverage.',
                  'استخراج وتحميل ملفات إكسل رسمية متكاملة لجميع التقارير والخطط وقوائم العملاء وتوافر المنتجات ومعدلات التغطية وتكرار الزيارات.'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink-soft)] bg-[var(--surface-muted)] px-3 py-1.5 rounded-xl border border-[var(--line)]">
          <Sparkles className="size-3.5 text-[var(--gold)]" />
          <span>{ar ? 'تنسيق رسمي (.xlsx) متعدد الصفحات' : 'Official Multi-Sheet .xlsx'}</span>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)] border-b border-[var(--line)] pb-2">
          <Filter className="size-3.5 text-[var(--gold-dark)]" />
          <span>{ar ? 'فلاتر ومعايير التصدير المشتركة' : 'Common Export Filters & Parameters'}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {manager && (
            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-soft)] mb-1">
                {ar ? 'نطاق الإشراف (Scope)' : 'Hierarchy Scope'}
              </label>
              <select
                aria-label="Scope"
                className="input text-xs w-full"
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
              >
                <option value="ALL_DESCENDANTS">{ar ? 'جميع التابعين (All Descendants)' : 'All Descendants'}</option>
                <option value="DIRECT_REPORTS">{ar ? 'المرؤوسون المباشرون فقط' : 'Direct Reports Only'}</option>
              </select>
            </div>
          )}

          {manager && (
            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-soft)] mb-1">
                {ar ? 'المندوب المستهدف (Representative)' : 'Target Representative'}
              </label>
              <select
                aria-label="Representative"
                className="input text-xs w-full"
                value={repId}
                onChange={(e) => setRepId(e.target.value)}
              >
                <option value="">{ar ? 'جميع المندوبين المصرح بهم' : 'All Authorized Reps'}</option>
                {reps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.area})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[var(--ink-soft)] mb-1">
              {ar ? 'من تاريخ (From Date)' : 'From Date'}
            </label>
            <input
              aria-label="From"
              className="input text-xs w-full"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--ink-soft)] mb-1">
              {ar ? 'إلى تاريخ (To Date)' : 'To Date'}
            </label>
            <input
              aria-label="To"
              className="input text-xs w-full"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--ink-soft)] mb-1">
              {ar ? 'فترة الحساب (Coverage Period)' : 'Calculation Period'}
            </label>
            <select
              aria-label="Period"
              className="input text-xs w-full"
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
            >
              <option value="monthly">{ar ? 'شهري (Monthly)' : 'Monthly'}</option>
              <option value="weekly">{ar ? 'أسبوعي (Weekly)' : 'Weekly'}</option>
              <option value="daily">{ar ? 'يومي (Daily)' : 'Daily'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--ink-soft)] mb-1">
              {ar ? 'بداية الأسبوع (Week Start)' : 'Week Start (Saturday)'}
            </label>
            <input
              aria-label="Week start"
              className="input text-xs w-full"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--ink-soft)] mb-1">
              {ar ? 'شهر توافر المنتجات (Month)' : 'Availability Month'}
            </label>
            <input
              aria-label="Month"
              className="input text-xs w-full"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--ink-soft)] mb-1">
              {ar ? 'فئة التقرير (Activity Type)' : 'Report Type'}
            </label>
            <select
              aria-label="Report type"
              className="input text-xs w-full"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="all">{ar ? 'جميع التقارير (All)' : 'All Reports'}</option>
              <option value="hospital">{ar ? 'المستشفيات (Hospitals)' : 'Hospitals'}</option>
              <option value="doctor">{ar ? 'الأطباء (Doctors)' : 'Doctors'}</option>
              <option value="pharmacy">{ar ? 'الصيدليات (Pharmacies)' : 'Pharmacies'}</option>
              <option value="branch">{ar ? 'فروع التوزيع (Branches)' : 'Distribution Branches'}</option>
              <option value="availability">{ar ? 'توافر المنتجات (Availability)' : 'Product Availability'}</option>
              <option value="event">{ar ? 'الفعاليات (Events)' : 'Events'}</option>
              <option value="training">{ar ? 'التدريب (Training)' : 'Training'}</option>
              <option value="specialTask">{ar ? 'مراجعة المبيعات (Tasks)' : 'Sales Review / Admin'}</option>
            </select>
          </div>

          {manager && (
            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-soft)] mb-1">
                {ar ? 'نوع الالتزام (Compliance)' : 'Compliance Type'}
              </label>
              <select
                aria-label="Compliance type"
                className="input text-xs w-full"
                value={complianceType}
                onChange={(e) => setComplianceType(e.target.value as any)}
              >
                <option value="DAILY_REPORT">{ar ? 'التقرير اليومي (Daily Reports)' : 'Daily Reports'}</option>
                <option value="WEEKLY_PLAN">{ar ? 'الخطة الأسبوعية (Weekly Plans)' : 'Weekly Plans'}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <InlineAlert tone="error">
          <div className="flex items-center justify-between gap-2">
            <span>{error}</span>
            <Button size="sm" variant="ghost" onClick={() => setError('')}>
              ✕
            </Button>
          </div>
        </InlineAlert>
      )}

      {downloadSuccess && (
        <InlineAlert tone="success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span className="font-semibold text-xs md:text-sm">{downloadSuccess}</span>
          </div>
        </InlineAlert>
      )}

      {/* Export Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportCards.map((card) => {
          const isBusy = busy === card.key;
          const isDisabled = !!busy || card.disabled;

          return (
            <div
              key={card.key}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[var(--gold)] transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[var(--surface-muted)] border border-[var(--line)]">
                      {card.icon}
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-[var(--ink)]">
                      {card.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-[var(--ink-soft)] leading-relaxed mt-2">
                  {card.desc}
                </p>
                {card.disabled && card.disabledReason && (
                  <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-2">
                    ⚠️ {card.disabledReason}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--line)]">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isDisabled}
                  onClick={() => void handleDownload(card.key, card.url, card.filename)}
                >
                  {isBusy ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      <span>{ar ? 'جارٍ التوليد والتحميل...' : 'Generating Excel...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="size-4" />
                      <span>{ar ? 'تصدير إكسل رسمي (.xlsx)' : 'Download Excel (.xlsx)'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
