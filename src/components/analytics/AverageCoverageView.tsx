'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  Building2,
  Stethoscope,
  Pill,
  Truck,
  Users,
  Calendar,
  RefreshCw,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  BarChart3,
  Layers,
  RotateCcw,
  Send,
  Check,
  Filter,
  Download,
  ArrowUpDown,
  Search,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';
import { SectionCard } from '@/components/ui/SectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { useTranslation } from '@/lib/i18nContext';
import { downloadExcelFromUrl } from '@/lib/clientExport';
import type {
  AverageCoverageReport,
  CoverageColor,
  AverageColor,
  FrequencyColor,
  EntityFrequencyItem,
} from '@/lib/services/averageCoverageService';

interface ScopedRep {
  id: string;
  name: string;
  area: string;
}

interface TeamSummaryItem {
  repId: string;
  repName: string;
  repArea: string;
  coveragePct: number;
  coverageColor: string;
  actualVisits: number;
  bumRate: number;
  averageColorVsBum: string;
  frequencyTotal?: number;
  frequencySame?: number;
  frequencyOver?: number;
  frequencyLess?: number;
}

interface AverageCoverageViewProps {
  initialRepId?: string;
  currentUser?: {
    id: string;
    name: string;
    positionCode?: string | null;
    systemRole?: string | null;
  };
}

