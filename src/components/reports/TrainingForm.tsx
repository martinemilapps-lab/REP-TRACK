'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';

interface TrainingFormProps {
  selectedRep: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const TRAINING_TYPE_OPTIONS: SelectOption[] = [
  { value: 'تدريب علمي ومنتجات (Product Knowledge & Pharmacology)', label: 'تدريب علمي ومنتجات (Product Knowledge)' },
  { value: 'ورشة عمل علمية تفاعلية (Scientific Workshop)', label: 'ورشة عمل علمية تفاعلية (Scientific Workshop)' },
  { value: 'مهارات بيع وتفاوض (Selling & Negotiation Skills)', label: 'مهارات بيع وتفاوض (Selling Skills)' },
  { value: 'تدريب وتوجيه ميداني (Field Coaching / Dual Work)', label: 'تدريب وتوجيه ميداني (Field Coaching)' },
  { value: 'لوائح وسياسات الجودة (Compliance & SOPs)', label: 'لوائح وسياسات (Compliance)' },
  { value: 'مهارات التواصل والعرض (Presentation & Soft Skills)', label: 'مهارات التواصل والعرض (Soft Skills)' },
  { value: 'تدريب آخر (Other Training)', label: 'تدريب آخر (Other)' },
];

export function TrainingForm({ selectedRep, onSuccess, onError }: TrainingFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    trainingType: 'تدريب علمي ومنتجات (Product Knowledge & Pharmacology)',
    trainingDate: new Date().toISOString().split('T')[0],
    trainer: '',
    attendees: '',
    durationHours: '2',
    outcomes: '',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep) {
      onError(t('msg.requiredRep'));
      return;
    }
    if (!formData.title.trim()) {
      onError('يرجى كتابة عنوان التدريب أو ورشة العمل');
      return;
    }
    if (!formData.trainingDate) {
      onError('يرجى تحديد تاريخ التدريب');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reports/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          durationHours: formData.durationHours ? Number(formData.durationHours) : 1,
          rep: selectedRep,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message || 'تم توثيق التدريب بنجاح ✓');
        setFormData({
          title: '',
          trainingType: 'تدريب علمي ومنتجات (Product Knowledge & Pharmacology)',
          trainingDate: new Date().toISOString().split('T')[0],
          trainer: '',
          attendees: '',
          durationHours: '2',
          outcomes: '',
          notes: '',
        });
      } else {
        onError(data.message || t('msg.errorGeneric'));
      }
    } catch {
      onError(t('msg.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 md:p-6 mb-4 shadow-card animate-fade-in"
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--line)]">
        <span className="text-2xl">🎓</span>
        <div>
          <h2 className="text-base font-extrabold text-[var(--ink)]">
            {t('training.formTitle')}
          </h2>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5">
            البند الثالث في شيت المندوب الطبي: توثيق الدورات العلمية، الورش التدريبية، والتوجيه الميداني
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Row 1: Title & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('training.title')} <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('training.titlePlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('training.type')}
            </label>
            <CustomSelect
              options={TRAINING_TYPE_OPTIONS}
              value={formData.trainingType}
              onChange={(val) => setFormData((prev) => ({ ...prev, trainingType: val }))}
              placeholder={t('training.type')}
            />
          </div>
        </div>

        {/* Row 2: Date, Trainer, Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="trainingDate" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('training.date')} <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="date"
              id="trainingDate"
              value={formData.trainingDate}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="trainer" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('training.trainer')}
            </label>
            <input
              type="text"
              id="trainer"
              value={formData.trainer}
              onChange={handleChange}
              placeholder="مثال: مدير التدريب، مدير الخط، د. فوزي ناصر..."
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="durationHours" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('training.duration')}
            </label>
            <input
              type="number"
              id="durationHours"
              min="0.5"
              step="0.5"
              value={formData.durationHours}
              onChange={handleChange}
              placeholder="مثال: 2 أو 3"
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
            />
          </div>
        </div>

        {/* Row 3: Attendees */}
        <div>
          <label htmlFor="attendees" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
            {t('training.attendees')}
          </label>
          <input
            type="text"
            id="attendees"
            value={formData.attendees}
            onChange={handleChange}
            placeholder="مثال: فردي (المندوب فقط)، فريق القاهرة، ممثلي خط التخدير..."
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
          />
        </div>

        {/* Row 4: Outcomes & Key Learnings */}
        <div>
          <label htmlFor="outcomes" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
            {t('training.outcomes')}
          </label>
          <textarea
            id="outcomes"
            rows={2}
            value={formData.outcomes}
            onChange={handleChange}
            placeholder="أهم المفاهيم العلمية والمحاور التطبيقية المستفادة..."
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors resize-y"
          />
        </div>

        {/* Row 5: Notes */}
        <div>
          <label htmlFor="notes" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
            {t('training.notes')}
          </label>
          <textarea
            id="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="ملاحظات وتوصيات إضافية..."
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors resize-y"
          />
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--line)] flex justify-end">
        <Button type="submit" variant="primary" isLoading={loading}>
          {loading ? t('training.submitting') : t('training.submit')}
        </Button>
      </div>
    </form>
  );
}
