'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, Pencil, GripVertical, Type, ListOrdered, Hash, Calendar, ToggleLeft, AlignLeft, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Drawer } from '@/components/ui/Drawer';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SectionCard } from '@/components/ui/SectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTranslation } from '@/lib/i18nContext';

/**
 * Custom fields are stored in localStorage (persisted per-browser) and surfaced
 * to the admin. They define extra UI elements that render dynamically on forms
 * throughout the system. This is a client-side field manager — no DB migration needed.
 */

export interface CustomField {
  id: string;
  targetSection: string; // 'hospital_visit' | 'pharmacy_visit' | 'doctor_visit' | 'branch_visit' | 'weekly_plan' | 'events' | 'trainings' | 'special_tasks' | 'availability' | 'manager_activity'
  fieldLabel: string;
  fieldLabelAr: string;
  fieldType: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'date' | 'toggle' | 'email' | 'phone';
  options?: string[]; // For select/multiselect
  required: boolean;
  placeholder?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'reptrack_custom_fields';

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text Field', labelAr: 'حقل نصي', icon: Type },
  { value: 'textarea', label: 'Text Area', labelAr: 'مساحة نص', icon: AlignLeft },
  { value: 'number', label: 'Number', labelAr: 'رقم', icon: Hash },
  { value: 'select', label: 'Dropdown List', labelAr: 'قائمة منسدلة', icon: ListOrdered },
  { value: 'multiselect', label: 'Multi-Select List', labelAr: 'قائمة متعددة', icon: ListOrdered },
  { value: 'date', label: 'Date Picker', labelAr: 'تاريخ', icon: Calendar },
  { value: 'toggle', label: 'Toggle Switch', labelAr: 'مفتاح تبديل', icon: ToggleLeft },
  { value: 'email', label: 'Email', labelAr: 'بريد إلكتروني', icon: Type },
  { value: 'phone', label: 'Phone Number', labelAr: 'رقم هاتف', icon: Type },
] as const;

const TARGET_SECTIONS = [
  { value: 'hospital_visit', label: 'Hospital Visit Report', labelAr: 'تقرير زيارة المستشفى' },
  { value: 'pharmacy_visit', label: 'Pharmacy Visit Report', labelAr: 'تقرير زيارة الصيدلية' },
  { value: 'doctor_visit', label: 'Doctor Visit Report', labelAr: 'تقرير زيارة الطبيب' },
  { value: 'branch_visit', label: 'Branch Visit Report', labelAr: 'تقرير زيارة الفرع' },
  { value: 'weekly_plan', label: 'Weekly Plan', labelAr: 'الخطة الأسبوعية' },
  { value: 'events', label: 'Events', labelAr: 'الفعاليات' },
  { value: 'trainings', label: 'Trainings', labelAr: 'التدريبات' },
  { value: 'special_tasks', label: 'Special Tasks', labelAr: 'المهام الخاصة' },
  { value: 'availability', label: 'Product Availability', labelAr: 'توافر المنتجات' },
  { value: 'manager_activity', label: 'Manager Activity', labelAr: 'نشاط المدير' },
  { value: 'hospital_form', label: 'Hospital Master Form', labelAr: 'نموذج المستشفيات' },
  { value: 'pharmacy_form', label: 'Pharmacy Master Form', labelAr: 'نموذج الصيدليات' },
  { value: 'doctor_form', label: 'Doctor Master Form', labelAr: 'نموذج الأطباء' },
] as const;

