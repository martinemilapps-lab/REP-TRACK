'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/lib/i18nContext';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';

type Row = {
  id: string;
  name: string;
  position: string;
  assignmentSummary: string;
  period: string;
  status: 'SUBMITTED' | 'NOT_SUBMITTED';
};

type Payload = {
  rows: Row[];
  options: {
    employees: Array<{ id: string; name: string; position: string }>;
  };
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
const lastSaturday = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 1) % 7));
  return iso(d);
};

export function ComplianceView() {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const l = (en: string, a: string) => (ar ? a : en);

  const [type, setType] = useState<'DAILY_REPORT' | 'WEEKLY_PLAN'>('DAILY_REPORT');
  const [scope, setScope] = useState('ALL_DESCENDANTS');
  const [date, setDate] = useState(iso(new Date()));
  const [week, setWeek] = useState(lastSaturday());
  const [employees, setEmployees] = useState<string[]>([]);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const q = new URLSearchParams({
        type,
        scopeMode: scope,
        pageSize: '100',
        [type === 'DAILY_REPORT' ? 'date' : 'weekStart']:
          type === 'DAILY_REPORT' ? date : week,
      });
      const r = await fetch('/api/compliance?' + q);
      const x = await r.json();
      if (!r.ok) throw new Error(x.message);
      setData(x);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to load compliance'
      );
    }
  }, [type, scope, date, week]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 150);
    return () => clearTimeout(t);
  }, [load]);

  const employeeOptions = useMemo(() => {
    return (data?.options.employees || []).map((x) => ({
      value: x.id,
      label: `${x.name} · ${x.position}`,
    }));
  }, [data]);

  const visibleRows = useMemo(() => {
    if (!data?.rows) return [];
    if (employees.length === 0) return data.rows;
    return data.rows.filter((r) => employees.includes(r.id));
  }, [data, employees]);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-black">
        {l('Submission Compliance', 'متابعة الالتزام بالتقديم')}
      </h2>

      <FilterBar>
        <select
          aria-label="Type"
          className="input"
          value={type}
          onChange={(e) => {
            setType(e.target.value as typeof type);
            setEmployees([]);
          }}
        >
          <option value="DAILY_REPORT">
            {l('Daily Reports', 'التقارير اليومية')}
          </option>
          <option value="WEEKLY_PLAN">
            {l('Weekly Plans', 'الخطط الأسبوعية')}
          </option>
        </select>

        <select
          aria-label="Scope"
          className="input"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <option value="ALL_DESCENDANTS">
            {l('All Descendants', 'جميع المرؤوسين')}
          </option>
          <option value="DIRECT_REPORTS">
            {l('Direct Reports', 'المرؤوسون المباشرون')}
          </option>
        </select>

        {type === 'DAILY_REPORT' ? (
          <input
            aria-label="Date"
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        ) : (
          <input
            aria-label="Week start"
            type="date"
            className="input"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
          />
        )}

        <MultiSelectDropdown
          label={l('Employee', 'الموظف')}
          options={employeeOptions}
          selectedValues={employees}
          onChange={setEmployees}
          placeholder={l('All employees', 'كل الموظفين')}
        />
      </FilterBar>

      {error && (
        <InlineAlert tone="error">
          {error}
          <Button size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </InlineAlert>
      )}

      {!data ? (
        <Skeleton className="h-72" />
      ) : visibleRows.length === 0 ? (
        <EmptyState title={l('No eligible employees', 'لا يوجد موظفون')} />
      ) : (
        <DataTable
          label="Submission compliance"
          headers={[
            l('Employee', 'الموظف'),
            l('Position', 'المنصب'),
            l('Territory', 'المنطقة'),
            l('Period', 'الفترة'),
            l('Status', 'الحالة'),
          ]}
        >
          {visibleRows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3">{r.name}</td>
              <td className="px-4 py-3">{r.position}</td>
              <td className="px-4 py-3">{r.assignmentSummary}</td>
              <td className="px-4 py-3">{r.period}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={r.status === 'SUBMITTED' ? 'success' : 'error'}>
                  {r.status}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
