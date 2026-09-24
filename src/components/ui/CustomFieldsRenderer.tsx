'use client';

import React, { useEffect, useState } from 'react';
import { getCustomFieldsForSection, CustomField } from '@/components/admin/AdminFieldManager';
import { useTranslation } from '@/lib/i18nContext';

interface CustomFieldsRendererProps {
  section: string;
  values?: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
  readonly?: boolean;
}

export function CustomFieldsRenderer({
  section,
  values = {},
  onChange,
  readonly = false,
}: CustomFieldsRendererProps) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const [fields, setFields] = useState<CustomField[]>([]);

  useEffect(() => {
    const load = () => {
      setFields(getCustomFieldsForSection(section));
    };

    load();

    const handleUpdate = () => {
      load();
    };

    window.addEventListener('reptrack_admin_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('reptrack_admin_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [section]);

  if (!fields || fields.length === 0) {
    return null;
  }

  const updateValue = (fieldId: string, val: any) => {
    if (!onChange) return;
    onChange({
      ...values,
      [fieldId]: val,
    });
  };

  return (
    <div className="space-y-4 my-4 p-4 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-tint)]/10" data-ui-id={`custom-fields-${section}`}>
      <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold-dark)]">
          {ar ? 'حقول مخصصة للنظام' : 'System Custom Fields'}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const label = ar ? field.fieldLabelAr || field.fieldLabel : field.fieldLabel;
          const currentVal = values[field.id] ?? '';

          return (
            <div key={field.id} className={field.fieldType === 'textarea' ? 'sm:col-span-2' : ''}>
              <label className="block text-sm font-semibold mb-1">
                {label} {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.fieldType === 'textarea' ? (
                <textarea
                  className="input w-full"
                  rows={3}
                  placeholder={field.placeholder || ''}
                  value={currentVal}
                  required={field.required}
                  disabled={readonly}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                />
              ) : field.fieldType === 'select' ? (
                <select
                  className="input w-full"
                  value={currentVal}
                  required={field.required}
                  disabled={readonly}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                >
                  <option value="">{ar ? 'اختر...' : 'Select...'}</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.fieldType === 'multiselect' ? (
                <div className="space-y-1.5 p-2 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                  {field.options?.map((opt) => {
                    const selectedArr: string[] = Array.isArray(currentVal) ? currentVal : [];
                    const isChecked = selectedArr.includes(opt);
                    return (
                      <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={readonly}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...selectedArr, opt]
                              : selectedArr.filter((item) => item !== opt);
                            updateValue(field.id, next);
                          }}
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              ) : field.fieldType === 'toggle' ? (
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={Boolean(currentVal)}
                    disabled={readonly}
                    onChange={(e) => updateValue(field.id, e.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              ) : (
                <input
                  type={
                    field.fieldType === 'number'
                      ? 'number'
                      : field.fieldType === 'date'
                      ? 'date'
                      : field.fieldType === 'email'
                      ? 'email'
                      : field.fieldType === 'phone'
                      ? 'tel'
                      : 'text'
                  }
                  className="input w-full"
                  placeholder={field.placeholder || ''}
                  value={currentVal}
                  required={field.required}
                  disabled={readonly}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
