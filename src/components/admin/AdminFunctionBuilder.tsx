'use client';

import { useEffect, useState } from 'react';
import { Zap, Plus, Trash2, Pencil, Search, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Drawer } from '@/components/ui/Drawer';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SectionCard } from '@/components/ui/SectionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/lib/i18nContext';

/**
 * Custom Function/Process Builder.
 * Admin can define entirely new functions/workflows for specific position titles.
 * Each function has a set of fields/steps that appear as a form for that position.
 */

export interface CustomFunction {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  targetPositions: string[];  // 'MR', 'DM', 'AM', 'OM', 'BUM', 'PM', 'MM', 'SMD'
  icon: string;               // Lucide icon name
  category: 'report' | 'task' | 'form' | 'workflow' | 'dashboard' | 'other';
  fields: CustomFunctionField[];
  isActive: boolean;
  createdAt: string;
}

export interface CustomFunctionField {
  id: string;
  label: string;
  labelAr: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'toggle' | 'email' | 'phone' | 'multiselect';
  options?: string[];
  required: boolean;
  placeholder?: string;
  order: number;
}

const FUNCTIONS_KEY = 'reptrack_custom_functions';
const POSITIONS = ['MR', 'DM', 'AM', 'OM', 'BUM', 'PM', 'MM', 'SMD'];
const CATEGORIES = [
  { value: 'report', label: 'Report / Log', labelAr: 'تقرير / سجل' },
  { value: 'task', label: 'Task / Assignment', labelAr: 'مهمة / تعيين' },
  { value: 'form', label: 'Data Entry Form', labelAr: 'نموذج إدخال بيانات' },
  { value: 'workflow', label: 'Workflow / Process', labelAr: 'سير عمل / عملية' },
  { value: 'dashboard', label: 'Dashboard Widget', labelAr: 'ودجت لوحة المعلومات' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' },
] as const;

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'date', label: 'Date' },
  { value: 'toggle', label: 'Toggle' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
] as const;

function loadFunctions(): CustomFunction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FUNCTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFunctions(fns: CustomFunction[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FUNCTIONS_KEY, JSON.stringify(fns));
}

export function getCustomFunctionsForPosition(positionCode: string): CustomFunction[] {
  return loadFunctions().filter(f => f.isActive && f.targetPositions.includes(positionCode));
}

