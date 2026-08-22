'use client';

import React, { useState } from 'react';
import { HOSPITAL_TYPES, VISIT_STATUS_OPTIONS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';

interface HospitalFormProps {
  selectedRep: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function HospitalForm({ selectedRep, onSuccess, onError }: HospitalFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    type: 'Private',
    dept: '',
    drsVisited: 0,
    contact: '',
    phone: '',
    cycle: 0,
    lastVisit: '',
    nextVisit: '',
    status: 'Visited',
    ourProducts: '',
    competitor: '',
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
      onError(t('form.hospitalName'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reports/hospital', {
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
          type: 'Private',
          dept: '',
          drsVisited: 0,
          contact: '',
          phone: '',
          cycle: 0,
          lastVisit: '',
          nextVisit: '',
          status: 'Visited',
          ourProducts: '',
          competitor: '',
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
        <span className="text-xl">🏥</span>
        <h2 className="text-base font-extrabold text-[var(--ink)]">
          {t('activity.hospital')} — {t('nav.submit')}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.hospitalName')}
          </label>
          <input
            id="name"
            value={formData.name}
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
            placeholder="مثال: مدينة نصر - القاهرة"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.type')}
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          >
            {HOSPITAL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.dept')}
          </label>
          <input
            id="dept"
            value={formData.dept}
            onChange={handleChange}
            placeholder="مثال: الباطنة / الرعاية"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.drsVisited')}
          </label>
          <input
            id="drsVisited"
            type="number"
            min="0"
            value={formData.drsVisited || ''}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-mono"
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
            placeholder="اسم المسؤول"
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
            {t('form.cycle')}
          </label>
          <input
            id="cycle"
            type="number"
            min="0"
            value={formData.cycle || ''}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-mono"
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

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.nextVisit')}
          </label>
          <input
            id="nextVisit"
            type="date"
            value={formData.nextVisit}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('th.status')}
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          >
            {VISIT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.ourProducts')}
          </label>
          <input
            id="ourProducts"
            value={formData.ourProducts}
            onChange={handleChange}
            placeholder="Nitrong, Danasetron..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.competitor')}
          </label>
          <input
            id="competitor"
            value={formData.competitor}
            onChange={handleChange}
            placeholder="المنتج المنافس"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
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
