'use client';

import React, { useState } from 'react';
import { MONTHS_LIST, PRODUCTS_LIST } from '@/lib/constants';

interface AvailabilityFormProps {
  selectedRep: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function AvailabilityForm({ selectedRep, onSuccess, onError }: AvailabilityFormProps) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep) {
      onError('اختار اسمك الأول');
      return;
    }
    if (!formData.hospital.trim()) {
      onError('اكتب اسم المستشفى');
      return;
    }
    if (!formData.product.trim()) {
      onError('اكتب اسم المنتج');
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
        onSuccess(data.message);
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
        onError(data.message || 'حصل خطأ، جرب تاني');
      }
    } catch {
      onError('حصل خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 mb-4 shadow-xs">
      <h2 className="text-base font-bold text-[var(--ink)] mb-1">توافر المنتج في المستشفى</h2>
      <p className="text-xs text-[var(--ink-soft)] mb-3.5">
        سجّل هل المنتج متوفر في صيدلية المستشفى الشهر ده ولا لأ، ومبيعاته لو معروفة
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">اسم المستشفى *</label>
          <input
            id="hospital"
            value={formData.hospital}
            onChange={handleChange}
            placeholder="مثال: مستشفى دار الشفاء"
            required
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">المنطقة</label>
          <input
            id="area"
            value={formData.area}
            onChange={handleChange}
            placeholder="مثال: مدينة نصر"
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">المنتج *</label>
          <input
            id="product"
            value={formData.product}
            onChange={handleChange}
            list="prodlist-avail"
            placeholder="اختار أو اكتب اسم المنتج"
            required
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
          <datalist id="prodlist-avail">
            {PRODUCTS_LIST.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">الشهر</label>
          <select
            id="month"
            value={formData.month}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          >
            {MONTHS_LIST.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">المبيعات (وحدات) — لو معروفة</label>
          <input
            id="sales"
            type="number"
            min="0"
            value={formData.sales || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">حالة التوافر</label>
          <select
            id="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          >
            <option value="Available">متوفر</option>
            <option value="Not Available">مش متوفر</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">ملاحظات</label>
        <textarea
          id="notes"
          rows={2}
          value={formData.notes}
          onChange={handleChange}
          className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 rounded-lg text-sm font-bold bg-[var(--teal)] text-white hover:bg-[var(--teal-deep)] transition-all cursor-pointer disabled:opacity-50"
      >
        {loading ? 'جاري الإرسال...' : 'إرسال التقرير'}
      </button>
    </form>
  );
}
