'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';

interface SpecialTaskFormProps {
  selectedRep: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'مسح ميداني للسوق (Market Survey)', label: 'مسح ميداني للسوق (Market Survey)' },
  { value: 'رصد ومتابعة المنافسين (Competitor Intelligence)', label: 'رصد ومتابعة المنافسين (Competitor Intel)' },
  { value: 'مهام إدارية ومكتبية (Administrative / Office)', label: 'مهام إدارية ومكتبية (Office / Admin)' },
  { value: 'تسليم عينات ومواد ترويجية (Sample & Promo Delivery)', label: 'تسليم عينات ومواد دعائية (Samples)' },
  { value: 'متابعة حسابات استراتيجية (Key Account Follow-up)', label: 'متابعة حسابات خاصة (Key Accounts)' },
  { value: 'مهمة ميدانية طارئة (Urgent Field Issue)', label: 'مهمة ميدانية طارئة (Urgent)' },
  { value: 'مهمة خاصة أخرى (Other Special Task)', label: 'مهمة أخرى (Other)' },
];

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'Normal', label: 'عادية (Normal)' },
  { value: 'High', label: 'هامة (High)' },
  { value: 'Urgent', label: 'عاجلة وفورية (Urgent)' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'Completed', label: 'تم الإنجاز بنجاح (Completed)' },
  { value: 'In Progress', label: 'جاري العمل والتنفيذ (In Progress)' },
  { value: 'Follow-up Needed', label: 'تتطلب متابعة لاحقة (Follow-up Needed)' },
];

export function SpecialTaskForm({ selectedRep, onSuccess, onError }: SpecialTaskFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    taskCategory: 'مسح ميداني للسوق (Market Survey)',
    taskDate: new Date().toISOString().split('T')[0],
    assignedBy: '',
    priority: 'Normal',
    status: 'Completed',
    description: '',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
    if (!formData.title.trim()) {
      onError('يرجى كتابة عنوان المهمة الخاصة أو النشاط');
      return;
    }
    if (!formData.taskDate) {
      onError('يرجى تحديد تاريخ تنفيذ المهمة');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reports/special-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rep: selectedRep,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message || 'تم توثيق المهمة الخاصة بنجاح ✓');
        setFormData({
          title: '',
          taskCategory: 'مسح ميداني للسوق (Market Survey)',
          taskDate: new Date().toISOString().split('T')[0],
          assignedBy: '',
          priority: 'Normal',
          status: 'Completed',
          description: '',
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
        <span className="text-2xl">⚡</span>
        <div>
          <h2 className="text-base font-extrabold text-[var(--ink)]">
            {t('task.formTitle')}
          </h2>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5">
            البند الرابع في شيت المندوب الطبي: توثيق المسح الميداني، المهام الإدارية، والتكليفات الخاصة
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Row 1: Title & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('task.title')} <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('task.titlePlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('task.category')}
            </label>
            <CustomSelect
              options={CATEGORY_OPTIONS}
              value={formData.taskCategory}
              onChange={(val) => setFormData((prev) => ({ ...prev, taskCategory: val }))}
              placeholder={t('task.category')}
            />
          </div>
        </div>

        {/* Row 2: Date, Assigned By, Priority, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="taskDate" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('task.date')} <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="date"
              id="taskDate"
              value={formData.taskDate}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="assignedBy" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('task.assignedBy')}
            </label>
            <input
              type="text"
              id="assignedBy"
              value={formData.assignedBy}
              onChange={handleChange}
              placeholder="مثال: مدير الخط، إدارة التسويق..."
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('task.priority')}
            </label>
            <CustomSelect
              options={PRIORITY_OPTIONS}
              value={formData.priority}
              onChange={(val) => setFormData((prev) => ({ ...prev, priority: val }))}
              placeholder={t('task.priority')}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
              {t('task.status')}
            </label>
            <CustomSelect
              options={STATUS_OPTIONS}
              value={formData.status}
              onChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}
              placeholder={t('task.status')}
            />
          </div>
        </div>

        {/* Row 3: Description & Deliverables */}
        <div>
          <label htmlFor="description" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
            {t('task.description')}
          </label>
          <textarea
            id="description"
            rows={2}
            value={formData.description}
            onChange={handleChange}
            placeholder="شرح وتفاصيل ما تم إنجازه في هذه المهمة والنتائج..."
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors resize-y"
          />
        </div>

        {/* Row 4: Notes */}
        <div>
          <label htmlFor="notes" className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
            {t('task.notes')}
          </label>
          <textarea
            id="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="ملاحظات وتوصيات إضافية للمتابعة..."
            className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--gold)] transition-colors resize-y"
          />
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--line)] flex justify-end">
        <Button type="submit" variant="primary" isLoading={loading}>
          {loading ? t('task.submitting') : t('task.submit')}
        </Button>
      </div>
    </form>
  );
}
