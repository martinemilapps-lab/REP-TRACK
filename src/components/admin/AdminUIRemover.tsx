'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Plus, Trash2, Search, LayoutGrid, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Drawer } from '@/components/ui/Drawer';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SectionCard } from '@/components/ui/SectionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/lib/i18nContext';

/**
 * UI Element Visibility Manager.
 * Admin can hide/show any element, function, field, or text block in the UI.
 * Uses localStorage to persist hidden element IDs.
 */

export interface HiddenElement {
  id: string;
  elementId: string;       // CSS selector or component ID
  label: string;           // Human-readable label
  section: string;         // Where in the system
  elementType: 'field' | 'function' | 'section' | 'button' | 'text' | 'nav_item' | 'card' | 'column';
  isHidden: boolean;
  createdAt: string;
}

const HIDDEN_KEY = 'reptrack_hidden_elements';

const ELEMENT_TYPES = [
  { value: 'field', label: 'Form Field', labelAr: 'حقل نموذج' },
  { value: 'function', label: 'Function / Feature', labelAr: 'وظيفة / ميزة' },
  { value: 'section', label: 'Section / Card', labelAr: 'قسم / بطاقة' },
  { value: 'button', label: 'Button / Action', labelAr: 'زر / إجراء' },
  { value: 'text', label: 'Text Block', labelAr: 'كتلة نصية' },
  { value: 'nav_item', label: 'Navigation Item', labelAr: 'عنصر تنقل' },
  { value: 'card', label: 'Data Card', labelAr: 'بطاقة بيانات' },
  { value: 'column', label: 'Table Column', labelAr: 'عمود جدول' },
] as const;

const UI_SECTIONS = [
  { value: 'hospital_report', label: 'Hospital Visit Report', labelAr: 'تقرير زيارة المستشفى' },
  { value: 'pharmacy_report', label: 'Pharmacy Visit Report', labelAr: 'تقرير زيارة الصيدلية' },
  { value: 'doctor_report', label: 'Doctor Visit Report', labelAr: 'تقرير زيارة الطبيب' },
  { value: 'branch_report', label: 'Branch Visit Report', labelAr: 'تقرير زيارة الفرع' },
  { value: 'weekly_plan', label: 'Weekly Plan', labelAr: 'الخطة الأسبوعية' },
  { value: 'overview', label: 'Overview / Dashboard', labelAr: 'لوحة المعلومات' },
  { value: 'navigation', label: 'Main Navigation', labelAr: 'التنقل الرئيسي' },
  { value: 'manager', label: 'Manager Workspace', labelAr: 'مساحة عمل المدير' },
  { value: 'my_lists', label: 'My Lists', labelAr: 'قوائمي' },
  { value: 'exports', label: 'Export / Download', labelAr: 'التصدير / التحميل' },
  { value: 'availability', label: 'Product Availability', labelAr: 'توافر المنتجات' },
  { value: 'events_trainings', label: 'Events & Trainings', labelAr: 'الفعاليات والتدريبات' },
  { value: 'admin_panel', label: 'Admin Panel', labelAr: 'لوحة الإدارة' },
  { value: 'login', label: 'Login Page', labelAr: 'صفحة تسجيل الدخول' },
  { value: 'global', label: 'Global / Everywhere', labelAr: 'عام / في كل مكان' },
] as const;

