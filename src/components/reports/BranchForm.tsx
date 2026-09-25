'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { useTranslation } from '@/lib/i18nContext';
import { SavedCustomerDetails, VisitMode } from './SavedCustomerDetails';
import { getReportingWindowStatus, isDateSubmissionOpen } from '@/lib/business/reportingWindow';
import { CustomFieldsRenderer } from '@/components/ui/CustomFieldsRenderer';

type Item = {
  id: string;
  name: string;
  coverageArea?: string;
  defaultCycle?: number;
};

export function BranchForm({
  onSuccess,
  onError,
}: {
  selectedRep: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const l = (e: string, a: string) => (ar ? a : e);
  const windowStatus = getReportingWindowStatus();
  const [visitDate, setVisitDate] = useState(windowStatus.todayDate);
  const isClosed = !isDateSubmissionOpen(visitDate);

  const [branches, setBranches] = useState<Item[]>([]);
  const [branchId, setBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [visitType, setVisitType] = useState<VisitMode>('Single');
  const [companion, setCompanion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch('/api/lists')
      .then((r) => r.json())
      .then((a) => {
        setBranches(a.data?.branches || []);
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isClosed) {
      setError(
        l(
          'Submission window closed for this date. Reports must be submitted by maximum 9:00 AM the next day. The system cannot accept reporting after this time.',
          'انتهت مهلة التقديم لهذا اليوم (الحد الأقصى 9:00 صباحاً في اليوم التالي). لا يقبل النظام تقارير بعد هذا الوقت.'
        )
      );
      return;
    }
    if (!branchId || (visitType === 'Double' && !companion.trim())) {
      setError(
        l(
          'Select a branch, and enter a companion for a Double visit.',
          'اختر الفرع وأدخل المرافق للزيارة المشتركة.'
        )
      );
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/reports/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          products: [],
          notes,
          visitType,
          companion,
          visitDate,
          customFieldValues,
        }),
      });
      const x = await r.json();
      if (!r.ok || !x.success) throw new Error(x.message);
      onSuccess(l('Distribution Branch visit saved.', 'تم حفظ زيارة فرع التوزيع.'));
      setBranchId('');
      setNotes('');
      setVisitType('Single');
      setCompanion('');
      setCustomFieldValues({});
      setError('');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Unable to save';
      setError(message);
      onError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="text-2xl font-black">
        {l('Distribution Branch Submit Visit', 'تسجيل زيارة فرع توزيع')}
      </h2>
      {error && <InlineAlert tone="error">{error}</InlineAlert>}
      <label className="block text-sm font-semibold">
        {l('Visit Date', 'تاريخ الزيارة')} *
        <input
          required
          type="date"
          className="input mt-1 w-full"
          value={visitDate}
          min={windowStatus.minAllowedDate}
          max={windowStatus.maxAllowedDate}
          onChange={(e) => setVisitDate(e.target.value)}
        />
      </label>
      {isClosed && (
        <InlineAlert tone="error">
          {l(
            'Submission window closed for this date. Reports are accepted maximum the next day at 9:00 AM. System cannot accept reporting after this time.',
            'انتهت مهلة التقديم لهذا التاريخ (الحد الأقصى 9:00 صباحاً في اليوم التالي). لا يقبل النظام تقارير بعد هذا الوقت.'
          )}
        </InlineAlert>
      )}
      <label className="block text-sm font-semibold">
        {l('Name', 'الاسم')} *
        <select
          required
          className="input mt-1 w-full"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
        >
          <option value="">{l('Select saved branch…', 'اختر فرعاً محفوظاً…')}</option>
          {branches.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </label>
      <SavedCustomerDetails
        category="branch"
        customer={branches.find((x) => x.id === branchId)}
        visitMode={visitType}
        companion={companion}
        onVisitModeChange={(value) => {
          setVisitType(value);
          if (value === 'Single') setCompanion('');
        }}
        onCompanionChange={setCompanion}
      />
      <CustomFieldsRenderer
        section="branch_visit"
        values={customFieldValues}
        onChange={setCustomFieldValues}
      />

      {/* Blank field called Notes to make MR write in it manually for each visit */}
      <FormField
        multiline
        label={l('Notes', 'ملاحظات')}
        placeholder={l('Write visit notes manually…', 'اكتب ملاحظات الزيارة يدوياً…')}
        value={notes}
        onChange={setNotes}
      />

      <Button type="submit" isLoading={saving} disabled={isClosed}>
        {isClosed
          ? l('Closed (Past 9:00 AM)', 'مغلق (بعد 9:00 ص)')
          : l('Submit', 'إرسال')}
      </Button>
    </form>
  );
}
