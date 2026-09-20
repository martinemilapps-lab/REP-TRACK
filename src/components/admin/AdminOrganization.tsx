'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SectionCard } from '@/components/ui/SectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/lib/i18nContext';

type Person = { id: string; name: string; positionCode: string; isActive?: boolean | null; directManagers: Person[]; directReports: Person[]; ancestors: Person[]; descendants: Person[] };
type Relationship = { id: string; subordinate?: Person; manager?: Person };
const positionLevel: Record<string, number> = { MR: 1, DM: 2, AM: 3, OM: 3, BUM: 4, PM: 4, MM: 5, SMD: 6 };

export function AdminOrganization() {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [subordinateId, setSubordinateId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState<(Relationship & { affectedDescendants?: number }) | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/hierarchy');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message);
      setPeople(payload.employees);
      setRelationships(payload.relationships);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to load hierarchy'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const selected = useMemo(() => people.find(person => person.id === subordinateId), [people, subordinateId]);
  const managers = useMemo(() => people.filter(person => person.id !== subordinateId && person.isActive !== false && positionLevel[person.positionCode] > positionLevel[selected?.positionCode ?? '']), [people, selected, subordinateId]);
  const chooseSubordinate = (id: string) => {
    setSubordinateId(id);
    const person = people.find(item => item.id === id);
    setManagerId(person?.directManagers[0]?.id ?? '');
    setMessage(''); setError('');
  };

  const replaceManager = async () => {
    if (!subordinateId || !managerId) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/hierarchy', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subordinateUserId: subordinateId, managerUserId: managerId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message);
      setMessage(ar ? 'تم تحديث المدير وإعادة بناء نطاقات التقارير والخطط.' : 'Manager updated. Report and plan scopes were rebuilt.');
      await load();
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to update manager'); }
    finally { setBusy(false); }
  };

  const previewRemoval = async (relationship: Relationship) => {
    try {
      const response = await fetch(`/api/admin/hierarchy/${relationship.id}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message);
      setRemove({ ...relationship, ...payload });
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to preview change'); }
  };
  const removeRelationship = async () => {
    if (!remove) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/hierarchy/${remove.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message);
      setRemove(null); setMessage(ar ? 'تم حذف العلاقة وإعادة بناء الهيكل.' : 'Relationship removed and hierarchy rebuilt.');
      await load();
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to remove relationship'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-5">
    <header><h1 className="text-2xl font-black">{ar ? 'تسلسل الصلاحيات' : 'Authority chain'}</h1><p className="text-sm text-[var(--ink-soft)]">{ar ? 'حدد من يتبع من. يتم تحديث ظهور التقارير والخطط والقوائم تلقائياً.' : 'Control who reports to whom. Report, plan, list, and availability scopes update automatically.'}</p></header>
    {error ? <InlineAlert tone="error">{error} <Button size="sm" variant="secondary" onClick={() => void load()}><RefreshCcw className="size-4"/>Retry</Button></InlineAlert> : null}
    {message ? <InlineAlert tone="success">{message}</InlineAlert> : null}
    <SectionCard title={ar ? 'تغيير المدير المباشر' : 'Change direct manager'} description={ar ? 'عملية واحدة تستبدل المدير الحالي وتمنع تعدد المديرين أو الدورات.' : 'One safe operation replaces the current manager and prevents duplicate managers or cycles.'}>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="text-sm font-medium">{ar ? 'الموظف' : 'Employee'}<select className="input mt-1 w-full" value={subordinateId} onChange={event => chooseSubordinate(event.target.value)}><option value="">{ar ? 'اختر الموظف...' : 'Choose employee...'}</option>{people.filter(person => person.isActive !== false).map(person => <option key={person.id} value={person.id}>{person.name} · {person.positionCode}</option>)}</select></label>
        <label className="text-sm font-medium">{ar ? 'المدير الجديد' : 'New direct manager'}<select className="input mt-1 w-full" value={managerId} onChange={event => setManagerId(event.target.value)} disabled={!subordinateId}><option value="">{ar ? 'اختر المدير...' : 'Choose manager...'}</option>{managers.map(manager => <option key={manager.id} value={manager.id}>{manager.name} · {manager.positionCode}</option>)}</select></label>
        <Button onClick={() => void replaceManager()} isLoading={busy} disabled={!subordinateId || !managerId}><Save className="size-4"/>{ar ? 'حفظ التسلسل' : 'Save authority chain'}</Button>
      </div>
      {selected ? <div className="mt-4 grid gap-3 rounded-xl bg-[var(--surface-hover)] p-4 text-sm sm:grid-cols-3"><p><b>{ar ? 'المدير الحالي:' : 'Current manager:'}</b><br/>{selected.directManagers.map(item => item.name).join(', ') || '—'}</p><p><b>{ar ? 'المرؤوسون المباشرون:' : 'Direct reports:'}</b><br/>{selected.directReports.length}</p><p><b>{ar ? 'كل المرؤوسين:' : 'All descendants:'}</b><br/>{selected.descendants.length}</p></div> : null}
    </SectionCard>
    {loading ? <Skeleton className="h-72"/> : <>
      <div className="grid gap-3 lg:grid-cols-2">{people.map(person => <SectionCard key={person.id} title={person.name} description={person.positionCode}><p className="text-sm"><b>{ar ? 'المدير:' : 'Manager:'}</b> {person.directManagers.map(item => item.name).join(', ') || '—'}</p><p className="text-sm"><b>{ar ? 'المرؤوسون:' : 'Reports:'}</b> {person.directReports.map(item => item.name).join(', ') || '—'}</p><p className="text-xs text-[var(--ink-soft)]">{person.ancestors.length} {ar ? 'مدير أعلى' : 'ancestors'} · {person.descendants.length} {ar ? 'مرؤوس' : 'descendants'}</p></SectionCard>)}</div>
      <SectionCard title={ar ? 'العلاقات المباشرة' : 'Direct reporting relationships'} description={`${relationships.length} ${ar ? 'علاقة نشطة' : 'active relationships'}`}>{relationships.length ? relationships.map(relationship => <div key={relationship.id} className="flex items-center justify-between gap-3 border-b border-[var(--line)] py-2 text-sm"><span>{relationship.subordinate?.name} <span aria-hidden="true">→</span> {relationship.manager?.name}</span><Button size="sm" variant="danger" onClick={() => void previewRemoval(relationship)}><Trash2 className="size-4"/>{ar ? 'حذف' : 'Remove'}</Button></div>) : <p className="text-sm text-[var(--ink-soft)]">{ar ? 'لا توجد علاقات.' : 'No relationships.'}</p>}</SectionCard>
    </>}
    <ConfirmDialog open={remove !== null} title={ar ? 'حذف علاقة الإشراف؟' : 'Remove reporting relationship?'} description={ar ? `قد يؤثر ذلك على ${remove?.affectedDescendants ?? 0} من المرؤوسين. سيتم الحفاظ على البيانات التاريخية.` : `This may affect ${remove?.affectedDescendants ?? 0} descendants. Historical records are preserved.`} destructive confirmLabel={ar ? 'حذف' : 'Remove'} onClose={() => setRemove(null)} onConfirm={() => void removeRelationship()}/>
  </div>;
}
