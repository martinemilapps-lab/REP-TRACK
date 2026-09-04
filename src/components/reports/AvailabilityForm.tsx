'use client';

import React, { useState, useMemo } from 'react';
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
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hospital: '',
    area: '',
    product: '',
    month: 'Jan',
    annualTarget: 0,
    avgMonthlyTarget: 0,
    sales: 0,
    potentiality: 0,
    status: 'Available',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    if (['annualTarget', 'avgMonthlyTarget', 'sales', 'potentiality'].includes(id)) {
      const numVal = Math.max(0, parseFloat(value) || 0);
      setFormData((prev) => ({ ...prev, [id]: numVal }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Automated Real-Time Calculations for items 5, 6, 7
  const { salesPctAvgTarget, salesPctAnnualTarget, salesPctPotentiality } = useMemo(() => {
    const sales = formData.sales || 0;
    const avgTarget = formData.avgMonthlyTarget || 0;
    const annualTarget = formData.annualTarget || 0;
    const potentiality = formData.potentiality || 0;

    return {
      salesPctAvgTarget: avgTarget > 0 ? Math.round((sales / avgTarget) * 100) : 0,
      salesPctAnnualTarget: annualTarget > 0 ? Math.round((sales / annualTarget) * 100) : 0,
      salesPctPotentiality: potentiality > 0 ? Math.round((sales / potentiality) * 100) : 0,
    };
  }, [formData.sales, formData.avgMonthlyTarget, formData.annualTarget, formData.potentiality]);

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
        body: JSON.stringify({
          ...formData,
          monthlySales: formData.sales,
          rep: selectedRep,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message || t('msg.availabilitySaved'));
        setFormData({
          hospital: '',
          area: '',
          product: '',
          month: 'Jan',
          annualTarget: 0,
          avgMonthlyTarget: 0,
          sales: 0,
          potentiality: 0,
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
      <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[var(--line)]">
        <span className="text-2xl">📊</span>
        <div>
          <h2 className="text-base font-extrabold text-[var(--ink)]">
            {language === 'ar' ? 'تحليل المستحضرات (Products Analysis)' : 'Products Analysis'}
          </h2>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5">
            {language === 'ar'
              ? 'تحليل مبيعات وتارجت وإمكانيات المستحضر مع حساب النسب المئوية تلقائياً'
              : 'Analyze product targets, monthly sales, potentiality and automatic attainment ratios'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {/* Hospital */}
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
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
          />
        </div>

        {/* Area */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.area')}
          </label>
          <input
            id="area"
            value={formData.area}
            onChange={handleChange}
            placeholder="مثال: مدينة نصر"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
          />
        </div>

        {/* Product */}
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
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
          />
          <datalist id="prodlist-avail">
            {PRODUCTS_LIST.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        {/* Month */}
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

        {/* Availability Status */}
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

      {/* 4 Core Input Fields for Analysis */}
      <div className="bg-[var(--surface-subtle)]/70 border border-[var(--line)] rounded-2xl p-4 md:p-5 mb-4">
        <h3 className="text-xs font-extrabold text-[var(--ink)] mb-3 flex items-center gap-2">
          <span>🎯</span>
          <span>{language === 'ar' ? 'البيانات الرقمية للمستحضر (التارجت، المبيعات، والإمكانية)' : 'Product Numerical Analysis (Target, Sales & Potentiality)'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* 1 - Annual Target */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5 flex items-center justify-between">
              <span>1. {t('form.annualTarget')}</span>
              <span className="text-[10px] text-gray-500 font-mono">Yearly</span>
            </label>
            <input
              id="annualTarget"
              type="number"
              min="0"
              value={formData.annualTarget || ''}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-mono font-bold text-purple-900 outline-none"
            />
          </div>

          {/* 2 - Average Target / Month */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5 flex items-center justify-between">
              <span>2. {t('form.avgMonthlyTarget')}</span>
              <span className="text-[10px] text-gray-500 font-mono">Avg / Mo</span>
            </label>
            <input
              id="avgMonthlyTarget"
              type="number"
              min="0"
              value={formData.avgMonthlyTarget || ''}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-mono font-bold text-blue-900 outline-none"
            />
          </div>

          {/* 3 - Sales / Month */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5 flex items-center justify-between">
              <span>3. {t('form.salesUnits')}</span>
              <span className="text-[10px] text-emerald-700 font-mono font-bold">Sales / Mo</span>
            </label>
            <input
              id="sales"
              type="number"
              min="0"
              value={formData.sales || ''}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-mono font-bold text-emerald-900 outline-none"
            />
          </div>

          {/* 4 - Potentiality / Month */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5 flex items-center justify-between">
              <span>4. {t('form.potentiality')}</span>
              <span className="text-[10px] text-amber-700 font-mono font-bold">Potential / Mo</span>
            </label>
            <input
              id="potentiality"
              type="number"
              min="0"
              value={formData.potentiality || ''}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-mono font-bold text-amber-900 outline-none"
            />
          </div>
        </div>

        {/* 3 Automated Calculated Percentage Metrics (5, 6, 7) */}
        <div className="mt-4 pt-4 border-t border-[var(--line)]">
          <div className="text-[11px] font-bold text-[var(--ink-muted)] mb-2 flex items-center gap-1.5">
            <span>⚡</span>
            <span>{language === 'ar' ? 'النسب المحسوبة تلقائياً بناءً على البيانات المدخلة أعلاه:' : 'Automatically calculated ratios from above data:'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 5 - Sales % of Average Target / Month */}
            <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs">
              <div className="text-[11px] font-bold text-blue-900 mb-1">
                5. {t('form.salesPctAvgTarget')}
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black font-mono text-blue-700">
                  {salesPctAvgTarget}%
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {formData.sales} / {formData.avgMonthlyTarget || '—'}
                </div>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, salesPctAvgTarget)}%` }}
                />
              </div>
            </div>

            {/* 6 - Sales % of Annual Target */}
            <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-2xs">
              <div className="text-[11px] font-bold text-purple-900 mb-1">
                6. {t('form.salesPctAnnualTarget')}
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black font-mono text-purple-700">
                  {salesPctAnnualTarget}%
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {formData.sales} / {formData.annualTarget || '—'}
                </div>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, salesPctAnnualTarget)}%` }}
                />
              </div>
            </div>

            {/* 7 - Sales % of Potentiality */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs">
              <div className="text-[11px] font-bold text-amber-900 mb-1">
                7. {t('form.salesPctPotentiality')}
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black font-mono text-amber-700">
                  {salesPctPotentiality}%
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {formData.sales} / {formData.potentiality || '—'}
                </div>
              </div>
              <div className="w-full bg-amber-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, salesPctPotentiality)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
          {t('form.notes')}
        </label>
        <textarea
          id="notes"
          rows={2}
          value={formData.notes}
          onChange={handleChange}
          placeholder="أي تفاصيل أو تعليقات بخصوص التحليل والتوافر..."
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
        />
      </div>

      <Button type="submit" variant="primary" size="md" isLoading={loading} className="px-6 font-extrabold">
        <span>💾</span>
        <span>{t('form.submit')}</span>
      </Button>
    </form>
  );
}
