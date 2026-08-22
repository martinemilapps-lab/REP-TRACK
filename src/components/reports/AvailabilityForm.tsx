'use client';

import React, { useState } from 'react';
import { MONTHS_LIST, PRODUCTS_LIST } from '@/lib/constants';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';

interface AvailabilityFormProps {
  selectedRep: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function AvailabilityForm({ selectedRep, onSuccess, onError }: AvailabilityFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hospital: '',
    area: '',
    product: '',
    month: 'Jan',
    sales: 0,
    status: 'Available',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const statusOptions: SelectOption[] = [
    { value: 'Available', label: t('status.available') },
    { value: 'Not Available', label: t('status.notAvailable') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep) {
      onError(t('msg.requiredRep'));
      return;
    }
    if (!formData.hospital.trim()) {
      onError(t('form.hospitalName'));
      return;
    }
    if (!formData.product.trim()) {
      onError(t('form.product'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reports/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rep: selectedRep }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message || t('msg.availabilitySaved'));
        setFormData({
          hospital: '',
          area: '',
          product: '',
          month: 'Jan',
          sales: 0,
          status: 'Available',
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
        <span className="text-xl">📦</span>
        <h2 className="text-base font-extrabold text-[var(--ink)]">
          {t('activity.availability')} — {t('nav.submit')}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.hospitalName')}
          </label>
          <input
            id="hospital"
            value={formData.hospital}
            onChange={handleChange}
            placeholder="مثال: مستشفى دار الشفاء"
            required
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.area')}
          </label>
          <input
            id="area"
            value={formData.area}
            onChange={handleChange}
            placeholder="مثال: مدينة نصر"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.product')}
          </label>
          <input
            id="product"
            value={formData.product}
            onChange={handleChange}
            list="prodlist-avail"
            placeholder="اختار أو اكتب اسم المنتج"
            required
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          />
          <datalist id="prodlist-avail">
            {PRODUCTS_LIST.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.month')}
          </label>
          <CustomSelect
            options={MONTHS_LIST}
            value={formData.month}
            onChange={(val) => handleSelectChange('month', val)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.salesUnits')}
          </label>
          <input
            id="sales"
            type="number"
            min="0"
            value={formData.sales || ''}
            onChange={handleChange}
            placeholder="0"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.availabilityStatus')}
          </label>
          <CustomSelect
            options={statusOptions}
            value={formData.status}
            onChange={(val) => handleSelectChange('status', val)}
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
          {t('form.notes')}
        </label>
        <textarea
          id="notes"
          rows={2}
          value={formData.notes}
          onChange={handleChange}
          placeholder="أي تفاصيل أو تعليقات بخصوص التوافر..."
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
        />
      </div>

      <Button type="submit" variant="primary" size="md" isLoading={loading}>
        {t('form.submit')}
      </Button>
    </form>
  );
}
