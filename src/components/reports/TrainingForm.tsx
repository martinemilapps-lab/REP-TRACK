'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { useTranslation } from '@/lib/i18nContext';
import { getReportingWindowStatus, isDateSubmissionOpen } from '@/lib/business/reportingWindow';

export function TrainingForm({
  selectedRep,
  onSuccess,
  onError,
}: {
  selectedRep: string;
  onSuccess: (x: string) => void;
  onError: (x: string) => void;
}) {
  void selectedRep;
  const { language } = useTranslation(),
    ar = language === 'ar',
    l = (e: string, a: string) => (ar ? a : e);
  const windowStatus = getReportingWindowStatus();
  const [title, setTitle] = useState('');
  const [trainingDate, setTrainingDate] = useState(windowStatus.todayDate);
  const isClosed = false;
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    
    setSaving(true);
    try {
      const r = await fetch('/api/reports/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, trainingDate, location }),
      });
      const x = await r.json();
      if (!r.ok) throw new Error(x.message);
      onSuccess(l('Training saved.', 'تم حفظ التدريب.'));
      setTitle('');
      setLocation('');
      setError('');
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : 'Unable to save';
      setError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-2xl font-black">{l('Training', 'التدريب')}</h2>
      {error && <InlineAlert tone="error">{error}</InlineAlert>}
      <FormField
        required
        label={l('Training Title / Topic', 'عنوان / موضوع التدريب')}
        value={title}
        onChange={setTitle}
      />
      <label className="block text-sm font-semibold">
        {l('Training Date', 'تاريخ التدريب')}
        <input
          required
          type="date"
          className="input mt-1 w-full"
          value={trainingDate}
          
          
          onChange={(e) => setTrainingDate(e.target.value)}
        />
      </label>
      <FormField
        label={l('Training Location', 'مكان التدريب')}
        value={location}
        onChange={setLocation}
      />
      <Button type="submit" isLoading={saving} disabled={false}>
        {isClosed
          ? l('Closed (Past 9:00 AM)', 'مغلق (بعد 9:00 ص)')
          : l('Submit', 'إرسال')}
      </Button>
    </form>
  );
}