function loadHiddenElements(): HiddenElement[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHiddenElements(elements: HiddenElement[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(elements));
}

export function isElementHidden(elementId: string): boolean {
  const elements = loadHiddenElements();
  return elements.some(e => e.elementId === elementId && e.isHidden);
}

export function AdminUIRemover() {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const [elements, setElements] = useState<HiddenElement[]>([]);
  const [editing, setEditing] = useState<Partial<HiddenElement> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HiddenElement | null>(null);
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { setElements(loadHiddenElements()); }, []);

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const updated: HiddenElement = {
      id: editing?.id || crypto.randomUUID(),
      elementId: String(form.get('elementId') || ''),
      label: String(form.get('label') || ''),
      section: String(form.get('section') || 'global'),
      elementType: String(form.get('elementType') || 'field') as HiddenElement['elementType'],
      isHidden: true,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    const all = elements.filter(e => e.id !== updated.id);
    all.push(updated);
    setElements(all);
    saveHiddenElements(all);
    setEditing(null);
    setSuccessMsg(editing?.id ? 'Rule updated' : 'Element hidden');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const deleteRule = () => {
    if (!deleteTarget) return;
    const all = elements.filter(e => e.id !== deleteTarget.id);
    setElements(all);
    saveHiddenElements(all);
    setDeleteTarget(null);
    setSuccessMsg('Rule removed (element visible again)');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const toggleHidden = (id: string) => {
    const all = elements.map(e => e.id === id ? { ...e, isHidden: !e.isHidden } : e);
    setElements(all);
    saveHiddenElements(all);
  };

  const filtered = elements.filter(el => {
    if (filterSection && el.section !== filterSection) return false;
    if (search) {
      const s = search.toLowerCase();
      return el.label.toLowerCase().includes(s) || el.elementId.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{ar ? 'إزالة / إخفاء العناصر' : 'UI Element Remover'}</h1>
          <p className="text-sm text-[var(--ink-soft)]">{ar ? 'إخفاء أي عنصر أو وظيفة أو حقل أو نص من واجهة المستخدم' : 'Hide any element, function, field, or text from the UI anywhere'}</p>
        </div>
        <Button onClick={() => setEditing({})}><Plus className="size-4" />{ar ? 'إخفاء عنصر' : 'Hide Element'}</Button>
      </header>

      {successMsg && <InlineAlert tone="success">{successMsg}</InlineAlert>}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-3 size-4 text-[var(--ink-soft)]" />
          <input className="input w-full ps-10" placeholder={ar ? 'ابحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input text-sm" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
          <option value="">{ar ? 'جميع الأقسام' : 'All sections'}</option>
          {UI_SECTIONS.map(s => <option key={s.value} value={s.value}>{ar ? s.labelAr : s.label}</option>)}
        </select>
        <StatusBadge tone="neutral">{elements.filter(e => e.isHidden).length} {ar ? 'مخفي' : 'hidden'}</StatusBadge>
      </div>

      {/* Element List */}
      {filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(el => {
            const section = UI_SECTIONS.find(s => s.value === el.section);
            const type = ELEMENT_TYPES.find(t => t.value === el.elementType);
            return (
              <SectionCard key={el.id} title={el.label} description={`${ar ? section?.labelAr : section?.label} · ${ar ? type?.labelAr : type?.label}`}
                actions={<StatusBadge tone={el.isHidden ? 'error' : 'success'}>{el.isHidden ? (ar ? 'مخفي' : 'Hidden') : (ar ? 'مرئي' : 'Visible')}</StatusBadge>}>
                <p className="mb-3 font-mono text-xs text-[var(--ink-soft)]">{el.elementId}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => toggleHidden(el.id)}>
                    {el.isHidden ? <><Eye className="size-4" />{ar ? 'إظهار' : 'Show'}</> : <><EyeOff className="size-4" />{ar ? 'إخفاء' : 'Hide'}</>}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(el)}>
                    <LayoutGrid className="size-4" />{ar ? 'تعديل' : 'Edit'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(el)}>
                    <Trash2 className="size-4" />{ar ? 'حذف القاعدة' : 'Delete Rule'}
                  </Button>
                </div>
              </SectionCard>
            );
          })}
        </div>
      ) : (
        <EmptyState title={ar ? 'لا توجد عناصر مخفية' : 'No hidden elements'} />
      )}

      {/* ─── Add/Edit Drawer ─── */}
      <Drawer open={editing !== null} title={editing?.id ? (ar ? 'تعديل قاعدة الإخفاء' : 'Edit Hide Rule') : (ar ? 'إخفاء عنصر جديد' : 'Hide New Element')} onClose={() => setEditing(null)}>
        <form className="space-y-4" onSubmit={save}>
          <label className="block text-sm">{ar ? 'معرّف العنصر (CSS selector أو ID)' : 'Element ID (CSS selector or component ID)'}
            <input name="elementId" className="input mt-1 w-full font-mono" defaultValue={editing?.elementId || ''} required placeholder="e.g., #hospital-notes, .visit-companion, nav.export" />
            <p className="mt-1 text-xs text-[var(--ink-soft)]">{ar ? 'استخدم معرّف CSS أو معرّف المكون لتحديد العنصر المراد إخفاؤه' : 'Use a CSS selector or component identifier to target the element'}</p>
          </label>
          <label className="block text-sm">{ar ? 'اسم العنصر (للعرض)' : 'Element Label (display name)'}
            <input name="label" className="input mt-1 w-full" defaultValue={editing?.label || ''} required placeholder="e.g., Hospital Notes Field" />
          </label>
          <label className="block text-sm">{ar ? 'القسم' : 'Section'}
            <select name="section" className="input mt-1 w-full" defaultValue={editing?.section || 'global'}>
              {UI_SECTIONS.map(s => <option key={s.value} value={s.value}>{ar ? s.labelAr : s.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">{ar ? 'نوع العنصر' : 'Element Type'}
            <select name="elementType" className="input mt-1 w-full" defaultValue={editing?.elementType || 'field'}>
              {ELEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.labelAr : t.label}</option>)}
            </select>
          </label>
          <Button type="submit">{ar ? 'حفظ' : 'Save'}</Button>
        </form>
      </Drawer>

      <ConfirmDialog open={deleteTarget !== null} title={ar ? 'تأكيد حذف القاعدة' : 'Confirm rule removal'} description={`${deleteTarget?.label} — ${ar ? 'سيظهر العنصر مرة أخرى' : 'Element will become visible again'}`} destructive confirmLabel={ar ? 'حذف' : 'Remove'} onClose={() => setDeleteTarget(null)} onConfirm={deleteRule} />
    </div>
  );
}
