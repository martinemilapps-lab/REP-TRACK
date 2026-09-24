'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Languages, Pencil, Plus, Trash2, Search, RefreshCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Drawer } from '@/components/ui/Drawer';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SectionCard } from '@/components/ui/SectionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/lib/i18nContext';

/**
 * Text override system. Admin can override ANY text key in the i18n system.
 * Stored in localStorage. The i18n context checks for overrides before returning default values.
 */

export interface TextOverride {
  id: string;
  key: string;       // i18n key like 'nav.overview' or custom label
  originalEn: string;
  originalAr: string;
  overrideEn: string;
  overrideAr: string;
  section: string;   // Categorization
  isActive: boolean;
  createdAt: string;
}

const OVERRIDES_KEY = 'reptrack_text_overrides';

function loadOverrides(): TextOverride[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveOverrides(overrides: TextOverride[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

export function getTextOverride(key: string, language: 'en' | 'ar'): string | null {
  const overrides = loadOverrides();
  const match = overrides.find(o => o.key === key && o.isActive);
  if (!match) return null;
  return language === 'ar' ? match.overrideAr : match.overrideEn;
}

const TEXT_SECTIONS = [
  { value: 'navigation', label: 'Navigation & Menu', labelAr: 'القائمة والتنقل' },
  { value: 'forms', label: 'Form Labels & Fields', labelAr: 'تسميات النماذج' },
  { value: 'buttons', label: 'Buttons & Actions', labelAr: 'الأزرار والإجراءات' },
  { value: 'headers', label: 'Page Headers & Titles', labelAr: 'عناوين الصفحات' },
  { value: 'messages', label: 'Messages & Notifications', labelAr: 'الرسائل والإشعارات' },
  { value: 'admin', label: 'Admin Panel', labelAr: 'لوحة الإدارة' },
  { value: 'reports', label: 'Reports & Analytics', labelAr: 'التقارير والتحليلات' },
  { value: 'misc', label: 'Miscellaneous', labelAr: 'متنوع' },
] as const;

export function AdminTextEditor() {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const [overrides, setOverrides] = useState<TextOverride[]>([]);
  const [editing, setEditing] = useState<Partial<TextOverride> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TextOverride | null>(null);
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { setOverrides(loadOverrides()); }, []);

  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const updated: TextOverride = {
      id: editing?.id || crypto.randomUUID(),
      key: String(form.get('key') || ''),
      originalEn: String(form.get('originalEn') || ''),
      originalAr: String(form.get('originalAr') || ''),
      overrideEn: String(form.get('overrideEn') || ''),
      overrideAr: String(form.get('overrideAr') || ''),
      section: String(form.get('section') || 'misc'),
      isActive: true,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    const all = overrides.filter(o => o.id !== updated.id);
    all.push(updated);
    setOverrides(all);
    saveOverrides(all);
    setEditing(null);
    setSuccessMsg(editing?.id ? 'Text override updated' : 'Text override added');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const deleteOverride = () => {
    if (!deleteTarget) return;
    const all = overrides.filter(o => o.id !== deleteTarget.id);
    setOverrides(all);
    saveOverrides(all);
    setDeleteTarget(null);
    setSuccessMsg('Override deleted');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const toggleActive = (id: string) => {
    const all = overrides.map(o => o.id === id ? { ...o, isActive: !o.isActive } : o);
    setOverrides(all);
    saveOverrides(all);
  };

  const filtered = overrides.filter(o => {
    if (filterSection && o.section !== filterSection) return false;
    if (search) {
      const s = search.toLowerCase();
      return o.key.toLowerCase().includes(s) || o.overrideEn.toLowerCase().includes(s) || o.overrideAr.includes(s) || o.originalEn.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{ar ? 'محرر نصوص النظام' : 'System Text Editor'}</h1>
          <p className="text-sm text-[var(--ink-soft)]">{ar ? 'تعديل وتخصيص جميع النصوص المعروضة في الموقع' : 'Edit and customize all text displayed throughout the website'}</p>
        </div>
        <Button onClick={() => setEditing({})}><Plus className="size-4" />{ar ? 'تعديل نص جديد' : 'New Text Override'}</Button>
      </header>

      {successMsg && <InlineAlert tone="success">{successMsg}</InlineAlert>}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-3 size-4 text-[var(--ink-soft)]" />
          <input className="input w-full ps-10" placeholder={ar ? 'ابحث عن نص...' : 'Search text...'} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input text-sm" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
          <option value="">{ar ? 'جميع الأقسام' : 'All sections'}</option>
          {TEXT_SECTIONS.map(s => <option key={s.value} value={s.value}>{ar ? s.labelAr : s.label}</option>)}
        </select>
        <StatusBadge tone="neutral">{filtered.length} {ar ? 'تعديل' : 'overrides'}</StatusBadge>
      </div>

      {/* Override List */}
      {filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(override => {
            const section = TEXT_SECTIONS.find(s => s.value === override.section);
            return (
              <SectionCard key={override.id} title={override.key} description={ar ? section?.labelAr : section?.label} actions={<StatusBadge tone={override.isActive ? 'success' : 'error'}>{override.isActive ? 'Active' : 'Inactive'}</StatusBadge>}>
                <div className="mb-3 space-y-2 text-sm">
                  <div className="rounded-lg bg-[var(--surface-hover)] p-2">
                    <p className="text-[var(--ink-soft)]">{ar ? 'النص الأصلي (EN):' : 'Original (EN):'}</p>
                    <p className="font-mono text-xs line-through opacity-60">{override.originalEn || '—'}</p>
                    <p className="text-[var(--ink-soft)] mt-1">{ar ? 'النص الجديد (EN):' : 'Override (EN):'}</p>
                    <p className="font-semibold text-[var(--gold-dark)]">{override.overrideEn || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--surface-hover)] p-2">
                    <p className="text-[var(--ink-soft)]">{ar ? 'النص الأصلي (AR):' : 'Original (AR):'}</p>
                    <p className="font-mono text-xs line-through opacity-60">{override.originalAr || '—'}</p>
                    <p className="text-[var(--ink-soft)] mt-1">{ar ? 'النص الجديد (AR):' : 'Override (AR):'}</p>
                    <p className="font-semibold text-[var(--gold-dark)]">{override.overrideAr || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(override)}><Pencil className="size-4" />{ar ? 'تعديل' : 'Edit'}</Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleActive(override.id)}>
                    {override.isActive ? (ar ? 'تعطيل' : 'Deactivate') : (ar ? 'تفعيل' : 'Activate')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(override)}><Trash2 className="size-4" />{ar ? 'حذف' : 'Delete'}</Button>
                </div>
              </SectionCard>
            );
          })}
        </div>
      ) : (
        <EmptyState title={ar ? 'لا توجد تعديلات نصية بعد' : 'No text overrides yet'} />
      )}

      {/* ─── Edit Drawer ─── */}
      <Drawer open={editing !== null} title={editing?.id ? (ar ? 'تعديل نص' : 'Edit Text Override') : (ar ? 'إضافة تعديل نص جديد' : 'Add New Text Override')} onClose={() => setEditing(null)}>
        <form className="space-y-4" onSubmit={save}>
          <label className="block text-sm">{ar ? 'مفتاح النص أو المعرّف' : 'Text Key / Identifier'}
            <input name="key" className="input mt-1 w-full font-mono" defaultValue={editing?.key || ''} required placeholder="e.g., nav.overview or custom_label" />
          </label>
          <label className="block text-sm">{ar ? 'القسم' : 'Section'}
            <select name="section" className="input mt-1 w-full" defaultValue={editing?.section || 'misc'}>
              {TEXT_SECTIONS.map(s => <option key={s.value} value={s.value}>{ar ? s.labelAr : s.label}</option>)}
            </select>
          </label>
          <fieldset className="rounded-lg border border-[var(--line)] p-3 space-y-3">
            <legend className="text-sm font-semibold px-2">{ar ? 'النص الإنجليزي' : 'English Text'}</legend>
            <label className="block text-sm">{ar ? 'الأصلي (مرجع)' : 'Original (reference)'}
              <input name="originalEn" className="input mt-1 w-full" defaultValue={editing?.originalEn || ''} placeholder="Current English text" />
            </label>
            <label className="block text-sm font-semibold">{ar ? 'النص الجديد' : 'New Override'}
              <input name="overrideEn" className="input mt-1 w-full" defaultValue={editing?.overrideEn || ''} required placeholder="New English text" />
            </label>
          </fieldset>
          <fieldset className="rounded-lg border border-[var(--line)] p-3 space-y-3">
            <legend className="text-sm font-semibold px-2">{ar ? 'النص العربي' : 'Arabic Text'}</legend>
            <label className="block text-sm">{ar ? 'الأصلي (مرجع)' : 'Original (reference)'}
              <input name="originalAr" className="input mt-1 w-full" defaultValue={editing?.originalAr || ''} placeholder="النص العربي الحالي" dir="rtl" />
            </label>
            <label className="block text-sm font-semibold">{ar ? 'النص الجديد' : 'New Override'}
              <input name="overrideAr" className="input mt-1 w-full" defaultValue={editing?.overrideAr || ''} required placeholder="النص العربي الجديد" dir="rtl" />
            </label>
          </fieldset>
          <Button type="submit"><Save className="size-4" />{ar ? 'حفظ' : 'Save'}</Button>
        </form>
      </Drawer>

      <ConfirmDialog open={deleteTarget !== null} title={ar ? 'تأكيد حذف التعديل' : 'Confirm override deletion'} description={`${deleteTarget?.key} — ${ar ? 'سيعود النص للقيمة الأصلية' : 'Text will revert to original value'}`} destructive confirmLabel={ar ? 'حذف' : 'Delete'} onClose={() => setDeleteTarget(null)} onConfirm={deleteOverride} />
    </div>
  );
}
