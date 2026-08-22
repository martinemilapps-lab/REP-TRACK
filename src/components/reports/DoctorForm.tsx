'use client';

import React, { useState } from 'react';
import { DOCTOR_CLASSES, PRODUCTS_LIST, VISIT_STATUS_OPTIONS } from '@/lib/constants';

interface DoctorFormProps {
  selectedRep: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function DoctorForm({ selectedRep, onSuccess, onError }: DoctorFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    specialty: '',
    workplace: '',
    area: '',
    mobile: '',
    cls: 'A',
    visitDate: '',
    cycle: 0,
    nextVisit: '',
    status: 'Visited',
    f1: '',
    f2: '',
    f3: '',
    reminder: '',
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
      onError('اكتب اسم الدكتور');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reports/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rep: selectedRep }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message);
        setFormData({
          code: '',
          name: '',
          specialty: '',
          workplace: '',
          area: '',
          mobile: '',
          cls: 'A',
          visitDate: '',
          cycle: 0,
          nextVisit: '',
          status: 'Visited',
          f1: '',
          f2: '',
          f3: '',
          reminder: '',
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
      <h2 className="text-base font-bold text-[var(--ink)] mb-3.5">بيانات زيارة الدكتور</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">كود الدكتور</label>
          <input
            id="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="مثال: DR-0001"
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">اسم الدكتور *</label>
          <input
            id="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="مثال: د. محمد عبد الرحمن"
            required
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">التخصص</label>
          <input
            id="specialty"
            value={formData.specialty}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">مكان العمل (عيادة/مستشفى)</label>
          <input
            id="workplace"
            value={formData.workplace}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">المنطقة</label>
          <input
            id="area"
            value={formData.area}
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
            {DOCTOR_CLASSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">تاريخ الزيارة</label>
          <input
            id="visitDate"
            type="date"
            value={formData.visitDate}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
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
      </div>

      <div className="border-t border-[var(--line)] pt-3.5 mb-3.5">
        <p className="text-xs font-bold text-[var(--ink-soft)] mb-2.5">المنتجات المعروضة (حتى 4 منتجات)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1">منتج 1</label>
            <input
              id="f1"
              value={formData.f1}
              onChange={handleChange}
              list="prodlist-doctor"
              className="w-full px-3 py-1.5 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1">منتج 2</label>
            <input
              id="f2"
              value={formData.f2}
              onChange={handleChange}
              list="prodlist-doctor"
              className="w-full px-3 py-1.5 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1">منتج 3</label>
            <input
              id="f3"
              value={formData.f3}
              onChange={handleChange}
              list="prodlist-doctor"
              className="w-full px-3 py-1.5 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1">Reminder</label>
            <input
              id="reminder"
              value={formData.reminder}
              onChange={handleChange}
              list="prodlist-doctor"
              className="w-full px-3 py-1.5 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
            />
          </div>
        </div>
        <datalist id="prodlist-doctor">
          {PRODUCTS_LIST.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
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
