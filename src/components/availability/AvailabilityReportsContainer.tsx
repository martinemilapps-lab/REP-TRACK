'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Building2,
  Calendar,
  Layers,
  RefreshCw,
  Sparkles,
  BarChart3,
  Download,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { downloadExcelFromUrl } from '@/lib/clientExport';
import {
  HospitalAvailabilityReport,
  AvailabilityRecord,
} from './HospitalAvailabilityReport';
import { MonthlyAvailabilityComparisonReport } from './MonthlyAvailabilityComparisonReport';

export function AvailabilityReportsContainer({
  records: externalRecords,
  refreshSignal = 0,
  title,
  subtitle,
}: {
  records?: AvailabilityRecord[];
  refreshSignal?: number;
  title?: string;
  subtitle?: string;
}) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const l = (en: string, a: string) => (ar ? a : en);

  const [activeTab, setActiveTab] = useState<'both' | 'hospital' | 'monthly'>('both');
  const [internalRecords, setInternalRecords] = useState<AvailabilityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExternal = Boolean(externalRecords);

  const fetchReports = useCallback(async () => {
    if (isExternal) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/availability');
      if (!res.ok) throw new Error('Failed to load product availability reports');
      const data = await res.json();
      if (data.success && Array.isArray(data.availabilities)) {
        setInternalRecords(data.availabilities);
      } else {
        setInternalRecords([]);
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : l('Unable to load availability reports.', 'تعذر تحميل تقارير التوافر.')
      );
    } finally {
      setLoading(false);
    }
  }, [isExternal, l]);

  useEffect(() => {
    if (!isExternal) {
      fetchReports();
    }
  }, [fetchReports, isExternal, refreshSignal]);

  const activeRecords = externalRecords || internalRecords;

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const filename = `تقرير_توافر_المنتجات_الشامل_${new Date().toISOString().slice(0, 10)}.xlsx`;
      await downloadExcelFromUrl('/api/exports/reports?type=availability', filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 pt-6 border-t-2 border-[var(--line)]">
      {/* Container Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--gold)]/20 text-[var(--gold)]">
              <BarChart3 className="size-4.5" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[var(--ink)]">
              {title || l('Product Availability Full Reports', 'التقارير الشاملة لتوافر المنتجات')}
            </h2>
          </div>
          <p className="text-xs md:text-sm text-[var(--ink-soft)] mt-1">
            {subtitle ||
              l(
                'Comprehensive analytics across your assigned hospitals, including availability breakdowns and 12-month change tracking.',
                'تحليلات شاملة للمستشفيات المعتمدة، تشمل تفصيل التوافر بالأسماء ومقارنة التغيرات على مدار 12 شهراً.'
              )}
          </p>
        </div>

        {/* View Switcher Tabs & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('both')}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                activeTab === 'both'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              {l('Both Reports', 'كلا التقريرين')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hospital')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                activeTab === 'hospital'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              <Building2 className="size-3.5" />
              <span>{l('1. Hospital Breakdown', '1. تفصيل المستشفيات')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                activeTab === 'monthly'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              <Calendar className="size-3.5" />
              <span>{l('2. 12-Month Changes', '2. مقارنة 12 شهراً')}</span>
            </button>
          </div>

          {!isExternal && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={fetchReports}
              isLoading={loading}
              leftIcon={<RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />}
              className="text-xs"
            >
              {l('Refresh Reports', 'تحديث التقارير')}
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleExport}
            isLoading={exporting}
            leftIcon={<Download className="size-3.5" />}
            className="text-xs font-bold"
          >
            {l('Export Excel (.xlsx)', 'تصدير إكسل (.xlsx)')}
          </Button>
        </div>
      </div>

      {error && <InlineAlert tone="error">{error}</InlineAlert>}

      {/* Report 1: Hospital Availability Breakdown */}
      {(activeTab === 'both' || activeTab === 'hospital') && (
        <HospitalAvailabilityReport records={activeRecords} loading={loading} />
      )}

      {/* Report 2: 12-Month Changes & Trends Matrix */}
      {(activeTab === 'both' || activeTab === 'monthly') && (
        <MonthlyAvailabilityComparisonReport records={activeRecords} loading={loading} />
      )}
    </div>
  );
}
