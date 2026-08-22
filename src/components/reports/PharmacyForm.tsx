'use client';

import React, { useState } from 'react';
import { PHARMACY_CLASSES, VISIT_STATUS_OPTIONS } from '@/lib/constants';

interface PharmacyFormProps {
  selectedRep: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function PharmacyForm({ selectedRep, onSuccess, onError }: PharmacyFormProps) {
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
    ourProducts: '',
    competitor: '',
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
    if (!formData.name.trim()) {
      onError('اكتب اسم الصيدلية');
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
        onSuccess(data.message);
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
          ourProducts: '',
          competitor: '',
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
      <h2 className="text-base font-bold text-[var(--ink)] mb-3.5">بيانات زيارة الصيدلية</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">اسم الصيدلية *</label>
          <input
            id="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="مثال: صيدلية النور"
            required
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">المنطقة / الحي</label>
          <input
            id="area"
            value={formData.area}
            onChange={handleChange}
            placeholder="مثال: شبرا"
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">العنوان بالكامل</label>
          <input
            id="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">اسم الصيدلي المسؤول</label>
          <input
            id="pharmacist"
            value={formData.pharmacist}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">رقم الموبايل</label>
          <input
            id="mobile"
            type="tel"
            value={formData.mobile}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">التصنيف</label>
          <select
            id="cls"
            value={formData.cls}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          >
            {PHARMACY_CLASSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">دورة الزيارة (بالأيام)</label>
          <input
            id="cycle"
            type="number"
            min="0"
            value={formData.cycle || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">تاريخ آخر زيارة</label>
          <input
            id="lastVisit"
            type="date"
            value={formData.lastVisit}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">تاريخ الزيارة الجاية</label>
          <input
            id="nextVisit"
            type="date"
            value={formData.nextVisit}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">الحالة</label>
          <select
            id="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          >
            {VISIT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">منتجاتنا متوفرة؟</label>
          <input
            id="ourProducts"
            value={formData.ourProducts}
            onChange={handleChange}
            placeholder="مثال: Nitrong, Danasetron"
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">منتجات المنافس متوفرة؟</label>
          <input
            id="competitor"
            value={formData.competitor}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
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
