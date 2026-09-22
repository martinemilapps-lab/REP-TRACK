'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Skeleton } from '@/components/ui/Skeleton';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';
import { Button } from '@/components/ui/Button';
import { AvailabilityReportsContainer } from '@/components/availability/AvailabilityReportsContainer';

type Row = {
  id: string;
  rep: string;
  username?: string;
  positionCode?: string;
  area?: string;
  hospital: string;
  hospitalType?: string;
  product: string;
  status: 'Available' | 'Not Available';
  month: string;
  submittedAt?: string;
};

export function ManagerAvailabilityView() {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const l = (e: string, a: string) => (ar ? a : e);

  const [scope, setScope] = useState<'DIRECT_REPORTS' | 'ALL_DESCENDANTS'>('ALL_DESCENDANTS');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Multi-choice filter states
  const [periods, setPeriods] = useState<string[]>([]);
  const [reps, setReps] = useState<string[]>([]);
  const [hospitals, setHospitals] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    fetch(`/api/reports?scopeMode=${scope}`, { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((x) => {
        setRows(x.availabilities || []);
        setError(false);
      })
      .catch(() => {
        if (!c.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [scope]);

  const unique = (key: keyof Row) =>
    [...new Set(rows.map((r) => String(r[key] || '')).filter(Boolean))].sort();

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!periods.length || periods.includes(r.month)) &&
          (!reps.length || reps.includes(r.rep)) &&
          (!hospitals.length || hospitals.includes(r.hospital)) &&
          (!areas.length || areas.includes(r.area || '')) &&
          (!products.length || products.includes(r.product)) &&
          (!statuses.length || statuses.includes(r.status))
      ),
    [rows, periods, reps, hospitals, areas, products, statuses]
  );

  const handleReset = () => {
    setPeriods([]);
    setReps([]);
    setHospitals([]);
    setAreas([]);
    setProducts([]);
    setStatuses([]);
  };

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-black">
          {l('Product Availability', 'توافر المنتجات')}
        </h2>
        <p className="text-sm text-[var(--ink-soft)]">
          {l(
            'Canonical MR submissions within your live organizational hierarchy.',
            'تقديمات المندوبين المعتمدة ضمن نطاقك التنظيمي الفعلي.'
          )}
        </p>
      </header>

      <FilterBar>
        <label className="text-sm font-semibold">
          {l('Scope', 'النطاق')}
          <select
            className="input mt-1 w-full"
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
          >
            <option value="ALL_DESCENDANTS">
              {l('All descendants', 'جميع المرؤوسين')}
            </option>
            <option value="DIRECT_REPORTS">
              {l('Direct reports', 'المرؤوسون المباشرون')}
            </option>
          </select>
        </label>

        <MultiSelectDropdown
          label={l('Period', 'الفترة')}
          options={unique('month')}
          selectedValues={periods}
          onChange={setPeriods}
          placeholder={l('All periods', 'كل الفترات')}
        />

        <MultiSelectDropdown
          label={l('MR', 'المندوب')}
          options={unique('rep')}
          selectedValues={reps}
          onChange={setReps}
          placeholder={l('All MRs', 'كل المندوبين')}
        />

        <MultiSelectDropdown
          label={l('Hospital', 'المستشفى')}
          options={unique('hospital')}
          selectedValues={hospitals}
          onChange={setHospitals}
          placeholder={l('All hospitals', 'كل المستشفيات')}
        />

        <MultiSelectDropdown
          label={l('Area / Territory', 'المنطقة')}
          options={unique('area')}
          selectedValues={areas}
          onChange={setAreas}
          placeholder={l('All areas', 'كل المناطق')}
        />

        <MultiSelectDropdown
          label={l('Product', 'المنتج')}
          options={unique('product')}
          selectedValues={products}
          onChange={setProducts}
          placeholder={l('All products', 'كل المنتجات')}
        />

        <MultiSelectDropdown
          label={l('Status', 'الحالة')}
          options={[
            { value: 'Available', label: l('✓ Available', '✓ متوفر') },
            { value: 'Not Available', label: l('✕ Not Available', '✕ غير متوفر') },
          ]}
          selectedValues={statuses}
          onChange={setStatuses}
          placeholder={l('All statuses', 'كل الحالات')}
        />

        <Button type="button" variant="secondary" onClick={handleReset}>
          {l('Reset', 'إعادة تعيين')}
        </Button>
      </FilterBar>

      {error ? (
        <InlineAlert tone="error">
          {l('Unable to load availability', 'تعذر تحميل التوافر')}
        </InlineAlert>
      ) : loading ? (
        <Skeleton className="h-72" />
      ) : (
        <DataTable
          label="Manager product availability"
          headers={[
            l('MR', 'المندوب'),
            l('Position', 'المنصب'),
            l('Territory', 'المنطقة'),
            l('Hospital', 'المستشفى'),
            l('Hospital type', 'نوع المستشفى'),
            l('Product', 'المنتج'),
            l('Status', 'الحالة'),
            l('Period', 'الفترة'),
            l('Submitted', 'وقت التقديم'),
          ]}
        >
          {filtered.map((r) => (
            <tr key={r.id}>
              <td className="p-3">
                {r.rep}
                <p className="text-xs text-[var(--ink-soft)]">{r.username}</p>
              </td>
              <td className="p-3">{r.positionCode || 'MR'}</td>
              <td className="p-3">{r.area || '—'}</td>
              <td className="p-3 font-semibold">{r.hospital}</td>
              <td className="p-3">{r.hospitalType || '—'}</td>
              <td className="p-3 font-medium">{r.product}</td>
              <td className="p-3">
                <StatusBadge tone={r.status === 'Available' ? 'success' : 'error'}>
                  {r.status === 'Available' ? '✓ Available' : '✕ Not Available'}
                </StatusBadge>
              </td>
              <td className="p-3">{r.month}</td>
              <td className="p-3">
                {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {/* 2 Full Reports for Managers across live hierarchy */}
      {!loading && !error && (
        <AvailabilityReportsContainer
          records={filtered as any}
          title={l('Manager Team Product Availability Reports', 'تقارير توافر المنتجات لفريق العمل')}
          subtitle={l(
            'Hierarchical aggregated full reports for your scoped representatives and territories.',
            'التقارير الشاملة التراكمية للمندوبين والمناطق التابعة لنطاقك الإداري والتنظيمي.'
          )}
        />
      )}
    </div>
  );
}

