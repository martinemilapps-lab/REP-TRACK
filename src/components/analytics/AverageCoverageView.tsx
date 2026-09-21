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
} from 'lucide-react';
import { SectionCard } from '@/components/ui/SectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { useTranslation } from '@/lib/i18nContext';
import type {
  AverageCoverageReport,
  CoverageColor,
  AverageColor,
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

      if (!selectedRepId && data.scopedReps?.length > 0) {
        setSelectedRepId(data.scopedReps[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, period, selectedRepId]);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

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

      {/* SECTION 3: For Managers up to SMD — Team Overview Matrix */}
      {isManager && teamSummary && teamSummary.length > 0 && (
        <SectionCard
          title={ar ? 'مصفوفة التغطية ومتوسط الزيارات للفريق' : 'Team Coverage & Average Visits Matrix'}
          description={
            ar
              ? 'متابعة شاملة لجميع المناديب التابعين لإشرافك مع تصنيف الألوان الفوري'
              : 'Full supervisory team matrix with instant Green/Yellow/Red status indicators'
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
                  <th className="p-3 text-start">{ar ? 'المقارنة بالمعدل' : 'Rate Comparison'}</th>
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

                        <td className="p-3">
                          {getAverageBadge(
                            item.averageColorVsBum as AverageColor,
                            item.actualVisits === item.bumRate
                              ? 'SAME'
                              : item.actualVisits > item.bumRate
                              ? 'ABOVE'
                              : 'BELOW',
                          )}
                        </td>

                        <td className="p-3 text-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRepId(item.repId);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-[var(--gold)] text-white border-[var(--gold)] shadow-xs'
                                : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--gold)]'
                            }`}
                          >
                            {isCurrent ? (ar ? 'المحدد حالياً' : 'Selected') : (ar ? 'عرض التحليل' : 'Inspect')}
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
