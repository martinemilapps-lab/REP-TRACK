'use client';

import React, { useState } from 'react';
import { PHARMACY_CLASSES, VISIT_STATUS_OPTIONS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';

interface PharmacyFormProps {
  selectedRep: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function PharmacyForm({ selectedRep, onSuccess, onError }: PharmacyFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    address: '',
    pharmacist: '',
    mobile: '',
    cls: 'A',
    cycle: 0,
    lastVisit: '',
    nextVisit: '',
    status: 'Visited',
    visitType: 'Single',
    companion: '',
    ourProducts: '',
    competitor: '',
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

  const classOptions: SelectOption[] = PHARMACY_CLASSES.map((c) => ({
    value: c,
    label: `Class ${c}`,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep) {
      onError(t('msg.requiredRep'));
      return;
    }
    if (!formData.name.trim()) {
      onError(t('form.pharmacyName'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reports/pharmacy', {
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
          address: '',
          pharmacist: '',
          mobile: '',
          cls: 'A',
          cycle: 0,
          lastVisit: '',
          nextVisit: '',
          status: 'Visited',
          visitType: 'Single',
          companion: '',
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
        <span className="text-xl">💊</span>
        <h2 className="text-base font-extrabold text-[var(--ink)]">
          {t('activity.pharmacy')} — {t('nav.submit')}
        </h2>
      </div>

      {/* Visit Nature / Type (Single vs Double) */}
      <div className="bg-[var(--surface-subtle)]/70 p-4 rounded-xl border border-[var(--line)] mb-5">
        <label className="block text-xs font-bold text-[var(--ink)] mb-2">
          {t('visit.type')} *
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, visitType: 'Single', companion: '' }))}
            className={`py-2.5 px-3 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              formData.visitType === 'Single'
                ? 'bg-[var(--surface)] text-[var(--gold-dark)] border-[var(--gold)] shadow-sm'
                : 'bg-transparent text-[var(--ink-soft)] border-transparent hover:bg-[var(--surface-hover)]'
            }`}
          >
            <span>👤</span>
            <span>{t('visit.single')}</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, visitType: 'Double' }))}
            className={`py-2.5 px-3 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              formData.visitType === 'Double'
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white border-[var(--gold-dark)] shadow-sm'
                : 'bg-transparent text-[var(--ink-soft)] border-transparent hover:bg-[var(--surface-hover)]'
            }`}
          >
            <span>👥</span>
            <span>{t('visit.double')}</span>
          </button>
        </div>
        {formData.visitType === 'Double' && (
          <div className="mt-3.5 pt-3 border-t border-[var(--line)] animate-fade-in">
            <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
              {t('visit.companion')}
            </label>
            <input
              type="text"
              id="companion"
              value={formData.companion}
              onChange={handleChange}
              placeholder={t('visit.companionPlaceholder')}
              className="w-full text-xs md:text-sm bg-[var(--surface)] border border-[var(--line)] rounded-lg p-2.5"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.pharmacyName')}
          </label>
          <input
            id="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="مثال: صيدلية النور"
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
            placeholder="مثال: شبرا - القاهرة"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.address')}
          </label>
          <input
            id="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="العنوان التفصيلي"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.pharmacist')}
          </label>
          <input
            id="pharmacist"
            value={formData.pharmacist}
            onChange={handleChange}
            placeholder="اسم د. الصيدلي"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.mobile')}
          </label>
          <input
            id="mobile"
            type="tel"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="01xxxxxxxxx"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] rounded-xl font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('th.classification')}
          </label>
          <CustomSelect
            options={classOptions}
            value={formData.cls}
            onChange={(val) => handleSelectChange('cls', val)}
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
          <CustomSelect
            options={VISIT_STATUS_OPTIONS}
            value={formData.status}
            onChange={(val) => handleSelectChange('status', val)}
          />
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