function loadCustomFields(): CustomField[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomFields(fields: CustomField[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
  window.dispatchEvent(new CustomEvent('reptrack_admin_update'));
}

export function getCustomFieldsForSection(section: string): CustomField[] {
  return loadCustomFields().filter(f => f.targetSection === section && f.isActive);
}

export function AdminFieldManager() {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const [fields, setFields] = useState<CustomField[]>([]);
  const [editing, setEditing] = useState<Partial<CustomField> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomField | null>(null);
  const [optionsText, setOptionsText] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { setFields(loadCustomFields()); }, []);

  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const updated: CustomField = {
      id: editing?.id || crypto.randomUUID(),
      targetSection: String(form.get('targetSection') || editing?.targetSection || 'hospital_visit'),
      fieldLabel: String(form.get('fieldLabel') || ''),
      fieldLabelAr: String(form.get('fieldLabelAr') || ''),
      fieldType: String(form.get('fieldType') || 'text') as CustomField['fieldType'],
      options: optionsText ? optionsText.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
      required: form.get('required') === 'on',
      placeholder: String(form.get('placeholder') || ''),
      displayOrder: Number(form.get('displayOrder') || 0),
      isActive: true,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    const all = fields.filter(f => f.id !== updated.id);
    all.push(updated);
    all.sort((a, b) => a.displayOrder - b.displayOrder);
    setFields(all);
    saveCustomFields(all);
    setEditing(null);
    setOptionsText('');
    setSuccessMsg(editing?.id ? 'Field updated' : 'Field added');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const deleteField = () => {
    if (!deleteTarget) return;
    const all = fields.filter(f => f.id !== deleteTarget.id);
    setFields(all);
    saveCustomFields(all);
    setDeleteTarget(null);
    setSuccessMsg('Field deleted');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const toggleActive = (id: string) => {
    const all = fields.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f);
    setFields(all);
    saveCustomFields(all);
  };

  const openEdit = (field: CustomField) => {
    setEditing(field);
    setOptionsText(field.options?.join('\n') || '');
  };

  const filtered = filterSection ? fields.filter(f => f.targetSection === filterSection) : fields;
  const typeInfo = FIELD_TYPE_OPTIONS.find(o => o.value === (editing as CustomField)?.fieldType);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{ar ? 'مدير الحقول والعناصر' : 'Field & Element Manager'}</h1>
          <p className="text-sm text-[var(--ink-soft)]">{ar ? 'إضافة وتعديل وحذف حقول وعناصر مخصصة في أي قسم' : 'Add, edit, and remove custom fields and elements in any section'}</p>
        </div>
        <Button onClick={() => { setEditing({}); setOptionsText(''); }}><Plus className="size-4" />{ar ? 'حقل جديد' : 'New Field'}</Button>
      </header>

      {successMsg && <InlineAlert tone="success">{successMsg}</InlineAlert>}

      {/* Filter */}
      <div className="flex gap-2">
        <select className="input text-sm" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
          <option value="">{ar ? 'جميع الأقسام' : 'All sections'}</option>
          {TARGET_SECTIONS.map(s => <option key={s.value} value={s.value}>{ar ? s.labelAr : s.label}</option>)}
        </select>
        <StatusBadge tone="neutral">{filtered.length} {ar ? 'حقل' : 'fields'}</StatusBadge>
      </div>

      {/* Field Grid */}
      {filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(field => {
            const section = TARGET_SECTIONS.find(s => s.value === field.targetSection);
            const typeOpt = FIELD_TYPE_OPTIONS.find(o => o.value === field.fieldType);
            const TypeIcon = typeOpt?.icon || Type;
            return (
              <SectionCard key={field.id}
                title={field.fieldLabel}
                description={field.fieldLabelAr}
                actions={<StatusBadge tone={field.isActive ? 'success' : 'error'}>{field.isActive ? 'Active' : 'Inactive'}</StatusBadge>}>
                <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                  <p><span className="text-[var(--ink-soft)]">{ar ? 'القسم:' : 'Section:'} </span>{ar ? section?.labelAr : section?.label}</p>
                  <p><span className="text-[var(--ink-soft)]">{ar ? 'النوع:' : 'Type:'} </span><TypeIcon className="inline size-3" /> {ar ? typeOpt?.labelAr : typeOpt?.label}</p>
                  <p><span className="text-[var(--ink-soft)]">{ar ? 'مطلوب:' : 'Required:'} </span>{field.required ? '✓' : '—'}</p>
                  <p><span className="text-[var(--ink-soft)]">{ar ? 'الترتيب:' : 'Order:'} </span>{field.displayOrder}</p>
                  {field.options && <p className="col-span-2"><span className="text-[var(--ink-soft)]">{ar ? 'خيارات:' : 'Options:'} </span>{field.options.join(', ')}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(field)}><Pencil className="size-4" />{ar ? 'تعديل' : 'Edit'}</Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleActive(field.id)}><ToggleLeft className="size-4" />{field.isActive ? (ar ? 'تعطيل' : 'Deactivate') : (ar ? 'تفعيل' : 'Activate')}</Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(field)}><Trash2 className="size-4" />{ar ? 'حذف' : 'Delete'}</Button>
                </div>
              </SectionCard>
            );
          })}
        </div>
      ) : (
        <EmptyState title={ar ? 'لا توجد حقول مخصصة بعد' : 'No custom fields yet'} />
      )}

      {/* ─── Add/Edit Drawer ─── */}
      <Drawer open={editing !== null} title={editing?.id ? (ar ? 'تعديل حقل' : 'Edit Field') : (ar ? 'إضافة حقل جديد' : 'Add New Field')} onClose={() => setEditing(null)}>
        <form className="space-y-4" onSubmit={save}>
          <label className="block text-sm">{ar ? 'القسم المستهدف' : 'Target Section'}
            <select name="targetSection" className="input mt-1 w-full" defaultValue={editing?.targetSection || 'hospital_visit'} required>
              {TARGET_SECTIONS.map(s => <option key={s.value} value={s.value}>{ar ? s.labelAr : s.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">{ar ? 'اسم الحقل (إنجليزي)' : 'Field Label (English)'}
            <input name="fieldLabel" className="input mt-1 w-full" defaultValue={editing?.fieldLabel || ''} required />
          </label>
          <label className="block text-sm">{ar ? 'اسم الحقل (عربي)' : 'Field Label (Arabic)'}
            <input name="fieldLabelAr" className="input mt-1 w-full" defaultValue={editing?.fieldLabelAr || ''} required />
          </label>
          <label className="block text-sm">{ar ? 'نوع العنصر' : 'Element Type'}
            <select name="fieldType" className="input mt-1 w-full" defaultValue={editing?.fieldType || 'text'}>
              {FIELD_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{ar ? o.labelAr : o.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">{ar ? 'الخيارات (سطر لكل خيار — للقوائم فقط)' : 'Options (one per line — for dropdowns only)'}
            <textarea name="options" className="input mt-1 w-full" rows={4} value={optionsText} onChange={e => setOptionsText(e.target.value)} placeholder={ar ? 'خيار 1\nخيار 2\nخيار 3' : 'Option 1\nOption 2\nOption 3'} />
          </label>
          <label className="block text-sm">{ar ? 'نص مساعد' : 'Placeholder'}
            <input name="placeholder" className="input mt-1 w-full" defaultValue={editing?.placeholder || ''} />
          </label>
          <label className="block text-sm">{ar ? 'ترتيب العرض' : 'Display Order'}
            <input name="displayOrder" type="number" className="input mt-1 w-full" defaultValue={editing?.displayOrder ?? 0} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="required" type="checkbox" defaultChecked={editing?.required} />
            {ar ? 'حقل مطلوب' : 'Required field'}
          </label>
          <Button type="submit">{ar ? 'حفظ' : 'Save'}</Button>
        </form>
      </Drawer>

      <ConfirmDialog open={deleteTarget !== null} title={ar ? 'تأكيد حذف الحقل' : 'Confirm field deletion'} description={`${deleteTarget?.fieldLabel} — ${ar ? 'سيتم حذف هذا الحقل نهائياً' : 'This field will be permanently removed'}`} destructive confirmLabel={ar ? 'حذف' : 'Delete'} onClose={() => setDeleteTarget(null)} onConfirm={deleteField} />
    </div>
  );
}
