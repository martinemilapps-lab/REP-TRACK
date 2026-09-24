'use client';

import { useCallback, useEffect, useState } from 'react';
import { Database, Trash2, ShieldAlert, UserX, UserCheck, AlertTriangle, ChevronLeft, ChevronRight, RefreshCcw, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Drawer } from '@/components/ui/Drawer';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SectionCard } from '@/components/ui/SectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/lib/i18nContext';
import type { AdminUserRow } from './adminTypes';

interface TableInfo { name: string; rowCount: number }
interface TableBrowse { rows: Record<string, unknown>[]; total: number; columns: string[] }

export function AdminDatabaseControl() {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [browseData, setBrowseData] = useState<TableBrowse | null>(null);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // User data deletion
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [purgeUserId, setPurgeUserId] = useState('');
  const [purgeConfirm, setPurgeConfirm] = useState(false);

  // Delete all except
  const [keepUserId, setKeepUserId] = useState('');
  const [keepConfirm, setKeepConfirm] = useState(false);

  // Nuclear reset
  const [nuclearOpen, setNuclearOpen] = useState(false);
  const [nuclearPassword, setNuclearPassword] = useState('');
  const [nuclearStep, setNuclearStep] = useState(0);
  const [nuclearConfirmText, setNuclearConfirmText] = useState('');

  const loadTables = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/admin/database?action=tables');
      const x = await r.json();
      if (!r.ok) throw new Error(x.message);
      setTables(x.tables || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/users?status=active&pageSize=50');
      const x = await r.json();
      if (r.ok) setUsers(x.users || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { void loadTables(); void loadUsers(); }, [loadTables, loadUsers]);

  const browseTable = useCallback(async (table: string, page: number) => {
    setBrowseLoading(true);
    setSelectedRows(new Set());
    try {
      const r = await fetch(`/api/admin/database?action=browse&table=${encodeURIComponent(table)}&page=${page}&pageSize=25`);
      const x = await r.json();
      if (!r.ok) throw new Error(x.message);
      setBrowseData({ rows: x.rows || [], total: x.total || 0, columns: x.columns || [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to browse table');
    } finally {
      setBrowseLoading(false);
    }
  }, []);

  const openTable = (name: string) => {
    setSelectedTable(name);
    setBrowsePage(1);
    void browseTable(name, 1);
  };

  const deleteSelectedRows = async () => {
    if (!selectedTable || !selectedRows.size) return;
    setBusy(true);
    setDeleteConfirm(false);
    try {
      const r = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_rows', table: selectedTable, rowIds: [...selectedRows] }),
      });
      const x = await r.json();
      if (!r.ok) throw new Error(x.message);
      setSuccessMsg(`${x.deleted} rows deleted`);
      setSelectedRows(new Set());
      void browseTable(selectedTable, browsePage);
      void loadTables();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const purgeUserData = async () => {
    setPurgeConfirm(false);
    setBusy(true);
    try {
      const r = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_user_data', userId: purgeUserId }),
      });
      const x = await r.json();
      if (!r.ok) throw new Error(x.message);
      setSuccessMsg(`Purged ${x.totalDeleted} rows across ${x.tablesAffected} tables`);
      void loadTables();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Purge failed');
    } finally {
      setBusy(false);
    }
  };

  const deleteAllExcept = async () => {
    setKeepConfirm(false);
    setBusy(true);
    try {
      const r = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_all_except', keepUserId }),
      });
      const x = await r.json();
      if (!r.ok) throw new Error(x.message);
      setSuccessMsg(`Deleted ${x.totalDeleted} rows across ${x.tablesAffected} tables (preserved selected user)`);
      void loadTables();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const executeNuclearReset = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'nuclear_reset', password: nuclearPassword }),
      });
      const x = await r.json();
      if (!r.ok) throw new Error(x.message);
      setSuccessMsg(`NUCLEAR RESET COMPLETE: ${x.totalRowsDeleted} rows deleted from ${x.tablesCleared} tables`);
      setNuclearOpen(false);
      setNuclearStep(0);
      setNuclearPassword('');
      setNuclearConfirmText('');
      void loadTables();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nuclear reset failed');
    } finally {
      setBusy(false);
    }
  };

  const filteredUsers = users.filter(u => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.username.toLowerCase().includes(userSearch.toLowerCase()));
  const totalTableRows = tables.reduce((sum, t) => sum + (t.rowCount > 0 ? t.rowCount : 0), 0);

  if (loading) return <Skeleton className="h-80" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">{ar ? 'لوحة تحكم قاعدة البيانات' : 'Database Control Panel'}</h1>
        <p className="text-sm text-[var(--ink-soft)]">{ar ? 'تحكم كامل في جميع بيانات النظام' : 'Full control over all system data'}</p>
      </header>

      {error && <InlineAlert tone="error">{error} <Button size="sm" variant="secondary" onClick={() => setError('')}><RefreshCcw className="size-4" />Dismiss</Button></InlineAlert>}
      {successMsg && <InlineAlert tone="success">{successMsg} <Button size="sm" variant="secondary" onClick={() => setSuccessMsg('')}>OK</Button></InlineAlert>}

      {/* ─── Table Overview ─── */}
      <SectionCard title={ar ? 'جداول قاعدة البيانات' : 'Database Tables'} description={`${tables.length} tables · ${totalTableRows.toLocaleString()} total rows`}
        actions={<Button size="sm" variant="secondary" onClick={() => void loadTables()}><RefreshCcw className="size-4" />{ar ? 'تحديث' : 'Refresh'}</Button>}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map(t => (
            <button key={t.name} type="button" onClick={() => openTable(t.name)}
              className={`flex items-center justify-between gap-2 rounded-lg border p-3 text-start text-sm transition-all hover:border-[var(--gold)] hover:bg-[var(--gold-tint)] ${selectedTable === t.name ? 'border-[var(--gold)] bg-[var(--gold-tint)]' : 'border-[var(--line)]'}`}>
              <span className="flex items-center gap-2">
                <Database className="size-4 text-[var(--gold-dark)]" />
                <span className="font-mono text-xs">{t.name}</span>
              </span>
              <StatusBadge tone={t.rowCount > 0 ? 'success' : 'neutral'}>{t.rowCount >= 0 ? t.rowCount : '—'}</StatusBadge>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* ─── Table Browser Drawer ─── */}
      <Drawer open={selectedTable !== null && browseData !== null} title={`${ar ? 'تصفح:' : 'Browse:'} ${selectedTable}`} onClose={() => { setSelectedTable(null); setBrowseData(null); }}>
        {browseLoading ? <Skeleton className="h-60" /> : browseData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>{browseData.total} {ar ? 'صف' : 'rows'} · {ar ? 'صفحة' : 'Page'} {browsePage}/{Math.max(1, Math.ceil(browseData.total / 25))}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" disabled={browsePage <= 1} onClick={() => { setBrowsePage(p => p - 1); void browseTable(selectedTable!, browsePage - 1); }}><ChevronLeft className="size-4" /></Button>
                <Button size="sm" variant="ghost" disabled={browsePage >= Math.ceil(browseData.total / 25)} onClick={() => { setBrowsePage(p => p + 1); void browseTable(selectedTable!, browsePage + 1); }}><ChevronRight className="size-4" /></Button>
              </div>
            </div>
            {selectedRows.size > 0 && (
              <div className="flex items-center gap-2">
                <StatusBadge tone="warning">{selectedRows.size} selected</StatusBadge>
                <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(true)} isLoading={busy}><Trash2 className="size-4" />{ar ? 'حذف المحدد' : 'Delete selected'}</Button>
              </div>
            )}
            <div className="max-h-[60dvh] overflow-auto rounded-lg border border-[var(--line)]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[var(--surface)] border-b border-[var(--line)]">
                  <tr>
                    <th className="p-2 text-start"><input type="checkbox" onChange={e => { if (e.target.checked) setSelectedRows(new Set(browseData.rows.map(r => String(r.id ?? '')))); else setSelectedRows(new Set()); }} /></th>
                    {browseData.columns.map(col => <th key={col} className="p-2 text-start font-mono whitespace-nowrap">{col}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {browseData.rows.map((row, i) => (
                    <tr key={i} className={`hover:bg-[var(--surface-hover)] ${selectedRows.has(String(row.id ?? '')) ? 'bg-[var(--gold-tint)]' : ''}`}>
                      <td className="p-2"><input type="checkbox" checked={selectedRows.has(String(row.id ?? ''))} onChange={e => { const next = new Set(selectedRows); if (e.target.checked) next.add(String(row.id ?? '')); else next.delete(String(row.id ?? '')); setSelectedRows(next); }} /></td>
                      {browseData.columns.map(col => <td key={col} className="max-w-[200px] truncate p-2 font-mono">{String(row[col] ?? '—')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── User Data Purge ─── */}
      <SectionCard title={ar ? 'حذف بيانات مستخدم محدد' : 'Delete Specific User Data'} description={ar ? 'حذف جميع التقارير والزيارات والخطط لمستخدم معين' : 'Delete all reports, visits, plans for a specific user'}>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-3 size-4 text-[var(--ink-soft)]" />
            <input className="input w-full ps-10" placeholder={ar ? 'ابحث عن مستخدم...' : 'Search user...'} value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          </div>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--line)] p-2">
            {filteredUsers.map(u => (
              <label key={u.id} className={`flex min-h-11 items-center gap-3 rounded-lg p-2 hover:bg-[var(--surface-hover)] cursor-pointer ${purgeUserId === u.id ? 'bg-[var(--gold-tint)] border border-[var(--gold)]' : ''}`}>
                <input type="radio" name="purge-user" checked={purgeUserId === u.id} onChange={() => setPurgeUserId(u.id)} />
                <span className="min-w-0">
                  <strong className="block truncate">{u.name}</strong>
                  <span className="text-xs text-[var(--ink-soft)]">{u.username} · {u.positionCode}</span>
                </span>
              </label>
            ))}
          </div>
          <Button variant="danger" disabled={!purgeUserId || busy} onClick={() => setPurgeConfirm(true)} isLoading={busy}>
            <UserX className="size-4" />{ar ? 'حذف جميع بيانات المستخدم' : 'Delete all user data'}
          </Button>
        </div>
      </SectionCard>

      {/* ─── Delete All Except One ─── */}
      <SectionCard title={ar ? 'حذف الكل ما عدا مستخدم واحد' : 'Delete All Data Except One User'} description={ar ? 'حذف جميع البيانات مع الاحتفاظ ببيانات مستخدم واحد فقط' : 'Purge everything but preserve one user\'s data'}>
        <InlineAlert tone="warning"><AlertTriangle className="size-4" />{ar ? 'عملية عالية الخطورة: سيتم حذف بيانات جميع المستخدمين ما عدا المستخدم المختار' : 'High risk: deletes data for ALL users except the selected one'}</InlineAlert>
        <div className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--line)] p-2">
          {filteredUsers.map(u => (
            <label key={u.id} className={`flex min-h-11 items-center gap-3 rounded-lg p-2 hover:bg-[var(--surface-hover)] cursor-pointer ${keepUserId === u.id ? 'bg-green-50 dark:bg-green-950/30 border border-green-500' : ''}`}>
              <input type="radio" name="keep-user" checked={keepUserId === u.id} onChange={() => setKeepUserId(u.id)} />
              <span className="min-w-0">
                <strong className="block truncate">{u.name}</strong>
                <span className="text-xs text-[var(--ink-soft)]">{u.username} · {u.positionCode}</span>
              </span>
              {keepUserId === u.id && <UserCheck className="ms-auto size-4 text-green-600" />}
            </label>
          ))}
        </div>
        <Button className="mt-3" variant="danger" disabled={!keepUserId || busy} onClick={() => setKeepConfirm(true)} isLoading={busy}>
          <Trash2 className="size-4" />{ar ? 'حذف كل البيانات ما عدا المختار' : 'Delete all except selected'}
        </Button>
      </SectionCard>

      {/* ─── Nuclear Reset (Danger Zone) ─── */}
      <SectionCard className="!border-red-500/40 !bg-red-50/50 dark:!bg-red-950/20" title={ar ? '⚠️ منطقة الخطر: إعادة ضبط كاملة' : '⚠️ Danger Zone: Nuclear Reset'} description={ar ? 'حذف جميع البيانات بالكامل والعودة للحالة الصفرية — يتطلب كلمة المرور' : 'Completely wipe ALL data and return to zero state — requires password verification'}>
        <InlineAlert tone="error"><ShieldAlert className="size-4" />{ar ? 'تحذير شديد: هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع البيانات نهائياً مع الاحتفاظ بحسابك فقط.' : 'CRITICAL WARNING: This action is IRREVERSIBLE. All data will be permanently deleted. Only your admin account will be preserved.'}</InlineAlert>
        <Button className="mt-4" variant="danger" onClick={() => { setNuclearOpen(true); setNuclearStep(0); setNuclearPassword(''); setNuclearConfirmText(''); }}>
          <ShieldAlert className="size-4" />{ar ? 'فتح إعادة الضبط النووية' : 'Open Nuclear Reset'}
        </Button>
      </SectionCard>

      {/* ─── Nuclear Reset Dialog ─── */}
      <Drawer open={nuclearOpen} title={ar ? '⚠️ إعادة ضبط نووية' : '⚠️ Nuclear Reset'} onClose={() => { setNuclearOpen(false); setNuclearStep(0); }}>
        <div className="space-y-5">
          {nuclearStep === 0 && (
            <div className="space-y-4">
              <InlineAlert tone="error"><ShieldAlert className="size-4" />{ar ? 'أنت على وشك حذف جميع البيانات في النظام بالكامل' : 'You are about to DELETE ALL DATA in the entire system'}</InlineAlert>
              <p className="text-sm font-semibold">{ar ? 'اكتب "DELETE ALL DATA" للمتابعة:' : 'Type "DELETE ALL DATA" to continue:'}</p>
              <input className="input w-full font-mono" value={nuclearConfirmText} onChange={e => setNuclearConfirmText(e.target.value)} placeholder="DELETE ALL DATA" />
              <Button variant="danger" disabled={nuclearConfirmText !== 'DELETE ALL DATA'} onClick={() => setNuclearStep(1)}>
                {ar ? 'المتابعة — أدخل كلمة المرور' : 'Continue — Enter Password'}
              </Button>
            </div>
          )}
          {nuclearStep === 1 && (
            <div className="space-y-4">
              <InlineAlert tone="error"><ShieldAlert className="size-4" />{ar ? 'الخطوة الأخيرة: أدخل كلمة المرور الخاصة بك لتأكيد الحذف النهائي' : 'Final step: Enter YOUR password to confirm permanent deletion'}</InlineAlert>
              <label className="block text-sm font-semibold">{ar ? 'كلمة المرور:' : 'Your Password:'}
                <input type="password" className="input mt-1 w-full" value={nuclearPassword} onChange={e => setNuclearPassword(e.target.value)} autoComplete="current-password" />
              </label>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setNuclearOpen(false); setNuclearStep(0); }}>{ar ? 'إلغاء' : 'Cancel'}</Button>
                <Button variant="danger" disabled={!nuclearPassword || busy} onClick={executeNuclearReset} isLoading={busy}>
                  <ShieldAlert className="size-4" />{ar ? '🔴 تنفيذ الحذف النهائي' : '🔴 Execute Nuclear Reset'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* ─── Confirm Dialogs ─── */}
      <ConfirmDialog open={deleteConfirm} title={ar ? 'تأكيد حذف الصفوف' : 'Confirm row deletion'} description={`${selectedRows.size} ${ar ? 'صف سيتم حذفه نهائياً من' : 'rows will be permanently deleted from'} ${selectedTable}`} destructive confirmLabel={ar ? 'حذف' : 'Delete'} onClose={() => setDeleteConfirm(false)} onConfirm={deleteSelectedRows} />
      <ConfirmDialog open={purgeConfirm} title={ar ? 'تأكيد حذف بيانات المستخدم' : 'Confirm user data purge'} description={ar ? 'سيتم حذف جميع التقارير والزيارات والخطط لهذا المستخدم' : 'All reports, visits, and plans for this user will be permanently deleted'} destructive confirmLabel={ar ? 'حذف الكل' : 'Purge all'} onClose={() => setPurgeConfirm(false)} onConfirm={purgeUserData} />
      <ConfirmDialog open={keepConfirm} title={ar ? 'تأكيد حذف بيانات الجميع' : 'Confirm mass data deletion'} description={ar ? 'سيتم حذف بيانات جميع المستخدمين ما عدا المستخدم المختار' : 'All data for ALL users except the selected one will be permanently deleted'} destructive confirmLabel={ar ? 'حذف الكل ما عدا المختار' : 'Delete all except selected'} onClose={() => setKeepConfirm(false)} onConfirm={deleteAllExcept} />
    </div>
  );
}
