'use client';

import React, { useState } from 'react';

interface BranchFormProps {
  selectedRep: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function BranchForm({ selectedRep, onSuccess, onError }: BranchFormProps) {
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
      onError('اكتب اسم الفرع');
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
        onSuccess(data.message);
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
      <h2 className="text-base font-bold text-[var(--ink)] mb-3.5">بيانات فرع التوزيع</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">اسم الموزّع / الفرع *</label>
          <input
            id="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="مثال: دلتا فارما للتوزيع"
            required
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">منطقة التغطية</label>
          <input
            id="area"
            value={formData.area}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">الشخص المسؤول</label>
          <input
            id="contact"
            value={formData.contact}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">رقم التليفون</label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">المنتجات الموزّعة</label>
          <input
            id="products"
            value={formData.products}
            onChange={handleChange}
            placeholder="مثال: Full product line"
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
