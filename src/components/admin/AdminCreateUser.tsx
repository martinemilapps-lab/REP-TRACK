'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SectionCard } from '@/components/ui/SectionCard';
import { useTranslation } from '@/lib/i18nContext';
import { CredentialResult } from './CredentialResult';
import type { CredentialRow } from './adminTypes';

const positions = ['MR', 'DM', 'AM', 'OM', 'BUM', 'PM', 'MM', 'SMD'] as const;
const positionLevel: Record<string, number> = { MR: 1, DM: 2, AM: 3, OM: 3, BUM: 4, PM: 4, MM: 5, SMD: 6 };
type ManagerOption = { id: string; name: string; positionCode: string | null; isActive?: boolean | null };

export function AdminCreateUser({ onCreated }: { onCreated: () => Promise<void> }) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const [name, setName] = useState('');
  const [positionCode, setPositionCode] = useState<(typeof positions)[number]>('MR');
  const [username, setUsername] = useState('');
  const [managerUserId, setManagerUserId] = useState('');
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [credential, setCredential] = useState<CredentialRow | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/hierarchy', { signal: controller.signal })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message);
        setManagers(payload.employees.filter((person: ManagerOption) => person.isActive !== false && person.positionCode !== 'MR'));
      })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Unable to load managers'); });
    return () => controller.abort();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, positionCode, username: username.toUpperCase(), managerUserId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message);
      setCredential(payload.credential);
      setName(''); setUsername(''); setManagerUserId('');
      await onCreated();
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to create user'); }
    finally { setBusy(false); }
  };

  return <SectionCard title={ar ? 'إضافة مستخدم جديد' : 'Add a new user'} description={ar ? 'أنشئ الحساب وضعه مباشرة داخل تسلسل الصلاحيات.' : 'Create the login and place it directly in the authority chain.'} actions={<UserPlus className="size-5 text-[var(--gold-deep)]"/>}>
    {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
    <form className="mt-4 grid gap-4 lg:grid-cols-2" onSubmit={submit}>
      <label className="text-sm font-medium">{ar ? 'الاسم الحقيقي' : 'Real name'}<input className="input mt-1 w-full" autoComplete="off" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Ahmed Hassan" required minLength={2}/></label>
      <label className="text-sm font-medium">{ar ? 'المسمى الوظيفي' : 'Position title'}<select className="input mt-1 w-full" value={positionCode} onChange={event => { const next = event.target.value as typeof positionCode; setPositionCode(next); setUsername(''); }}>{positions.map(position => <option key={position}>{position}</option>)}</select></label>
      <label className="text-sm font-medium">{ar ? 'كود المستخدم / اسم الدخول' : 'User code / username'}<input className="input mt-1 w-full font-mono uppercase" autoComplete="off" value={username} onChange={event => setUsername(event.target.value.toUpperCase().replace(/\s/g, ''))} placeholder={`${positionCode}1`} pattern={`${positionCode}[1-9][0-9]*`} required/><span className="mt-1 block text-xs text-[var(--ink-soft)]">{ar ? `يجب أن يبدأ بـ ${positionCode}` : `Must start with ${positionCode}, for example ${positionCode}1`}</span></label>
      <label className="text-sm font-medium">{ar ? 'المدير المباشر' : 'Direct manager'}<select className="input mt-1 w-full" value={managerUserId} onChange={event => setManagerUserId(event.target.value)} required><option value="">{ar ? 'اختر المدير...' : 'Choose manager...'}</option>{managers.filter(manager => positionLevel[manager.positionCode ?? ''] > positionLevel[positionCode]).map(manager => <option key={manager.id} value={manager.id}>{manager.name} · {manager.positionCode}</option>)}</select></label>
      <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--surface-hover)] p-3 text-sm"><span className="text-[var(--ink-soft)]"><KeyRound className="me-2 inline size-4"/>{ar ? 'سيتم إنشاء كلمة مرور مؤقتة لمرة واحدة ويجب تغييرها عند أول دخول.' : 'A one-time temporary password will be generated and must be changed at first sign-in.'}</span><Button type="submit" isLoading={busy} disabled={!name.trim() || !username || !managerUserId}><UserPlus className="size-4"/>{ar ? 'إنشاء وإضافة للهيكل' : 'Create and place in hierarchy'}</Button></div>
    </form>
    <Drawer open={credential !== null} title={ar ? 'تم إنشاء المستخدم' : 'User created'} onClose={() => setCredential(null)}>{credential ? <CredentialResult rows={[credential]} onDismiss={() => setCredential(null)}/> : null}</Drawer>
  </SectionCard>;
}
