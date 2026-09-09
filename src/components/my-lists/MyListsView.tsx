'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { Representative, MasterListsPayload, MasterHospital, MasterPharmacy, MasterDoctor, MasterBranch } from '@/types';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { Button } from '@/components/ui/Button';
import { MultiProductSelect } from '@/components/ui/MultiProductSelect';
import { FormField } from '@/components/ui/FormField';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Skeleton } from '@/components/ui/Skeleton';
import { Building2, Hospital, Pill, Stethoscope } from 'lucide-react';
type Customer = MasterHospital | MasterPharmacy | MasterDoctor | MasterBranch;
type CustomerFields = Partial<MasterHospital & MasterPharmacy & MasterDoctor & MasterBranch>;
interface MyListsViewProps {
    reps: Representative[];
    selectedRep: string;
    onSelectRep?: (rep: string) => void;
    onLogVisitForCustomer?: (category: 'hospital' | 'pharmacy' | 'doctor' | 'branch', item: Customer) => void;
    readOnly?: boolean;
}
type ListCategory = 'hospitals' | 'pharmacies' | 'doctors' | 'branches';
export function MyListsView({ reps, selectedRep, onSelectRep, onLogVisitForCustomer, readOnly = false, }: MyListsViewProps) {
    const { t, language } = useTranslation();
    const [activeCategory, setActiveCategory] = useState<ListCategory>('hospitals');
    const [search, setSearch] = useState('');
    const [areaFilter, setAreaFilter] = useState('');
    const [loadError, setLoadError] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [listsData, setListsData] = useState<MasterListsPayload>({
        hospitals: [],
        pharmacies: [],
        doctors: [],
        branches: [],
    });
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Customer | null>(null);
    const [saving, setSaving] = useState(false);
    const [modalFormData, setModalFormData] = useState<CustomerFields>({});
    const [statusMsg, setStatusMsg] = useState<{
        text: string;
        isError?: boolean;
    } | null>(null);
    const repOptions: SelectOption[] = useMemo(() => {
        return reps.map((r) => ({
            value: r.name,
            label: r.name,
            sublabel: r.area,
        }));
    }, [reps]);
    const loadLists = useCallback(async (repName?: string) => {
        if (readOnly && !repName)
            return;
        setLoading(true);
        setLoadError(false);
        try {
            const url = readOnly && repName ? `/api/lists?rep=${encodeURIComponent(repName)}` : '/api/lists';
            const res = await fetch(url);
            const data = await res.json();
            if (res.ok && data.success && data.data) {
                setListsData(data.data);
            }
            else {
                setLoadError(true);
            }
        }
        catch {
            setLoadError(true);
        }
        finally {
            setLoading(false);
        }
    }, [readOnly]);
    useEffect(() => {
        const timer = setTimeout(() => void loadLists(selectedRep), 0);
        return () => clearTimeout(timer);
    }, [selectedRep, loadLists]);
    const showNotification = (text: string, isError = false) => {
        setStatusMsg({
            text, isError
        });
        setTimeout(() => setStatusMsg(null), 3500);
    };
    // Open modal for Create
    const handleOpenCreateModal = () => {
        setEditingItem(null);
        if (activeCategory === 'hospitals') {
            setModalFormData({
                name: '',
                area: '',
                type: 'Private',
                contact: '',
                phone: '',
                defaultCycle: 7,
            });
        }
        else if (activeCategory === 'pharmacies') {
            setModalFormData({
                name: '',
                area: '',
                address: '',
                pharmacist: '',
                mobile: '',
                classification: 'A',
                defaultCycle: 7,
                targetProducts: '',
            });
        }
        else if (activeCategory === 'doctors') {
            setModalFormData({
                code: '',
                name: '',
                specialty: '',
                workplace: '',
                area: '',
                address: '',
                mobile: '',
                classification: 'A',
                bestTime: '',
                defaultCycle: 7,
            });
        }
        else if (activeCategory === 'branches') {
            setModalFormData({
                name: '',
                coverageArea: '',
                address: '',
                contact: '',
                phone: '',
                distributedProducts: '',
                defaultCycle: 7,
            });
        }
        setIsModalOpen(true);
    };
    // Open modal for Edit
    const handleOpenEditModal = (item: Customer) => {
        setEditingItem(item);
        setModalFormData({
            ...item
        });
        setIsModalOpen(true);
    };
    // Save Item (Create / Update) with immediate D1 autosave & optimistic rollback
    const handleSaveModal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly || saving)
            return;
        if (!modalFormData.name?.trim()) {
            showNotification(language === 'ar' ? 'اسم العميل مطلوب' : 'Customer name is required', true);
            return;
        }
        if (!Number.isInteger(Number(modalFormData.defaultCycle)) || Number(modalFormData.defaultCycle) < 1) {
            showNotification(language === 'ar' ? 'يجب أن تكون دورة الزيارة يوماً واحداً على الأقل' : 'Visit cycle must be at least one whole day', true);
            return;
        }
        setSaving(true);
        setSyncStatus('saving');
        const prevListsData = {
            ...listsData
        };
        try {
            const payload = {
                category: activeCategory,
                item: {
                    ...modalFormData,
                    id: editingItem?.id || undefined,
                },
            };
            const res = await fetch('/api/lists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
            });
            const resData = await res.json();
            if (res.ok && resData.success) {
                setIsModalOpen(false);
                setSyncStatus('saved');
                showNotification(t('lists.savedSuccess'));
                await loadLists(selectedRep);
            }
            else {
                // Rollback optimistic state
                setListsData(prevListsData);
                setSyncStatus('error');
                showNotification(resData.message || t('msg.errorGeneric'), true);
            }
        }
        catch {
            setListsData(prevListsData);
            setSyncStatus('error');
            showNotification(t('msg.errorGeneric'), true);
        }
        finally {
            setSaving(false);
        }
    };
    // Delete Item with immediate D1 persistence & optimistic rollback
    const handleDeleteItem = async (id: string, name: string) => {
        if (readOnly)
            return;
        void name;
        setSyncStatus('saving');
        const prevListsData = {
            ...listsData
        };
        // Optimistic removal
        setListsData((prev) => ({
            ...prev,
            [activeCategory]: (prev[activeCategory] || []).filter((it: Customer) => it.id !== id),
        }));
        try {
            const res = await fetch(`/api/lists?category=${activeCategory}&id=${encodeURIComponent(id)}`, {
                method: 'DELETE',
            });
            const resData = await res.json();
            if (res.ok && resData.success) {
                setSyncStatus('saved');
                showNotification(t('lists.deletedSuccess'));
            }
            else {
                setListsData(prevListsData);
                setSyncStatus('error');
                showNotification(resData.message || t('msg.errorGeneric'), true);
            }
        }
        catch {
            setListsData(prevListsData);
            setSyncStatus('error');
            showNotification(t('msg.errorGeneric'), true);
        }
    };
    // Filtered lists
    const currentList = listsData[activeCategory];
    const filteredList = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term)
            return currentList;
        return currentList.filter((record) => {
            const item: CustomerFields = record;
            return (item.name?.toLowerCase().includes(term) ||
                item.area?.toLowerCase().includes(term) ||
                item.address?.toLowerCase().includes(term) ||
                item.coverageArea?.toLowerCase().includes(term) ||
                item.contact?.toLowerCase().includes(term) ||
                item.pharmacist?.toLowerCase().includes(term) ||
                item.specialty?.toLowerCase().includes(term) ||
                item.workplace?.toLowerCase().includes(term));
        });
    }, [currentList, search]);
    // Manual Daily Rates state (keyed by category: 'hospitals', 'pharmacies', 'doctors', 'branches')
    const [dailyInputs, setDailyInputs] = useState<Record<string, string>>({
        hospitals: '',
        pharmacies: '',
        doctors: '',
        branches: '',
    });
    // Load manual rates from D1-backed representative fields when selectedRep changes
    useEffect(() => {
        const repObj = reps.find((r) => r.name === selectedRep);
        const timer = setTimeout(() => setDailyInputs({
            hospitals: repObj && repObj.assignedHospitals > 0 ? String(repObj.assignedHospitals) : '',
            pharmacies: repObj && repObj.assignedPharmacies > 0 ? String(repObj.assignedPharmacies) : '',
            doctors: repObj && repObj.assignedDrs > 0 ? String(repObj.assignedDrs) : '',
            branches: '',
        }), 0);
        return () => clearTimeout(timer);
    }, [selectedRep, reps]);
    const handleDailyInputChange = async (category: string, value: string) => {
        setDailyInputs((prev) => ({
            ...prev, [category]: value
        }));
        if (readOnly || !selectedRep)
            return;
        const num = parseFloat(value);
        const validNum = !isNaN(num) && num >= 0 ? Math.round(num) : 0;
        const patchPayload: Record<string, string | number> = {
            repName: selectedRep
        };
        if (category === 'hospitals')
            patchPayload.assignedHospitals = validNum;
        if (category === 'pharmacies')
            patchPayload.assignedPharmacies = validNum;
        if (category === 'doctors')
            patchPayload.assignedDrs = validNum;
        try {
            const response = await fetch('/api/reps', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patchPayload),
            });
            if (!response.ok)
                throw new Error();
        }
        catch {
            showNotification(language === 'ar' ? 'تعذر حفظ معدل الزيارة' : 'Unable to save the visit rate', true);
        }
    };
    // Active Category Calculation: Auto customer count, manual daily rate, auto weekly/monthly rates
    const customerCount = (listsData[activeCategory] || []).length;
    const currentDailyInputStr = dailyInputs[activeCategory] ?? '';
    const activeDailyRate = parseFloat(currentDailyInputStr) || 0;
    const activeWeeklyRate = activeDailyRate * 6; // 6 working days / week
    const activeMonthlyRate = Math.round(activeDailyRate * 26); // 26 working days / month
    const ar = language === 'ar';
    const l = (en: string, arabic: string) => ar ? arabic : en;
    const categories = [{
            key: 'hospitals', en: 'Hospitals', ar: 'المستشفيات', Icon: Hospital
        }, {
            key: 'doctors', en: 'Doctors', ar: 'الأطباء', Icon: Stethoscope
        }, {
            key: 'pharmacies', en: 'Pharmacies', ar: 'الصيدليات', Icon: Pill
        }, {
            key: 'branches', en: 'Distribution branches', ar: 'فروع التوزيع', Icon: Building2
        }] as const;
    const fields: Record<string, [
        string,
        string
    ]> = {
        name: ['Name', 'الاسم'], area: ['Area', 'المنطقة'], type: ['Hospital type', 'نوع المستشفى'], contact: ['Contact', 'جهة الاتصال'], phone: ['Phone', 'الهاتف'], address: ['Address', 'العنوان'], pharmacist: ['Pharmacist', 'الصيدلي'], mobile: ['Mobile', 'الهاتف المحمول'], classification: ['Classification', 'التصنيف'], specialty: ['Specialty', 'التخصص'], workplace: ['Workplace', 'مكان العمل'], bestTime: ['Best visit time', 'أفضل وقت للزيارة'], coverageArea: ['Coverage area', 'منطقة التغطية'], distributedProducts: ['Distributed products', 'المنتجات الموزعة'], defaultCycle: ['Visit cycle (days)', 'دورة الزيارة (أيام)'], targetProducts: ['Target products', 'المنتجات المستهدفة'], code: ['Code', 'الكود']
    };
    const keys: Record<ListCategory, string[]> = {
        hospitals: ['name', 'area', 'type', 'contact', 'phone'], pharmacies: ['name', 'area', 'address', 'pharmacist', 'mobile', 'classification'], doctors: ['code', 'name', 'area', 'address', 'specialty', 'workplace', 'mobile', 'classification', 'bestTime'], branches: ['name', 'coverageArea', 'address', 'contact', 'phone', 'distributedProducts']
    };
    const visible = filteredList.filter(item => !areaFilter || (item as unknown as Record<string, string>).area === areaFilter || (item as unknown as Record<string, string>).coverageArea === areaFilter);
    const actions = (item: typeof currentList[number]) => <div className="flex flex-wrap gap-2">
    <Button type="button" size="sm" variant="secondary" onClick={() => setDetail({
        ...item
    })}>{l('Details', 'التفاصيل')}</Button>{!readOnly && <>
        <Button type="button" size="sm" variant="secondary" disabled={saving || syncStatus === 'saving'} onClick={() => handleOpenEditModal(item)}>{l('Edit', 'تعديل')}</Button>
        <Button type="button" size="sm" variant="danger" disabled={saving || syncStatus === 'saving'} onClick={() => setPendingDelete({
            id: item.id, name: item.name
        })}>{l('Delete', 'حذف')}</Button>{onLogVisitForCustomer && <Button type="button" size="sm" onClick={() => onLogVisitForCustomer(({
            hospitals: 'hospital', doctors: 'doctor', pharmacies: 'pharmacy', branches: 'branch'
        } as const)[activeCategory], item)}>{l('Log visit', 'تسجيل زيارة')}</Button>}</>}</div>;
    return <div className="space-y-4">{statusMsg && <InlineAlert tone={statusMsg.isError ? 'error' : 'success'}>{statusMsg.text}</InlineAlert>}<SectionCard title={readOnly ? l('Team customer lists', 'قوائم عملاء الفريق') : l('My customer lists', 'قوائم عملائي')}>
    <div className="flex flex-wrap items-center justify-between gap-3">
    <p>{selectedRep}</p>
    <StatusBadge tone={syncStatus === 'error' ? 'error' : syncStatus === 'saving' ? 'warning' : 'success'}>{readOnly ? l('Read only', 'للقراءة فقط') : syncStatus === 'saving' ? l('Saving', 'جارٍ الحفظ') : syncStatus === 'error' ? l('Save failed', 'فشل الحفظ') : l('Saved', 'محفوظ')}</StatusBadge>
    </div>{readOnly && <div className="mt-3">
        <CustomSelect options={repOptions} value={selectedRep} onChange={value => onSelectRep?.(value)} placeholder={l('Select an authorized representative', 'اختر مندوباً مصرحاً به')} searchable/>
        </div>}</SectionCard>
 {readOnly && !selectedRep ? <EmptyState title={l('Select a representative to browse their lists', 'اختر مندوباً لاستعراض قوائمه')}/> : <>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label={l('Customer categories', 'فئات العملاء')}>{categories.map(({ key, en, ar: arabic, Icon }) => <Button type="button" key={key} aria-pressed={activeCategory === key} variant={activeCategory === key ? 'primary' : 'secondary'} leftIcon={<Icon className="size-4"/>} onClick={() => { setActiveCategory(key); setAreaFilter(''); }}>{l(en, arabic)} ({listsData[key].length})</Button>)}</div>
        <FilterBar>
        <label className="min-w-0 flex-1 text-sm">{l('Search', 'بحث')}<input value={search} type="search" onChange={e => setSearch(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] px-3"/>
        </label>
        <label className="min-w-0 flex-1 text-sm">{l('Area', 'المنطقة')}<select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] px-3">
        <option value="">{l('All areas', 'كل المناطق')}</option>{[...new Set(currentList.map(item => { const r = item as unknown as Record<string, string>; return r.area || r.coverageArea; }).filter(Boolean))].map(area => <option key={area}>{area}</option>)}</select>
        </label>
        <Button type="button" variant="secondary" onClick={() => { setSearch(''); setAreaFilter(''); }}>{l('Reset', 'إعادة تعيين')}</Button>{!readOnly && <Button type="button" disabled={saving || syncStatus === 'saving'} onClick={handleOpenCreateModal}>{l('Add customer', 'إضافة عميل')}</Button>}</FilterBar>
 {loadError ? <InlineAlert tone="error">{l('Unable to load lists', 'تعذر تحميل القوائم')} <Button type="button" onClick={() => void loadLists(selectedRep)}>{l('Retry', 'إعادة المحاولة')}</Button>
            </InlineAlert> : loading ? <Skeleton className="h-48"/> : <>
            <p role="status" className="text-sm">{visible.length} {l('customers', 'عميل')}</p>{!visible.length ? <EmptyState title={l('No matching customers', 'لا يوجد عملاء مطابقون')}/> : <>
                <div className="hidden lg:block">
                <DataTable label={l('Customers', 'العملاء')} headers={[l('Name', 'الاسم'), l('Area', 'المنطقة'), l('Visit cycle', 'دورة الزيارة'), l('Actions', 'الإجراءات')]}>{visible.map(item => <tr key={item.id}>
                    <td className="p-4 break-words">{item.name}</td>
                    <td className="p-4">{String((item as unknown as Record<string, unknown>).area || (item as unknown as Record<string, unknown>).coverageArea || '—')}</td>
                    <td className="p-4">{item.defaultCycle} {l('days', 'أيام')}</td>
                    <td className="p-4">{actions(item)}</td>
                    </tr>)}</DataTable>
                </div>
                <div className="grid gap-3 lg:hidden">{visible.map(item => <SectionCard key={item.id} title={item.name}>
                    <p className="mb-3 text-sm">{String((item as unknown as Record<string, unknown>).area || (item as unknown as Record<string, unknown>).coverageArea || '—')} · {item.defaultCycle} {l('days', 'أيام')}</p>{actions(item)}</SectionCard>)}</div>
                </>}</>}
 {activeCategory !== 'branches' && <SectionCard title={l('Visit rates', 'معدلات الزيارة')}>
            <p className="mb-3 text-sm">{customerCount} {l('customers', 'عميل')} · {activeWeeklyRate} {l('visits per week', 'زيارة أسبوعياً')} · {activeMonthlyRate} {l('visits per month', 'زيارة شهرياً')}</p>
            <label className="text-sm">{l('Daily visit rate', 'معدل الزيارات اليومي')}<input type="number" min="0" value={currentDailyInputStr} disabled={readOnly} onChange={e => void handleDailyInputChange(activeCategory, e.target.value)} className="ms-2 min-h-11 w-24 rounded-lg border border-[var(--line)] px-2"/>
            </label>
            </SectionCard>}</>}
 <Drawer open={Boolean(detail)} title={String(detail?.name || l('Customer details', 'تفاصيل العميل'))} onClose={() => setDetail(null)}>
    <dl className="grid gap-4 sm:grid-cols-2">{Object.entries(fields).map(([key, label]) => detail?.[key] !== undefined && detail?.[key] !== '' ? <div key={key}>
        <dt className="text-xs text-[var(--ink-soft)]">{label[ar ? 1 : 0]}</dt>
        <dd className="break-words whitespace-pre-wrap">{String(detail[key])}</dd>
        </div> : null)}</dl>
    </Drawer>
 <Drawer open={isModalOpen} title={editingItem ? l('Edit customer', 'تعديل العميل') : l('Add customer', 'إضافة عميل')} onClose={() => { if (!saving)
        setIsModalOpen(false); }}>
    <form onSubmit={handleSaveModal}>{statusMsg?.isError && <InlineAlert tone="error">{statusMsg.text}</InlineAlert>}<fieldset disabled={saving} className="grid min-w-0 gap-4 sm:grid-cols-2">{[...keys[activeCategory], 'defaultCycle'].map(key => <FormField key={key} label={fields[key][ar ? 1 : 0]} value={String(modalFormData[key as keyof CustomerFields] ?? '')} required={key === 'name' || key === 'defaultCycle'} type={key === 'defaultCycle' ? 'number' : 'text'} onChange={value => setModalFormData({
            ...modalFormData, [key]: key === 'defaultCycle' ? Number(value) : value
        })}/>)}{activeCategory === 'pharmacies' && <div className="sm:col-span-2">
        <MultiProductSelect value={modalFormData.targetProducts || ''} onChange={value => setModalFormData({
            ...modalFormData, targetProducts: value
        })}/>
        </div>}<div className="flex flex-wrap gap-2 sm:col-span-2">
    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{l('Cancel', 'إلغاء')}</Button>
    <Button type="submit" isLoading={saving}>{l('Save', 'حفظ')}</Button>
    </div>
    </fieldset>
    </form>
    </Drawer>
 <ConfirmDialog open={Boolean(pendingDelete)} title={l('Delete customer', 'حذف العميل')} description={pendingDelete?.name || ''} destructive onClose={() => setPendingDelete(null)} onConfirm={() => { if (pendingDelete)
        void handleDeleteItem(pendingDelete.id, pendingDelete.name); setPendingDelete(null); }}/>
 </div>;
}
