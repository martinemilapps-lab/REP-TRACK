'use client';

import { useEffect, useMemo, useState } from 'react';
import { Send, CheckCircle2, XCircle, RotateCcw, PackageCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SectionCard } from '@/components/ui/SectionCard';

type Hospital = { id: string; name: string; area: string };
type Product = { id: string; name: string; code?: string | null };
type Status = 'Available' | 'Not Available';

const currentMonth = () => new Date().toISOString().slice(0, 7);

export function AvailabilityForm({
  onSuccess,
  onError,
}: {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const l = (en: string, a: string) => (ar ? a : en);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [hospitalId, setHospitalId] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/lists').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ])
      .then(([lists, catalog]) => {
        if (!lists.success || !catalog.success) throw new Error();
        setHospitals(lists.data.hospitals || []);
        setProducts(catalog.products || []);
        setStatuses({});
      })
      .catch(() =>
        setError(
          ar
            ? 'تعذر تحميل المستشفيات والمنتجات.'
            : 'Unable to load saved hospitals and products.'
        )
      )
      .finally(() => setLoading(false));
  }, [ar]);

  const enteredCount = useMemo(() => {
    return products.filter((p) => Boolean(statuses[p.id])).length;
  }, [products, statuses]);

  const setAllStatus = (status: Status) => {
    const next: Record<string, Status> = {};
    products.forEach((p) => {
      next[p.id] = status;
    });
    setStatuses(next);
  };

  const clearAllStatuses = () => {
    setStatuses({});
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !hospitalId || enteredCount === 0) return;

    // Submit all products with an entered status
    const enteredItems = products
      .filter((p) => Boolean(statuses[p.id]))
      .map((p) => ({
        productId: p.id,
        status: statuses[p.id],
      }));

    if (enteredItems.length === 0) {
      setError(
        l(
          'Please specify availability for at least one product before submitting.',
          'يرجى تحديد حالة التوافر لمنتج واحد على الأقل قبل الإرسال.'
        )
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/reports/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId,
          month,
          notes,
          items: enteredItems,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);

      onSuccess(
        l(
          `Registered ${data.savedCount} product availability statuses for ${data.hospitalName}`,
          `تم تسجيل وتأكيد حالة ${data.savedCount} منتج بنجاح في ${data.hospitalName}`
        )
      );
      setStatuses({});
      setNotes('');
    } catch (e) {
      const message =
        e instanceof Error && e.message
          ? e.message
          : l('Unable to save availability.', 'تعذر حفظ التوافر.');
      setError(message);
      onError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p role="status" className="p-6 text-sm text-[var(--ink-soft)]">
        {l('Loading product availability…', 'جارٍ تحميل توافر المنتجات…')}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" dir={ar ? 'rtl' : 'ltr'}>
      <header>
        <h2 className="text-2xl font-black">
          {l('Product Availability', 'توافر المنتجات')}
        </h2>
        <p className="text-sm text-[var(--ink-soft)]">
          {l(
            'Record product availability for your saved hospitals and reporting month.',
            'سجل حالة توافر المنتجات للمستشفيات المحفوظة لشهر التقرير.'
          )}
        </p>
      </header>

      {error && <InlineAlert tone="error">{error}</InlineAlert>}

      <SectionCard title={l('Hospital and period', 'المستشفى والفترة')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            {l('Saved hospital', 'المستشفى المحفوظ')} *
            <select
              required
              className="input mt-1 w-full"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
            >
              <option value="">
                {l('Select hospital…', 'اختر مستشفى…')}
              </option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} · {h.area}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {l('Reporting month', 'شهر التقرير')} *
            <input
              required
              type="month"
              className="input mt-1 w-full"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
        </div>
        {!hospitals.length && (
          <InlineAlert tone="warning">
            {l(
              'Create hospitals in My Lists first.',
              'أضف المستشفيات من قوائمي أولاً.'
            )}
          </InlineAlert>
        )}
      </SectionCard>

      <SectionCard
        title={`${l('Canonical product catalog', 'قائمة المنتجات المعتمدة')} · ${products.length}`}
        actions={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setAllStatus('Available')}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-50 px-2 py-1 font-semibold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-all cursor-pointer"
            >
              <CheckCircle2 className="size-3.5" />
              <span>{l('Mark all Available', 'تحديد الكل كمتوفر')}</span>
            </button>
            <button
              type="button"
              onClick={() => setAllStatus('Not Available')}
              className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-50 px-2 py-1 font-semibold text-red-800 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60 transition-all cursor-pointer"
            >
              <XCircle className="size-3.5" />
              <span>{l('Mark all Not Available', 'تحديد الكل كغير متوفر')}</span>
            </button>
            <button
              type="button"
              onClick={clearAllStatuses}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 font-semibold text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>{l('Clear', 'مسح')}</span>
            </button>
          </div>
        }
      >
        <div className="max-h-[60dvh] overflow-auto rounded-xl border border-[var(--line)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--surface)] z-10">
              <tr>
                <th className="p-3 text-start font-bold">{l('Product', 'المنتج')}</th>
                <th className="p-3 font-bold text-center">{l('Status', 'الحالة')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const currentStatus = statuses[product.id];
                return (
                  <tr
                    key={product.id}
                    className={`border-t border-[var(--line)] transition-colors ${
                      currentStatus ? 'bg-[var(--surface-subtle)]/50' : ''
                    }`}
                  >
                    <td className="p-3 font-medium">
                      {product.name}
                      {product.code ? (
                        <small className="ms-2 text-[var(--ink-soft)]">
                          {product.code}
                        </small>
                      ) : null}
                    </td>
                    <td className="p-2">
                      <div className="flex justify-center gap-2">
                        {(['Available', 'Not Available'] as const).map((status) => {
                          const active = currentStatus === status;
                          return (
                            <button
                              type="button"
                              key={status}
                              aria-pressed={active}
                              onClick={() =>
                                setStatuses({
                                  ...statuses,
                                  [product.id]: status,
                                })
                              }
                              className={`rounded-lg border px-3 py-1.5 font-semibold text-xs md:text-sm cursor-pointer transition-all ${
                                active
                                  ? status === 'Available'
                                    ? 'border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100 dark:border-emerald-500 font-bold shadow-xs'
                                    : 'border-red-600 bg-red-100 text-red-900 dark:bg-red-900/60 dark:text-red-100 dark:border-red-500 font-bold shadow-xs'
                                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]'
                              }`}
                            >
                              {status === 'Available'
                                ? l('✓ Available', '✓ متوفر')
                                : l('✕ Not Available', '✕ غير متوفر')}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <label className="mt-4 block text-sm font-semibold">
          {l('Notes', 'ملاحظات')}
          <textarea
            className="input mt-1 w-full"
            placeholder={l('Add notes about product availability…', 'أضف ملاحظات حول توافر المنتجات…')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {/* Footer Area with Submit Option in bottom-right green-marked area */}
        <div className="mt-5 pt-4 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status summary on left */}
          <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--ink-soft)]">
            <PackageCheck className="size-4 text-[var(--gold)]" />
            <span>
              {l('Registered:', 'تم تحديد:')}{' '}
              <b className="text-[var(--ink)] font-bold">
                {enteredCount} / {products.length} {l('products', 'منتج')}
              </b>
            </span>
          </div>

          {/* Submit Option in the area marked green (bottom right) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="submit"
              size="lg"
              isLoading={saving}
              disabled={!hospitalId || enteredCount === 0 || !products.length}
              leftIcon={<Send className="size-4" />}
              className="w-full sm:w-auto min-w-[220px] font-bold text-sm shadow-md"
            >
              {l(
                `Submit Availability (${enteredCount})`,
                `تسجيل التوفر (${enteredCount})`
              )}
            </Button>
          </div>
        </div>
      </SectionCard>
    </form>
  );
}
