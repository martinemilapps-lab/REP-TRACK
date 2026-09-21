'use client';

import { useCallback, useEffect, useState } from 'react';
import type { WeeklyPlanRecord } from '@/types';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Drawer } from '@/components/ui/Drawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SectionCard } from '@/components/ui/SectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReportDetails, reportLabel } from '@/components/reports/ReportExplorer';
import { CalendarDays, Download, Plus, Eye, Edit3, Trash2 } from 'lucide-react';

interface MyWeeklyPlanViewProps {
  onOpenPlan?: (plan: WeeklyPlanRecord) => void;
  onCreateNew?: () => void;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function MyWeeklyPlanView({
  onOpenPlan,
  onCreateNew,
  onSuccess,
  onError,
}: MyWeeklyPlanViewProps) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const l = (en: string, arabic: string) => (ar ? arabic : en);

  const [plans, setPlans] = useState<WeeklyPlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WeeklyPlanRecord | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<WeeklyPlanRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/weekly-plans', { signal });
      if (!response.ok) throw new Error('Failed to load plans');
      const data = await response.json();
      if (!signal?.aborted) {
        setPlans(data.plans || []);
      }
    } catch {
      if (!signal?.aborted) {
        setError(true);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const handleDelete = async () => {
    if (!deletingPlan || isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/weekly-plans/${deletingPlan.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Delete failed');
      onSuccess?.(l('Weekly plan deleted successfully ✓', 'تم حذف الخطة الأسبوعية بنجاح ✓'));
      setDeletingPlan(null);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : l('Unable to delete plan', 'تعذر حذف الخطة');
      onError?.(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in" dir={ar ? 'rtl' : 'ltr'}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] p-5 rounded-2xl border border-[var(--line)] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--gold-tint)] border border-[var(--gold-border)] flex items-center justify-center text-[var(--gold-dark)]">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[var(--ink)]">
                {l('My Weekly Plan', 'خطتي الأسبوعية')}
              </h1>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                {l(
                  'Review, view details, export, or edit your saved AM/PM weekly plans.',
                  'مراجعة وتفاصيل وتصدير وتعديل خططك الأسبوعية المسجلة.'
                )}
              </p>
            </div>
          </div>
        </div>

        {onCreateNew && (
          <Button
            type="button"
            onClick={onCreateNew}
            leftIcon={<Plus className="size-4" />}
            className="self-start sm:self-auto cursor-pointer"
          >
            {l('New Weekly Plan', 'خطة أسبوعية جديدة')}
          </Button>
        )}
      </div>

      {error && (
        <InlineAlert tone="error">
          <div className="flex items-center justify-between gap-3 w-full">
            <span>{l('Unable to load weekly plans.', 'تعذر تحميل الخطط الأسبوعية.')}</span>
            <Button type="button" size="sm" variant="secondary" onClick={() => void load()}>
              {l('Retry', 'إعادة المحاولة')}
            </Button>
          </div>
        </InlineAlert>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-8 text-center">
          <EmptyState
            title={l('No weekly plans recorded yet', 'لا توجد خطط أسبوعية مسجلة حتى الآن')}
            description={l(
              'You have not submitted any weekly plans yet. Click below to start entering your weekly plan.',
              'لم تقم بتقديم أي خطة أسبوعية حتى الآن. اضغط أدناه للبدء في إدخال خطتك الأسبوعية.'
            )}
            icon={<CalendarDays className="size-8 text-[var(--gold-dark)]" />}
          />
          {onCreateNew && (
            <div className="mt-4 flex justify-center">
              <Button type="button" onClick={onCreateNew} leftIcon={<Plus className="size-4" />}>
                {l('Enter Weekly Plan', 'تسجيل الخطة الأسبوعية')}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <SectionCard
              key={plan.id}
              title={plan.weekLabel || `${plan.startDate} – ${plan.endDate}`}
              actions={
                <StatusBadge tone={plan.status === 'Approved' ? 'success' : plan.status === 'Submitted' ? 'success' : 'neutral'}>
                  {reportLabel(plan.status, ar)}
                </StatusBadge>
              }
            >
              <div className="space-y-3">
                <div className="text-xs text-[var(--ink-soft)] flex flex-col gap-1">
                  <span>
                    <b>{l('Period:', 'الفترة:')}</b> {plan.startDate} {l('to', 'إلى')} {plan.endDate}
                  </span>
                  {plan.submittedAt && (
                    <span>
                      <b>{l('Submitted:', 'تاريخ التقديم:')}</b>{' '}
                      {new Date(plan.submittedAt).toLocaleDateString(ar ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                  {plan.managerNotes && (
                    <div className="p-2 mt-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                      <b>{l('Manager note:', 'ملاحظة المدير:')}</b> {plan.managerNotes}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--line)] flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedPlan(plan)}
                    leftIcon={<Eye className="size-3.5" />}
                  >
                    {l('Details', 'التفاصيل')}
                  </Button>

                  {onOpenPlan && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => onOpenPlan(plan)}
                      leftIcon={<Edit3 className="size-3.5" />}
                    >
                      {l('Edit Plan', 'تعديل الخطة')}
                    </Button>
                  )}

                  <a
                    href={`/api/weekly-plans/${plan.id}/export`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] px-2.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-all"
                    download
                  >
                    <Download className="size-3.5" />
                    <span>{l('Export Excel', 'تصدير Excel')}</span>
                  </a>

                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => setDeletingPlan(plan)}
                    leftIcon={<Trash2 className="size-3.5" />}
                  >
                    {l('Delete', 'حذف')}
                  </Button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {/* Plan Details Drawer */}
      <Drawer
        open={Boolean(selectedPlan)}
        title={selectedPlan?.weekLabel || l('Weekly Plan Details', 'تفاصيل الخطة الأسبوعية')}
        onClose={() => setSelectedPlan(null)}
      >
        {selectedPlan && (
          <ReportDetails
            row={{
              id: selectedPlan.id,
              type: 'plan',
              name: selectedPlan.weekLabel || `${selectedPlan.startDate} – ${selectedPlan.endDate}`,
              date: selectedPlan.startDate,
              owner: selectedPlan.rep,
              position: 'MR',
              status: selectedPlan.status,
              record: {
                ...selectedPlan,
              },
            }}
          />
        )}
      </Drawer>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deletingPlan)}
        title={l('Delete Weekly Plan', 'حذف الخطة الأسبوعية')}
        description={l(
          'Are you sure you want to delete this weekly plan? This action cannot be undone.',
          'هل أنت متأكد من حذف هذه الخطة الأسبوعية؟ لا يمكن التراجع عن هذا الإجراء.'
        )}
        destructive
        onClose={() => setDeletingPlan(null)}
        onConfirm={() => void handleDelete()}
        confirmLabel={l('Delete', 'حذف')}
      />
    </div>
  );
}
