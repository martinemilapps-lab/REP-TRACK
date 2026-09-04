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
        contact: '',
        phone: '',
        defaultCycle: 7,
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
        address: '',
        mobile: '',
        classification: 'A',
        bestTime: '',
        defaultCycle: 7,
      });
    } else if (activeCategory === 'branches') {
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
        item.address?.toLowerCase().includes(term) ||
        item.coverageArea?.toLowerCase().includes(term) ||
        item.contact?.toLowerCase().includes(term) ||
        item.pharmacist?.toLowerCase().includes(term) ||
        item.specialty?.toLowerCase().includes(term) ||
        item.workplace?.toLowerCase().includes(term)
      );
    });
  }, [currentList, search]);

  // Manual Daily Rates state (keyed by category: 'hospitals', 'pharmacies', 'doctors', 'branches')
  const [dailyInputs, setDailyInputs] = useState<Record<string, string>>({
    hospitals: '',
    pharmacies: '',
    doctors: '',
    branches: '',
  });

  // Load manual rates from localStorage on mount and when selectedRep changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const repKey = selectedRep || 'default';
    setDailyInputs({
      hospitals: localStorage.getItem(`reptrack_daily_target_${repKey}_hospitals`) || localStorage.getItem('reptrack_daily_target_global_hospitals') || '',
      pharmacies: localStorage.getItem(`reptrack_daily_target_${repKey}_pharmacies`) || localStorage.getItem('reptrack_daily_target_global_pharmacies') || '',
      doctors: localStorage.getItem(`reptrack_daily_target_${repKey}_doctors`) || localStorage.getItem('reptrack_daily_target_global_doctors') || '',
      branches: localStorage.getItem(`reptrack_daily_target_${repKey}_branches`) || localStorage.getItem('reptrack_daily_target_global_branches') || '',
    });
  }, [selectedRep]);

  const handleDailyInputChange = (category: string, value: string) => {
    setDailyInputs((prev) => ({ ...prev, [category]: value }));
    if (typeof window !== 'undefined') {
      const repKey = selectedRep || 'default';
      const num = parseFloat(value);
      if (!isNaN(num) && num >= 0) {
        localStorage.setItem(`reptrack_daily_target_${repKey}_${category}`, value);
        localStorage.setItem(`reptrack_daily_target_global_${category}`, value);
      } else if (value.trim() === '') {
        localStorage.removeItem(`reptrack_daily_target_${repKey}_${category}`);
      }
    }
  };

  // Active Category Calculation: Auto customer count, manual daily rate, auto weekly/monthly rates
  const customerCount = (listsData[activeCategory] || []).length;
  const currentDailyInputStr = dailyInputs[activeCategory] ?? '';
  const activeDailyRate = parseFloat(currentDailyInputStr) || 0;
  const activeWeeklyRate = activeDailyRate * 6; // 6 working days / week
  const activeMonthlyRate = Math.round(activeDailyRate * 26); // 26 working days / month

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
                      <th>الصيدلي / المشتريات</th>
                      <th>التليفون</th>
                    </>
                  )}
                  {activeCategory === 'pharmacies' && (
                    <>
                      <th>العنوان التفصيلي</th>
                      <th>الصيدلي المسؤول</th>
                      <th>التليفون</th>
                      <th>التصنيف</th>
                    </>
                  )}
                  {activeCategory === 'doctors' && (
                    <>
                      <th>العنوان التفصيلي</th>
                      <th>Speciality (التخصص)</th>
                      <th>Working Hospital/s (العمل)</th>
                      <th>الموبايل</th>
                      <th>التصنيف</th>
                      <th>أفضل موعد</th>
                    </>
                  )}
                  {activeCategory === 'branches' && (
                    <>
                      <th>العنوان التفصيلي</th>
                      <th>Key Person (المسؤول)</th>
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
                        <td className="whitespace-nowrap">{item.contact || '—'}</td>
                        <td className="font-mono whitespace-nowrap">{item.phone || '—'}</td>
                      </>
                    )}

                    {activeCategory === 'pharmacies' && (
                      <>
                        <td className="whitespace-nowrap max-w-[160px] truncate" title={item.address}>{item.address || '—'}</td>
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
                        <td className="whitespace-nowrap max-w-[150px] truncate" title={item.address}>{item.address || '—'}</td>
                        <td className="whitespace-nowrap font-medium text-amber-950">{item.specialty || '—'}</td>
                        <td className="whitespace-nowrap max-w-[150px] truncate" title={item.workplace}>{item.workplace || '—'}</td>
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
                        <td className="whitespace-nowrap max-w-[150px] truncate" title={item.address}>{item.address || '—'}</td>
                        <td className="whitespace-nowrap font-bold text-slate-800">{item.contact || '—'}</td>
                        <td className="font-mono whitespace-nowrap">{item.phone || '—'}</td>
                        <td className="whitespace-nowrap max-w-[160px] truncate" title={item.distributedProducts}>{item.distributedProducts || '—'}</td>
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

        {/* Bottom Summary Cards: Required Average Visits /day, /week, /month */}
        <div className="mt-4 pt-4 border-t border-[var(--line)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 mb-3">
            <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
              <span>🎯</span>
              <span>
                {activeCategory === 'hospitals'
                  ? 'معدل الزيارات المطلوب للمستشفيات (Required Visit Rates)'
                  : activeCategory === 'pharmacies'
                  ? 'معدل الزيارات المطلوب للصيدليات (Required Visit Rates)'
                  : activeCategory === 'doctors'
                  ? 'معدل الزيارات المطلوب للأطباء (Required Visit Rates)'
                  : 'معدل الزيارات المطلوب للفروع والموزعين (Required Visit Rates)'}
              </span>
            </h4>
            <span className="text-[11px] font-bold text-gray-500">
              (إجمالي القائمة تلقائي | المعدل اليومي يدوي | الأسبوعي والشهري محسوب تلقائياً)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Purple Scratch: Auto Recorded from List Customers */}
            <div className="p-3.5 bg-gradient-to-br from-amber-50/90 to-orange-50/90 border-2 border-purple-300 rounded-2xl shadow-xs relative">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="text-xs font-black text-amber-950">
                  إجمالي العملاء بالقائمة
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                  تلقائي من القائمة
                </span>
              </div>
              <div className="text-2xl font-black text-amber-950 font-mono mt-1">
                {customerCount} <span className="text-xs font-bold text-amber-800">عميل</span>
              </div>
              <div className="text-[10px] text-amber-800/90 font-bold mt-1.5 flex items-center gap-1">
                <span>✓</span>
                <span>مسجل تلقائياً وفقاً للبيانات المعبأة</span>
              </div>
            </div>

            {/* 2. Red Scratch: Manual Daily Visits Recording */}
            <div className="p-3.5 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-2 border-rose-400 rounded-2xl shadow-sm relative">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="text-xs font-black text-blue-950">
                  متوسط الزيارات / اليوم
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                  ✍️ تسجيل يدوي
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={currentDailyInputStr}
                  onChange={(e) => handleDailyInputChange(activeCategory, e.target.value)}
                  placeholder="0.0"
                  className="w-24 px-2.5 py-1 text-lg font-black font-mono text-blue-950 bg-white border-2 border-rose-300 focus:border-rose-500 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-rose-400/40 shadow-inner"
                />
                <span className="text-xs font-black text-blue-950">زيارة / يوم</span>
              </div>
              <div className="text-[10px] text-rose-800/90 font-bold mt-1.5 flex items-center gap-1">
                <span>✎</span>
                <span>سجل المعدل اليومي المطلوب يدوياً</span>
              </div>
            </div>

            {/* 3. Green Scratch: Auto Calculated Weekly Visits */}
            <div className="p-3.5 bg-gradient-to-br from-emerald-50/90 to-teal-50/90 border-2 border-emerald-400 rounded-2xl shadow-xs relative">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="text-xs font-black text-emerald-950">
                  متوسط الزيارات / الأسبوع
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  ⚡ تلقائي (×6)
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-950 font-mono mt-1">
                {activeWeeklyRate.toFixed(1)} <span className="text-xs font-bold text-emerald-800">زيارة / أسبوع</span>
              </div>
              <div className="text-[10px] text-emerald-800/90 font-bold mt-1.5 flex items-center gap-1">
                <span>⚡</span>
                <span>محسوب تلقائياً (اليومي × 6 أيام عمل)</span>
              </div>
            </div>

            {/* 4. Green Scratch: Auto Calculated Monthly Visits */}
            <div className="p-3.5 bg-gradient-to-br from-purple-50/90 to-violet-50/90 border-2 border-emerald-400 rounded-2xl shadow-xs relative">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="text-xs font-black text-purple-950">
                  متوسط الزيارات / الشهر
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  ⚡ تلقائي (×26)
                </span>
              </div>
              <div className="text-2xl font-black text-purple-950 font-mono mt-1">
                {activeMonthlyRate} <span className="text-xs font-bold text-purple-800">زيارة / شهر</span>
              </div>
              <div className="text-[10px] text-purple-800/90 font-bold mt-1.5 flex items-center gap-1">
                <span>⚡</span>
                <span>محسوب تلقائياً (اليومي × 26 يوم عمل)</span>
              </div>
            </div>
          </div>
        </div>
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

                {/* Hospital Specific Fields */}
                {activeCategory === 'hospitals' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        المنطقة (Area)
                      </label>
                      <input
                        type="text"
                        value={modalFormData.area || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, area: e.target.value })}
                        placeholder="مثال: الدقي - الجيزة"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
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
                        المنطقة (Area)
                      </label>
                      <input
                        type="text"
                        value={modalFormData.area || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, area: e.target.value })}
                        placeholder="مثال: مصر الجديدة"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        العنوان التفصيلي (Address)
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
                        المنطقة (Area)
                      </label>
                      <input
                        type="text"
                        value={modalFormData.area || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, area: e.target.value })}
                        placeholder="مثال: المعادي - القاهرة"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        العنوان التفصيلي (Address)
                      </label>
                      <input
                        type="text"
                        value={modalFormData.address || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, address: e.target.value })}
                        placeholder="الشارع / رقم المبنى / الدور..."
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        Speciality (التخصص)
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
                        Working Hospital/s (مستشفى / عيادات العمل)
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
                        المنطقة (Area)
                      </label>
                      <input
                        type="text"
                        value={modalFormData.coverageArea || modalFormData.area || ''}
                        onChange={(e) =>
                          setModalFormData({
                            ...modalFormData,
                            coverageArea: e.target.value,
                            area: e.target.value,
                          })
                        }
                        placeholder="مثال: القاهرة الكبرى / شبرا"
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        العنوان التفصيلي (Address)
                      </label>
                      <input
                        type="text"
                        value={modalFormData.address || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, address: e.target.value })}
                        placeholder="عنوان الفرع أو المخزن..."
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        Key Person (الشخص المفتاح / المسؤول)
                      </label>
                      <input
                        type="text"
                        value={modalFormData.contact || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, contact: e.target.value })}
                        placeholder="اسم المسؤول / Key Person"
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
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
                        المنتجات الموزعة
                      </label>
                      <input
                        type="text"
                        value={modalFormData.distributedProducts || ''}
                        onChange={(e) => setModalFormData({ ...modalFormData, distributedProducts: e.target.value })}
                        placeholder="مثال: جميع الأصناف أو أصناف محددة..."
                        className="w-full text-xs px-3.5 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
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

                {/* Target Products (Only for Pharmacies) */}
                {activeCategory === 'pharmacies' && (
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
