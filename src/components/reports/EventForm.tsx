'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { OUR_PRODUCTS_DISCUSSED_LIST } from '@/lib/constants';

interface EventFormProps {
  selectedRep: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const EVENT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'مؤتمر طبي (Medical Conference)', label: 'مؤتمر طبي (Medical Conference)' },
  { value: 'ندوة علمية (Scientific Symposium)', label: 'ندوة علمية (Scientific Symposium)' },
  { value: 'ستاند ومعرض طبي (Booth / Exhibition)', label: 'ستاند ومعرض طبي (Booth / Exhibition)' },
  { value: 'حلقة نقاشية (Roundtable / Advisory)', label: 'حلقة نقاشية (Roundtable / Advisory)' },
  { value: 'حفل إطلاق منتج (Launch Event)', label: 'حفل إطلاق منتج (Launch Event)' },
  { value: 'لقاء علمي لقسم مستشفى (Hospital Department Meeting)', label: 'لقاء علمي لقسم مستشفى' },
  { value: 'أخرى (Other Event)', label: 'فعالية أخرى (Other)' },
];

export function EventForm({ selectedRep, onSuccess, onError }: EventFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    eventType: 'مؤتمر طبي (Medical Conference)',
    eventDate: new Date().toISOString().split('T')[0],
    location: '',
    attendeesCount: '',
    targetSpecialty: '',
    products: '',
    budget: '',
    feedback: '',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleProductChipToggle = (product: string) => {
    const current = formData.products ? formData.products.split('، ') : [];
    let updated: string[];
    if (current.includes(product)) {
      updated = current.filter((p) => p !== product);
    } else {
      updated = [...current, product];
    }
    setFormData((prev) => ({ ...prev, products: updated.join('، ') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep) {
      onError(t('msg.requiredRep'));
      return;
    }
    if (!formData.title.trim()) {
      onError('يرجى كتابة اسم الفعالية أو المؤتمر');
      return;
    }
    if (!formData.eventDate) {
      onError('يرجى تحديد تاريخ الفعالية');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reports/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          attendeesCount: formData.attendeesCount ? Number(formData.attendeesCount) : 0,
          rep: selectedRep,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message || 'تم حفظ وتوثيق الفعالية بنجاح ✓');
        setFormData({
          title: '',
          eventType: 'مؤتمر طبي (Medical Conference)',
          eventDate: new Date().toISOString().split('T')[0],
          location: '',
          attendeesCount: '',
          targetSpecialty: '',
          products: '',
          budget: '',
          feedback: '',
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
        <span className="text-2xl">🎟️</span>
        <div>
          <h2 className="text-base font-extrabold text-[var(--ink)]">
            {t('event.formTitle')}
          </h2>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5">
            البند الثاني في شيت المندوب الطبي: توثيق المؤتمرات، الندوات العلمية، وستاندات العرض
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Row 1: Event Title & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('event.title')} <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('event.titlePlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('event.type')}
            </label>
            <CustomSelect
              options={EVENT_TYPE_OPTIONS}
              value={formData.eventType}
              onChange={(val) => setFormData((prev) => ({ ...prev, eventType: val }))}
              placeholder={t('event.type')}
            />
          </div>
        </div>

        {/* Row 2: Date, Location, Attendees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="eventDate" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('event.date')} <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="date"
              id="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('event.location')}
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="مثال: فندق الفورسيزونز، قاعة المحاضرات..."
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="attendeesCount" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('event.attendees')}
            </label>
            <input
              type="number"
              id="attendeesCount"
              min="0"
              value={formData.attendeesCount}
              onChange={handleChange}
              placeholder="مثال: 50"
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
            />
          </div>
        </div>

        {/* Row 3: Target Specialty & Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="targetSpecialty" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('event.specialty')}
            </label>
            <input
              type="text"
              id="targetSpecialty"
              value={formData.targetSpecialty}
              onChange={handleChange}
              placeholder="مثال: أطباء القلب وجراحة الأوعية، أطباء التخدير..."
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="budget" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('event.budget')}
            </label>
            <input
              type="text"
              id="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="مثال: 5,000 ج.م أو رعاية ستاند طبي"
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
            />
          </div>
        </div>

        {/* Row 4: Products Discussed with Focus Chips */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
            {t('event.products')}
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {OUR_PRODUCTS_DISCUSSED_LIST.map((prod) => {
              const selected = formData.products.includes(prod);
              return (
                <button
                  key={prod}
                  type="button"
                  onClick={() => handleProductChipToggle(prod)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[var(--gold)] text-white border-[var(--gold)] shadow-xs'
                      : 'bg-[var(--bg-subtle)] text-[var(--ink-soft)] border-[var(--line)] hover:border-[var(--gold-light)]'
                  }`}
                >
                  {selected ? '✓ ' : '+ '}
                  {prod}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            id="products"
            value={formData.products}
            onChange={handleChange}
            placeholder="المنتجات المحددة أو كتابة منتجات إضافية..."
            className="w-full px-3.5 py-2 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--gold)] transition-colors"
          />
        </div>

        {/* Row 5: Outcomes & Key Feedback */}
        <div>
          <label htmlFor="feedback" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
            {t('event.feedback')}
          </label>
          <textarea
            id="feedback"
            rows={2}
            value={formData.feedback}
            onChange={handleChange}
            placeholder="أهم النقاط والمخرجات، ردود فعل الأطباء على المنتجات المعروضة..."
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors resize-y"
          />
        </div>

        {/* Row 6: Notes */}
        <div>
          <label htmlFor="notes" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
            {t('event.notes')}
          </label>
          <textarea
            id="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="ملاحظات وتوصيات للمتابعة لاحقًا..."
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors resize-y"
          />
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--line)] flex justify-end">
        <Button type="submit" variant="primary" isLoading={loading}>
          {loading ? t('event.submitting') : t('event.submit')}
        </Button>
      </div>
    </form>
  );
}