export function AdminFunctionBuilder() {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const [functions, setFunctions] = useState<CustomFunction[]>([]);
  const [editing, setEditing] = useState<Partial<CustomFunction> | null>(null);
  const [editFields, setEditFields] = useState<CustomFunctionField[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<CustomFunction | null>(null);
  const [search, setSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());

  // Field editor state
  const [editingField, setEditingField] = useState<Partial<CustomFunctionField> | null>(null);
  const [fieldOptionsText, setFieldOptionsText] = useState('');

  useEffect(() => { setFunctions(loadFunctions()); }, []);

  const openNew = () => {
    setEditing({});
    setEditFields([]);
    setSelectedPositions(new Set());
  };

  const openEdit = (fn: CustomFunction) => {
    setEditing(fn);
    setEditFields([...fn.fields]);
    setSelectedPositions(new Set(fn.targetPositions));
  };

  const saveFunction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const updated: CustomFunction = {
      id: editing?.id || crypto.randomUUID(),
      name: String(form.get('name') || ''),
      nameAr: String(form.get('nameAr') || ''),
      description: String(form.get('description') || ''),
      descriptionAr: String(form.get('descriptionAr') || ''),
      targetPositions: [...selectedPositions],
      icon: String(form.get('icon') || 'Zap'),
      category: String(form.get('category') || 'other') as CustomFunction['category'],
      fields: editFields,
      isActive: true,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    if (!updated.targetPositions.length) {
      return; // Positions are required
    }
    const all = functions.filter(f => f.id !== updated.id);
    all.push(updated);
    setFunctions(all);
    saveFunctions(all);
    setEditing(null);
    setSuccessMsg(editing?.id ? 'Function updated' : 'New function created');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const deleteFunction = () => {
    if (!deleteTarget) return;
    const all = functions.filter(f => f.id !== deleteTarget.id);
    setFunctions(all);
    saveFunctions(all);
    setDeleteTarget(null);
    setSuccessMsg('Function deleted');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const toggleActive = (id: string) => {
    const all = functions.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f);
    setFunctions(all);
    saveFunctions(all);
  };

  // Field CRUD
  const addField = () => {
    setEditingField({});
    setFieldOptionsText('');
  };

  const saveField = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const field: CustomFunctionField = {
      id: editingField?.id || crypto.randomUUID(),
      label: String(form.get('fieldLabel') || ''),
      labelAr: String(form.get('fieldLabelAr') || ''),
      type: String(form.get('fieldType') || 'text') as CustomFunctionField['type'],
      options: fieldOptionsText ? fieldOptionsText.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
      required: form.get('fieldRequired') === 'on',
      placeholder: String(form.get('fieldPlaceholder') || ''),
      order: Number(form.get('fieldOrder') || editFields.length),
    };
    const updated = editFields.filter(f => f.id !== field.id);
    updated.push(field);
    updated.sort((a, b) => a.order - b.order);
    setEditFields(updated);
    setEditingField(null);
    setFieldOptionsText('');
  };

  const removeField = (fieldId: string) => {
    setEditFields(editFields.filter(f => f.id !== fieldId));
  };

  const filtered = functions.filter(fn => {
    if (search) {
      const s = search.toLowerCase();
      return fn.name.toLowerCase().includes(s) || fn.nameAr.includes(s) || fn.description.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{ar ? 'منشئ الوظائف الجديدة' : 'Function Builder'}</h1>
          <p className="text-sm text-[var(--ink-soft)]">{ar ? 'إنشاء وظائف ونماذج وعمليات جديدة بالكامل لأي منصب' : 'Create entirely new functions, forms, and processes for any position'}</p>
        </div>
        <Button onClick={openNew}><Plus className="size-4" />{ar ? 'وظيفة جديدة' : 'New Function'}</Button>
      </header>

      {successMsg && <InlineAlert tone="success">{successMsg}</InlineAlert>}

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-3 size-4 text-[var(--ink-soft)]" />
        <input className="input w-full ps-10" placeholder={ar ? 'ابحث عن وظيفة...' : 'Search functions...'} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Function Grid */}
      {filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(fn => {
            const cat = CATEGORIES.find(c => c.value === fn.category);
            return (
              <SectionCard key={fn.id} title={ar ? fn.nameAr : fn.name} description={ar ? fn.descriptionAr : fn.description}
                actions={<StatusBadge tone={fn.isActive ? 'success' : 'error'}>{fn.isActive ? 'Active' : 'Inactive'}</StatusBadge>}>
                <div className="mb-3 space-y-1 text-sm">
                  <p><span className="text-[var(--ink-soft)]">{ar ? 'الفئة:' : 'Category:'} </span>{ar ? cat?.labelAr : cat?.label}</p>
                  <p><span className="text-[var(--ink-soft)]">{ar ? 'المناصب:' : 'Positions:'} </span>{fn.targetPositions.join(', ')}</p>
                  <p><span className="text-[var(--ink-soft)]">{ar ? 'الحقول:' : 'Fields:'} </span>{fn.fields.length}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(fn)}><Pencil className="size-4" />{ar ? 'تعديل' : 'Edit'}</Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleActive(fn.id)}>
                    {fn.isActive ? (ar ? 'تعطيل' : 'Deactivate') : (ar ? 'تفعيل' : 'Activate')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(fn)}><Trash2 className="size-4" />{ar ? 'حذف' : 'Delete'}</Button>
                </div>
              </SectionCard>
            );
          })}
        </div>
      ) : (
        <EmptyState title={ar ? 'لا توجد وظائف مخصصة بعد' : 'No custom functions yet'} />
      )}

      {/* ─── Function Editor Drawer ─── */}
      <Drawer open={editing !== null && editingField === null} title={editing?.id ? (ar ? 'تعديل وظيفة' : 'Edit Function') : (ar ? 'إنشاء وظيفة جديدة' : 'Create New Function')} onClose={() => setEditing(null)}>
        <form className="space-y-4" onSubmit={saveFunction}>
          <label className="block text-sm">{ar ? 'اسم الوظيفة (إنجليزي)' : 'Function Name (English)'}
            <input name="name" className="input mt-1 w-full" defaultValue={editing?.name || ''} required />
          </label>
          <label className="block text-sm">{ar ? 'اسم الوظيفة (عربي)' : 'Function Name (Arabic)'}
            <input name="nameAr" className="input mt-1 w-full" defaultValue={editing?.nameAr || ''} required />
          </label>
          <label className="block text-sm">{ar ? 'الوصف (إنجليزي)' : 'Description (English)'}
            <textarea name="description" className="input mt-1 w-full" rows={2} defaultValue={editing?.description || ''} />
          </label>
          <label className="block text-sm">{ar ? 'الوصف (عربي)' : 'Description (Arabic)'}
            <textarea name="descriptionAr" className="input mt-1 w-full" rows={2} defaultValue={editing?.descriptionAr || ''} />
          </label>
          <label className="block text-sm">{ar ? 'الفئة' : 'Category'}
            <select name="category" className="input mt-1 w-full" defaultValue={editing?.category || 'other'}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{ar ? c.labelAr : c.label}</option>)}
            </select>
          </label>
          <fieldset className="rounded-lg border border-[var(--line)] p-3">
            <legend className="text-sm font-semibold px-2">{ar ? 'المناصب المستهدفة' : 'Target Positions'}</legend>
            <div className="flex flex-wrap gap-2 mt-2">
              {POSITIONS.map(p => (
                <label key={p} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm cursor-pointer transition-all ${selectedPositions.has(p) ? 'border-[var(--gold)] bg-[var(--gold-tint)] font-semibold' : 'border-[var(--line)] hover:bg-[var(--surface-hover)]'}`}>
                  <input type="checkbox" className="sr-only" checked={selectedPositions.has(p)} onChange={e => { const next = new Set(selectedPositions); if (e.target.checked) next.add(p); else next.delete(p); setSelectedPositions(next); }} />
                  {p}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Fields Editor */}
          <fieldset className="rounded-lg border border-[var(--line)] p-3 space-y-3">
            <legend className="text-sm font-semibold px-2">{ar ? 'حقول النموذج' : 'Form Fields'} ({editFields.length})</legend>
            {editFields.map(field => (
              <div key={field.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--surface-hover)] p-2 text-sm">
                <span><strong>{field.label}</strong> <span className="text-[var(--ink-soft)]">({field.type})</span>{field.required && <span className="text-red-500"> *</span>}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" type="button" onClick={() => { setEditingField(field); setFieldOptionsText(field.options?.join('\n') || ''); }}><Pencil className="size-3" /></Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => removeField(field.id)}><Trash2 className="size-3" /></Button>
                </div>
              </div>
            ))}
            <Button size="sm" variant="secondary" type="button" onClick={addField}><Plus className="size-4" />{ar ? 'إضافة حقل' : 'Add Field'}</Button>
          </fieldset>

          <Button type="submit" disabled={selectedPositions.size === 0}><Zap className="size-4" />{ar ? 'حفظ الوظيفة' : 'Save Function'}</Button>
        </form>
      </Drawer>

      {/* ─── Field Editor (nested) ─── */}
      <Drawer open={editingField !== null} title={editingField?.id ? (ar ? 'تعديل حقل' : 'Edit Field') : (ar ? 'إضافة حقل' : 'Add Field')} onClose={() => setEditingField(null)}>
        <form className="space-y-4" onSubmit={saveField}>
          <label className="block text-sm">{ar ? 'اسم الحقل (إنجليزي)' : 'Field Label (English)'}
            <input name="fieldLabel" className="input mt-1 w-full" defaultValue={editingField?.label || ''} required />
          </label>
          <label className="block text-sm">{ar ? 'اسم الحقل (عربي)' : 'Field Label (Arabic)'}
            <input name="fieldLabelAr" className="input mt-1 w-full" defaultValue={editingField?.labelAr || ''} required />
          </label>
          <label className="block text-sm">{ar ? 'نوع الحقل' : 'Field Type'}
            <select name="fieldType" className="input mt-1 w-full" defaultValue={editingField?.type || 'text'}>
              {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">{ar ? 'الخيارات (للقوائم)' : 'Options (for dropdowns)'}
            <textarea className="input mt-1 w-full" rows={3} value={fieldOptionsText} onChange={e => setFieldOptionsText(e.target.value)} placeholder="Option 1&#10;Option 2&#10;Option 3" />
          </label>
          <label className="block text-sm">{ar ? 'نص مساعد' : 'Placeholder'}
            <input name="fieldPlaceholder" className="input mt-1 w-full" defaultValue={editingField?.placeholder || ''} />
          </label>
          <label className="block text-sm">{ar ? 'الترتيب' : 'Order'}
            <input name="fieldOrder" type="number" className="input mt-1 w-full" defaultValue={editingField?.order ?? editFields.length} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="fieldRequired" type="checkbox" defaultChecked={editingField?.required} />
            {ar ? 'حقل مطلوب' : 'Required'}
          </label>
          <Button type="submit">{ar ? 'حفظ الحقل' : 'Save Field'}</Button>
        </form>
      </Drawer>

      <ConfirmDialog open={deleteTarget !== null} title={ar ? 'تأكيد حذف الوظيفة' : 'Confirm function deletion'} description={`${deleteTarget?.name} — ${ar ? 'سيتم حذف هذه الوظيفة وجميع حقولها' : 'This function and all its fields will be permanently deleted'}`} destructive confirmLabel={ar ? 'حذف' : 'Delete'} onClose={() => setDeleteTarget(null)} onConfirm={deleteFunction} />
    </div>
  );
}
