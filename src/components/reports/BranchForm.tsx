'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';

interface BranchFormProps {
  selectedRep: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function BranchForm({ selectedRep, onSuccess, onError }: BranchFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    contact: '',
    phone: '',
    products: '',
    lastVisit: '',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
    if (!formData.name.trim()) {
      onError(t('form.branchName'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reports/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rep: selectedRep }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message || t('msg.visitSaved'));
        setFormData({
          name: '',
          area: '',
          contact: '',
          phone: '',
          products: '',
          lastVisit: '',
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
        <span className="text-xl">🏢</span>
        <h2 className="text-base font-extrabold text-[var(--ink)]">
          {t('activity.branch')} — {t('nav.submit')}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.branchName')}
          </label>
          <input
            id="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="مثال: دلتا فارما للتوزيع"
            required
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.coverageArea')}
          </label>
          <input
            id="area"
            value={formData.area}
            onChange={handleChange}
            placeholder="مثال: قطاع الدلتا / الجيزة"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.contact')}
          </label>
          <input
            id="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="اسم المسؤول بالفرع"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.phone')}
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="01xxxxxxxxx"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.distributedProducts')}
          </label>
          <input
            id="products"
            value={formData.products}
            onChange={handleChange}
            placeholder="مثال: خط المنتجات بالكامل"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.visitDate')}
          </label>
          <input
            id="lastVisit"
            type="date"
            value={formData.lastVisit}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-mono"
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
          placeholder="أي تفاصيل أو تعليقات بخصوص الزيارة..."
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
        />
      </div>

      <Button type="submit" variant="primary" size="md" isLoading={loading}>
        {t('form.submit')}
      </Button>
    </form>
  );
}
