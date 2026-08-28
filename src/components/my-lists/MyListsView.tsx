'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { Representative, MasterHospital, MasterPharmacy, MasterDoctor, MasterBranch, MasterListsPayload } from '@/types';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { Button } from '@/components/ui/Button';
import { MultiProductSelect } from '@/components/ui/MultiProductSelect';
import { HOSPITAL_TYPES, PHARMACY_CLASSES, DOCTOR_CLASSES } from '@/lib/constants';

interface MyListsViewProps {
  reps: Representative[];
  selectedRep: string;
  onSelectRep: (rep: string) => void;
  onLogVisitForCustomer?: (category: 'hospital' | 'pharmacy' | 'doctor' | 'branch', item: any) => void;
}

type ListCategory = 'hospitals' | 'pharmacies' | 'doctors' | 'branches';

export function MyListsView({
  reps,
  selectedRep,
  onSelectRep,
  onLogVisitForCustomer,
}: MyListsViewProps) {
  const { t, language } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<ListCategory>('hospitals');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [listsData, setListsData] = useState<MasterListsPayload>({
    hospitals: [],
    pharmacies: [],
    doctors: [],
    branches: [],
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalFormData, setModalFormData] = useState<any>({});
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const repOptions: SelectOption[] = useMemo(() => {
    return reps.map((r) => ({
      value: r.name,
      label: r.name,
      sublabel: r.area,
    }));
  }, [reps]);

  const loadLists = useCallback(async (repName?: string) => {
    setLoading(true);
    try {
      const url = repName ? `/api/lists?rep=${encodeURIComponent(repName)}` : '/api/lists';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setListsData(data.data);
      }
    } catch (e) {
      console.error('Failed to load lists:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLists(selectedRep);
  }, [selectedRep, loadLists]);

  const showNotification = (text: string, isError = false) => {
    setStatusMsg({ text, isError });
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
        dept: '',
        contact: '',
        phone: '',
        doctorNames: '',
        defaultCycle: 7,
        targetProducts: '',
      });
    } else if (activeCategory === 'pharmacies') {
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
    } else if (activeCategory === 'doctors') {
      setModalFormData({
        code: '',
        name: '',
        specialty: '',
        workplace: '',
        area: '',
        mobile: '',
        classification: 'A',
        bestTime: '',
        defaultCycle: 7,
        targetProducts: '',
      });
    } else if (activeCategory === 'branches') {
      setModalFormData({
        name: '',
        coverageArea: '',
        contact: '',
        phone: '',
        distributedProducts: '',
        defaultCycle: 7,
      });
    }
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (item: any) => {
    setEditingItem(item);
    setModalFormData({ ...item });
    setIsModalOpen(true);
  };

  // Save Item (Create / Update)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalFormData.name?.trim()) {
      showNotification('اسم العميل / الجهة مطلوب', true);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        category: activeCategory,
        rep: selectedRep,
        item: {
          ...modalFormData,
          id: editingItem?.id || undefined,
        },
      };

      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showNotification(t('lists.savedSuccess'));
        setIsModalOpen(false);
        await loadLists(selectedRep);
      } else {
        showNotification(resData.message || t('msg.errorGeneric'), true);
      }
    } catch {
      showNotification(t('msg.errorGeneric'), true);
    } finally {
      setSaving(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`${t('lists.deleteConfirm')} (${name})`)) return;

    try {
      const res = await fetch(`/api/lists?category=${activeCategory}&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        showNotification(t('lists.deletedSuccess'));
        await loadLists(selectedRep);
      } else {
        showNotification(resData.message || t('msg.errorGeneric'), true);
      }
    } catch {
      showNotification(t('msg.errorGeneric'), true);
    }
  };

  // Filtered lists
  const currentList = listsData[activeCategory] || [];
  const filteredList = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return currentList;
    return (currentList as any[]).filter((item) => {
      return (
        item.name?.toLowerCase().includes(term) ||
        item.area?.toLowerCase().includes(term) ||
        item.coverageArea?.toLowerCase().includes(term) ||
        item.contact?.toLowerCase().includes(term) ||
        item.pharmacist?.toLowerCase().includes(term) ||
        item.specialty?.toLowerCase().includes(term) ||
        item.doctorNames?.toLowerCase().includes(term)
      );
    });
  }, [currentList, search]);

  return (
    <div className="animate-fade-in space-y-5">
      {/* Toast Banner */}
      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-between animate-in fade-in zoom-in-95 ${
            statusMsg.isError ? 'bg-red-50 text-red-900 border border-red-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-sm px-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Identity Selector Card */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📋</span>
          <h2 className="text-base font-extrabold text-[var(--ink)]">
            {t('lists.title')}
          </h2>
        </div>
        <p className="text-xs text-[var(--ink-soft)] mb-3.5 leading-relaxed">
          {t('lists.desc')}
        </p>
        <div className="max-w-xs md:max-w-sm">
          <CustomSelect
            options={repOptions}
            value={selectedRep}
            onChange={onSelectRep}
            placeholder={t('rep.selector.placeholder')}
            searchable={true}
          />
        </div>
      </div>

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveCategory('hospitals')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeCategory === 'hospitals'
              ? 'bg-amber-50/80 border-amber-300 shadow-sm ring-1 ring-amber-300'
              : 'bg-white border-[var(--line)] hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--ink-secondary)]">{t('lists.hospitals')}</span>
            <span className="text-base">🏥</span>
          </div>
          <div className="text-xl font-black text-amber-950 font-mono mt-1">
            {listsData.hospitals.length}
          </div>
        </div>

        <div
          onClick={() => setActiveCategory('pharmacies')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeCategory === 'pharmacies'
              ? 'bg-amber-50/80 border-amber-300 shadow-sm ring-1 ring-amber-300'
              : 'bg-white border-[var(--line)] hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--ink-secondary)]">{t('lists.pharmacies')}</span>
            <span className="text-base">💊</span>
          </div>
          <div className="text-xl font-black text-amber-950 font-mono mt-1">
            {listsData.pharmacies.length}
          </div>
        </div>

        <div
          onClick={() => setActiveCategory('doctors')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeCategory === 'doctors'
              ? 'bg-amber-50/80 border-amber-300 shadow-sm ring-1 ring-amber-300'
              : 'bg-white border-[var(--line)] hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--ink-secondary)]">{t('lists.doctors')}</span>
            <span className="text-base">🩺</span>
          </div>
          <div className="text-xl font-black text-amber-950 font-mono mt-1">
            {listsData.doctors.length}
          </div>
        </div>

        <div
          onClick={() => setActiveCategory('branches')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeCategory === 'branches'
              ? 'bg-amber-50/80 border-amber-300 shadow-sm ring-1 ring-amber-300'
              : 'bg-white border-[var(--line)] hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--ink-secondary)]">{t('lists.branches')}</span>
            <span className="text-base">🏢</span>
          </div>
          <div className="text-xl font-black text-amber-950 font-mono mt-1">
            {listsData.branches.length}
          </div>
        </div>
      </div>

      {/* Main List Management Container */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 shadow-card space-y-4">
        {/* Header with Search and Add Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveCategory('hospitals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'hospitals' ? 'bg-white text-[var(--ink)] shadow-xs' : 'text-gray-600 hover:text-black'
              }`}
            >
              🏥 {t('lists.hospitals')} ({listsData.hospitals.length})
            </button>
            <button
              onClick={() => setActiveCategory('pharmacies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'pharmacies' ? 'bg-white text-[var(--ink)] shadow-xs' : 'text-gray-600 hover:text-black'
              }`}
            >
              💊 {t('lists.pharmacies')} ({listsData.pharmacies.length})
            </button>
            <button
              onClick={() => setActiveCategory('doctors')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'doctors' ? 'bg-white text-[var(--ink)] shadow-xs' : 'text-gray-600 hover:text-black'
              }`}
            >
              🩺 {t('lists.doctors')} ({listsData.doctors.length})
            </button>
            <button
              onClick={() => setActiveCategory('branches')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'branches' ? 'bg-white text-[var(--ink)] shadow-xs' : 'text-gray-600 hover:text-black'
              }`}
            >
              🏢 {t('lists.branches')} ({listsData.branches.length})
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو المنطقة..."
              className="text-xs px-3 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none w-48 font-medium"
            />
            <Button
              onClick={handleOpenCreateModal}
              variant="primary"
              size="sm"
              className="font-extrabold whitespace-nowrap"
            >
              <span>+</span>
              <span>
                {activeCategory === 'hospitals'
                  ? t('lists.addHospital')
                  : activeCategory === 'pharmacies'
                  ? t('lists.addPharmacy')
                  : activeCategory === 'doctors'
                  ? t('lists.addDoctor')
                  : t('lists.addBranch')}
              </span>
            </Button>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--ink-soft)] font-bold">
            <div className="inline-block w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mb-2" />
            <div>{t('app.loading')}</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--ink-muted)] bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            {t('lists.emptyCategory')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>المنطقة</th>
                  {activeCategory === 'hospitals' && (
                    <>
                      <th>النوع</th>
                      <th>القسم</th>
                      <th>الصيدلي / المشتريات</th>
                      <th>الأطباء</th>
                    </>
                  )}
                  {activeCategory === 'pharmacies' && (
                    <>
                      <th>العنوان</th>
                      <th>الصيدلي المسؤول</th>
                      <th>التليفون</th>
                      <th>التصنيف</th>
                    </>
                  )}
                  {activeCategory === 'doctors' && (
                    <>
                      <th>التخصص</th>
                      <th>العيادة / المستشفى</th>
                      <th>الموبايل</th>
                      <th>التصنيف</th>
                      <th>أفضل موعد</th>
                    </>
                  )}
                  {activeCategory === 'branches' && (
                    <>
                      <th>المسؤول</th>
                      <th>التليفون</th>
                      <th>المنتجات الموزعة</th>
                    </>
                  )}
                  <th>دورة الزيارة</th>
                  <th className="text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item: any) => (
                  <tr key={item.id}>
                    <td className="font-bold text-[var(--ink)] whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="whitespace-nowrap">{item.area || item.coverageArea || '—'}</td>

                    {activeCategory === 'hospitals' && (
                      <>
                        <td className="whitespace-nowrap">{item.type || '—'}</td>
                        <td className="whitespace-nowrap">{item.dept || '—'}</td>
                        <td className="whitespace-nowrap">{item.contact || '—'}</td>
                        <td className="whitespace-nowrap max-w-[150px] truncate" title={item.doctorNames}>
                          {item.doctorNames || '—'}
                        </td>
                      </>
                    )}

                    {activeCategory === 'pharmacies' && (
                      <>
                        <td className="whitespace-nowrap max-w-[160px] truncate">{item.address || '—'}</td>
                        <td className="whitespace-nowrap">{item.pharmacist || '—'}</td>
                        <td className="font-mono whitespace-nowrap">{item.mobile || '—'}</td>
                        <td className="whitespace-nowrap">
                          <span className="font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded">
                            Class {item.classification}
                          </span>
                        </td>
                      </>
                    )}

                    {activeCategory === 'doctors' && (
                      <>
                        <td className="whitespace-nowrap">{item.specialty || '—'}</td>
                        <td className="whitespace-nowrap">{item.workplace || '—'}</td>
                        <td className="font-mono whitespace-nowrap">{item.mobile || '—'}</td>
                        <td className="whitespace-nowrap">
                          <span className="font-bold px-2 py-0.5 bg-blue-100 text-blue-900 rounded">
                            Class {item.classification}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-xs">{item.bestTime || '—'}</td>
                      </>
                    )}

                    {activeCategory === 'branches' && (
                      <>
                        <td className="whitespace-nowrap">{item.contact || '—'}</td>
                        <td className="font-mono whitespace-nowrap">{item.phone || '—'}</td>
                        <td className="whitespace-nowrap max-w-[160px] truncate">{item.distributedProducts || '—'}</td>
                      </>
                    )}

                    <td className="font-mono font-bold whitespace-nowrap text-amber-800">
                      {item.defaultCycle ?? 7} يوم
                    </td>

                    <td className="whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors"
                        >
                          ✏️ {t('lists.edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="px-2 py-1 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer transition-colors"
                        >
                          🗑️ {t('lists.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[var(--line)] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#FAF7F0] to-[#F5EFE0] border-b border-[#E8E2D2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {activeCategory === 'hospitals'
                    ? '🏥'
                    : activeCategory === 'pharmacies'
                    ? '💊'
                    : activeCategory === 'doctors'
                    ? '🩺'
                    : '🏢'}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--ink)]">
                    {editingItem ? 'تعديل بيانات العميل' : 'إضافة عميل جديد للقائمة'}
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {activeCategory === 'hospitals'
                      ? 'بيانات المستشفى أو المركز الطبي'
                      : activeCategory === 'pharmacies'
                      ? 'بيانات الصيدلية'
                      : activeCategory === 'doctors'
                      ? 'بيانات الطبيب والعيادة'
                      : 'بيانات فرع / مخزن التوزيع'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center font-bold text-sm border border-gray-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                    {activeCategory === 'hospitals'
                      ? 'اسم المستشفى *'
                      : activeCategory === 'pharmacies'
                      ? 'اسم الصيدلية *'
                      : activeCategory === 'doctors'
                      ? 'اسم الدكتور *'
                      : 'اسم الفرع / الموزع *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={modalFormData.name || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, name: e.target.value })}
                    placeholder="الاسم الكامل..."
                    className="w-full text-xs md:text-sm px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none font-bold"
                  />
                </div>

                {/* Area / Region */}
                <div>
                  <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                    المنطقة / العنوان
                  </label>
                  <input
                    type="text"
                    value={modalFormData.area || modalFormData.coverageArea || ''}
                    onChange={(e) =>
                      setModalFormData({
                        ...modalFormData,
                        area: e.target.value,
                        coverageArea: e.target.value,
                      })
                    }
                    placeholder="مثال: الدقي - الجيزة"
                    className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                  />
                </div>

                {/* Hospital Specific Fields */}
                {activeCategory === 'hospitals' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        نوع المستشفى
                      </label>
                      <CustomSelect
                        options={HOSPITAL_TYPES}
                        value={modalFormData.type || 'Private'}
                        onChange={(val) => setModalFormData({ ...modalFormData, type: val })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        القسم المستهدف
                      </label>
                      <input
                        type="text"
                        value={modalFormData.dept || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, dept: e.target.value })}
                        placeholder="مثال: الباطنة / الرعاية"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        الصيدلي / المشتريات (المسؤول)
                      </label>
                      <input
                        type="text"
                        value={modalFormData.contact || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, contact: e.target.value })}
                        placeholder="اسم الصيدلي أو مسؤول المشتريات"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        أسماء الأطباء في المستشفى
                      </label>
                      <input
                        type="text"
                        value={modalFormData.doctorNames || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, doctorNames: e.target.value })}
                        placeholder="مثال: د. طارق علي، د. سمير كمال..."
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        رقم التليفون
                      </label>
                      <input
                        type="tel"
                        value={modalFormData.phone || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, phone: e.target.value })}
                        placeholder="01xxxxxxxxx"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Pharmacy Specific Fields */}
                {activeCategory === 'pharmacies' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        الصيدلي المسؤول
                      </label>
                      <input
                        type="text"
                        value={modalFormData.pharmacist || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, pharmacist: e.target.value })}
                        placeholder="اسم الصيدلي المسؤول"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        العنوان التفصيلي
                      </label>
                      <input
                        type="text"
                        value={modalFormData.address || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, address: e.target.value })}
                        placeholder="الشارع / المعلم..."
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        رقم الموبايل
                      </label>
                      <input
                        type="tel"
                        value={modalFormData.mobile || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, mobile: e.target.value })}
                        placeholder="01xxxxxxxxx"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        تصنيف الصيدلية (Class)
                      </label>
                      <CustomSelect
                        options={PHARMACY_CLASSES.map((c) => ({ value: c, label: `Class ${c}` }))}
                        value={modalFormData.classification || 'A'}
                        onChange={(val) => setModalFormData({ ...modalFormData, classification: val })}
                      />
                    </div>
                  </>
                )}

                {/* Doctor Specific Fields */}
                {activeCategory === 'doctors' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        التخصص
                      </label>
                      <input
                        type="text"
                        value={modalFormData.specialty || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, specialty: e.target.value })}
                        placeholder="مثال: باطنة / قلب / تخدير"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        العيادة / المستشفى
                      </label>
                      <input
                        type="text"
                        value={modalFormData.workplace || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, workplace: e.target.value })}
                        placeholder="اسم العيادة أو المستشفى"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        رقم الموبايل
                      </label>
                      <input
                        type="tel"
                        value={modalFormData.mobile || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, mobile: e.target.value })}
                        placeholder="01xxxxxxxxx"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        تصنيف الطبيب (Class)
                      </label>
                      <CustomSelect
                        options={DOCTOR_CLASSES.map((c) => ({ value: c, label: `Class ${c}` }))}
                        value={modalFormData.classification || 'A'}
                        onChange={(val) => setModalFormData({ ...modalFormData, classification: val })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        أفضل موعد للزيارة
                      </label>
                      <input
                        type="text"
                        value={modalFormData.bestTime || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, bestTime: e.target.value })}
                        placeholder="مثال: السبت والأربعاء من 6 إلى 8 مساءً"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Branch Specific Fields */}
                {activeCategory === 'branches' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        الشخص المسؤول
                      </label>
                      <input
                        type="text"
                        value={modalFormData.contact || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, contact: e.target.value })}
                        placeholder="اسم المسؤول"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        رقم التليفون
                      </label>
                      <input
                        type="tel"
                        value={modalFormData.phone || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, phone: e.target.value })}
                        placeholder="01xxxxxxxxx"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Default Visit Cycle */}
                <div>
                  <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                    دورة الزيارة الافتراضية (أيام)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={modalFormData.defaultCycle ?? 7}
                    onChange={(e) =>
                      setModalFormData({ ...modalFormData, defaultCycle: parseInt(e.target.value, 10) || 7 })
                    }
                    className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none font-mono font-bold text-amber-900"
                  />
                </div>

                {/* Target Products (Multi-Select) */}
                {activeCategory !== 'branches' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                      المنتجات المستهدفة مع هذا العميل
                    </label>
                    <MultiProductSelect
                      value={modalFormData.targetProducts || ''}
                      onChange={(val) => setModalFormData({ ...modalFormData, targetProducts: val })}
                      placeholder="اختر المنتجات المستهدفة من كتالوج صني..."
                    />
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 mt-4 -mx-4 -mb-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-black cursor-pointer"
                >
                  إلغاء
                </button>
                <Button type="submit" variant="primary" size="md" isLoading={saving} className="font-extrabold px-6">
                  <span>💾</span>
                  <span>{editingItem ? 'تحديث البيانات' : 'حفظ في القائمة'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