export function AverageCoverageView({ initialRepId, currentUser }: AverageCoverageViewProps) {
  const { language } = useTranslation();
  const ar = language === 'ar';

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [selectedRepId, setSelectedRepId] = useState<string>(initialRepId || '');
  const [scopedReps, setScopedReps] = useState<ScopedRep[]>([]);
  const [isManager, setIsManager] = useState(false);
  const [report, setReport] = useState<AverageCoverageReport | null>(null);
  const [teamSummary, setTeamSummary] = useState<TeamSummaryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Visits Frequency state & filters
  const [freqCategoryFilter, setFreqCategoryFilter] = useState<
    'ALL' | 'HOSPITAL' | 'DOCTOR' | 'PHARMACY' | 'DISTRIBUTION_BRANCH'
  >('ALL');
  const [freqStatusFilter, setFreqStatusFilter] = useState<
    'ALL' | 'GREEN' | 'RED' | 'YELLOW' | 'UNVISITED' | 'FULL_COVERAGE'
  >('ALL');
  const [freqSearch, setFreqSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'actualVisits' | 'expectedVisits' | 'coveragePct' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);

  const loadData = useCallback(async (showBusy = true) => {
    try {
      if (showBusy) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('date', selectedDate);
      params.set('period', period);
      if (selectedRepId) params.set('repId', selectedRepId);
      params.set('summary', 'true');

      const res = await fetch(`/api/average-coverage?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load average and coverage data');
      }

      setIsManager(Boolean(data.isManager));
      setScopedReps(data.scopedReps || []);
      setReport(data.report || null);
      setTeamSummary(data.teamSummary || null);
      setLastUpdated(
        new Date().toLocaleTimeString(ar ? 'ar-EG' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );

      if (!selectedRepId && data.scopedReps?.length > 0) {
        setSelectedRepId(data.scopedReps[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, period, selectedRepId, ar]);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  // Live Auto-Sync: Automatic updates on tab focus and every 25 seconds
  useEffect(() => {
    const onFocus = () => void loadData(false);
    window.addEventListener('focus', onFocus);

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        void loadData(false);
      }
    }, 25000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
  }, [loadData]);

  // Handle explicit report submission up hierarchy
  const handleSendReport = async () => {
    try {
      setSubmittingReport(true);
      setSubmissionSuccess(null);
      setError(null);

      const res = await fetch('/api/average-coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, period }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to send visits frequency report');
      }

      const timeStr = new Date().toLocaleTimeString(ar ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      setSubmissionSuccess(
        ar
          ? `تم إرسال التقرير الشامل لمتوسط وتغطية وتكرار الزيارات بأسماء العملاء تلقائياً الساعة ${timeStr} إلى جميع المديرين المشرفين في الهيكل الإداري حتى مدير القطاع (SMD).`
          : `Comprehensive Customer Average, Coverage & Frequency Report successfully submitted at ${timeStr} to all assigned managers up to SMD.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send report');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Export Official Excel (.xlsx)
  const handleExportExcel = async () => {
    setExportingExcel(true);
    setError(null);
    try {
      const q = `/api/exports/coverage?period=${period}&date=${selectedDate}${selectedRepId ? `&repId=${selectedRepId}` : ''}`;
      const defaultName = `تقرير_تغطية_وتكرار_الزيارات_${report?.repName || 'Rep'}_${period}_${selectedDate}.xlsx`;
      await downloadExcelFromUrl(q, defaultName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExportingExcel(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (!filteredFrequencyItems.length) return;
    const headers = [
      ar ? 'اسم العميل' : 'Customer Name',
      ar ? 'النوع' : 'Category',
      ar ? 'المنطقة' : 'Area',
      ar ? 'التخصص / التصنيف' : 'Specialty/Type',
      ar ? 'دورة الزيارة (أيام)' : 'Cycle Days',
      ar ? 'الزيارات المستهدفة' : 'Target Expected',
      ar ? 'الزيارات المنفذة' : 'Actual Conducted',
      ar ? 'نسبة التغطية %' : 'Coverage %',
      ar ? 'حالة التغطية' : 'Coverage Status',
      ar ? 'حالة التكرار' : 'Frequency Status',
      ar ? 'المتوسط اليومي' : 'Daily Average Rate',
      ar ? 'تاريخ آخر زيارة' : 'Last Visit Date',
    ];

    const rows = filteredFrequencyItems.map((item) => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.category,
      `"${(item.area || '').replace(/"/g, '""')}"`,
      `"${(item.extraInfo || '').replace(/"/g, '""')}"`,
      item.cycleDays,
      item.expectedVisits,
      item.actualVisits,
      `${item.coveragePct}%`,
      item.coverageStatus,
      item.frequencyStatus,
      item.averageDailyRate,
      item.lastVisitDate || 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `customer_average_coverage_frequency_${selectedDate}_${period}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Color styling helpers
  const getCoverageBadge = (color: CoverageColor, pct: number) => {
    switch (color) {
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="size-3.5" />
            <span>{pct}% ({ar ? '90-100% ممتاز' : '90-100% High'})</span>
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <AlertTriangle className="size-3.5" />
            <span>{pct}% ({ar ? '80-90% متوسط' : '80-90% Mid'})</span>
          </span>
        );
      case 'RED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <XCircle className="size-3.5" />
            <span>{pct}% ({ar ? '< 80% منخفض' : '< 80% Low'})</span>
          </span>
        );
    }
  };

  const getCoverageBarColor = (color: CoverageColor) => {
    switch (color) {
      case 'GREEN':
        return 'bg-emerald-500';
      case 'YELLOW':
        return 'bg-amber-500';
      case 'RED':
      default:
        return 'bg-rose-500';
    }
  };

  const getAverageBadge = (color: AverageColor, comparison: 'SAME' | 'ABOVE' | 'BELOW') => {
    switch (color) {
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="size-3.5" />
            <span>{ar ? 'مطابق للمعدل (Same)' : 'Target Met (Same)'}</span>
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <TrendingUp className="size-3.5" />
            <span>{ar ? 'أعلى من المعدل (Above)' : 'Above Target (More)'}</span>
          </span>
        );
      case 'RED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <XCircle className="size-3.5" />
            <span>{ar ? 'أقل من المعدل (Below)' : 'Below Target (Less)'}</span>
          </span>
        );
    }
  };

  /**
   * Visits Frequency Badge rule:
   * Green: number visited with same frequency (actual === expected)
   * Red: overvisited (actual > expected)
   * Yellow: less visited (actual < expected)
   */
  const getFrequencyBadge = (color: FrequencyColor, actual: number, expected: number) => {
    switch (color) {
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs">
            <CheckCircle2 className="size-3.5" />
            <span>{ar ? 'نفس التكرار (مطابق)' : 'Same Frequency'}</span>
            <span className="font-mono text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded-md font-bold">
              {actual} / {expected}
            </span>
          </span>
        );
      case 'RED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 shadow-2xs">
            <TrendingUp className="size-3.5" />
            <span>{ar ? 'زيارات زائدة (Overvisited)' : 'Overvisited'}</span>
            <span className="font-mono text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded-md font-bold">
              +{actual - expected} ({actual}/{expected})
            </span>
          </span>
        );
      case 'YELLOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
            <AlertTriangle className="size-3.5" />
            <span>{ar ? 'زيارات أقل (Less Visited)' : 'Less Visited'}</span>
            <span className="font-mono text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded-md font-bold">
              -{Math.max(0, expected - actual)} ({actual}/{expected})
            </span>
          </span>
        );
    }
  };

  /**
   * Customer-level Coverage Badge & Percentage
   */
  const getCustomerCoverageBadge = (pct: number, isCovered: boolean) => {
    if (!isCovered || pct === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
          <XCircle className="size-3" />
          <span>0% ({ar ? 'غير مغطى' : 'Uncovered'})</span>
        </span>
      );
    }
    if (pct >= 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="size-3" />
          <span>{pct}% ({ar ? 'مغطى بالكامل' : '100% Full'})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
        <AlertTriangle className="size-3" />
        <span>{pct}% ({ar ? 'مغطى جزئياً' : 'Partial'})</span>
      </span>
    );
  };

  const formatRelativeDate = (dateStr?: string | null) => {
    if (!dateStr) return ar ? 'لم يُزر بعد' : 'Not visited yet';
    const visitDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    visitDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return ar ? 'اليوم' : 'Today';
    if (diffDays === 1) return ar ? 'أمس' : 'Yesterday';
    if (diffDays > 1 && diffDays < 7) return ar ? `منذ ${diffDays} أيام` : `${diffDays}d ago`;
    return dateStr;
  };

  // Filtered frequency items for Section 3
  const filteredFrequencyItems = useMemo(() => {
    if (!report?.visitsFrequency) return [];
    const hosp = report.visitsFrequency.hospital.items;
    const doc = report.visitsFrequency.doctor.items;
    const pharm = report.visitsFrequency.pharmacy.items;
    const branch = report.visitsFrequency.branch.items;

    let list: EntityFrequencyItem[] = [];
    if (freqCategoryFilter === 'ALL') {
      list = [...hosp, ...doc, ...pharm, ...branch];
    } else if (freqCategoryFilter === 'HOSPITAL') {
      list = hosp;
    } else if (freqCategoryFilter === 'DOCTOR') {
      list = doc;
    } else if (freqCategoryFilter === 'PHARMACY') {
      list = pharm;
    } else {
      list = branch;
    }

    if (freqStatusFilter === 'GREEN') {
      list = list.filter((item) => item.frequencyColor === 'GREEN');
    } else if (freqStatusFilter === 'RED') {
      list = list.filter((item) => item.frequencyColor === 'RED');
    } else if (freqStatusFilter === 'YELLOW') {
      list = list.filter((item) => item.frequencyColor === 'YELLOW');
    } else if (freqStatusFilter === 'UNVISITED') {
      list = list.filter((item) => item.actualVisits === 0);
    } else if (freqStatusFilter === 'FULL_COVERAGE') {
      list = list.filter((item) => item.coveragePct >= 100);
    }

    if (freqSearch.trim()) {
      const q = freqSearch.toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.area.toLowerCase().includes(q) ||
          (item.extraInfo && item.extraInfo.toLowerCase().includes(q)),
      );
    }

    // Sort items
    list = [...list].sort((a, b) => {
      let valA: any = a.name;
      let valB: any = b.name;
      if (sortBy === 'actualVisits') {
        valA = a.actualVisits;
        valB = b.actualVisits;
      } else if (sortBy === 'expectedVisits') {
        valA = a.expectedVisits;
        valB = b.expectedVisits;
      } else if (sortBy === 'coveragePct') {
        valA = a.coveragePct;
        valB = b.coveragePct;
      } else if (sortBy === 'status') {
        valA = a.frequencyColor;
        valB = b.frequencyColor;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [report, freqCategoryFilter, freqStatusFilter, freqSearch, sortBy, sortOrder]);

  const filteredTeamSummary = useMemo(() => {
    if (!teamSummary) return [];
    if (!searchFilter.trim()) return teamSummary;
    const term = searchFilter.toLowerCase();
    return teamSummary.filter(
      (item) =>
        item.repName.toLowerCase().includes(term) || item.repArea.toLowerCase().includes(term),
    );
  }, [teamSummary, searchFilter]);

  if (loading && !report) {
    return (
      <div className="animate-fade-in space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Top Header & Context Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[var(--gold-tint)] text-[var(--gold-dark)] border border-[var(--gold-border)]">
              <TrendingUp className="size-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--ink)]">
                {ar ? 'معدل التغطية ومتوسط الزيارات' : 'Average and Coverage Rate'}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--ink-soft)]">
                {ar
                  ? 'متابعة نسب التغطية اليومية ومقارنة معدلات الزيارات الفعلية مع معدلات BUM وقوائم My Lists'
                  : 'Live daily coverage percentage & average visits tracking against BUM & My Lists rates'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls: Period + Date + Refresh */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Period selector */}
          <div className="inline-flex rounded-xl p-1 bg-[var(--surface-hover)] border border-[var(--line)]">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === p
                    ? 'bg-[var(--gold)] text-white shadow-xs'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                {p === 'daily' && (ar ? 'يومي' : 'Daily')}
                {p === 'weekly' && (ar ? 'أسبوعي' : 'Weekly')}
                {p === 'monthly' && (ar ? 'شهري' : 'Monthly')}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs font-semibold">
            <Calendar className="size-3.5 text-[var(--ink-soft)]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-[var(--ink)] outline-hidden cursor-pointer"
            />
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => void loadData(false)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--line)] hover:bg-[var(--surface-hover)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all cursor-pointer"
            title={ar ? 'تحديث الحسابات الآن' : 'Refresh calculations now'}
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin text-[var(--gold-dark)]' : ''}`} />
          </button>
        </div>
      </div>

      {error && <InlineAlert tone="error">{error}</InlineAlert>}

      {/* For Managers: Supervised MR Selector */}
      {isManager && scopedReps.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-[var(--gold-dark)]" />
            <label className="text-xs font-bold text-[var(--ink)]">
              {ar ? 'اختر المندوب من فريقك:' : 'Select Supervised MR:'}
            </label>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedRepId}
              onChange={(e) => setSelectedRepId(e.target.value)}
              className="input text-xs font-bold w-full sm:w-72"
            >
              {scopedReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.area}
                </option>
              ))}
            </select>
            <span className="text-xs font-bold text-[var(--ink-soft)] whitespace-nowrap">
              ({scopedReps.length} {ar ? 'مندوب متاح' : 'reps'})
            </span>
          </div>
        </div>
      )}

      {/* Target Period Context Banner */}
      {report && (
        <div className="bg-[var(--gold-tint)]/40 border border-[var(--gold-border)] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--ink)]">{report.repName}</span>
            <span className="text-[var(--ink-soft)] font-mono">({report.repArea})</span>
          </div>
          <div className="font-semibold text-[var(--ink-soft)]">
            {ar ? 'نطاق الاحتساب:' : 'Calculation Period:'}{' '}
            <strong className="font-mono text-[var(--ink)]">
              {report.startDate} {report.startDate !== report.endDate && `← ${report.endDate}`}
            </strong>
          </div>
        </div>
      )}

      {/* SECTION 1: Daily Coverage Breakdown (4 Categories + Overall) */}
      {report && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--gold)]" />
              <h2 className="text-base sm:text-lg font-black text-[var(--ink)]">
                {ar ? '1. معدلات التغطية (Coverage Rate)' : '1. Coverage Rates'}
              </h2>
            </div>
            <span className="text-xs text-[var(--ink-soft)] font-semibold hidden sm:inline">
              🟢 90-100% · 🟡 80-90% · 🔴 &lt; 80%
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Hospitals */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink-soft)]">
                  <Building2 className="size-4 text-blue-500" />
                  <span>{ar ? 'المستشفيات' : 'Hospitals'}</span>
                </div>
                {getCoverageBadge(report.coverage.hospital.color, report.coverage.hospital.coveragePct)}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[var(--ink)] font-mono">
                  {report.coverage.hospital.coveragePct}%
                </span>
                <span className="text-xs font-bold text-[var(--ink-soft)]">
                  {report.coverage.hospital.visitedEntitiesCount} / {report.coverage.hospital.totalInList} {ar ? 'تمت زيارتهم' : 'visited'}
                </span>
              </div>
              <div className="w-full bg-[var(--line)] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getCoverageBarColor(report.coverage.hospital.color)}`}
                  style={{ width: `${report.coverage.hospital.coveragePct}%` }}
                />
              </div>
            </div>

            {/* Doctors */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink-soft)]">
                  <Stethoscope className="size-4 text-emerald-500" />
                  <span>{ar ? 'الأطباء' : 'Doctors'}</span>
                </div>
                {getCoverageBadge(report.coverage.doctor.color, report.coverage.doctor.coveragePct)}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[var(--ink)] font-mono">
                  {report.coverage.doctor.coveragePct}%
                </span>
                <span className="text-xs font-bold text-[var(--ink-soft)]">
                  {report.coverage.doctor.visitedEntitiesCount} / {report.coverage.doctor.totalInList} {ar ? 'تمت زيارتهم' : 'visited'}
                </span>
              </div>
              <div className="w-full bg-[var(--line)] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getCoverageBarColor(report.coverage.doctor.color)}`}
                  style={{ width: `${report.coverage.doctor.coveragePct}%` }}
                />
              </div>
            </div>

            {/* Pharmacies */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink-soft)]">
                  <Pill className="size-4 text-purple-500" />
                  <span>{ar ? 'الصيدليات' : 'Pharmacies'}</span>
                </div>
                {getCoverageBadge(report.coverage.pharmacy.color, report.coverage.pharmacy.coveragePct)}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[var(--ink)] font-mono">
                  {report.coverage.pharmacy.coveragePct}%
                </span>
                <span className="text-xs font-bold text-[var(--ink-soft)]">
                  {report.coverage.pharmacy.visitedEntitiesCount} / {report.coverage.pharmacy.totalInList} {ar ? 'تمت زيارتهم' : 'visited'}
                </span>
              </div>
              <div className="w-full bg-[var(--line)] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getCoverageBarColor(report.coverage.pharmacy.color)}`}
                  style={{ width: `${report.coverage.pharmacy.coveragePct}%` }}
                />
              </div>
            </div>

            {/* Distribution Branches */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink-soft)]">
                  <Truck className="size-4 text-amber-500" />
                  <span>{ar ? 'فروع التوزيع' : 'Distribution'}</span>
                </div>
                {getCoverageBadge(report.coverage.branch.color, report.coverage.branch.coveragePct)}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[var(--ink)] font-mono">
                  {report.coverage.branch.coveragePct}%
                </span>
                <span className="text-xs font-bold text-[var(--ink-soft)]">
                  {report.coverage.branch.visitedEntitiesCount} / {report.coverage.branch.totalInList} {ar ? 'تمت زيارتهم' : 'visited'}
                </span>
              </div>
              <div className="w-full bg-[var(--line)] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getCoverageBarColor(report.coverage.branch.color)}`}
                  style={{ width: `${report.coverage.branch.coveragePct}%` }}
                />
              </div>
            </div>

            {/* Overall Summary */}
            <div className="bg-[var(--surface-hover)] border-2 border-[var(--gold)]/40 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-[var(--ink)]">
                  <Award className="size-4 text-[var(--gold-dark)]" />
                  <span>{ar ? 'التغطية الكلية' : 'Overall Coverage'}</span>
                </div>
                {getCoverageBadge(report.coverage.overall.color, report.coverage.overall.coveragePct)}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[var(--gold-dark)] font-mono">
                  {report.coverage.overall.coveragePct}%
                </span>
                <span className="text-xs font-bold text-[var(--ink-soft)]">
                  {report.coverage.overall.visitedEntitiesCount} / {report.coverage.overall.totalInList} {ar ? 'إجمالي' : 'total'}
                </span>
              </div>
              <div className="w-full bg-[var(--line)] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getCoverageBarColor(report.coverage.overall.color)}`}
                  style={{ width: `${report.coverage.overall.coveragePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Average Visits Comparison (Actual vs BUM Rate vs My Lists Rate) */}
      {report && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--gold)]" />
              <h2 className="text-base sm:text-lg font-black text-[var(--ink)]">
                {ar ? '2. متوسط الزيارات والمقارنة بالمعدلات (Average Visits)' : '2. Average Visits & Rates'}
              </h2>
            </div>
            <span className="text-xs text-[var(--ink-soft)] font-semibold hidden sm:inline">
              🟢 {ar ? 'مطابق للمعدل' : 'Same'} · 🟡 {ar ? 'أعلى من المعدل' : 'Above'} · 🔴 {ar ? 'أقل من المعدل' : 'Below'}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Hospitals Average */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <Building2 className="size-4 text-blue-500" />
                  <span>{ar ? 'مستشفيات' : 'Hospitals'}</span>
                </span>
                {getAverageBadge(report.averageVisits.hospital.colorVsBum, report.averageVisits.hospital.comparisonVsBum)}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-[10px] text-[var(--ink-soft)] uppercase font-bold">{ar ? 'الزيارات المنفذة' : 'Actual Visits'}</div>
                  <div className="text-2xl font-black text-[var(--ink)] font-mono">{report.averageVisits.hospital.actualVisits}</div>
                </div>
                <div className="text-end">
                  <div className="text-[10px] text-[var(--ink-soft)] font-bold">{ar ? 'معدل BUM' : 'BUM Rate'}</div>
                  <div className="text-base font-black text-[var(--gold-dark)] font-mono">{report.averageVisits.hospital.bumRate}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--ink-soft)]">
                <span>{ar ? 'معدل دورة القوائم (My Lists):' : 'My Lists Cycle Rate:'}</span>
                <strong className="font-mono text-[var(--ink)]">{report.averageVisits.hospital.listRate}</strong>
              </div>
            </div>

            {/* Doctors Average */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <Stethoscope className="size-4 text-emerald-500" />
                  <span>{ar ? 'أطباء' : 'Doctors'}</span>
                </span>
                {getAverageBadge(report.averageVisits.doctor.colorVsBum, report.averageVisits.doctor.comparisonVsBum)}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-[10px] text-[var(--ink-soft)] uppercase font-bold">{ar ? 'الزيارات المنفذة' : 'Actual Visits'}</div>
                  <div className="text-2xl font-black text-[var(--ink)] font-mono">{report.averageVisits.doctor.actualVisits}</div>
                </div>
                <div className="text-end">
                  <div className="text-[10px] text-[var(--ink-soft)] font-bold">{ar ? 'معدل BUM' : 'BUM Rate'}</div>
                  <div className="text-base font-black text-[var(--gold-dark)] font-mono">{report.averageVisits.doctor.bumRate}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--ink-soft)]">
                <span>{ar ? 'معدل دورة القوائم (My Lists):' : 'My Lists Cycle Rate:'}</span>
                <strong className="font-mono text-[var(--ink)]">{report.averageVisits.doctor.listRate}</strong>
              </div>
            </div>

            {/* Pharmacies Average */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <Pill className="size-4 text-purple-500" />
                  <span>{ar ? 'صيدليات' : 'Pharmacies'}</span>
                </span>
                {getAverageBadge(report.averageVisits.pharmacy.colorVsBum, report.averageVisits.pharmacy.comparisonVsBum)}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-[10px] text-[var(--ink-soft)] uppercase font-bold">{ar ? 'الزيارات المنفذة' : 'Actual Visits'}</div>
                  <div className="text-2xl font-black text-[var(--ink)] font-mono">{report.averageVisits.pharmacy.actualVisits}</div>
                </div>
                <div className="text-end">
                  <div className="text-[10px] text-[var(--ink-soft)] font-bold">{ar ? 'معدل BUM' : 'BUM Rate'}</div>
                  <div className="text-base font-black text-[var(--gold-dark)] font-mono">{report.averageVisits.pharmacy.bumRate}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--ink-soft)]">
                <span>{ar ? 'معدل دورة القوائم (My Lists):' : 'My Lists Cycle Rate:'}</span>
                <strong className="font-mono text-[var(--ink)]">{report.averageVisits.pharmacy.listRate}</strong>
              </div>
            </div>

            {/* Distribution Branches Average */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <Truck className="size-4 text-amber-500" />
                  <span>{ar ? 'فروع التوزيع' : 'Distribution'}</span>
                </span>
                {getAverageBadge(report.averageVisits.branch.colorVsBum, report.averageVisits.branch.comparisonVsBum)}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-[10px] text-[var(--ink-soft)] uppercase font-bold">{ar ? 'الزيارات المنفذة' : 'Actual Visits'}</div>
                  <div className="text-2xl font-black text-[var(--ink)] font-mono">{report.averageVisits.branch.actualVisits}</div>
                </div>
                <div className="text-end">
                  <div className="text-[10px] text-[var(--ink-soft)] font-bold">{ar ? 'معدل BUM' : 'BUM Rate'}</div>
                  <div className="text-base font-black text-[var(--gold-dark)] font-mono">{report.averageVisits.branch.bumRate}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--ink-soft)]">
                <span>{ar ? 'معدل دورة القوائم (My Lists):' : 'My Lists Cycle Rate:'}</span>
                <strong className="font-mono text-[var(--ink)]">{report.averageVisits.branch.listRate}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Full Customer Report for Average, Coverage & Frequency (تقرير العملاء التفصيلي) */}
      {report?.visitsFrequency && (
        <div className="space-y-4 pt-4 border-t border-[var(--line)]">
          {/* Header & Live Auto-Sync Status & Submission Action */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[var(--gold-tint)] text-[var(--gold-dark)] border border-[var(--gold-border)]">
                  <RotateCcw className="size-5" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[var(--ink)] flex items-center gap-2 flex-wrap">
                    <span>
                      {ar
                        ? '3. تقرير العملاء التفصيلي: متوسط الزيارات والتغطية وتكرار الزيارات'
                        : '3. Full Customer Report: Average, Coverage & Frequency'}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[var(--surface-hover)] border border-[var(--line)] text-[var(--ink-soft)]">
                      {ar ? 'حساب تلقائي حسب دورة My Lists' : 'Auto-calculated from My Lists'}
                    </span>
                  </h2>
                  <p className="text-xs text-[var(--ink-soft)] font-medium mt-0.5">
                    {ar
                      ? 'قائمة مفصلة بأسماء جميع العملاء في (مستشفيات، أطباء، صيدليات، فروع ومخازن التوزيع) مع نسبة التغطية والمتوسط وحالة التكرار، وتتغير تلقائياً فور تسجيل كل زيارة.'
                      : 'Comprehensive customer list across Hospitals, Doctors, Pharmacies, and Distribution Branches with Coverage %, Average Rate, and Frequency status.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions: Live Sync Indicator, Refresh, CSV Export, Submit to SMD */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
              {/* Live Sync Badge */}
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shadow-2xs"
                title={ar ? 'التحديث التلقائي نشط فور تسجيل أي زيارة' : 'Live updates active after each visit'}
              >
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px]">
                  {ar ? 'تحديث تلقائي لحظي' : 'Live Sync'}
                </span>
                {lastUpdated && (
                  <span className="opacity-70 font-mono text-[10px]">
                    ({lastUpdated})
                  </span>
                )}
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => void loadData(false)}
                disabled={refreshing}
                title={ar ? 'تحديث البيانات الآن' : 'Refresh Data Now'}
                className="p-2 rounded-xl text-xs font-bold bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-[var(--gold)]' : ''}`} />
              </button>

              {/* Export Excel (.xlsx) Button */}
              <button
                type="button"
                onClick={() => void handleExportExcel()}
                disabled={exportingExcel}
                title={ar ? 'تصدير التقرير الرسمي كملف Excel (.xlsx)' : 'Export Official Excel (.xlsx)'}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-[var(--surface)] text-[var(--ink)] border border-emerald-500/40 hover:bg-emerald-500/10 hover:border-emerald-500 transition-all cursor-pointer disabled:opacity-50"
              >
                {exportingExcel ? (
                  <RefreshCw className="size-3.5 animate-spin text-emerald-600" />
                ) : (
                  <FileSpreadsheet className="size-3.5 text-emerald-600" />
                )}
                <span>{ar ? 'تصدير Excel (.xlsx)' : 'Export Excel (.xlsx)'}</span>
              </button>

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={handleExportCsv}
                title={ar ? 'تصدير كملف CSV سريع' : 'Export CSV'}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-[var(--surface)] text-[var(--ink-soft)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
              >
                <Download className="size-3 text-[var(--gold-dark)]" />
                <span>CSV</span>
              </button>

              {/* Submit Report Up Hierarchy to SMD */}
              <button
                type="button"
                onClick={() => void handleSendReport()}
                disabled={submittingReport}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-[var(--gold)] text-white hover:bg-[var(--gold-dark)] shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingReport ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                <span>
                  {ar
                    ? 'إرسال التقرير الشامل للمديرين المشرفين حتى SMD'
                    : 'Submit Report to Assigned Managers till SMD'}
                </span>
              </button>
            </div>
          </div>

          {/* Submission Feedback Alert */}
          {submissionSuccess && (
            <InlineAlert tone="success">{submissionSuccess}</InlineAlert>
          )}

          {/* Color Rule Guide Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line)] text-xs shadow-2xs">
            <span className="font-bold text-[var(--ink)] flex items-center gap-1.5">
              <span>{ar ? 'دليل الألوان والتقييم:' : 'Color & Status Guide:'}</span>
            </span>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="size-3" />
                <span>{ar ? '🟢 الأخضر: نفس التكرار (مطابق للدورة)' : '🟢 Green: Same Frequency'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-xs bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                <TrendingUp className="size-3" />
                <span>{ar ? '🔴 الأحمر: زيارات زائدة (Overvisited)' : '🔴 Red: Overvisited'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-xs bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <AlertTriangle className="size-3" />
                <span>{ar ? '🟡 الأصفر: زيارات أقل (Less Visited)' : '🟡 Yellow: Less Visited'}</span>
              </span>
            </div>
          </div>

          {/* Frequency & Coverage KPI Summary Cards */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {/* Same Frequency Card (Green) */}
            <div className="bg-[var(--surface)] border-2 border-emerald-500/40 rounded-2xl p-3.5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  <span>{ar ? 'نفس التكرار' : 'Same'}</span>
                </span>
                <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {report.visitsFrequency.overall.samePct}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-0.5">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {report.visitsFrequency.overall.sameCount}
                </div>
                <span className="text-[10px] font-bold text-[var(--ink-soft)]">
                  {ar ? 'عميل مطابق' : 'on target'}
                </span>
              </div>
              <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${report.visitsFrequency.overall.samePct}%` }}
                />
              </div>
            </div>

            {/* Overvisited Card (Red) */}
            <div className="bg-[var(--surface)] border-2 border-rose-500/40 rounded-2xl p-3.5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                  <TrendingUp className="size-3.5 text-rose-500" />
                  <span>{ar ? 'زيارات زائدة' : 'Overvisited'}</span>
                </span>
                <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                  {report.visitsFrequency.overall.overPct}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-0.5">
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {report.visitsFrequency.overall.overCount}
                </div>
                <span className="text-[10px] font-bold text-[var(--ink-soft)]">
                  {ar ? 'عميل زائد' : 'over target'}
                </span>
              </div>
              <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${report.visitsFrequency.overall.overPct}%` }}
                />
              </div>
            </div>

            {/* Less Visited Card (Yellow) */}
            <div className="bg-[var(--surface)] border-2 border-amber-500/40 rounded-2xl p-3.5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="size-3.5 text-amber-500" />
                  <span>{ar ? 'زيارات أقل' : 'Less Visited'}</span>
                </span>
                <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                  {report.visitsFrequency.overall.lessPct}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-0.5">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {report.visitsFrequency.overall.lessCount}
                </div>
                <span className="text-[10px] font-bold text-[var(--ink-soft)]">
                  {ar ? 'عميل دون المستهدف' : 'under target'}
                </span>
              </div>
              <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${report.visitsFrequency.overall.lessPct}%` }}
                />
              </div>
            </div>

            {/* Covered Entities & Coverage % Card */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1">
                  <Award className="size-3.5 text-[var(--gold-dark)]" />
                  <span>{ar ? 'العملاء المغطون' : 'Covered'}</span>
                </span>
                <span className="text-xs font-mono font-black text-[var(--gold-dark)]">
                  {report.visitsFrequency.overall.overallCoveragePct}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-0.5">
                <div className="text-2xl font-black text-[var(--ink)] font-mono">
                  {report.visitsFrequency.overall.totalVisited}
                </div>
                <span className="text-[10px] font-bold text-[var(--ink-soft)]">
                  {ar ? `من ${report.visitsFrequency.overall.totalEntities}` : `of ${report.visitsFrequency.overall.totalEntities}`}
                </span>
              </div>
              <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--gold)] transition-all duration-500"
                  style={{ width: `${report.visitsFrequency.overall.overallCoveragePct}%` }}
                />
              </div>
            </div>

            {/* Unvisited Entities (0%) Card */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5 shadow-xs space-y-2 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                  <XCircle className="size-3.5 text-rose-500" />
                  <span>{ar ? 'غير مغطى (0%)' : 'Uncovered 0%'}</span>
                </span>
                <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                  {report.visitsFrequency.overall.unvisitedPct}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-0.5">
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {report.visitsFrequency.overall.unvisitedCount}
                </div>
                <span className="text-[10px] font-bold text-[var(--ink-soft)]">
                  {ar ? 'عميل لم يُزر' : 'not visited'}
                </span>
              </div>
              <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500/70 transition-all duration-500"
                  style={{ width: `${report.visitsFrequency.overall.unvisitedPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Filtering and Controls Bar */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-xs space-y-3">
            {/* Row 1: Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[var(--surface-hover)] rounded-xl border border-[var(--line)]">
              {[
                { key: 'ALL', label: ar ? 'الكل' : 'All', count: report.visitsFrequency.overall.totalEntities },
                { key: 'HOSPITAL', label: ar ? 'المستشفيات' : 'Hospitals', count: report.visitsFrequency.hospital.totalEntities },
                { key: 'DOCTOR', label: ar ? 'الأطباء' : 'Doctors', count: report.visitsFrequency.doctor.totalEntities },
                { key: 'PHARMACY', label: ar ? 'الصيدليات' : 'Pharmacies', count: report.visitsFrequency.pharmacy.totalEntities },
                { key: 'DISTRIBUTION_BRANCH', label: ar ? 'فروع ومخازن التوزيع' : 'Branches', count: report.visitsFrequency.branch.totalEntities },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setFreqCategoryFilter(cat.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    freqCategoryFilter === cat.key
                      ? 'bg-[var(--gold)] text-white shadow-xs'
                      : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-80 font-mono">({cat.count})</span>
                </button>
              ))}
            </div>

            {/* Row 2: Status Filter Buttons & Sort Options */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              {/* Status Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: 'ALL', label: ar ? 'كل الحالات' : 'All Status' },
                  { key: 'GREEN', label: ar ? '🟢 نفس التكرار' : '🟢 Same' },
                  { key: 'RED', label: ar ? '🔴 زائدة' : '🔴 Over' },
                  { key: 'YELLOW', label: ar ? '🟡 أقل' : '🟡 Less' },
                  { key: 'FULL_COVERAGE', label: ar ? '🏆 مغطى بالكامل' : '🏆 100% Full' },
                  { key: 'UNVISITED', label: ar ? '⭕ غير مغطى (0%)' : '⭕ Uncovered' },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setFreqStatusFilter(st.key as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      freqStatusFilter === st.key
                        ? 'bg-[var(--ink)] text-[var(--surface)] border-[var(--ink)]'
                        : 'bg-[var(--surface)] text-[var(--ink-soft)] border-[var(--line)] hover:border-[var(--ink)]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                <span className="text-xs text-[var(--ink-soft)] font-bold flex items-center gap-1">
                  <ArrowUpDown className="size-3 text-[var(--gold-dark)]" />
                  <span>{ar ? 'ترتيب حسب:' : 'Sort by:'}</span>
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="input text-xs py-1 px-2.5 rounded-lg border-[var(--line)]"
                >
                  <option value="name">{ar ? 'اسم العميل' : 'Customer Name'}</option>
                  <option value="actualVisits">{ar ? 'الزيارات المنفذة' : 'Actual Visits'}</option>
                  <option value="expectedVisits">{ar ? 'الزيارات المستهدفة' : 'Expected Visits'}</option>
                  <option value="coveragePct">{ar ? 'نسبة التغطية %' : 'Coverage %'}</option>
                  <option value="status">{ar ? 'حالة التكرار' : 'Frequency Status'}</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-1 rounded-lg text-xs font-bold border border-[var(--line)] hover:bg-[var(--surface-hover)] cursor-pointer"
                  title={ar ? (sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي') : (sortOrder === 'asc' ? 'Ascending' : 'Descending')}
                >
                  {sortOrder === 'asc' ? '▲' : '▼'}
                </button>
              </div>
            </div>

            {/* Row 3: Search Box & Filter Counter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[var(--line)]">
              <div className="relative w-full sm:w-80">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--ink-soft)]" />
                <input
                  type="search"
                  placeholder={ar ? 'بحث باسم العميل، المنطقة، التخصص، التصنيف...' : 'Search customer by name, area, specialty…'}
                  value={freqSearch}
                  onChange={(e) => setFreqSearch(e.target.value)}
                  className="input text-xs w-full ps-9"
                />
              </div>
              <span className="text-xs font-bold text-[var(--ink-soft)] self-end sm:self-auto">
                {ar
                  ? `عرض ${filteredFrequencyItems.length} من إجمالي ${report.visitsFrequency.overall.totalEntities} عميل`
                  : `Showing ${filteredFrequencyItems.length} of ${report.visitsFrequency.overall.totalEntities} customers`}
              </span>
            </div>
          </div>

          {/* Full Customer Report Detailed Table */}
          <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-xs">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--surface-hover)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold uppercase tracking-wider">
                  <th className="p-3 text-start">{ar ? 'العميل والفئة' : 'Customer & Category'}</th>
                  <th className="p-3 text-start">{ar ? 'المنطقة / العنوان' : 'Area / Location'}</th>
                  <th className="p-3 text-start">{ar ? 'دورة الزيارة (My Lists)' : 'My Lists Cycle'}</th>
                  <th className="p-3 text-start">{ar ? 'المتوسط اليومي' : 'Daily Average'}</th>
                  <th className="p-3 text-start">{ar ? 'نسبة التغطية (Coverage %)' : 'Coverage %'}</th>
                  <th className="p-3 text-start">{ar ? 'تكرار الزيارات (Frequency)' : 'Visits Frequency'}</th>
                  <th className="p-3 text-end">{ar ? 'آخر زيارة' : 'Last Visit'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredFrequencyItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm text-[var(--ink-soft)]">
                      {ar ? 'لا يوجد عملاء يطابقون خيارات البحث والتصفية' : 'No customers match the current filter criteria'}
                    </td>
                  </tr>
                ) : (
                  filteredFrequencyItems.map((item) => (
                    <tr
                      key={`${item.category}-${item.id}`}
                      className="hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      {/* Name & Category */}
                      <td className="p-3">
                        <div className="font-bold text-[var(--ink)] text-sm">{item.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md font-semibold bg-[var(--surface-hover)] text-[var(--ink-soft)] border border-[var(--line)]">
                            {item.category === 'HOSPITAL' && (ar ? 'مستشفى' : 'Hospital')}
                            {item.category === 'DOCTOR' && (ar ? 'طبيب' : 'Doctor')}
                            {item.category === 'PHARMACY' && (ar ? 'صيدلية' : 'Pharmacy')}
                            {item.category === 'DISTRIBUTION_BRANCH' && (ar ? 'فرع توزيع' : 'Branch')}
                          </span>
                          {item.extraInfo && (
                            <span className="text-[10px] text-[var(--ink-soft)] font-medium">
                              {item.extraInfo}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Area */}
                      <td className="p-3 text-[var(--ink-soft)] font-medium">
                        {item.area || '—'}
                      </td>

                      {/* Cycle Days */}
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-[var(--surface-hover)] px-2 py-0.5 rounded-lg border border-[var(--line)] text-[var(--ink)]">
                          <span>{item.cycleDays}</span>
                          <span className="text-[10px] text-[var(--ink-soft)] font-normal">
                            {ar ? 'يوم' : 'days'}
                          </span>
                        </span>
                      </td>

                      {/* Daily Average Rate */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-[var(--ink)]">
                          {item.averageDailyRate}
                        </div>
                        <div className="text-[10px] text-[var(--ink-soft)]">
                          {ar ? 'زيارة/يوم' : 'v/day'}
                        </div>
                      </td>

                      {/* Coverage % and Progress Bar */}
                      <td className="p-3">
                        <div className="space-y-1 min-w-[130px]">
                          <div className="flex items-center justify-between">
                            {getCustomerCoverageBadge(item.coveragePct, item.isCovered)}
                          </div>
                          <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                item.coverageColor === 'GREEN'
                                  ? 'bg-emerald-500'
                                  : item.coverageColor === 'YELLOW'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, item.coveragePct)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Frequency Badge */}
                      <td className="p-3">
                        {getFrequencyBadge(item.frequencyColor, item.actualVisits, item.expectedVisits)}
                      </td>

                      {/* Last Visit Date */}
                      <td className="p-3 text-end">
                        <div className="font-mono text-xs font-semibold text-[var(--ink)]">
                          {formatRelativeDate(item.lastVisitDate)}
                        </div>
                        {item.lastVisitDate && (
                          <div className="text-[10px] font-mono text-[var(--ink-soft)]">
                            {item.lastVisitDate}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: For Managers up to SMD — Team Overview Matrix */}
      {isManager && teamSummary && teamSummary.length > 0 && (
        <SectionCard
          title={ar ? 'مصفوفة التغطية ومتوسط الزيارات وتكرارها للفريق' : 'Team Coverage, Average & Frequency Matrix'}
          description={
            ar
              ? 'متابعة شاملة لجميع المناديب التابعين لإشرافك مع تصنيف الألوان الفوري للتغطية ومتوسط الزيارات وتكرارها'
              : 'Full supervisory team matrix with instant Green/Yellow/Red status for coverage, rates, and visits frequency'
          }
        >
          <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <input
              type="search"
              placeholder={ar ? 'بحث باسم المندوب أو المنطقة...' : 'Search by rep name or area…'}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="input text-xs w-full sm:w-72"
            />
            <span className="text-xs font-bold text-[var(--ink-soft)] self-end sm:self-auto">
              {ar ? `عرض ${filteredTeamSummary.length} من ${teamSummary.length} مندوب` : `Showing ${filteredTeamSummary.length} of ${teamSummary.length} reps`}
            </span>
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--line)]">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--surface-hover)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold uppercase tracking-wider">
                  <th className="p-3 text-start">{ar ? 'المندوب والمنطقة' : 'Representative & Area'}</th>
                  <th className="p-3 text-start">{ar ? 'نسبة التغطية الكلية' : 'Overall Coverage %'}</th>
                  <th className="p-3 text-start">{ar ? 'حالة التغطية' : 'Coverage Status'}</th>
                  <th className="p-3 text-start">{ar ? 'الزيارات المنفذة' : 'Actual Visits'}</th>
                  <th className="p-3 text-start">{ar ? 'معدل BUM' : 'BUM Rate'}</th>
                  <th className="p-3 text-start">{ar ? 'تكرار الزيارات (My Lists)' : 'Visits Frequency'}</th>
                  <th className="p-3 text-end">{ar ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] bg-[var(--surface)]">
                {filteredTeamSummary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-sm text-[var(--ink-soft)]">
                      {ar ? 'لا يوجد نتائج مطابقة' : 'No matching representatives found'}
                    </td>
                  </tr>
                ) : (
                  filteredTeamSummary.map((item) => {
                    const isCurrent = item.repId === selectedRepId;

                    return (
                      <tr
                        key={item.repId}
                        className={`hover:bg-[var(--surface-hover)] transition-colors ${
                          isCurrent ? 'bg-[var(--gold-tint)]/40 font-bold' : ''
                        }`}
                      >
                        <td className="p-3 font-semibold text-[var(--ink)]">
                          <div>{item.repName}</div>
                          <div className="text-[10px] text-[var(--ink-soft)] font-normal">{item.repArea}</div>
                        </td>

                        <td className="p-3 font-mono font-bold text-sm">
                          {item.coveragePct}%
                        </td>

                        <td className="p-3">
                          {getCoverageBadge(item.coverageColor as CoverageColor, item.coveragePct)}
                        </td>

                        <td className="p-3 font-mono font-bold">
                          {item.actualVisits}
                        </td>

                        <td className="p-3 font-mono text-[var(--gold-dark)]">
                          {item.bumRate}
                        </td>

                        {/* Visits Frequency summary chips */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              title={ar ? 'نفس التكرار' : 'Same Frequency'}
                            >
                              <span>🟢</span>
                              <span className="font-mono">{item.frequencySame ?? 0}</span>
                            </span>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                              title={ar ? 'زيارات زائدة' : 'Overvisited'}
                            >
                              <span>🔴</span>
                              <span className="font-mono">{item.frequencyOver ?? 0}</span>
                            </span>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                              title={ar ? 'زيارات أقل' : 'Less Visited'}
                            >
                              <span>🟡</span>
                              <span className="font-mono">{item.frequencyLess ?? 0}</span>
                            </span>
                          </div>
                        </td>

                        <td className="p-3 text-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRepId(item.repId);
                              window.scrollTo({ top: 350, behavior: 'smooth' });
                            }}
                            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-[var(--gold)] text-white border-[var(--gold)] shadow-xs'
                                : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--gold)]'
                            }`}
                          >
                            <Eye className="size-3.5" />
                            <span>
                              {isCurrent
                                ? (ar ? 'تقرير العملاء (محدد)' : 'Viewing Report')
                                : (ar ? 'عرض تقرير العملاء' : 'View Customer Report')}
                            </span>
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
      )}
    </div>
  );
}
